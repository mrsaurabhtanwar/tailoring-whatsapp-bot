// WhatsApp client implementation optimized for Railway deployment
// Includes containerized environment support with unique Chrome profiles

const fs = require('fs');
const path = require('path');
const os = require('os');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');

class WhatsAppClient {
    constructor(opts = {}) {
        this._ready = false;
        this._opts = opts;
        this._qrPngPath = path.join(__dirname, 'current-qr.png');
        this._qrDataUrlPath = path.join(__dirname, 'qr-data-url.txt');
        this._sessionDir = path.join(__dirname, '.wwebjs_auth');
        this._retryCount = 0;
        this._maxRetries = 3; // Reduced retries for Railway
        this._isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
        this._isInitializing = false;

        // Ensure session directory exists
        try { fs.mkdirSync(this._sessionDir, { recursive: true }); } catch {}

        console.log(`🌐 Environment: ${this._isRailway ? 'Railway' : 'Local'} | Platform: ${process.platform}`);
        
        // Only initialize if not in Railway environment during startup
        if (!this._isRailway) {
            this._createClient();
            this._wireEvents();
            this._initialize();
        } else {
            console.log('🚀 Railway detected: WhatsApp client will initialize on first use');
        }
    }

    _createClient() {
        const isWindows = process.platform === 'win32';
        
        console.log(`🌐 Environment: ${this._isRailway ? 'Railway' : 'Local'} | Platform: ${process.platform}`);

        // Strategy 1: Use external browser if provided (RECOMMENDED for Azure)
        if (process.env.BROWSER_WS_URL) {
            console.log('🔗 Using external Chrome service:', process.env.BROWSER_WS_URL);
            this.client = new Client({
                authStrategy: new LocalAuth({ clientId: 'tailoring-shop-bot' }),
                puppeteer: {
                    browserWSEndpoint: process.env.BROWSER_WS_URL,
                    timeout: 60000,
                    protocolTimeout: 60000
                },
                qrMaxRetries: 5,
                authTimeoutMs: 120000,
                restartOnAuthFail: true
            });
            return;
        }

        // Strategy 2: Production-optimized local Chrome
        let puppeteerConfig;
        
        if (process.env.NODE_ENV === 'production') {
            console.log('🔧 Using production-optimized Chrome configuration');
            
            puppeteerConfig = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--disable-plugins',
                    '--disable-sync',
                    '--disable-translate',
                    '--hide-scrollbars',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--no-first-run',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
                    '--disable-ipc-flooding-protection',
                    '--single-process',
                    '--memory-pressure-off',
                    '--max_old_space_size=1024',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-accelerated-2d-canvas',
                    '--disable-accelerated-jpeg-decoding',
                    '--disable-accelerated-mjpeg-decode',
                    '--disable-accelerated-video-decode'
                ],
                timeout: 60000,
                protocolTimeout: 60000,
                handleSIGINT: false,
                handleSIGTERM: false,
                handleSIGHUP: false
            };
        } else if (isWindows) {
            // Windows local development
            const chromePaths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
            ];
            
            const executablePath = chromePaths.find(p => {
                try { return fs.existsSync(p); } catch { return false; }
            });

            puppeteerConfig = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: executablePath,
                timeout: 60000
            };
        } else {
            // Linux development configuration
            const { execSync } = require('child_process');
            let executablePath = null;
            
            try {
                executablePath = execSync('which chromium', { encoding: 'utf8' }).trim();
                console.log('🔍 Found Chromium at:', executablePath);
            } catch (e) {
                console.log('⚠️ System Chromium not found, using Puppeteer default');
            }
            
            puppeteerConfig = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ],
                timeout: 60000,
                protocolTimeout: 60000
            };
            
            if (executablePath) {
                puppeteerConfig.executablePath = executablePath;
            }
        }

        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: 'tailoring-shop-bot' }),
            puppeteer: puppeteerConfig,
            qrMaxRetries: this._isRailway ? 10 : 5,
            authTimeoutMs: this._isRailway ? 300000 : 120000,
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
                await qrcode.toFile(this._qrPngPath, qr, { type: 'png', errorCorrectionLevel: 'H' });
                console.log('✅ QR PNG saved');
                
                // Also store data URL
                const dataUrl = await qrcode.toDataURL(qr);
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
            try { if (fs.existsSync(this._qrPngPath)) fs.unlinkSync(this._qrPngPath); } catch {}
            console.log('✅ WhatsApp client is ready.');
        };

        this._onAuthenticated = () => {
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
            console.error('❌ Max retries reached. Please check Railway configuration.');
            console.log('💡 Solutions:');
            console.log('   1. Add BROWSER_WS_URL environment variable with a remote Chrome service');
            console.log('   2. Check Railway deployment logs for Chrome/Puppeteer issues');
            console.log('   3. Use local development for initial WhatsApp setup');
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
        if (this._isInitializing) return;
        this._isInitializing = true;
        
        try {
            console.log('🚀 Initializing WhatsApp client...');
            if (this.client) {
                await this.client.initialize();
            }
        } catch (err) {
            console.error('❌ Failed to initialize WhatsApp client:', err.message);
            if (!this._isRailway) {
                this._handleFailure();
            }
        } finally {
            this._isInitializing = false;
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
        if (!this.client) {
            // Lazy initialize for Railway
            if (this._isRailway && !this._isInitializing) {
                console.log('🔄 Lazy initializing WhatsApp client for Railway...');
                this._createClient();
                this._wireEvents();
                await this._initialize();
                // Wait a bit for initialization
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        if (!this.isReady()) {
            throw new Error('WhatsApp client not ready. Please scan QR code first.');
        }
        return this.client.sendMessage(chatId, message);
    }

    async restartClient() {
        try {
            await this.destroy();
        } catch {}
        
        // Wait a bit before recreating
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        this._createClient();
        this._wireEvents();
        await this._initialize();
    }

    async destroy() {
        try {
            if (this.client) {
                // Remove event listeners safely
                try {
                    this.client.removeListener('qr', this._onQr);
                    this.client.removeListener('ready', this._onReady);
                    this.client.removeListener('authenticated', this._onAuthenticated);
                    this.client.removeListener('auth_failure', this._onAuthFailure);
                    this.client.removeListener('disconnected', this._onDisconnected);
                } catch (e) {
                    console.warn('⚠️ Error removing event listeners:', e.message);
                }
                
                // Destroy client safely
                try {
                    await Promise.race([
                        this.client.destroy(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Destroy timeout')), 5000))
                    ]);
                } catch (e) {
                    console.warn('⚠️ Error during client destroy:', e.message);
                }
            }
            
            // Cleanup temporary user data directory if it exists
            if (this._userDataDir && fs.existsSync(this._userDataDir)) {
                try {
                    fs.rmSync(this._userDataDir, { recursive: true, force: true });
                    console.log('🧹 Cleaned up temporary Chrome profile');
                } catch (cleanupErr) {
                    console.warn('⚠️ Could not clean up Chrome profile:', cleanupErr.message);
                }
            }
        } catch (err) {
            console.error('Error during WhatsApp client destroy:', err.message);
        } finally {
            this.client = null;
            this._ready = false;
            this._userDataDir = null;
            this._isInitializing = false;
        }
    }
}

module.exports = WhatsAppClient;
