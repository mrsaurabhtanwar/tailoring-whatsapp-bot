const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');

class WhatsAppClient {
  constructor() {
  this.ready = false;
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'tailoring-shop-bot',
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      }
    });

    this.initialize();
  }

  initialize() {
    this.client.on('qr', async (qr) => {
      console.log('📱 QR CODE RECEIVED - Please scan to authenticate WhatsApp');
      console.log('🔗 Access QR code at: https://your-app.onrender.com/qr');
      
      // Display QR in terminal
      qrcode.generate(qr, { small: true });
      
      // Save QR as image file
      try {
        await QRCode.toFile('current-qr.png', qr, { width: 400 });
        console.log('✅ QR code saved as current-qr.png');
        
        // Also save as data URL for easy viewing
        const dataUrl = await QRCode.toDataURL(qr);
        fs.writeFileSync('qr-data-url.txt', dataUrl);
        console.log('✅ QR data URL saved to qr-data-url.txt');
        console.log('📱 Scan the QR code with your WhatsApp mobile app to authenticate');
      } catch (error) {
        console.error('❌ Error saving QR code:', error);
      }
    });

    this.client.on('ready', () => {
      this.ready = true;
      console.log('✅ WhatsApp Client is ready and authenticated!');
      console.log('📱 Bot is now ready to send messages');
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      console.log('❌ WhatsApp Client disconnected:', reason);
      console.log('🔄 Attempting to reconnect in 5 seconds...');
      // Auto-restart after 5 seconds
      setTimeout(() => {
        console.log('🔄 Reinitializing WhatsApp client...');
        this.client.initialize();
      }, 5000);
    });

    this.client.on('auth_failure', (msg) => {
      this.ready = false;
      console.log('❌ WhatsApp Authentication failed:', msg);
      console.log('📱 Please scan the QR code again to authenticate');
    });

    this.client.initialize();
  }

  async sendMessage(chatId, message) {
    try {
      if (!this.ready) {
        throw new Error('WhatsApp client not ready. Scan the QR code to authenticate.');
      }
      if (!chatId || typeof chatId !== 'string' || !chatId.includes('@')) {
        throw new Error('Invalid chatId provided');
      }
      await this.client.sendMessage(chatId, message);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getClient() {
    return this.client;
  }

  isReady() {
    return this.ready === true;
  }

  async waitUntilReady(timeoutMs = 30000) {
    if (this.ready) return true;
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (this.ready) return resolve(true);
        if (Date.now() - start > timeoutMs) return reject(new Error('Timed out waiting for WhatsApp client to be ready'));
        setTimeout(check, 500);
      };
      check();
    });
  }
}

module.exports = WhatsAppClient;