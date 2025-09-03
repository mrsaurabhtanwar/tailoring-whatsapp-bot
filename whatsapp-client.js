const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppClient {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'tailoring-shop-bot'
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
          '--disable-gpu'
        ]
      }
    });

    this.initialize();
  }

  initialize() {
    this.client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp Client is ready!');
    });

    this.client.on('disconnected', (reason) => {
      console.log('Client was logged out', reason);
      // Auto-restart after 5 seconds
      setTimeout(() => {
        this.client.initialize();
      }, 5000);
    });

    this.client.on('auth_failure', () => {
      console.log('Authentication failed');
    });

    this.client.initialize();
  }

  async sendMessage(chatId, message) {
    try {
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
}

module.exports = WhatsAppClient;