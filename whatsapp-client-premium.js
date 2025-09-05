// Premium WhatsApp client for reliable hosting platforms
// Handles profile locks and ensures stable operation

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

class PremiumWhatsAppClient {
    constructor(opts = {}) {
        this._ready = false;
        this._opts = opts;
        this._qrPngPath = path.join(__dirname, 'current-qr.png');
        this._qrDataUrlPath = path.join(__dirname, 'qr-data-url.txt');
        this._sessionDir = path.join(__dirname, '.wwebjs_auth');
        this._clientId = 'tailoring-shop-bot-premium';
        this._retryCount = 0;
        this._maxRetries = 5;

        console.log('🚀 Initializing Premium WhatsApp Client...');
        
        // Ensure session directory exists
        this._ensureSessionDir();
        
        // Clear any existing profile locks
        this._clearProfileLocks();
        
        this._createClient();
        this._wireEvents();
        this._initialize();
    }

    _ensureSessionDir() {
        try {
            fs.mkdirSync(this._sessionDir, { recursive: true });
            console.log('✅ Session directory ready:', this._sessionDir);
        } catch (err) {
            console.log('ℹ️ Session directory already exists');
        }
    }

    _clearProfileLocks() {
        try {
            console.log('🔓 Clearing profile locks...');
            
            // Clear Chrome profile locks
            const lockFiles = [
                path.join(this._sessionDir, 'SingletonLock'),
                path.join(this._sessionDir, 'SingletonCookie'),
                path.join(this._sessionDir, 'Default', 'SingletonLock'),
                path.join(this._sessionDir, 'Default', 'SingletonCookie'),
                path.join(this._sessionDir, 'Default', 'LOCK'),
                path.join(this._sessionDir, 'LOCK')
            ];
            
            let clearedCount = 0;
            lockFiles.forEach(lockFile => {
                if (fs.existsSync(lockFile)) {
                    try {
                        fs.unlinkSync(lockFile);
                        console.log('🗑️ Cleared lock file:', path.basename(lockFile));
                        clearedCount++;
                    } catch (err) {
                        console.log('⚠️ Could not clear:', path.basename(lockFile));
                    }
                }
            });
            
            // Clear Service Worker locks
            const serviceWorkerDir = path.join(this._sessionDir, 'Default', 'Service Worker');
            if (fs.existsSync(serviceWorkerDir)) {
                try {
                    fs.rmSync(serviceWorkerDir, { recursive: true });
                    console.log('🗑️ Cleared Service Worker directory');
                    clearedCount++;
                } catch (err) {
                    console.log('⚠️ Could not clear Service Worker directory');
                }
            }
            
            // Clear any Chrome processes
            this._killChromeProcesses();
            
            console.log(`✅ Profile locks cleared (${clearedCount} files)`);
        } catch (err) {
            console.log('⚠️ Error clearing profile locks:', err.message);
        }
    }

    _killChromeProcesses() {
        try {
            const { exec } = require('child_process');
            const platform = process.platform;
            
            if (platform === 'linux' || platform === 'darwin') {
                // Kill any existing Chrome processes
                exec('pkill -f chrome || pkill -f chromium || true', (error) => {
                    if (!error) {
                        console.log('🔄 Killed existing Chrome processes');
                    }
                });
            } else if (platform === 'win32') {
                // Windows - kill Chrome processes
                exec('taskkill /f /im chrome.exe /t 2>nul || taskkill /f /im chromium.exe /t 2>nul || echo "No Chrome processes found"', (error) => {
                    if (!error) {
                        console.log('🔄 Killed existing Chrome processes');
                    }
                });
            }
        } catch (err) {
            console.log('⚠️ Could not kill Chrome processes:', err.message);
        }
    }

    _createClient() {
        console.log('🔧 Creating WhatsApp client with premium configuration...');
        
        this.client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: this._clientId,
                dataPath: this._sessionDir
            }),
            puppeteer: {
                headless: 'new',
                executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process',
                    '--no-zygote',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
                    '--disable-ipc-flooding-protection',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--disable-plugins',
                    '--disable-sync',
                    '--disable-translate',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--user-data-dir=' + this._sessionDir,
                    '--profile-directory=Default',
                    '--remote-debugging-port=0',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--disable-translate',
                    '--hide-scrollbars',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-first-run',
                    '--safebrowsing-disable-auto-update',
                    '--disable-ipc-flooding-protection'
                ],
                timeout: 0,
                protocolTimeout: 0,
                ignoreDefaultArgs: ['--disable-extensions']
            },
            qrMaxRetries: 10,
            authTimeoutMs: 300000,
            restartOnAuthFail: true,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 0
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
                    errorCorrectionLevel: 'H',
                    width: 512,
                    margin: 2
                });
                console.log('✅ QR PNG saved');
                
                // Also store data URL
                const dataUrl = await qrcode.toDataURL(qr, {
                    errorCorrectionLevel: 'H',
                    width: 512,
                    margin: 2
                });
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

        this._onReady = () => {
            this._ready = true;
            try { 
                if (fs.existsSync(this._qrPngPath)) fs.unlinkSync(this._qrPngPath); 
            } catch {}
            console.log('✅ WhatsApp client is ready and authenticated!');
            
            // Persist session info
            try {
                fs.writeFileSync(
                    path.join(this._sessionDir, 'session-info.json'),
                    JSON.stringify({ 
                        readyAt: new Date().toISOString(),
                        clientId: this._clientId,
                        platform: process.platform
                    }, null, 2),
                    'utf8'
                );
            } catch {}
        };

        this._onAuthenticated = () => {
            console.log('🔒 WhatsApp authenticated successfully.');
        };

        this._onAuthFailure = (m) => {
            this._ready = false;
            console.error('❌ WhatsApp authentication failed:', m);
            this._handleFailure();
        };

        this._onDisconnected = (reason) => {
            this._ready = false;
            console.warn('⚠️ WhatsApp disconnected:', reason);
            this._handleFailure();
        };

        this.client.on('qr', this._onQr);
        this.client.on('ready', this._onReady);
        this.client.on('authenticated', this._onAuthenticated);
        this.client.on('auth_failure', this._onAuthFailure);
        this.client.on('disconnected', this._onDisconnected);
    }

    _handleFailure() {
        if (this._retryCount >= this._maxRetries) {
            console.error('❌ Max retries reached. Please check your hosting configuration.');
            console.log('💡 Solutions:');
            console.log('   1. Check if your hosting platform supports Chrome/Puppeteer');
            console.log('   2. Verify environment variables are set correctly');
            console.log('   3. Check hosting platform logs for errors');
            console.log('   4. Consider using Railway, Render, or DigitalOcean');
            return;
        }

        this._retryCount++;
        const delay = Math.min(30000 * this._retryCount, 120000); // Exponential backoff, max 2 min
        
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
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Clear locks again before restart
        this._clearProfileLocks();
        
        this._createClient();
        this._wireEvents();
        await this._initialize();
    }

    async destroy() {
        try {
            if (this.client) {
                this.client.removeListener('qr', this._onQr);
                this.client.removeListener('ready', this._onReady);
                this.client.removeListener('authenticated', this._onAuthenticated);
                this.client.removeListener('auth_failure', this._onAuthFailure);
                this.client.removeListener('disconnected', this._onDisconnected);
                await this.client.destroy();
            }
        } catch (err) {
            console.error('Error during WhatsApp client destroy:', err.message);
        } finally {
            this.client = null;
            this._ready = false;
        }
    }
}

module.exports = PremiumWhatsAppClient;
