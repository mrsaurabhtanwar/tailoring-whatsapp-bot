const express = require('express');
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
    timestamp: new Date().toISOString()
  });
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
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = `91${formattedPhone}`;
    }
    const chatId = `${formattedPhone}@c.us`;
    
    // Generate message
    const message = generateMessage('orderReady', {
      customerName: name,
      item: item,
      shopName: 'Sharma Tailors' // Change to your shop name
    });
    
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
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to send WhatsApp message'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});