# WhatsApp Bot for Tailoring Shop 🧵📱

A lightweight, memory-optimized WhatsApp automation bot specifically designed for tailoring shops, built for Railway deployment.

## ✨ Features

- **WhatsApp Integration**: Send automated order notifications via WhatsApp
- **Memory Optimized**: Designed for Railway's memory constraints
- **Easy Authentication**: Web-based QR code scanning
- **Order Notifications**: Automated customer notifications when orders are ready
- **Health Monitoring**: Built-in health checks and session management
- **Railway Ready**: Optimized specifically for Railway platform

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## 📋 Prerequisites

- Node.js 20.x
- WhatsApp Business or Personal account
- Railway account (free tier supported)

## 🛠️ Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mrsaurabhtanwar/tailoring-whatsapp-bot.git
   cd tailoring-whatsapp-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp env.example .env
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

5. **Authenticate WhatsApp**:
   - Open http://localhost:8080/scanner
   - Scan QR code with WhatsApp mobile app

## ☁️ Railway Deployment

### Method 1: One-Click Deploy
1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Configure environment variables
4. Deploy!

### Method 2: Manual Deploy
1. Fork this repository
2. Connect to Railway at [railway.app](https://railway.app)
3. Create new project from your fork
4. Set environment variables (see below)
5. Deploy automatically

### Required Environment Variables

```env
NODE_ENV=production
RAILWAY=true
PORT=8080
SEND_DELAY_MS=1000
NODE_OPTIONS=--max-old-space-size=512 --expose-gc --optimize-for-size
SHOP_NAME=Your Shop Name
SHOP_PHONE=Your Shop Phone Number
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
```

## 📱 WhatsApp Authentication

After deployment:

1. Visit your Railway app URL: `https://your-app.railway.app/scanner`
2. Scan the QR code with WhatsApp mobile app
3. Verify connection at: `https://your-app.railway.app/session-status`

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check and API info |
| `/healthz` | GET | Strict health check |
| `/scanner` | GET | QR code scanner page |
| `/qr` | GET | QR code image |
| `/session-status` | GET | WhatsApp session status |
| `/webhook/order-ready` | POST | Send order ready notification |

## 📨 Sending Notifications

Send a POST request to `/webhook/order-ready`:

```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "item": "Shirt",
  "dueDate": "2024-01-15",
  "price": 500,
  "orderId": "ORD001",
  "advancePayment": 200
}
```

Example with curl:
```bash
curl -X POST https://your-app.railway.app/webhook/order-ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "item": "Shirt",
    "dueDate": "2024-01-15",
    "price": 500
  }'
```

## 🏗️ Project Structure

```
tailoring-whatsapp-bot/
├── server.js                 # Main application server
├── whatsapp-client.js        # WhatsApp client wrapper
├── templates.js              # Message templates
├── memory-guardian.js        # Memory management
├── session-keepalive.js      # Session maintenance
├── session-storage.js        # Session persistence
├── chromium-session-manager.js # Browser session management
├── qr-scanner.html           # QR code scanner page
├── Dockerfile                # Railway container config
├── railway.toml              # Railway deployment config
├── package.json              # Dependencies and scripts
└── RAILWAY_DEPLOYMENT.md     # Detailed deployment guide
```

## 🔧 Memory Optimization

This bot is specifically optimized for Railway's memory constraints:

- Memory limit: 512MB RAM
- Garbage collection enabled
- Optimized Puppeteer settings
- Memory pressure monitoring
- Automatic cleanup routines

## 📊 Monitoring

### Health Checks
- **Basic**: `GET /` - General health and info
- **Strict**: `GET /healthz` - Binary health status
- **Session**: `GET /session-status` - WhatsApp authentication status

### Memory Management
- Automatic garbage collection
- Memory pressure detection
- Request rejection under high memory usage
- Built-in memory cleanup endpoint

## �️ Troubleshooting

### Common Issues

1. **WhatsApp Disconnected**
   - Re-scan QR code at `/scanner`
   - Check session status at `/session-status`

2. **Memory Errors**
   - Bot auto-manages memory within Railway limits
   - Use `/cleanup` endpoint if needed

3. **Deployment Issues**
   - Check Railway build logs
   - Verify environment variables

### Debug Endpoints
- `/session-status` - Check WhatsApp connection
- `/` - View all available endpoints
- Railway logs via dashboard or CLI

## � Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [WhatsApp Web.js Documentation](https://wwebjs.dev/)
- [Railway Documentation](https://docs.railway.app/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Saurabh Tanwar**
- GitHub: [@mrsaurabhtanwar](https://github.com/mrsaurabhtanwar)

## 🙏 Acknowledgments

- [WhatsApp Web.js](https://github.com/pedroslopez/whatsapp-web.js) for the WhatsApp API
- [Railway](https://railway.app) for the hosting platform
- [Puppeteer](https://github.com/puppeteer/puppeteer) for browser automation

---

⭐ **Star this repository if it helped you!**