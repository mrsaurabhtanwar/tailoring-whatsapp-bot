function generateMessage(type, data) {
  const safe = (v, d = '') => (v === undefined || v === null ? d : String(v));
  const templates = {
    orderReady: `🎉 *Great News, ${safe(data.customerName, 'Customer')}!*

Your order is ready for pickup.

� *Items:* ${safe(data.garmentTypes, safe(data.item, 'order'))}
� *Ready By:* ${safe(data.deliveryDate, safe(data.dueDate, 'today'))}

🏪 ${safe(data.shopName, 'Our Shop')}\r\n`.
      trim(),

    orderConfirm: `✅ *Order Confirmed!*

Hi ${data.customerName},

Your order has been confirmed:
📋 *Order ID:* ${data.orderId}
👔 *Items:* ${data.garmentTypes}
💰 *Amount:* ₹${data.price}
📅 *Expected Ready Date:* ${data.deliveryDate}

We'll notify you once it's ready! 

*${data.shopName}*`,

    reminder: `⏰ *Pickup Reminder*

Hi ${data.customerName},

Your complete order is ready for pickup:
📋 *Order ID:* ${data.orderId}
👔 *Items:* ${data.garmentTypes}

Please collect at your earliest convenience.

*${data.shopName}*
📞 ${data.shopPhone}`,

    fittingReminder: `📏 *Fitting Appointment*

Hi ${data.customerName},

Your fitting is scheduled:
📋 *Order ID:* ${data.orderId}
👔 *Items:* ${data.garmentTypes}

Please visit us during shop hours.

*${data.shopName}*`
  };

  return templates[type] || 'Thank you for your order!';
  const msg = templates[type] || `Thank you for your order, ${safe(data.customerName, '')}!`.trim();
  // Ensure message length is sane to avoid large buffers
  return msg.length > 1000 ? msg.slice(0, 1000) : msg;
}

module.exports = { generateMessage };