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
    
    // Ensure WhatsApp is ready
    if (typeof whatsappClient.isReady === 'function' && !whatsappClient.isReady()) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client not ready. Please scan the QR code to authenticate.',
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 WhatsApp Bot Status: ${whatsappClient.isReady() ? 'Ready' : 'Not Ready'}`);
  console.log(`🔗 Health check: http://localhost:${port}/`);
  console.log(`📷 QR Code: http://localhost:${port}/qr`);
  console.log(`📨 Webhook: http://localhost:${port}/webhook/order-ready`);
});