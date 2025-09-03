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

// Webhook to receive order ready notifications
app.post('/webhook/order-ready', async (req, res) => {
  try {
    const { name, phone, item, orderDate, dueDate } = req.body;
    
    // Format phone number (ensure it has country code)
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
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
    res.json({ success: true, message: 'Message sent successfully' });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});