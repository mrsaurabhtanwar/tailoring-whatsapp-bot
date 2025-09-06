# Railway-optimized Dockerfile for WhatsApp Bot
FROM node:20-slim

# Install Chrome dependencies and utilities in a single layer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r botuser && useradd -r -g botuser -G audio,video botuser \
    && mkdir -p /home/botuser/Downloads \
    && chown -R botuser:botuser /home/botuser \
    && chown -R botuser:botuser /app

# Copy package files
COPY package*.json ./

# Install dependencies with optimized settings for Railway
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && npm ci --only=production --no-audit --no-fund

# Copy application files
COPY --chown=botuser:botuser . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/.wwebjs_auth /app/sessions /app/temp \
    && chown -R botuser:botuser /app/.wwebjs_auth /app/sessions /app/temp \
    && chmod -R 755 /app/.wwebjs_auth /app/sessions /app/temp

# Switch to non-root user
USER botuser

# Environment variables for Railway
ENV NODE_ENV=production \
    RAILWAY=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    SESSION_DIR=/app/sessions \
    PORT=8080

# Health check optimized for Railway
HEALTHCHECK --interval=60s --timeout=15s --start-period=120s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-8080}/healthz', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Expose port
EXPOSE 8080

# Start the application with Railway-optimized memory settings
CMD ["node", "--max-old-space-size=512", "--expose-gc", "--optimize-for-size", "server.js"]
