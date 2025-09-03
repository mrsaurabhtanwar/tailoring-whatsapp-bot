const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');

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
    this.client.on('qr', async (qr) => {
      console.log('QR RECEIVED', qr);
      
      // Display QR in terminal
      qrcode.generate(qr, { small: true });
      
      // Save QR as image file
      try {
        await QRCode.toFile('current-qr.png', qr, { width: 400 });
        console.log('✅ QR code saved as current-qr.png - Open this file to scan!');
        
        // Also save as data URL for easy viewing
        const dataUrl = await QRCode.toDataURL(qr);
        fs.writeFileSync('qr-data-url.txt', dataUrl);
        console.log('✅ QR data URL saved to qr-data-url.txt');
      } catch (error) {
        console.error('Error saving QR code:', error);
      }
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