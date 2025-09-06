// Enhanced session manager with Chromium user data persistence
// This approach saves the entire Chrome user data directory for better session persistence

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChromiumSessionManager {
    constructor() {
        this.baseDir = path.join(__dirname, '.wwebjs_auth');
        this.chromiumDataDir = path.join(this.baseDir, 'chromium-data');
        this.sessionBackupPath = path.join(__dirname, 'chromium-session-backup.tar.gz');
        this.isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        try {
            fs.mkdirSync(this.baseDir, { recursive: true });
            fs.mkdirSync(this.chromiumDataDir, { recursive: true });
            console.log('📁 Chromium session directories created');
        } catch (error) {
            console.log('⚠️ Directory creation error:', error.message);
        }
    }

    // Create a compressed backup of the entire Chromium user data directory
    async backupChromiumData() {
        try {
            if (!fs.existsSync(this.chromiumDataDir)) {
                console.log('⚠️ No Chromium data directory found to backup');
                return false;
            }

            const files = fs.readdirSync(this.chromiumDataDir);
            if (files.length === 0) {
                console.log('⚠️ Chromium data directory is empty');
                return false;
            }

            console.log('📦 Creating Chromium session backup...');
            
            if (this.isRender) {
                // Use tar on Render (Linux)
                execSync(`cd "${this.baseDir}" && tar -czf chromium-session-backup.tar.gz chromium-data/`, { 
                    timeout: 30000 
                });
            } else {
                // Use PowerShell on Windows
                const psCommand = `Compress-Archive -Path "${this.chromiumDataDir}\\*" -DestinationPath "${this.sessionBackupPath.replace('.tar.gz', '.zip')}" -Force`;
                execSync(`powershell -Command "${psCommand}"`, { timeout: 30000 });
            }

            console.log('✅ Chromium session backup created');
            return true;
        } catch (error) {
            console.log('❌ Failed to backup Chromium data:', error.message);
            return false;
        }
    }

    // Restore Chromium user data from backup
    async restoreChromiumData() {
        try {
            const backupFile = this.isRender ? this.sessionBackupPath : this.sessionBackupPath.replace('.tar.gz', '.zip');
            
            if (!fs.existsSync(backupFile)) {
                console.log('⚠️ No Chromium backup file found');
                return false;
            }

            console.log('🔄 Restoring Chromium session from backup...');

            // Clear existing data
            if (fs.existsSync(this.chromiumDataDir)) {
                fs.rmSync(this.chromiumDataDir, { recursive: true, force: true });
            }
            fs.mkdirSync(this.chromiumDataDir, { recursive: true });

            if (this.isRender) {
                // Extract tar.gz on Render (Linux)
                execSync(`cd "${this.baseDir}" && tar -xzf chromium-session-backup.tar.gz`, { 
                    timeout: 30000 
                });
            } else {
                // Extract zip on Windows
                const psCommand = `Expand-Archive -Path "${backupFile}" -DestinationPath "${this.chromiumDataDir}" -Force`;
                execSync(`powershell -Command "${psCommand}"`, { timeout: 30000 });
            }

            console.log('✅ Chromium session restored from backup');
            return true;
        } catch (error) {
            console.log('❌ Failed to restore Chromium data:', error.message);
            return false;
        }
    }

    // Get Chromium data directory path for WhatsApp Web.js
    getChromiumDataPath() {
        return this.chromiumDataDir;
    }

    // Check if valid session data exists
    hasValidSession() {
        try {
            const sessionFiles = [
                'Default/Local Storage/leveldb/CURRENT',
                'Default/Local Storage/leveldb/MANIFEST-000001',
                'Default/Session Storage'
            ];

            for (const file of sessionFiles) {
                const filePath = path.join(this.chromiumDataDir, file);
                if (!fs.existsSync(filePath)) {
                    return false;
                }
            }

            console.log('✅ Valid Chromium session data found');
            return true;
        } catch (error) {
            console.log('⚠️ Session validation error:', error.message);
            return false;
        }
    }

    // Clean up old or corrupted session data
    cleanupSession() {
        try {
            if (fs.existsSync(this.chromiumDataDir)) {
                fs.rmSync(this.chromiumDataDir, { recursive: true, force: true });
            }
            if (fs.existsSync(this.sessionBackupPath)) {
                fs.unlinkSync(this.sessionBackupPath);
            }
            if (fs.existsSync(this.sessionBackupPath.replace('.tar.gz', '.zip'))) {
                fs.unlinkSync(this.sessionBackupPath.replace('.tar.gz', '.zip'));
            }
            
            this.ensureDirectories();
            console.log('🧹 Session cleanup completed');
        } catch (error) {
            console.log('⚠️ Session cleanup error:', error.message);
        }
    }
}

module.exports = ChromiumSessionManager;
