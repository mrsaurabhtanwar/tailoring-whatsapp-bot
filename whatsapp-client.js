// Simplified WhatsApp client without external Chromium dependencies
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
        // Simplified Puppeteer config without external dependencies
        const puppeteerConfig = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-software-rasterizer'
            ]
            // Let whatsapp-web.js handle Chromium automatically
        };

        this.client = new Client({
            authStrategy: new LocalAuth({ 
                clientId: 'tailoring-shop-bot',
                dataPath: this._sessionDir
            }),
            puppeteer: puppeteerConfig,
            takeoverOnConflict: true,
            takeoverTimeoutMs: 0,
            qrMaxRetries: 5
        });
    }

    _wireEvents() {
        if (!this.client) return;

        this._onQr = async (qr) => {
            try {
                this._ready = false;
                // Save QR to PNG for /qr endpoint
                await qrcode.toFile(this._qrPngPath, qr, { 
                    type: 'png', 
                    errorCorrectionLevel: 'H',
                    width: 256
                });
                // Also store data URL
                const dataUrl = await qrcode.toDataURL(qr);
                fs.writeFileSync(this._qrDataUrlPath, dataUrl, 'utf8');
                // Print terminal QR
                qrcodeTerminal.generate(qr, { small: true });
                console.log('📱 New WhatsApp QR generated. Scan it to authenticate.');
            } catch (err) {
                console.error('Failed to write QR assets:', err.message);
            }
        };

        this._onReady = () => {
            this._ready = true;
            try { 
                if (fs.existsSync(this._qrPngPath)) fs.unlinkSync(this._qrPngPath); 
                if (fs.existsSync(this._qrDataUrlPath)) fs.unlinkSync(this._qrDataUrlPath);
            } catch {}
            console.log('✅ WhatsApp client is ready!');
            // Persist session info
            try {
                fs.writeFileSync(
                    path.join(this._sessionDir, 'session-info.json'),
                    JSON.stringify({ 
                        readyAt: new Date().toISOString(),
                        clientId: 'tailoring-shop-bot'
                    }, null, 2),
                    'utf8'
                );
            } catch {}
        };

        this._onAuthenticated = () => {
            console.log('🔐 WhatsApp authenticated successfully.');
        };

        this._onAuthFailure = (msg) => {
            this._ready = false;
            console.error('❌ WhatsApp authentication failed:', msg);
            // Clean up failed session
            try {
                const sessionPath = path.join(this._sessionDir, 'session-tailoring-shop-bot');
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            } catch {}
        };

        this._onDisconnected = (reason) => {
            this._ready = false;
            console.warn('⚠️ WhatsApp disconnected:', reason);
            // Auto-restart after delay
            setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                this.restartClient().catch(console.error);
            }, 5000);
        };

        this.client.on('qr', this._onQr);
        this.client.on('ready', this._onReady);
        this.client.on('authenticated', this._onAuthenticated);
        this.client.on('auth_failure', this._onAuthFailure);
        this.client.on('disconnected', this._onDisconnected);
        
        // Additional error handling
        this.client.on('error', (error) => {
            console.error('WhatsApp client error:', error);
        });
    }

    async _initialize() {
        try {
            console.log('🚀 Initializing WhatsApp client...');
            await this.client.initialize();
        } catch (err) {
            console.error('Failed to initialize WhatsApp client:', err.message);
            // Retry after delay
            setTimeout(() => {
                console.log('🔄 Retrying initialization...');
                this._initialize().catch(console.error);
            }, 10000);
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
                if (Date.now() - start > timeoutMs) {
                    return reject(new Error('WhatsApp client not ready after timeout'));
                }
                setTimeout(check, 500);
            };
            check();
        });
    }

    async sendMessage(chatId, message) {
        if (!this.isReady()) {
            throw new Error('WhatsApp client not ready. Please scan QR code first.');
        }
        try {
            const result = await this.client.sendMessage(chatId, message);
            console.log(`✅ Message sent to ${chatId}`);
            return result;
        } catch (error) {
            console.error(`❌ Failed to send message to ${chatId}:`, error.message);
            throw error;
        }
    }

    async restartClient() {
        console.log('🔄 Restarting WhatsApp client...');
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
                // Remove all listeners
                this.client.removeAllListeners();
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