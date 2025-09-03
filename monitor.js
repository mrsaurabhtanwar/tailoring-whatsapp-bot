const axios = require('axios');
const fs = require('fs');

class BotMonitor {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.monitoringInterval = null;
  }

  checkMemory() {
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    console.log(`📊 Memory Status:`);
    console.log(`   Heap Used: ${memUsageMB}MB`);
    console.log(`   Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    console.log(`   External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
    console.log(`   RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    
    // Log to file for debugging
    const logEntry = {
      timestamp: new Date().toISOString(),
      heapUsed: memUsageMB,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    };
    
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync('memory.log', logLine);
    } catch (error) {
      console.log('Could not write to memory.log:', error.message);
    }
    
    // Warn if memory is high
    if (memUsageMB > 300) {
      console.log('⚠️ HIGH MEMORY WARNING!');
      
      // Force garbage collection if available
      if (global.gc) {
        console.log('🧹 Running garbage collection...');
        global.gc();
        const afterGC = process.memoryUsage();
        console.log(`📊 After GC: ${Math.round(afterGC.heapUsed / 1024 / 1024)}MB`);
      }
    }
    
    return memUsageMB;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/`);
      const data = response.data;
      
      console.log('🔍 Bot Health Check:', new Date().toISOString());
      console.log('📊 Status:', data.status);
      console.log('📱 WhatsApp Ready:', data.whatsappReady);
      console.log('📷 QR Available:', data.qrCodeAvailable);
      console.log('⏰ Timestamp:', data.timestamp);
      
      // Check memory
      const memUsage = this.checkMemory();
      
      console.log('---');
      
      return { ...data, memoryUsage: memUsage };
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return null;
    }
  }

  async sendTestMessage() {
    try {
      const testData = {
        name: 'Test Customer',
        phone: '917078319637',
        item: 'test shirt',
        orderDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };

      console.log('📤 Sending test message...');
      const response = await axios.post(`${this.baseUrl}/webhook/order-ready`, testData);
      
      console.log('✅ Test message result:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Test message failed:', error.response?.data || error.message);
      return null;
    }
  }

  startMonitoring(intervalMs = 30000) { // Default: 30 seconds
    console.log(`🔍 Starting bot monitoring every ${intervalMs/1000} seconds...`);
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Monitoring stopped');
    }
  }

  async runDiagnostics() {
    console.log('🔧 Running bot diagnostics...\n');
    
    // Check health
    const health = await this.checkHealth();
    
    if (health) {
      // Test message if WhatsApp is ready
      if (health.whatsappReady) {
        console.log('📤 Testing message sending...');
        await this.sendTestMessage();
      } else {
        console.log('⚠️ WhatsApp not ready - skipping message test');
      }
    }
    
    console.log('\n🔧 Diagnostics complete');
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new BotMonitor();
  
  const command = process.argv[2];
  const interval = parseInt(process.argv[3]) || 30000;
  
  switch (command) {
    case 'monitor':
      monitor.startMonitoring(interval);
      break;
    case 'health':
      monitor.checkHealth();
      break;
    case 'test':
      monitor.sendTestMessage();
      break;
    case 'diagnose':
      monitor.runDiagnostics();
      break;
    default:
      console.log('Usage: node monitor.js [command] [interval]');
      console.log('Commands:');
      console.log('  monitor [interval] - Start continuous monitoring');
      console.log('  health             - Single health check');
      console.log('  test               - Send test message');
      console.log('  diagnose           - Run full diagnostics');
      console.log('Example: node monitor.js monitor 60000');
  }
}

module.exports = BotMonitor;
