const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');

class WhatsAppClient {
  constructor() {
    this.ready = false;
    this.restartCount = 0;
    this.maxRestarts = 10; // Increased from 5 to 10
    this.lastRestart = Date.now();
    this.healthCheckInterval = null;
    this.lastOpeningTime = null;
    this.lastErrorTime = null;
    this.keepAliveInterval = null;
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
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--disable-logging',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-software-rasterizer',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-webgl',
          '--disable-webgl2',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain'
        ],
        timeout: 60000, // 60 second timeout
        protocolTimeout: 180000 // 3 minute protocol timeout
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
      
      // Start keep-alive mechanism
      this.startKeepAlive();
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      this.stopHealthCheck();
      this.stopKeepAlive();
      console.log('❌ WhatsApp Client disconnected:', reason);
      
      // Clean up QR code files on disconnect
      try {
        if (fs.existsSync('current-qr.png')) {
          fs.unlinkSync('current-qr.png');
        }
        if (fs.existsSync('qr-data-url.txt')) {
          fs.unlinkSync('qr-data-url.txt');
        }
      } catch (error) {
        console.log('Warning: Could not clean up QR files:', error.message);
      }
      
      // Only attempt restart for certain reasons, not LOGOUT
      if (reason !== 'LOGOUT' && this.shouldRestart()) {
        const delay = Math.min(10000 * (this.restartCount + 1), 60000); // Increased delays
        console.log(`🔄 Attempting to reconnect in ${delay/1000} seconds... (attempt ${this.restartCount + 1}/${this.maxRestarts})`);
        
        setTimeout(() => {
          console.log('🔄 Reinitializing WhatsApp client...');
          this.restartCount++;
          this.lastRestart = Date.now();
          this.initialize();
        }, delay);
      } else if (reason === 'LOGOUT') {
        console.log('📱 Client was logged out - authentication required. QR code will be generated on next initialization.');
        // For logout, clean restart without counting as failure
        setTimeout(() => {
          console.log('🔄 Restarting after logout...');
          this.initialize();
        }, 5000);
      } else {
        console.log('❌ Max restart attempts reached or restart not appropriate for reason:', reason);
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
    }, 60000); // Increased from 30 seconds to 60 seconds
    
    console.log('🔍 Health check started');
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🔍 Health check stopped');
    }
  }

  // Keep-alive mechanism to prevent timeouts
  startKeepAlive() {
    this.stopKeepAlive(); // Clear any existing interval
    
    this.keepAliveInterval = setInterval(async () => {
      try {
        if (this.ready && this.client) {
          // Send a ping to keep the connection alive
          await this.client.getState();
          console.log('💓 Keep-alive ping sent');
        }
      } catch (error) {
        console.log('⚠️ Keep-alive failed:', error.message);
      }
    }, 300000); // Every 5 minutes
    
    console.log('💓 Keep-alive mechanism started');
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      console.log('💓 Keep-alive stopped');
    }
  }

  performHealthCheck() {
    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      console.log(`💾 Memory usage: ${memUsageMB}MB`);
      
      // If memory usage is too high, restart
      if (memUsageMB > 400) { // Reduced threshold to 400MB
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
            // Only restart if state is OPENING for more than 30 seconds
            if (state === 'OPENING' && this.lastOpeningTime) {
              if (Date.now() - this.lastOpeningTime > 30000) {
                console.log('🔄 Client stuck in OPENING state, restarting...');
                this.restartClient();
              }
            } else if (state === 'OPENING') {
              this.lastOpeningTime = Date.now();
            } else {
              this.lastOpeningTime = null;
            }
          } else {
            this.lastOpeningTime = null;
          }
        }).catch(error => {
          console.log('⚠️ Health check failed:', error.message);
          // Only restart if error persists for more than 30 seconds
          if (!this.lastErrorTime) {
            this.lastErrorTime = Date.now();
          } else if (Date.now() - this.lastErrorTime > 30000) {
            console.log('🔄 Persistent health check errors, restarting...');
            this.restartClient();
            this.lastErrorTime = null;
          }
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
    this.stopKeepAlive();
    
    try {
      if (this.client) {
        this.client.destroy();
      }
    } catch (error) {
      console.log('Error destroying client:', error.message);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Wait longer before recreating to allow cleanup
    setTimeout(() => {
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
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--disable-logging',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-background-networking',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-software-rasterizer',
            '--disable-threaded-animation',
            '--disable-threaded-scrolling',
            '--disable-webgl',
            '--disable-webgl2',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--no-default-browser-check',
            '--no-pings',
            '--password-store=basic',
            '--use-mock-keychain'
          ],
          timeout: 60000,
          protocolTimeout: 180000
        }
      });
      this.initialize();
    }, 10000); // Increased from 5 seconds to 10 seconds
  }

  // Cleanup method
  destroy() {
    console.log('🧹 Cleaning up WhatsApp client...');
    this.stopHealthCheck();
    this.stopKeepAlive();
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