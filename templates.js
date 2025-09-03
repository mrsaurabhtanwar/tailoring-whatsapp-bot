function generateMessage(type, data) {
  const templates = {
    orderReady: `🎉 *Great News, ${data.customerName}!*

Your complete order is ready for pickup! ✨

📋 *Order ID:* ${data.orderId}
👔 *Items:* ${data.garmentTypes}
💰 *Total Amount:* ₹${data.price}

📍 *Pickup Details:*
🏪 ${data.shopName}
🕒 Shop Hours: 10:00 AM - 8:00 PM
📞 Call us: ${data.shopPhone}

Please visit us at your convenience to collect your order.

Thank you for choosing us! 🙏

*${data.shopName}*
_Your Style, Our Craft_`,

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
}

module.exports = { generateMessage };