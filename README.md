# WhatsApp Tailoring Shop Bot

A WhatsApp automation bot for tailoring shops that sends order ready notifications to customers.

## Features

- 📱 WhatsApp message automation via whatsapp-web.js
- 🔗 Webhook integration for order notifications
- 📷 QR code authentication with session persistence
- ☁️ Ready for Replit deployment with minimal setup
- 🛡️ Memory-optimized with throttling and health checks

## Replit Quick Start

### 1. Import to Replit

1. Fork or import this repository to Replit
2. Replit will automatically detect the configuration and install dependencies
3. Click the **Run** button

### 2. Authenticate WhatsApp

1. After the server starts, visit the **Scanner** tab or go to `/scanner`
2. Open WhatsApp on your mobile phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code displayed
5. Wait for authentication success message

### 3. Verify Health

- Check `/healthz` endpoint - should return `{"ok": true}` when ready
- Check `/` for detailed status including `whatsappReady: true`

### 4. Test Message Sending

Send a POST request to `/webhook/order-ready`:

```json
{
  "name": "John Doe", 
  "phone": "9876543210",
  "item": "Formal Shirt",
  "dueDate": "2024-01-20"
}
```

## API Endpoints

- `GET /` - Health check and status
- `GET /healthz` - Strict health check (200 when ready, 503 when not)
- `GET /scanner` - QR scanner page for authentication  
- `GET /qr` - QR code image
- `POST /webhook/order-ready` - Send WhatsApp notifications

## Configuration

### Environment Variables (Optional)

Copy `.env.example` to create a `.env` file if needed:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `CHROME_PATH` - Custom Chromium path (auto-detected on Replit)
- `SEND_DELAY_MS` - Throttle delay between messages (default: 600ms)

### Webhook Payload

Required fields:
- `name` - Customer name
- `phone` - Phone number (will auto-add +91 for India)
- `item` - Order description

Optional fields:
- `orderDate` - Order date
- `dueDate` - Expected completion date

## Features

### Memory Management
- Memory-capped Node.js process (512MB on Replit)
- Single long-lived WhatsApp client with session persistence
- Automatic memory monitoring and cleanup

### Message Throttling
- Rate-limited message sending (600ms default delay)
- Serialized message queue to prevent concurrency issues
- Bottleneck integration for reliable delivery

### Health Monitoring
- `/healthz` endpoint for uptime monitoring
- Automatic client restart on failures
- Graceful shutdown handling

## Troubleshooting

### WhatsApp Not Ready
- Visit `/scanner` to re-authenticate
- Check console logs for errors
- Verify QR code scanning was successful

### Message Sending Fails
- Ensure WhatsApp client shows as ready (`/healthz` returns 200)
- Check phone number format (should be 10+ digits)
- Verify webhook payload has required fields

### Memory Issues
- Monitor memory usage in logs
- Replit automatically restarts if memory limit exceeded
- Consider reducing `SEND_DELAY_MS` if needed

## Local Development

```bash
git clone <repository>
cd tailoring-whatsapp-bot
npm install
npm run dev
```

Visit `http://localhost:3000/scanner` to authenticate locally.

## Dependencies

- `express` - Web framework
- `whatsapp-web.js` - WhatsApp Web API
- `puppeteer-core` - Browser automation (aliased from puppeteer)
- `bottleneck` - Rate limiting
- `qrcode` - QR code generation
- `dotenv` - Environment configuration
