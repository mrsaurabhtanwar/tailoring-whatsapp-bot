const fs = require('fs');
const path = require('path');

// System health monitoring utility
class HealthMonitor {
    constructor() {
        this.startTime = Date.now();
        this.errorCount = 0;
        this.lastHealthCheck = Date.now();
        this.metrics = {
            requests: 0,
            errors: 0,
            whatsappMessages: 0,
            averageResponseTime: 0
        };
    }

    recordRequest(responseTime) {
        this.metrics.requests++;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (this.metrics.requests - 1) + responseTime) / this.metrics.requests;
    }

    recordError() {
        this.errorCount++;
        this.metrics.errors++;
    }

    recordWhatsAppMessage() {
        this.metrics.whatsappMessages++;
    }

    getHealthStatus() {
        const uptime = Date.now() - this.startTime;
        const memUsage = process.memoryUsage();
        
        return {
            status: 'healthy',
            uptime: Math.round(uptime / 1000),
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            },
            metrics: this.metrics,
            lastCheck: new Date().toISOString()
        };
    }

    async saveHealthReport() {
        try {
            const report = this.getHealthStatus();
            const logFile = path.join(__dirname, 'logs', 'health.log');
            const logEntry = `${new Date().toISOString()} - ${JSON.stringify(report)}\n`;
            
            await fs.promises.appendFile(logFile, logEntry);
        } catch (error) {
            console.error('Failed to save health report:', error.message);
        }
    }

    startMonitoring() {
        // Save health report every hour
        setInterval(() => {
            this.saveHealthReport();
        }, 3600000);

        console.log('🏥 Health monitoring started');
    }
}

module.exports = HealthMonitor;
