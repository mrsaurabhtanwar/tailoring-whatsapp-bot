// Lightweight WhatsApp client optimized for Render deployment
// Features: Session persistence, memory optimization, and Render compatibility

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const ExternalSessionStorage = require('./session-storage');

class RenderWhatsAppClient {
    constructor() {
        this._ready = false;
        this._qrPngPath = path.join(__dirname, 'current-qr.png');
        this._qrDataUrlPath = path.join(__dirname, 'qr-data-url.txt');
        this._sessionDir = path.join(__dirname, '.wwebjs_auth');
        this._retryCount = 0;
        this._maxRetries = 3;
        this._isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
        this._sessionStorage = new ExternalSessionStorage();

        // Ensure session directory exists
        try { 
            fs.mkdirSync(this._sessionDir, { recursive: true }); 
        } catch (e) {
            console.log('Session directory already exists or creation failed');
        }

        console.log(`🌐 Environment: ${this._isRender ? 'Render' : 'Local'}`);
        
        this._createClient();
        this._wireEvents();
        this._initialize();
    }

    _createClient() {
        // Ultra-lightweight Puppeteer configuration for memory optimization
        const puppeteerConfig = {
            headless: 'new',
            // Don't use userDataDir with LocalAuth - they're incompatible
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-first-run',
                '--memory-pressure-off',
                '--max_old_space_size=150',
                '--single-process',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-background-networking',
                '--disable-databases',
                '--disable-file-system',
                '--disable-notifications',
                '--disable-permissions-api'
            ],
            timeout: 60000, // Increased timeout for better stability
            protocolTimeout: 60000,
            // Let Puppeteer handle Chrome download automatically
            // Don't specify executablePath to allow auto-download
        };

