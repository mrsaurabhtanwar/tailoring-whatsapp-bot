const express = require("express");
const fs = require("fs");
const path = require("path");

// Load .env in non-production before other modules use env vars
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (err) {
    console.warn("⚠️ dotenv not loaded:", err.message);
  }
}

const WhatsAppClient = require("./whatsapp-client");
const { generateMessage } = require("./templates.js");
const HealthMonitor = require("./health-monitor");

const app = express();

// Initialize health monitoring
const healthMonitor = new HealthMonitor();
healthMonitor.startMonitoring();

// Enhanced middleware for production
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests
      console.log(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

const Bottleneck = require("bottleneck");

// Enhanced error handling for WhatsApp client initialization
let whatsappClient;
try {
  whatsappClient = new WhatsAppClient();
} catch (error) {
  console.error("❌ Failed to create WhatsApp client:", error.message);
  // Create a safe fallback client
  whatsappClient = {
    isReady: () => false,
    sendMessage: () => Promise.reject(new Error("WhatsApp client not available")),
    destroy: () => Promise.resolve(),
    _createClient: () => {},
    _wireEvents: () => {},
    _initialize: () => Promise.resolve()
  };
}

const port = parseInt(process.env.PORT || "8080", 10);
const sendDelay = parseInt(process.env.SEND_DELAY_MS || "600", 10);
// Enhanced bottleneck with circuit breaker pattern
const limiter = new Bottleneck({ 
  minTime: sendDelay, 
  maxConcurrent: 1,
  reservoir: 10, // Limit to 10 messages per reservoir refill
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000 // Refill every minute
});
let sendChain = Promise.resolve();

// Health check endpoint
app.get("/", (req, res) => {
  const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const uptime = Math.round(process.uptime());
  
  res.json({
    status: "Tailoring Shop Bot Running",
    timestamp: new Date().toISOString(),
    whatsappReady: typeof whatsappClient.isReady === "function" ? whatsappClient.isReady() : false,
    qrCodeAvailable: fs.existsSync("current-qr.png"),
    memory: memUsage + "MB",
    uptime: uptime + "s",
    environment: process.env.RAILWAY_ENVIRONMENT ? "Railway" : "Local",
    endpoints: {
      "GET /health": "Alternative health check",
      "GET /": "Main health check",
      "GET /scanner": "QR scanner page for WhatsApp authentication",
      "GET /qr": "Get QR code image for WhatsApp authentication",
      "POST /webhook/order-ready": "Send WhatsApp notifications",
    },
  });
});

// Strict healthcheck for uptime
app.get("/healthz", (req, res) => {
  const ok =
    typeof whatsappClient.isReady === "function"
      ? whatsappClient.isReady()
      : false;
  if (ok) return res.status(200).json({ ok: true });
  return res.status(503).json({ ok: false });
});

// Alternative health endpoint for compatibility - relaxed for Railway
app.get("/health", (req, res) => {
  // During startup, just check if the server is responding
  // WhatsApp client can be authenticated later via QR code
  const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const uptime = Math.round(process.uptime());
  
  res.status(200).json({ 
    ok: true, 
    serverRunning: true,
    whatsappReady: typeof whatsappClient.isReady === "function" ? whatsappClient.isReady() : false,
    memory: memUsage + "MB",
    uptime: uptime + "s",
    environment: process.env.RAILWAY_ENVIRONMENT ? "Railway" : "Local",
    message: "Server is running. Scan QR code to authenticate WhatsApp if needed."
  });
});

// QR scanner page
app.get("/scanner", (req, res) => {
  res.sendFile(path.join(__dirname, "qr-scanner.html"));
});

// QR code endpoint for authentication
app.get("/qr", (req, res) => {
  try {
    if (fs.existsSync("current-qr.png")) {
      res.sendFile(path.join(__dirname, "current-qr.png"));
    } else {
      res.status(404).json({
        error: "QR code not available yet. Please initialize WhatsApp client first.",
        whatsappReady: typeof whatsappClient.isReady === "function" ? whatsappClient.isReady() : false,
        initEndpoint: "/init-whatsapp"
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to serve QR code" });
  }
});

// Session status endpoint
app.get("/session-status", (req, res) => {
  try {
    const authPath = "./.wwebjs_auth";
    const sessionPath = path.join(authPath, "session-tailoring-shop-bot");
    const sessionInfoPath = path.join(authPath, "session-info.json");

    let sessionInfo = null;
    if (fs.existsSync(sessionInfoPath)) {
      sessionInfo = JSON.parse(fs.readFileSync(sessionInfoPath, "utf8"));
    }

    const status = {
      authenticated: whatsappClient.isReady(),
      sessionExists: fs.existsSync(sessionPath),
      qrCodeRequired:
        !whatsappClient.isReady() && !fs.existsSync("current-qr.png"),
      sessionInfo: sessionInfo,
      lastCheck: new Date().toISOString(),
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to check session status" });
  }
});

// Memory cleanup endpoint
app.post("/cleanup", (req, res) => {
  try {
    const memBefore = process.memoryUsage();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memAfter = process.memoryUsage();
    const memFreed = Math.round(
      (memBefore.heapUsed - memAfter.heapUsed) / 1024 / 1024,
    );

    res.json({
      success: true,
      message: "Memory cleanup completed",
      memoryBefore: Math.round(memBefore.heapUsed / 1024 / 1024) + "MB",
      memoryAfter: Math.round(memAfter.heapUsed / 1024 / 1024) + "MB",
      memoryFreed: memFreed + "MB",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Memory cleanup failed: " + error.message,
    });
  }
});

// Handle POST to root (redirect to proper endpoint)
app.post("/", (req, res) => {
  res.status(400).json({
    success: false,
    error:
      "Invalid endpoint. Use /webhook/order-ready for WhatsApp notifications",
    availableEndpoints: {
      "GET /": "Health check",
      "POST /webhook/order-ready": "Send WhatsApp notifications",
    },
  });
});

// Improved webhook to receive order ready notifications
app.post("/webhook/order-ready", async (req, res) => {
  try {
    console.log("Received webhook data:", JSON.stringify(req.body, null, 2));

    const data = req.body;

    // Validate required fields
    if (!data.name || !data.phone) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name and phone are required",
      });
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = data.phone.toString().replace(/\D/g, ""); // Remove non-digits
    // Basic sanity: must be at least 10 digits after cleaning
    if (formattedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number: must contain at least 10 digits",
      });
    }
    if (!formattedPhone.startsWith("91")) {
      formattedPhone = `91${formattedPhone}`;
    }
    const chatId = `${formattedPhone}@c.us`;

    // CRITICAL FIX: Map the incoming data to match what your template expects
    const messageData = {
      orderId: data.orderId || "",
      customerName: data.name || "", // Map 'name' to 'customerName'
      phone: formattedPhone,
      item: data.item || "",
      garmentTypes: data.item || "", // Your template uses both
      orderDate: data.orderDate || "",
      deliveryDate: data.dueDate || "", // Map 'dueDate' to 'deliveryDate'
      dueDate: data.dueDate || "", // Keep dueDate as well
      price: data.price || 0, // Don't parse here - let template handle it
      advancePayment: data.advancePayment || 0,
      remainingAmount: data.remainingAmount || 0,
      shopName: data.shopName || "RS Tailors & Fabric", // Change to your shop name
      shopPhone: data.shopPhone || "8824781960",
    };

    console.log("Prepared message data:", JSON.stringify(messageData, null, 2));

    // Use your existing generateMessage function from templates.js
    const message = generateMessage("orderReady", messageData);

    console.log("Generated message preview:");
    console.log(message.substring(0, 200) + "...");

    // Wait for WhatsApp to be ready with retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      if (
        typeof whatsappClient.isReady === "function" &&
        whatsappClient.isReady()
      ) {
        break;
      }

      console.log(
        `⏳ Waiting for WhatsApp client to be ready... (attempt ${retryCount + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryCount++;
    }

    if (retryCount >= maxRetries) {
      return res.status(503).json({
        success: false,
        error:
          "WhatsApp client not ready after multiple attempts. Please scan the QR code to authenticate.",
      });
    }

    // If memory is already high, reject early to protect the instance
    const heapMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    if (heapMB > 450) {
      return res.status(503).json({
        success: false,
        error: "Server under memory pressure, try again shortly.",
      });
    }

    // Send WhatsApp message in a single-flight chain to reduce Puppeteer pressure
    await (sendChain = sendChain
      .catch(() => {}) // isolate previous error from breaking the chain
      .then(() =>
        limiter.schedule(() => whatsappClient.sendMessage(chatId, message)),
      ));

    console.log(
      `✅ Message sent to ${data.name} (${formattedPhone}) for ${data.item}`,
    );

    res.json({
      success: true,
      message: "WhatsApp message sent successfully",
      details: {
        customer: data.name,
        phone: formattedPhone,
        item: data.item,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    const status = String((error && error.message) || "").includes("not ready")
      ? 503
      : 500;
    res.status(status).json({
      success: false,
      error: error.message,
      details: "Failed to send WhatsApp message",
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
  });
});

// Add endpoint to manually initialize WhatsApp client
app.post("/init-whatsapp", async (req, res) => {
  try {
    if (!whatsappClient.client) {
      console.log('🔄 Manually initializing WhatsApp client...');
      whatsappClient._createClient();
      whatsappClient._wireEvents();
      await whatsappClient._initialize();
    }
    res.json({
      success: true,
      message: "WhatsApp client initialization started",
      ready: whatsappClient.isReady()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced memory monitoring with alerts and cleanup
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const rss = Math.round(memUsage.rss / 1024 / 1024);
  const external = Math.round(memUsage.external / 1024 / 1024);
  
  // Detailed logging every 10 minutes
  if (Math.round(process.uptime()) % 600 === 0) {
    console.log(`💾 Memory: Heap ${memUsageMB}MB | RSS ${rss}MB | External ${external}MB`);
    console.log(`⏱️ Uptime: ${Math.round(process.uptime() / 60)} minutes`);
    console.log(`📱 WhatsApp Status: ${whatsappClient.isReady() ? "Ready" : "Not Ready"}`);
  }

  // Memory pressure warnings and cleanup
  if (memUsageMB > 1536) { // 1.5GB warning
    console.log("🚨 CRITICAL: Memory usage very high! Initiating emergency cleanup...");
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
      console.log("🧹 Emergency garbage collection completed");
    }
    
    // Clear any large objects if possible
    if (sendChain) {
      sendChain = Promise.resolve();
    }
    
  } else if (memUsageMB > 1024) { // 1GB warning
    console.log("⚠️ HIGH: Memory usage approaching limits, cleaning up...");
    if (global.gc) {
      global.gc();
    }
  }
}, 60000); // Check every minute

// Periodic health monitoring
setInterval(() => {
  const uptime = process.uptime();
  const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  
  // Log system health every hour
  if (uptime > 0 && Math.round(uptime) % 3600 === 0) {
    console.log(`🏥 Health Check - Uptime: ${Math.round(uptime/3600)}h | Memory: ${memUsage}MB | PID: ${process.pid}`);
  }
}, 300000); // Check every 5 minutes

// Production-grade graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, initiating graceful shutdown...");
  console.log("📊 Final memory usage:", Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB");
  console.log("⏱️ Uptime:", Math.round(process.uptime()) + "s");
  
  // Graceful shutdown sequence
  const gracefulShutdown = async () => {
    try {
      console.log("� Stopping new requests...");
      
      if (whatsappClient && typeof whatsappClient.destroy === "function") {
        console.log("📱 Destroying WhatsApp client...");
        await Promise.race([
          whatsappClient.destroy(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp destroy timeout')), 10000))
        ]);
      }
      
      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error.message);
      process.exit(1);
    }
  };
  
  gracefulShutdown();
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Enhanced error handling with recovery
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  
  // Log to file if possible
  try {
    const fs = require('fs');
    const errorLog = `${new Date().toISOString()} - Uncaught Exception: ${error.message}\n${error.stack}\n\n`;
    fs.appendFileSync('./logs/errors.log', errorLog);
  } catch (logError) {
    console.error('Failed to log error:', logError.message);
  }
  
  // Don't exit immediately in production, attempt recovery
  if (process.env.NODE_ENV === 'production') {
    console.log("🔄 Attempting to continue in production mode...");
    setTimeout(() => {
      if (global.gc) {
        global.gc();
        console.log("🧹 Forced garbage collection after error");
      }
    }, 1000);
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  
  // Log to file if possible
  try {
    const fs = require('fs');
    const errorLog = `${new Date().toISOString()} - Unhandled Rejection: ${reason}\n\n`;
    fs.appendFileSync('./logs/errors.log', errorLog);
  } catch (logError) {
    console.error('Failed to log rejection:', logError.message);
  }
  
  // Continue running in production
  if (process.env.NODE_ENV === 'production') {
    console.log("🔄 Continuing after unhandled rejection...");
  }
});

// Memory leak detection and cleanup
process.on('warning', (warning) => {
  console.warn('⚠️ Node.js Warning:', warning.name, warning.message);
  if (warning.name === 'MaxListenersExceededWarning') {
    console.log("🔧 Detected potential memory leak, cleaning up...");
    if (global.gc) {
      global.gc();
    }
  }
});

// Start server - bind to 0.0.0.0 for Railway environment
app.listen(port, '0.0.0.0', () => {
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
  const baseUrl = isRailway 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'wtb-production.up.railway.app'}` 
    : `http://localhost:${port}`;
    
  console.log(`🚀 Server running on 0.0.0.0:${port}`);
  console.log(`🌐 Environment: ${isRailway ? 'Railway' : 'Local'}`);
  console.log(
    `📱 WhatsApp Bot Status: ${whatsappClient.isReady() ? "Ready" : "Not Ready"}`,
  );
  console.log(`🔗 Health check: ${baseUrl}/`);
  console.log(`📷 QR Code: ${baseUrl}/qr`);
  console.log(`📨 Webhook: ${baseUrl}/webhook/order-ready`);
  console.log(
    `💾 Initial Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  );
});
