// Lightweight wrapper around whatsapp-web.js
// - Handles QR generation (saves to current-qr.png and qr-data-url.txt)
// - Tracks readiness state
// - Provides sendMessage, isReady, waitUntilReady, destroy

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

class WhatsAppClient {
        constructor(opts = {}) {
                this._ready = false;
                this._opts = opts;
                this._qrPngPath = path.join(__dirname, 'current-qr.png');
                this._qrDataUrlPath = path.join(__dirname, 'qr-data-url.txt');
                this._sessionDir = path.join(__dirname, '.wwebjs_auth');

                // Ensure session directory exists
                try { fs.mkdirSync(this._sessionDir, { recursive: true }); } catch {}

                this._createClient();
                this._wireEvents();
                this._initialize();
        }

        _createClient() {
                // Azure-optimized Chrome configuration
                const isWindows = process.platform === 'win32';
                const isAzure = process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_RESOURCE_GROUP;
                
                let executablePath;

                if (isWindows && !isAzure) {
                    // Local Windows development
                    const chromePaths = [
                        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
                    ];
                    
                    executablePath = chromePaths.find(p => {
                        try {
                            return require('fs').existsSync(p);
                        } catch {
                            return false;
                        }
                    });
                }

                const ws = process.env.BROWSER_WS_URL;
                
                let puppeteerConfig;
                
                if (ws) {
                    // Use external browser WebSocket
                    puppeteerConfig = { browserWSEndpoint: ws };
                } else if (isAzure) {
                    // Azure App Service configuration
                    puppeteerConfig = {
                        headless: 'new',
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu',
                            '--disable-software-rasterizer',
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
                            '--no-first-run'
                        ],
                        timeout: 0, // No timeout on Azure
                        protocolTimeout: 240000
                    };
                } else {
                    // Local development (simplified)
                    puppeteerConfig = {
                        headless: 'new',
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox'
                        ],
                        executablePath: executablePath,
                        timeout: 60000
                    };
                }

                this.client = new Client({
                        authStrategy: new LocalAuth({ clientId: 'tailoring-shop-bot' }),
                        puppeteer: puppeteerConfig,
                        takeoverOnConflict: true,
                        takeoverTimeoutMs: 0,
                        qrMaxRetries: isAzure ? 10 : 3,
                        authTimeoutMs: isAzure ? 300000 : 60000,
                        restartOnAuthFail: true
                });
        }

        _wireEvents() {
                if (!this.client) return;

                this._onQr = async (qr) => {
                        try {
                                this._ready = false;
                                // Save QR to PNG for /qr endpoint
                                await qrcode.toFile(this._qrPngPath, qr, { type: 'png', errorCorrectionLevel: 'H' });
                                // Also store data URL so scanner page can use it if needed
                                const dataUrl = await qrcode.toDataURL(qr);
                                fs.writeFileSync(this._qrDataUrlPath, dataUrl, 'utf8');
                                // Print terminal QR as fallback
                                qrcodeTerminal.generate(qr, { small: true });
                                console.log('🔐 New WhatsApp QR generated. Scan it to authenticate.');
                        } catch (err) {
                                console.error('Failed to write QR assets:', err.message);
                        }
                };

                this._onReady = () => {
                        this._ready = true;
                        try { if (fs.existsSync(this._qrPngPath)) fs.unlinkSync(this._qrPngPath); } catch {}
                        console.log('✅ WhatsApp client is ready.');
                        // Persist a tiny session info file
                        try {
                                fs.writeFileSync(
                                        path.join(this._sessionDir, 'session-info.json'),
                                        JSON.stringify({ readyAt: new Date().toISOString() }, null, 2),
                                        'utf8'
                                );
                        } catch {}
                };

                this._onAuthenticated = () => {
                        console.log('🔒 WhatsApp authenticated.');
                };

                this._onAuthFailure = (m) => {
                        this._ready = false;
                        console.error('❌ WhatsApp authentication failed:', m);
                };

                this._onDisconnected = (reason) => {
                        this._ready = false;
                        console.warn('⚠️ WhatsApp disconnected:', reason);
                        // Attempt a soft restart after a short delay
                        setTimeout(() => this.restartClient().catch(() => {}), 3000);
                };

                this.client.on('qr', this._onQr);
                this.client.on('ready', this._onReady);
                this.client.on('authenticated', this._onAuthenticated);
                this.client.on('auth_failure', this._onAuthFailure);
                this.client.on('disconnected', this._onDisconnected);
        }

        async _initialize() {
                try {
                        console.log('🚀 Initializing WhatsApp client...');
                        const isAzure = process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_RESOURCE_GROUP;
                        
                        if (isAzure) {
                                console.log('🌐 Azure environment detected, using optimized settings');
                        }
                        
                        await this.client.initialize();
                } catch (err) {
                        console.error('❌ Failed to initialize WhatsApp client:', err.message);
                        
                        // Enhanced retry logic for Azure
                        const retryDelay = process.env.WEBSITE_SITE_NAME ? 60000 : 30000; // Longer delay on Azure
                        console.log(`🔄 Retrying WhatsApp client initialization in ${retryDelay/1000}s...`);
                        
                        setTimeout(() => {
                                console.log('🔄 Attempting WhatsApp client restart...');
                                this.restartClient().catch((restartErr) => {
                                        console.error('❌ Restart failed:', restartErr.message);
                                });
                        }, retryDelay);
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

module.exports = WhatsAppClient;

