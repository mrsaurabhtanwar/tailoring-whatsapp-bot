// Session Keep-Alive Manager - Prevents WhatsApp disconnections
// Implements heartbeat mechanism and connection monitoring

class SessionKeepAlive {
    constructor(whatsappClient) {
        this.client = whatsappClient;
        this.heartbeatInterval = 30000; // 30 seconds
        this.connectionCheckInterval = 60000; // 1 minute
        this.lastActivity = Date.now();
        this.isActive = false;
        this.heartbeatTimer = null;
        this.connectionTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        
        this.startKeepAlive();
    }

    startKeepAlive() {
        if (this.isActive) return;
        this.isActive = true;
        
        console.log('💓 Session Keep-Alive: Started');
        
        // Start heartbeat
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, this.heartbeatInterval);
        
        // Start connection monitoring
        this.connectionTimer = setInterval(() => {
            this.checkConnection();
        }, this.connectionCheckInterval);
    }

    stopKeepAlive() {
        if (!this.isActive) return;
        this.isActive = false;
        
        console.log('💓 Session Keep-Alive: Stopped');
        
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
            this.connectionTimer = null;
        }
    }

    async sendHeartbeat() {
        try {
            if (!this.client || !this.client.isReady()) {
                console.log('💓 Heartbeat: Client not ready, skipping');
                return;
            }

            // Send a simple status check to keep connection alive
            const info = await this.client.client.getState();
            if (info === 'CONNECTED') {
                this.lastActivity = Date.now();
                console.log('💓 Heartbeat: Connection healthy');
                this.reconnectAttempts = 0; // Reset reconnect attempts on successful heartbeat
            } else {
                console.log(`💓 Heartbeat: Connection state: ${info}`);
                this.handleConnectionIssue();
            }
        } catch (error) {
            console.log('💓 Heartbeat: Error -', error.message);
            this.handleConnectionIssue();
        }
    }

    async checkConnection() {
        try {
            if (!this.client || !this.client.isReady()) {
                console.log('💓 Connection Check: Client not ready');
                return;
            }

            const timeSinceLastActivity = Date.now() - this.lastActivity;
            
            // If no activity for more than 2 minutes, consider connection stale
            if (timeSinceLastActivity > 120000) {
                console.log('💓 Connection Check: Connection appears stale, attempting refresh');
                await this.refreshConnection();
            }
        } catch (error) {
            console.log('💓 Connection Check: Error -', error.message);
        }
    }

    async refreshConnection() {
        try {
            if (!this.client || !this.client.client) {
                console.log('💓 Refresh: No client available');
                return;
            }

            console.log('💓 Refresh: Attempting to refresh connection...');
            
            // Try to get a simple page to refresh the connection
            const page = this.client.client.pupPage;
            if (page) {
                await page.evaluate(() => {
                    // Simple DOM query to keep connection active
                    return document.title;
                });
                this.lastActivity = Date.now();
                console.log('💓 Refresh: Connection refreshed successfully');
            }
        } catch (error) {
            console.log('💓 Refresh: Failed -', error.message);
            this.handleConnectionIssue();
        }
    }

    handleConnectionIssue() {
        this.reconnectAttempts++;
        console.log(`💓 Connection Issue: Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('💓 Connection Issue: Max attempts reached, triggering client restart');
            this.triggerClientRestart();
        }
    }

    async triggerClientRestart() {
        try {
            console.log('💓 Restart: Triggering WhatsApp client restart...');
            
            // Stop keep-alive during restart
            this.stopKeepAlive();
            
            // Restart the client
            if (this.client && typeof this.client.restartClient === 'function') {
                await this.client.restartClient();
                
                // Restart keep-alive after a delay
                setTimeout(() => {
                    this.reconnectAttempts = 0;
                    this.startKeepAlive();
                }, 10000); // Wait 10 seconds before restarting keep-alive
            }
        } catch (error) {
            console.log('💓 Restart: Error during restart -', error.message);
        }
    }

    updateActivity() {
        this.lastActivity = Date.now();
    }

    getStatus() {
        return {
            isActive: this.isActive,
            lastActivity: new Date(this.lastActivity).toISOString(),
            reconnectAttempts: this.reconnectAttempts,
            timeSinceLastActivity: Date.now() - this.lastActivity
        };
    }
}

module.exports = SessionKeepAlive;
