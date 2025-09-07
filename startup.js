#!/usr/bin/env node

/**
 * Azure App Service Startup Script
 * Handles graceful startup and error recovery
 */

const path = require('path');

// Enhanced error handling for Azure
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately, let Azure handle restart
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections in Azure
});

// Azure-specific environment detection
const isAzure = process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_HOSTNAME;
const port = process.env.PORT || process.env.WEBSITES_PORT || 8080;

console.log('🔄 Starting WhatsApp Bot...');
console.log(`📦 Node.js version: ${process.version}`);
console.log(`🌐 Environment: ${isAzure ? 'Azure' : 'Local'}`);
console.log(`🔌 Port: ${port}`);
console.log(`💾 Memory limit: ${process.env.NODE_OPTIONS || 'default'}`);

// Ensure we're in the right directory
const appDir = path.dirname(__filename);
process.chdir(appDir);
console.log(`📁 Working directory: ${process.cwd()}`);

// Check required files exist
const requiredFiles = ['server.js', 'package.json', 'whatsapp-client.js'];
for (const file of requiredFiles) {
  try {
    require.resolve(`./${file}`);
    console.log(`✅ Found: ${file}`);
  } catch (error) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
}

// Start the actual server with error recovery
let startAttempts = 0;
const maxAttempts = 3;

function startServer() {
  startAttempts++;
  console.log(`🚀 Starting server (attempt ${startAttempts}/${maxAttempts})...`);
  
  try {
    // Start the main server
    require('./server.js');
  } catch (error) {
    console.error(`❌ Server startup failed (attempt ${startAttempts}):`, error.message);
    if (error && error.stack) {
      console.error(error.stack);
    }
    
    if (startAttempts < maxAttempts) {
      console.log(`⏳ Retrying in 5 seconds...`);
      setTimeout(startServer, 5000);
    } else {
      console.error(`❌ Max startup attempts reached. Exiting.`);
      process.exit(1);
    }
  }
}

// Start with a small delay to ensure Azure is ready
setTimeout(startServer, 2000);
