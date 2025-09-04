# WhatsApp Tailoring Shop Bot

A WhatsApp automation bot for tailoring shops that sends order ready notifications to customers.

## Features

- 📱 WhatsApp message automation
- 🔗 Webhook integration for order notifications
- 📷 QR code authentication
- ☁️ Cloud deployment ready (Render.com)

## Quick Start

### 1. Deploy to Render.com

1. Fork this repository
2. Connect your GitHub account to Render.com
3. Create a new Web Service
4. Connect your repository
5. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 2. Authenticate WhatsApp

1. After deployment, visit: `https://your-app.onrender.com/scanner`
2. Open WhatsApp on your mobile phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code displayed on the page
5. Wait for the status to show "Ready"

### 3. Test the Webhook

Send a POST request to `https://your-app.onrender.com/webhook/order-ready`:

```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "item": "Formal Shirt",
  "orderDate": "2024-01-15",
  "dueDate": "2024-01-20"
}
```

## API Endpoints

- `GET /` - Health check and status
- `GET /scanner` - QR scanner page for authentication
- `GET /qr` - QR code image
- `POST /webhook/order-ready` - Send WhatsApp notifications

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Visit `http://localhost:3000/scanner` to authenticate
5. Test with the webhook endpoint

## Replit Setup

- This repo includes `.replit` and `replit.nix` to install Chromium and run Node with a safe memory cap.
- Env vars: copy `.env.example` to `.env` if needed. `CHROME_PATH` can be left blank; it will auto-detect Chromium on Replit. If detection fails, set it to `/run/current-system/sw/bin/chromium`.
- Start: click Run (uses `npm run start:replit`).
- Authenticate at `/scanner` and confirm `/healthz` returns `{ ok: true }` before sending.
- Throttling: messages are serialized and rate-limited (default 600ms) to protect memory.

## Troubleshooting

### WhatsApp Not Ready
- Make sure you've scanned the QR code
- Check the logs for authentication errors
- Try re-scanning the QR code

### 404 Errors
- Ensure the server is running
- Check the correct endpoint URLs
- Verify the deployment is successful

### Message Sending Fails
- Confirm WhatsApp client is authenticated
- Check phone number format (should include country code)
- Verify the webhook payload format

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

## Dependencies

- `express` - Web framework
- `whatsapp-web.js` - WhatsApp Web API
- `qrcode` - QR code generation
- `qrcode-terminal` - Terminal QR display

## Support

For issues and questions, check the logs in your Render dashboard or contact support.
