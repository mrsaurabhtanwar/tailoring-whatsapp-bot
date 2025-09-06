// Enhanced Memory Guardian - Prevents Render crashes with aggressive memory management
// Implements graceful restarts with session preservation and memory optimization

const fs = require('fs');
const path = require('path');

class MemoryGuardian {
    // Global suspension controls to pause GC/cleanup during critical phases (e.g., WhatsApp init)
    static _suspensions = new Set();
    static suspend(tag = 'default') {
        try {
            MemoryGuardian._suspensions.add(tag);
            console.log(`⏸️ Memory Guardian: suspended (${tag})`);
        } catch {}
    }
    static resume(tag = 'default') {
        try {
            MemoryGuardian._suspensions.delete(tag);
            console.log(`▶️ Memory Guardian: resumed (${tag})`);
        } catch {}
    }
    static isSuspended() {
        return MemoryGuardian._suspensions.size > 0;
    }
    constructor() {
        this.checkInterval = 10000; // Check every 10 seconds for startup stability
        this.criticalMemoryMB = 100;  // Critical at 100MB (increased for startup)
        this.emergencyMemoryMB = 150; // Emergency at 150MB (increased for startup)
        this.warningCount = 0;
        this.maxWarnings = 3; // More warnings before restart
        this.startupGracePeriod = 120000; // 2 minutes grace period for startup
        this.startupTime = Date.now();
        this.isShuttingDown = false;
        this.sessionBackupPath = path.join(__dirname, 'emergency-session-backup.json');
        this.lastGCTime = 0;
        this.gcInterval = 30000; // Force GC every 30 seconds
        this.cleanupInterval = 60000; // Cleanup every minute
        this.lastCleanup = 0;
        
        this.startMonitoring();
    }

