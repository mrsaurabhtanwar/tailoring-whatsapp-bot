const express = require("express");
const fs = require("fs");
const path = require("path");

// Load .env in non-production before other modules use env vars
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch {}
}

const WhatsAppClient = require("./whatsapp-client");
const { generateMessage } = require("./templates.js");

const app = express();

// Limit request body to avoid memory spikes
app.use(express.json({ limit: "64kb" }));

const Bottleneck = require("bottleneck");
// Initialize WhatsApp client
const whatsappClient = new WhatsAppClient();
const port = parseInt(process.env.PORT || "5000", 10);
const sendDelay = parseInt(process.env.SEND_DELAY_MS || "600", 10);
// Bottleneck limiter to throttle sends
const limiter = new Bottleneck({ minTime: sendDelay, maxConcurrent: 1 });
// Simple single-flight queue to avoid concurrent Chrome work
let sendChain = Promise.resolve();

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "Tailoring Shop Bot Running",
    timestamp: new Date().toISOString(),
    whatsappReady:
      typeof whatsappClient.isReady === "function"
        ? whatsappClient.isReady()
        : false,
    qrCodeAvailable: fs.existsSync("current-qr.png"),
    endpoints: {
      "GET /healthz": "Strict health check",
      "GET /": "Health check",
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

// Alternative health endpoint for compatibility
app.get("/health", (req, res) => {
  const ok =
    typeof whatsappClient.isReady === "function"
      ? whatsappClient.isReady()
      : false;
  if (ok) return res.status(200).json({ ok: true });
  return res.status(503).json({ ok: false });
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
        error:
          "QR code not available. Please wait for WhatsApp client to generate one.",
        whatsappReady:
          typeof whatsappClient.isReady === "function"
            ? whatsappClient.isReady()
            : false,
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

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  console.log(`💾 Server Memory: ${memUsageMB}MB`);

  // If memory usage is too high, log warning
  if (memUsageMB > 450) {
    console.log("⚠️ High memory usage detected!");
  }
}, 60000); // Check every minute

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  if (whatsappClient && typeof whatsappClient.destroy === "function") {
    whatsappClient.destroy();
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  if (whatsappClient && typeof whatsappClient.destroy === "function") {
    whatsappClient.destroy();
  }
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(
    `📱 WhatsApp Bot Status: ${whatsappClient.isReady() ? "Ready" : "Not Ready"}`,
  );
  console.log(`🔗 Health check: http://localhost:${port}/`);
  console.log(`📷 QR Code: http://localhost:${port}/qr`);
  console.log(`📨 Webhook: http://localhost:${port}/webhook/order-ready`);
  console.log(
    `💾 Initial Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
  );
});
