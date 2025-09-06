# WhatsApp Tailoring Shop Bot

## Overview

A WhatsApp automation bot designed for tailoring shops to send order ready notifications to customers. The application integrates with WhatsApp Web using whatsapp-web.js and provides webhook endpoints for order management. It's optimized for Azure F1 (Free Tier) deployment with memory constraints and includes fallback mechanisms for browser compatibility issues.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Application Structure
- **Main Server**: Express.js application (`server.js`) serving as the primary entry point
- **WhatsApp Client**: Two implementations - `whatsapp-client.js` (standard) and `whatsapp-client-azure.js` (Azure-optimized with fallback strategies)
- **Message Templates**: Hindi-language message templates (`templates.js`) for customer notifications
- **Session Management**: Local authentication with persistent session storage in `.wwebjs_auth` directory

### Frontend Components
- **QR Scanner Interface**: Static HTML pages (`qr.html`, `qr-scanner.html`) for WhatsApp authentication
- **Health Check Endpoints**: RESTful endpoints for monitoring application status and readiness
- **QR Code Generation**: Real-time QR code generation for WhatsApp Web authentication

### Backend Architecture
- **Express.js Framework**: Lightweight web server with JSON middleware
- **Rate Limiting**: Bottleneck implementation for message throttling to prevent spam
- **Memory Optimization**: Configured for Azure F1 constraints with 512MB max old space size
- **Error Handling**: Comprehensive error handling for Azure deployment scenarios

### WhatsApp Integration Strategy
- **Primary Method**: Local Chrome browser with Puppeteer integration
- **Azure Fallback**: External Chrome service support (browserless.io) for F1 tier limitations
- **Session Persistence**: LocalAuth strategy with automatic session recovery
- **QR Authentication**: Multiple QR generation formats (PNG files and data URLs)

### Message Processing
- **Template System**: Structured Hindi message templates with currency and date formatting
- **Garment Translation**: English to Hindi garment type conversion
- **Webhook Integration**: RESTful endpoint for receiving order ready notifications
- **Message Queuing**: Sequential message processing to avoid rate limiting

### Deployment Optimizations
- **Azure F1 Compatibility**: Special handling for Azure App Service limitations
- **Memory Management**: Restricted request body size and optimized Chrome configurations
- **Platform Detection**: Automatic Windows/Linux Chrome path resolution
- **Environment Configuration**: Flexible configuration via environment variables

## External Dependencies

### Core Runtime
- **Node.js 20.x**: Primary runtime environment
- **Express.js**: Web application framework
- **whatsapp-web.js**: WhatsApp Web API wrapper

### Browser Automation
- **Puppeteer**: Chrome browser automation (local development)
- **External Chrome Services**: browserless.io, ScrapingBee, or Bright Data for Azure F1 deployment
- **QR Code Libraries**: qrcode and qrcode-terminal for authentication interface

### Utility Libraries
- **Bottleneck**: Rate limiting and message throttling
- **Axios**: HTTP client for external API calls
- **dotenv**: Environment variable management

### Cloud Platform
- **Microsoft Azure App Service**: Primary hosting platform (F1 Free Tier)
- **Azure Application Settings**: Configuration management via environment variables
- **GitHub Actions**: Automated deployment pipeline

### WhatsApp Integration
- **WhatsApp Web**: Authentication and message sending via web interface
- **Session Storage**: Local file system for authentication persistence
- **QR Authentication**: Phone-based pairing system

### Fallback Services
- **Remote Chrome Services**: External browser services for Azure compatibility
- **Alternative Hosting**: Railway, Render, DigitalOcean as backup deployment options