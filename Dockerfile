# Production-ready Dockerfile for Azure deployment
FROM node:20-alpine

# Install Chrome and dependencies for Puppeteer with enhanced stability
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init \
    curl \
    procps \
    && rm -rf /var/cache/apk/*

# Set optimized environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PORT=8080
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=100"

# Create app directory with proper permissions
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm install --only=production --no-audit --no-fund --ignore-scripts && \
    npm cache clean --force

# Copy application code
COPY . .

# Set proper ownership
RUN chown -R appuser:appuser /app && \
    chmod +x /app/server.js

# Switch to non-root user
USER appuser

# Create necessary directories
RUN mkdir -p /app/.wwebjs_auth /app/logs && \
    chmod 755 /app/.wwebjs_auth /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]