        this.client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: 'tailoring-shop-bot',
                dataPath: this._sessionDir
            }),
            puppeteer: puppeteerConfig,
            qrMaxRetries: 5, // Increased retries
            authTimeoutMs: 120000, // Increased timeout
            restartOnAuthFail: false,
            takeoverOnConflict: false,
            takeoverTimeoutMs: 60000, // Increased timeout
            // Add session persistence options
            session: null,
            // Add connection stability options
            ffmpegPath: null,
            bypassCSP: true
        });
    }

    _wireEvents() {
        if (!this.client) return;

        this._onQr = async (qr) => {
            try {
                this._ready = false;
                console.log('📱 QR Code received! Generating files...');
                
                // Save QR to PNG for /qr endpoint
                await qrcode.toFile(this._qrPngPath, qr, { 
                    type: 'png', 
                    errorCorrectionLevel: 'M',
                    width: 256
                });
                console.log('✅ QR PNG saved');
                
                // Also store data URL
                const dataUrl = await qrcode.toDataURL(qr, { width: 256 });
                fs.writeFileSync(this._qrDataUrlPath, dataUrl, 'utf8');
                console.log('✅ QR data URL saved');
                
                // Print terminal QR
                qrcodeTerminal.generate(qr, { small: true });
                console.log('🔐 New WhatsApp QR generated. Scan it to authenticate.');
                
                // Reset retry count on successful QR generation
                this._retryCount = 0;
                
            } catch (err) {
                console.error('❌ Failed to write QR assets:', err.message);
            }
        };

        this._onReady = async () => {
            this._ready = true;
            try { 
                if (fs.existsSync(this._qrPngPath)) fs.unlinkSync(this._qrPngPath); 
            } catch {}
            console.log('✅ WhatsApp client is ready.');
            
            // Save session data to external storage with a delay
            setTimeout(async () => {
                try {
                    await this._saveSessionToExternal();
                } catch (error) {
                    console.log('⚠️ Failed to save session to external storage:', error.message);
                }
            }, 10000); // Wait 10 seconds for session to fully stabilize
        };

        this._onAuthenticated = async () => {
            console.log('🔒 WhatsApp authenticated.');
        };

        this._onAuthFailure = (m) => {
            this._ready = false;
            console.error('❌ WhatsApp authentication failed:', m);
            this._handleFailure();
        };

        this._onDisconnected = (reason) => {
            this._ready = false;
            console.warn('⚠️ WhatsApp disconnected:', reason);
            
            // Don't restart immediately for certain disconnect reasons
            if (reason === 'NAVIGATION' || reason === 'LOGOUT') {
                console.log('🔄 WhatsApp logout detected, will require re-authentication');
                return;
            }
            
            // Add delay before handling failure to prevent rapid restarts
            setTimeout(() => {
                if (!this._ready) {
                    this._handleFailure();
                }
            }, 5000); // Wait 5 seconds before attempting restart
        };

        this.client.on('qr', this._onQr);
        this.client.on('ready', this._onReady);
        this.client.on('authenticated', this._onAuthenticated);
        this.client.on('auth_failure', this._onAuthFailure);
        this.client.on('disconnected', this._onDisconnected);
    }

    _handleFailure() {
        if (this._retryCount >= this._maxRetries) {
            console.error('❌ Max retries reached. Please check Render configuration.');
            console.log('💡 Solutions:');
            console.log('   1. Check if session files are properly persisted');
            console.log('   2. Ensure Render has sufficient memory allocation');
            console.log('   3. Try redeploying the application');
            return;
        }

        this._retryCount++;
        const delay = Math.min(15000 * this._retryCount, 60000); // Max 1 minute delay
        
        console.log(`🔄 Retry ${this._retryCount}/${this._maxRetries} in ${delay/1000}s...`);
        
        setTimeout(() => {
            console.log('🔄 Attempting WhatsApp client restart...');
            this.restartClient().catch((err) => {
                console.error('❌ Restart failed:', err.message);
            });
        }, delay);
    }

    async _initialize() {
        try {
            console.log('🚀 Initializing WhatsApp client...');
            
            // Try to restore session from external storage first
            if (this._isRender) {
                console.log('🔄 Attempting to restore session from external storage...');
                const restored = await this._loadSessionFromExternal();
                if (restored) {
                    console.log('✅ Session restored successfully from external storage');
                } else {
                    console.log('ℹ️ No existing session found, will require QR scan');
                    console.log('💡 After authentication, session will be saved for future deployments');
                }
            }
            
            await this.client.initialize();
        } catch (err) {
            console.error('❌ Failed to initialize WhatsApp client:', err.message);
            this._handleFailure();
        }
    }

    isReady() {
        return !!this._ready;
    }

    async waitUntilReady(timeoutMs = 30000) {
        if (this.isReady()) return;
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (this.isReady()) return resolve();
                if (Date.now() - start > timeoutMs) return reject(new Error('WhatsApp client not ready'));
                setTimeout(check, 500);
            };
            check();
        });
    }

    async sendMessage(chatId, message) {
        if (!this.isReady()) {
            throw new Error('WhatsApp client not ready');
        }
        return this.client.sendMessage(chatId, message);
    }

    async restartClient() {
        try {
            await this.destroy();
        } catch {}
        
        // Wait a bit before recreating
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        this._createClient();
        this._wireEvents();
        await this._initialize();
    }

    async _saveSessionToExternal() {
        try {
            console.log('💾 Preparing to save session to external storage...');
            // Give the session files time to be written
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Read session files and save to external storage
            const sessionData = {};
            
            if (fs.existsSync(this._sessionDir)) {
                const sessionPath = path.join(this._sessionDir, 'session-tailoring-shop-bot');
                if (fs.existsSync(sessionPath)) {
                    console.log('📁 Reading session files from:', sessionPath);
                    
                    // Only read essential session files to minimize memory usage
                    const essentialFiles = [
                        'Default/Preferences',
                        'Default/Local Storage/leveldb/CURRENT',
                        'Default/Local Storage/leveldb/MANIFEST-000001',
                        'Default/Session Storage/000003.log',
                        'Local State'
                    ];
                    
                    for (const file of essentialFiles) {
                        const fullPath = path.join(sessionPath, file);
                        if (fs.existsSync(fullPath)) {
                            try {
                                const stat = fs.statSync(fullPath);
                                // Only read files smaller than 1MB to prevent memory issues
                                if (stat.isFile() && stat.size > 0 && stat.size < 1024 * 1024) {
                                    const fileData = fs.readFileSync(fullPath);
                                    sessionData[file] = fileData.toString('base64');
                                    console.log(`✅ Read session file: ${file} (${stat.size} bytes)`);
                                } else if (stat.size >= 1024 * 1024) {
                                    console.log(`⚠️ Skipping large file: ${file} (${stat.size} bytes)`);
                                }
                            } catch (e) {
                                console.log(`⚠️ Could not read session file: ${file} - ${e.message}`);
                            }
                        }
                    }
                } else {
                    console.log('⚠️ Session directory not found:', sessionPath);
                }
            } else {
                console.log('⚠️ Base session directory not found:', this._sessionDir);
            }
            
            if (Object.keys(sessionData).length > 0) {
                console.log(`💾 Saving ${Object.keys(sessionData).length} session files to external storage...`);
                await this._sessionStorage.saveSession(sessionData);
                console.log('✅ Session saved to external storage successfully');
            } else {
                console.log('⚠️ No session data found to save - session may not be fully initialized yet');
            }
        } catch (error) {
            console.log('⚠️ Failed to save session data:', error.message);
        }
    }

    async _loadSessionFromExternal() {
        try {
            const sessionData = await this._sessionStorage.loadSession();
            if (sessionData && Object.keys(sessionData).length > 0) {
                // Restore session files
                const sessionPath = path.join(this._sessionDir, 'session-tailoring-shop-bot');
                fs.mkdirSync(sessionPath, { recursive: true });
                
                for (const [relativePath, base64Data] of Object.entries(sessionData)) {
                    try {
                        const filePath = path.join(sessionPath, relativePath);
                        const dir = path.dirname(filePath);
                        fs.mkdirSync(dir, { recursive: true });
                        
                        // Convert from base64 back to binary
                        const fileData = Buffer.from(base64Data, 'base64');
                        fs.writeFileSync(filePath, fileData);
                        console.log(`✅ Restored session file: ${relativePath}`);
                    } catch (e) {
                        console.log(`⚠️ Failed to restore session file: ${relativePath} - ${e.message}`);
                    }
                }
                
                console.log('✅ Session restored from external storage');
                return true;
            }
        } catch (error) {
            console.log('⚠️ Failed to load session from external storage:', error.message);
        }
        return false;
    }

    async destroy() {
        try {
            // Save session before destroying
            if (this._ready) {
                await this._saveSessionToExternal();
            }
            
            if (this.client) {
                // Remove listeners safely
                try {
                    this.client.removeListener('qr', this._onQr);
                    this.client.removeListener('ready', this._onReady);
                    this.client.removeListener('authenticated', this._onAuthenticated);
                    this.client.removeListener('auth_failure', this._onAuthFailure);
                    this.client.removeListener('disconnected', this._onDisconnected);
                } catch (e) {
                    console.log('⚠️ Error removing listeners:', e.message);
                }
                
                // Destroy client safely
                try {
                    await this.client.destroy();
                } catch (e) {
                    console.log('⚠️ Error destroying client:', e.message);
                }
            }
        } catch (err) {
            console.log('⚠️ Error during WhatsApp client destroy:', err.message);
        } finally {
            this.client = null;
            this._ready = false;
        }
    }
}

module.exports = RenderWhatsAppClient;
