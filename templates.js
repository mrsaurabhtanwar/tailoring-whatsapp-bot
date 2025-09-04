function generateMessage(type, data = {}) {
  const safe = (v, d = '') => (v === undefined || v === null ? d : String(v));
  const templates = {
    orderReady: `🎉 *Great News, ${safe(data.customerName, 'Customer')}!*

Your order is ready for pickup.

• *Items:* ${safe(data.garmentTypes, safe(data.item, 'order'))}
• *Ready By:* ${safe(data.deliveryDate, safe(data.dueDate, 'today'))}

🏪 ${safe(data.shopName, 'Our Shop')}`.trim(),

    orderConfirm: `✅ *Order Confirmed!*

Hi ${safe(data.customerName, 'Customer')},

Your order has been confirmed:
📋 *Order ID:* ${safe(data.orderId, '-')}
👔 *Items:* ${safe(data.garmentTypes, safe(data.item, '-'))}
💰 *Amount:* ₹${safe(data.price, '-')}
📅 *Expected Ready Date:* ${safe(data.deliveryDate, '-')}

We'll notify you once it's ready!

*${safe(data.shopName, 'Our Shop')}*`.trim(),

    reminder: `⏰ *Pickup Reminder*

Hi ${safe(data.customerName, 'Customer')},

Your complete order is ready for pickup:
📋 *Order ID:* ${safe(data.orderId, '-')}
👔 *Items:* ${safe(data.garmentTypes, safe(data.item, '-'))}

Please collect at your earliest convenience.

*${safe(data.shopName, 'Our Shop')}*
📞 ${safe(data.shopPhone, '')}`.trim(),

    fittingReminder: `📏 *Fitting Appointment*

Hi ${safe(data.customerName, 'Customer')},

Your fitting is scheduled:
📋 *Order ID:* ${safe(data.orderId, '-')}
👔 *Items:* ${safe(data.garmentTypes, safe(data.item, '-'))}

Please visit us during shop hours.

*${safe(data.shopName, 'Our Shop')}*`.trim()
  };

  const fallback = `Thank you for your order, ${safe(data.customerName, 'Customer')}!`;
  const msg = (templates[type] || fallback).trim();
  // Ensure message length is sane to avoid large buffers
  return msg.length > 2000 ? msg.slice(0, 2000) : msg;
}

module.exports = { generateMessage };