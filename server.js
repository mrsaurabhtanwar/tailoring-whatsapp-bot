const express = require('express');
const fs = require('fs');
const path = require('path');
const WhatsAppClient = require('./whatsapp-client');
const { generateMessage } = require('./templates');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize WhatsApp client
const whatsappClient = new WhatsAppClient();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Tailoring Shop Bot Running',
    timestamp: new Date().toISOString(),
    whatsappReady: typeof whatsappClient.isReady === 'function' ? whatsappClient.isReady() : false,
    qrCodeAvailable: fs.existsSync('current-qr.png'),
    endpoints: {
      'GET /': 'Health check',
      'GET /scanner': 'QR scanner page for WhatsApp authentication',
      'GET /qr': 'Get QR code image for WhatsApp authentication',
      'POST /webhook/order-ready': 'Send WhatsApp notifications'
    }
  });
});

// QR scanner page
app.get('/scanner', (req, res) => {
  res.sendFile(path.join(__dirname, 'qr-scanner.html'));
});

// QR code endpoint for authentication
app.get('/qr', (req, res) => {
  try {
    if (fs.existsSync('current-qr.png')) {
      res.sendFile(path.join(__dirname, 'current-qr.png'));
    } else {
      res.status(404).json({ 
        error: 'QR code not available. Please wait for WhatsApp client to generate one.',
        whatsappReady: typeof whatsappClient.isReady === 'function' ? whatsappClient.isReady() : false
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve QR code' });
  }
});

// Memory cleanup endpoint
app.post('/cleanup', (req, res) => {
  try {
    const memBefore = process.memoryUsage();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const memAfter = process.memoryUsage();
    const memFreed = Math.round((memBefore.heapUsed - memAfter.heapUsed) / 1024 / 1024);
    
    res.json({
      success: true,
      message: 'Memory cleanup completed',
      memoryBefore: Math.round(memBefore.heapUsed / 1024 / 1024) + 'MB',
      memoryAfter: Math.round(memAfter.heapUsed / 1024 / 1024) + 'MB',
      memoryFreed: memFreed + 'MB'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Memory cleanup failed: ' + error.message 
    });
  }
});

// Handle POST to root (redirect to proper endpoint)
app.post('/', (req, res) => {
  res.status(400).json({ 
    success: false,
    error: 'Invalid endpoint. Use /webhook/order-ready for WhatsApp notifications',
    availableEndpoints: {
      'GET /': 'Health check',
      'POST /webhook/order-ready': 'Send WhatsApp notifications'
    }
  });
});

// Webhook to receive order ready notifications
app.post('/webhook/order-ready', async (req, res) => {
  try {
    console.log('Received webhook data:', req.body);
    
    const { name, phone, item, orderDate, dueDate } = req.body;
    
  // Validate required fields
  if (!name || !phone || !item) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, phone, and item are required' 
      });
    }
    
    // Format phone number (ensure it has country code)
    let formattedPhone = phone.toString().replace(/\D/g, ''); // Remove non-digits
    // Basic sanity: must be at least 10 digits after cleaning
    if (formattedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number: must contain at least 10 digits'
      });
    }
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = `91${formattedPhone}`;
    }
    const chatId = `${formattedPhone}@c.us`;
    
    // Generate message
    const message = generateMessage('orderReady', {
      customerName: name,
      item: item,
      orderId: '',
      garmentTypes: item,
      price: '',
      deliveryDate: dueDate || '',
      shopName: 'RS Tailors & Fabric', // Change to your shop name
      shopPhone: ''
    });
    
    // Wait for WhatsApp to be ready with retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    while (retryCount < maxRetries) {
      if (typeof whatsappClient.isReady === 'function' && whatsappClient.isReady()) {
        break;
      }
      
      console.log(`⏳ Waiting for WhatsApp client to be ready... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryCount++;
    }
    
    if (retryCount >= maxRetries) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client not ready after multiple attempts. Please scan the QR code to authenticate.',
      });
    }

    // Send WhatsApp message
    await whatsappClient.sendMessage(chatId, message);
    
    console.log(`Message sent to ${name} (${phone}) for ${item}`);
    res.json({ 
      success: true, 
      message: 'WhatsApp message sent successfully',
      details: {
        customer: name,
        phone: formattedPhone,
        item: item
      }
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
  const status = String(error && error.message || '').includes('not ready') ? 503 : 500;
  res.status(status).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to send WhatsApp message'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: error.message 
  });
});

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  console.log(`💾 Server Memory: ${memUsageMB}MB`);
  
  // If memory usage is too high, log warning
  if (memUsageMB > 450) {
    console.log('⚠️ High memory usage detected!');
  }
}, 60000); // Check every minute

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  if (whatsappClient && typeof whatsappClient.destroy === 'function') {
    whatsappClient.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  if (whatsappClient && typeof whatsappClient.destroy === 'function') {
    whatsappClient.destroy();
  }
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 WhatsApp Bot Status: ${whatsappClient.isReady() ? 'Ready' : 'Not Ready'}`);
  console.log(`🔗 Health check: http://localhost:${port}/`);
  console.log(`📷 QR Code: http://localhost:${port}/qr`);
  console.log(`📨 Webhook: http://localhost:${port}/webhook/order-ready`);
  console.log(`💾 Initial Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});