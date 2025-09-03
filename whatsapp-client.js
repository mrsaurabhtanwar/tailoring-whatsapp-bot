const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');

class WhatsAppClient {
  constructor() {
    this.ready = false;
    this.restartCount = 0;
    this.maxRestarts = 5;
    this.lastRestart = Date.now();
    this.healthCheckInterval = null;
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
          '--disable-features=VizDisplayCompositor',
          '--memory-pressure-off',
          '--max_old_space_size=256',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
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
      this.restartCount = 0; // Reset restart count on successful connection
      console.log('✅ WhatsApp Client is ready and authenticated!');
      console.log('📱 Bot is now ready to send messages');
      
      // Start health check
      this.startHealthCheck();
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      this.stopHealthCheck();
      console.log('❌ WhatsApp Client disconnected:', reason);
      
      // Check if we should restart
      if (this.shouldRestart()) {
        const delay = Math.min(5000 * (this.restartCount + 1), 30000); // Exponential backoff, max 30s
        console.log(`🔄 Attempting to reconnect in ${delay/1000} seconds... (attempt ${this.restartCount + 1}/${this.maxRestarts})`);
        
        setTimeout(() => {
          console.log('🔄 Reinitializing WhatsApp client...');
          this.restartCount++;
          this.lastRestart = Date.now();
          this.client.initialize();
        }, delay);
      } else {
        console.log('❌ Max restart attempts reached. Manual intervention required.');
      }
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

  // Health check methods
  startHealthCheck() {
    this.stopHealthCheck(); // Clear any existing interval
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
    
    console.log('🔍 Health check started');
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🔍 Health check stopped');
    }
  }

  performHealthCheck() {
    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      console.log(`💾 Memory usage: ${memUsageMB}MB`);
      
      // If memory usage is too high, restart
      if (memUsageMB > 400) { // 400MB threshold
        console.log('⚠️ High memory usage detected, restarting client...');
        this.restartClient();
        return;
      }
      
      // Check if client is still responsive
      if (this.ready && this.client) {
        // Try to get client info to check if it's still responsive
        this.client.getState().then(state => {
          if (state !== 'CONNECTED') {
            console.log('⚠️ Client state is not CONNECTED:', state);
            this.restartClient();
          }
        }).catch(error => {
          console.log('⚠️ Health check failed:', error.message);
          this.restartClient();
        });
      }
      
    } catch (error) {
      console.error('❌ Health check error:', error);
    }
  }

  shouldRestart() {
    // Don't restart if we've exceeded max attempts
    if (this.restartCount >= this.maxRestarts) {
      return false;
    }
    
    // Don't restart if we just restarted recently (less than 1 minute ago)
    if (Date.now() - this.lastRestart < 60000) {
      return false;
    }
    
    return true;
  }

  restartClient() {
    console.log('🔄 Restarting WhatsApp client...');
    this.ready = false;
    this.stopHealthCheck();
    
    try {
      if (this.client) {
        this.client.destroy();
      }
    } catch (error) {
      console.log('Error destroying client:', error.message);
    }
    
    // Wait a bit before recreating
    setTimeout(() => {
      this.initialize();
    }, 2000);
  }

  // Cleanup method
  destroy() {
    console.log('🧹 Cleaning up WhatsApp client...');
    this.stopHealthCheck();
    this.ready = false;
    
    try {
      if (this.client) {
        this.client.destroy();
      }
    } catch (error) {
      console.log('Error during cleanup:', error.message);
    }
  }
}

module.exports = WhatsAppClient;