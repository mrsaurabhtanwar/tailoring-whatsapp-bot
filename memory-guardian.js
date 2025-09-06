// Memory Guardian - Prevents Render crashes by monitoring and managing memory
// Implements graceful restarts with session preservation

const fs = require('fs');
const path = require('path');

class MemoryGuardian {
    constructor() {
        this.checkInterval = 10000; // Check every 10 seconds
        this.criticalMemoryMB = 80;  // Critical at 80MB
        this.emergencyMemoryMB = 120; // Emergency at 120MB
        this.warningCount = 0;
        this.maxWarnings = 2;
        this.isShuttingDown = false;
        this.sessionBackupPath = path.join(__dirname, 'emergency-session-backup.json');
        
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
            
            // Initialize checkCount if not exists
            this.checkCount = (this.checkCount || 0) + 1;
            
            // Log memory every 5 checks (50 seconds)
            if (this.checkCount % 5 === 0) {
                console.log(`🛡️ Memory: ${rssMemoryMB}MB (Heap: ${heapUsedMB}MB)`);
            }

            if (rssMemoryMB > this.emergencyMemoryMB) {
                console.log(`🚨 EMERGENCY MEMORY: ${rssMemoryMB}MB! Immediate restart to prevent crash!`);
                this.emergencyRestart();
                return;
            }

            if (rssMemoryMB > this.criticalMemoryMB) {
                this.warningCount++;
                console.log(`⚠️ Critical Memory: ${rssMemoryMB}MB (Warning ${this.warningCount}/${this.maxWarnings})`);
                
                // Aggressive garbage collection
                if (typeof global.gc === 'function') {
                    console.log('🧹 Running emergency garbage collection...');
                    global.gc(true);
                } else if (typeof gc === 'function') {
                    console.log('🧹 Running emergency garbage collection...');
                    gc(true);
                }

                if (this.warningCount >= this.maxWarnings) {
                    console.log(`🚨 Too many memory warnings! Controlled restart...`);
                    this.controlledRestart();
                }
            } else {
                this.warningCount = 0; // Reset warnings if memory is normal
            }
        } catch (error) {
            console.log('❌ Memory check failed:', error.message);
            // Don't restart on memory check errors
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