    startMonitoring() {
        console.log('🛡️ Memory Guardian: Monitoring started');
        
        // Initial check
        this.checkMemory();
        
        // Regular monitoring - bind this context properly
        this.monitorInterval = setInterval(() => {
            if (!this.isShuttingDown) {
                this.checkMemory();
            }
        }, this.checkInterval);
        
        // Graceful shutdown handlers
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            console.log('🚨 Uncaught Exception:', error.message);
            console.log('🚨 Stack trace:', error.stack);
            this.emergencyRestart();
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.log('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
            this.emergencyRestart();
        });
    }

    checkMemory() {
        try {
            const memUsage = process.memoryUsage();
            const rssMemoryMB = Math.round(memUsage.rss / 1024 / 1024);
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const externalMB = Math.round(memUsage.external / 1024 / 1024);
            
            // Initialize checkCount if not exists
            this.checkCount = (this.checkCount || 0) + 1;

            // Check if we're in startup grace period
            const now = Date.now();
            const isInStartupGrace = (now - this.startupTime) < this.startupGracePeriod;
            const isSuspended = MemoryGuardian.isSuspended();

            // When suspended (e.g., during WhatsApp init), skip GC/cleanup entirely
            if (isSuspended) {
                // Only act on extreme emergencies to avoid Render OOM kills
                const emergencyDuringSuspendMB = 350; // much higher threshold while suspended
                if (rssMemoryMB > emergencyDuringSuspendMB) {
                    console.log(`🚨 EMERGENCY MEMORY (Suspended): ${rssMemoryMB}MB! Immediate restart!`);
                    this.emergencyRestart();
                    return;
                }
                // Light heartbeat log once a minute while suspended
                if (this.checkCount % 6 === 0) {
                    console.log('⏱️ Memory Guardian suspended; skipping GC/cleanup during critical phase');
                }
                return;
            }

            // Log memory every 3 checks (30 seconds) when active
            if (this.checkCount % 3 === 0) {
                console.log(`🛡️ Memory: RSS=${rssMemoryMB}MB, Heap=${heapUsedMB}MB, External=${externalMB}MB`);
            }
            
            if (isInStartupGrace) {
                // During startup, use higher thresholds
                const startupCriticalMB = 120;
                const startupEmergencyMB = 180;
                
                if (rssMemoryMB > startupEmergencyMB) {
                    console.log(`🚨 EMERGENCY MEMORY (Startup): ${rssMemoryMB}MB! Immediate restart!`);
                    this.emergencyRestart();
                    return;
                }
                
                if (rssMemoryMB > startupCriticalMB) {
                    this.warningCount++;
                    console.log(`⚠️ Critical Memory (Startup): ${rssMemoryMB}MB (Warning ${this.warningCount}/${this.maxWarnings})`);
                    this.forceGarbageCollection();
                    
                    if (this.warningCount >= this.maxWarnings) {
                        console.log(`🚨 Too many memory warnings during startup! Controlled restart...`);
                        this.controlledRestart();
                    }
                } else {
                    this.warningCount = 0; // Reset warnings if memory is normal
                }
            } else {
                // After startup, use normal thresholds
                if (rssMemoryMB > this.emergencyMemoryMB) {
                    console.log(`🚨 EMERGENCY MEMORY: ${rssMemoryMB}MB! Immediate restart to prevent crash!`);
                    this.emergencyRestart();
                    return;
                }

                if (rssMemoryMB > this.criticalMemoryMB) {
                    this.warningCount++;
                    console.log(`⚠️ Critical Memory: ${rssMemoryMB}MB (Warning ${this.warningCount}/${this.maxWarnings})`);
                    
                    // Aggressive garbage collection
                    this.forceGarbageCollection();

                    if (this.warningCount >= this.maxWarnings) {
                        console.log(`🚨 Too many memory warnings! Controlled restart...`);
                        this.controlledRestart();
                    }
                } else {
                    this.warningCount = 0; // Reset warnings if memory is normal
                }
            }

            // Periodic garbage collection (skip during startup grace period)
            if (!isInStartupGrace && now - this.lastGCTime > this.gcInterval) {
                this.forceGarbageCollection();
                this.lastGCTime = now;
            }

            // Periodic cleanup (skip during startup grace period)  
            if (!isInStartupGrace && now - this.lastCleanup > this.cleanupInterval) {
                this.performCleanup();
                this.lastCleanup = now;
            }
        } catch (error) {
            console.log('❌ Memory check failed:', error.message);
            // Don't restart on memory check errors
        }
    }

    forceGarbageCollection() {
        try {
            if (typeof global.gc === 'function') {
                console.log('🧹 Running garbage collection...');
                global.gc(true);
            } else if (typeof gc === 'function') {
                console.log('🧹 Running garbage collection...');
                gc(true);
            }
        } catch (error) {
            console.log('⚠️ GC failed:', error.message);
        }
    }

    performCleanup() {
        try {
            console.log('🧹 Performing memory cleanup...');
            
            // Clear any temporary files
            this.cleanupTempFiles();
            
            // Clear any cached data
            if (global.gc) {
                global.gc(true);
            }
            
            console.log('✅ Memory cleanup completed');
        } catch (error) {
            console.log('⚠️ Cleanup failed:', error.message);
        }
    }

    cleanupTempFiles() {
        try {
            const tempFiles = [
                'current-qr.png',
                'qr-data-url.txt',
                'emergency-session-backup.json'
            ];
            
            for (const file of tempFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    const stat = fs.statSync(filePath);
                    // Only delete files older than 5 minutes
                    if (Date.now() - stat.mtime.getTime() > 300000) {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Cleaned up old file: ${file}`);
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ Temp file cleanup failed:', error.message);
        }
    }

    async emergencyRestart() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log('🚨 EMERGENCY RESTART: Saving session and restarting...');
        
        try {
            // Quick session backup
            await this.createEmergencyBackup();
        } catch (error) {
            console.log('❌ Emergency backup failed:', error.message);
        }

        // Force exit
        process.exit(1);
    }

    async controlledRestart() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log('🔄 CONTROLLED RESTART: Gracefully restarting...');
        
        try {
            // Save session state
            await this.createEmergencyBackup();
            
            // Clean shutdown
            clearInterval(this.monitorInterval);
            
            // Give time for cleanup
            setTimeout(() => {
                process.exit(0);
            }, 2000);
            
        } catch (error) {
            console.log('❌ Controlled restart failed:', error.message);
            process.exit(1);
        }
    }

    async gracefulShutdown(signal) {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log(`🛡️ Graceful shutdown (${signal}): Saving session...`);
        
        try {
            await this.createEmergencyBackup();
            clearInterval(this.monitorInterval);
            console.log('✅ Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            console.log('❌ Graceful shutdown failed:', error.message);
            process.exit(1);
        }
    }

    async createEmergencyBackup() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                memoryUsage: process.memoryUsage(),
                sessionExists: fs.existsSync(path.join(__dirname, '.wwebjs_auth')),
                reason: 'memory_guardian_backup'
            };

            fs.writeFileSync(this.sessionBackupPath, JSON.stringify(backupData, null, 2));
            console.log('💾 Emergency session backup created');
        } catch (error) {
            console.log('❌ Emergency backup failed:', error.message);
        }
    }

    async restoreFromBackup() {
        try {
            if (fs.existsSync(this.sessionBackupPath)) {
                const backupData = JSON.parse(fs.readFileSync(this.sessionBackupPath, 'utf8'));
                console.log('🔄 Session backup found:', backupData.timestamp);
                return backupData;
            }
        } catch (error) {
            console.log('❌ Backup restoration failed:', error.message);
        }
        return null;
    }
}

module.exports = MemoryGuardian;
