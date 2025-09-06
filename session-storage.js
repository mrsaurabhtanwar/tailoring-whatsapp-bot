// External session storage for Render free tier
// Supports multiple storage backends: JSONBin, MongoDB Atlas, or file-based

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ExternalSessionStorage {
    constructor() {
        this.storageType = process.env.SESSION_STORAGE_TYPE || 'jsonbin'; // Default to jsonbin for persistence
        this.jsonbinApiKey = process.env.JSONBIN_API_KEY;
        this.jsonbinMasterKey = process.env.JSONBIN_MASTER_KEY;
        this.jsonbinBinId = process.env.JSONBIN_BIN_ID;
        this.mongoUri = process.env.MONGODB_URI;
        this.localPath = path.join(__dirname, '.wwebjs_auth');
        this.lastSaveTime = 0;
        this.saveDebounceMs = 5000; // Save at most once every 5 seconds
        
        // Auto-fallback to file storage if external storage not configured
        if (this.storageType === 'jsonbin' && (!this.jsonbinApiKey || !this.jsonbinBinId)) {
            console.log('⚠️ JSONBin credentials not found, falling back to file storage');
            this.storageType = 'file';
        }
        
        if (this.storageType === 'mongodb' && !this.mongoUri) {
            console.log('⚠️ MongoDB URI not found, falling back to file storage');
            this.storageType = 'file';
        }
        
        console.log(`📦 Session Storage: ${this.storageType}`);
        
        if (this.storageType === 'file') {
            console.log('ℹ️ Using local file storage - sessions will not persist across Render restarts');
            console.log('💡 To enable persistent sessions, set up JSONBin or MongoDB storage');
        } else {
            console.log('✅ External session storage configured - sessions will persist across restarts');
        }
    }

    async saveSession(sessionData) {
        try {
            // Debounce saves to prevent excessive API calls
            const now = Date.now();
            if (now - this.lastSaveTime < this.saveDebounceMs) {
                console.log('💾 Session save debounced (too frequent)');
                return;
            }
            this.lastSaveTime = now;

            console.log(`💾 Saving session to ${this.storageType} storage...`);
            
            switch (this.storageType) {
                case 'jsonbin':
                    if (!this.jsonbinApiKey || !this.jsonbinBinId) {
                        console.log('⚠️ JSONBin credentials missing, falling back to file storage');
                        return await this._saveToFile(sessionData);
                    }
                    try {
                        const result = await this._saveToJsonBin(sessionData);
                        // Also save locally as backup
                        await this._saveToFile(sessionData);
                        return result;
                    } catch (error) {
                        console.log('⚠️ JSONBin save failed, using file backup:', error.message);
                        return await this._saveToFile(sessionData);
                    }
                case 'mongodb':
                    if (!this.mongoUri) {
                        console.log('⚠️ MongoDB URI missing, falling back to file storage');
                        return await this._saveToFile(sessionData);
                    }
                    try {
                        const result = await this._saveToMongoDB(sessionData);
                        // Also save locally as backup
                        await this._saveToFile(sessionData);
                        return result;
                    } catch (error) {
                        console.log('⚠️ MongoDB save failed, using file backup:', error.message);
                        return await this._saveToFile(sessionData);
                    }
                case 'file':
                default:
                    return await this._saveToFile(sessionData);
            }
        } catch (error) {
            console.error(`❌ Failed to save session to ${this.storageType}:`, error.message);
            // Try fallback to file storage
            if (this.storageType !== 'file') {
                console.log('🔄 Attempting fallback to file storage...');
                try {
                    return await this._saveToFile(sessionData);
                } catch (fallbackError) {
                    console.error('❌ Fallback to file storage also failed:', fallbackError.message);
                }
            }
            throw error;
        }
    }

    async loadSession() {
        try {
            console.log(`🔄 Attempting to load session from ${this.storageType} storage...`);
            
            switch (this.storageType) {
                case 'jsonbin':
                    if (!this.jsonbinApiKey || !this.jsonbinBinId) {
                        console.log('⚠️ JSONBin credentials missing, skipping external session load');
                        return null;
                    }
                    return await this._loadFromJsonBin();
                case 'mongodb':
                    if (!this.mongoUri) {
                        console.log('⚠️ MongoDB URI missing, skipping external session load');
                        return null;
                    }
                    return await this._loadFromMongoDB();
                case 'file':
                default:
                    return await this._loadFromFile();
            }
        } catch (error) {
            console.log(`ℹ️ No existing session found in ${this.storageType} storage:`, error.message);
            return null;
        }
    }

    async _saveToJsonBin(sessionData) {
        if (!this.jsonbinApiKey || !this.jsonbinBinId) {
            throw new Error('JSONBin API key and Bin ID required');
        }

        // Determine which keys to try (Master Key first if available, then Access Key)
        const keys = [];
        if (this.jsonbinMasterKey) {
            keys.push({ type: 'X-Master-Key', key: this.jsonbinMasterKey });
        }
        keys.push({ type: 'X-Access-Key', key: this.jsonbinApiKey });

        console.log(`📦 Using JSONBin Bin ID: ${this.jsonbinBinId}`);
        console.log(`🔑 Will try ${keys.length} authentication method(s)`);

        // Try each key in order
        for (let i = 0; i < keys.length; i++) {
            const { type, key } = keys[i];
            console.log(`🔑 Trying ${type}: ${key.substring(0, 10)}...`);

            const headers = {
                'Content-Type': 'application/json',
                [type]: key
            };

            try {
                const response = await axios.put(
                    `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}`,
                    {
                        sessionData: sessionData,
                        timestamp: new Date().toISOString(),
                        version: '2.0'
                    },
                    {
                        headers: headers,
                        timeout: 30000
                    }
                );

                console.log(`✅ Session saved to JSONBin with ${type}`);
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    console.log(`❌ ${type} failed (401 Unauthorized)`);
                    if (i < keys.length - 1) {
                        console.log('⚠️ Trying next authentication method...');
                        continue; // Try next key
                    }
                }
                // If it's the last key or not a 401 error, throw
                if (i === keys.length - 1) {
                    throw error;
                }
            }
        }
    }

    async _loadFromJsonBin() {
        if (!this.jsonbinApiKey || !this.jsonbinBinId) {
            throw new Error('JSONBin API key and Bin ID required');
        }

        // Determine which keys to try (Master Key first if available, then Access Key)
        const keys = [];
        if (this.jsonbinMasterKey) {
            keys.push({ type: 'X-Master-Key', key: this.jsonbinMasterKey });
        }
        keys.push({ type: 'X-Access-Key', key: this.jsonbinApiKey });

        console.log(`📦 Using JSONBin Bin ID: ${this.jsonbinBinId}`);
        console.log(`🔑 Will try ${keys.length} authentication method(s) for loading`);

        // Try each key in order
        for (let i = 0; i < keys.length; i++) {
            const { type, key } = keys[i];
            console.log(`🔑 Trying ${type}: ${key.substring(0, 10)}...`);

            try {
                const response = await axios.get(
                    `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}/latest`,
                    {
                        headers: {
                            [type]: key
                        },
                        timeout: 30000
                    }
                );

                console.log(`✅ Session loaded from JSONBin with ${type}`);
                return response.data.record.sessionData;
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    console.log(`❌ ${type} failed (401 Unauthorized)`);
                    if (i < keys.length - 1) {
                        console.log('⚠️ Trying next authentication method...');
                        continue; // Try next key
                    }
                }
                // If it's the last key or not a 401 error, throw
                if (i === keys.length - 1) {
                    throw error;
                }
            }
        }
    }

    async _saveToMongoDB(sessionData) {
        // Simple MongoDB implementation using axios
        if (!this.mongoUri) {
            throw new Error('MongoDB URI required');
        }

        const response = await axios.post(
            `${this.mongoUri}/sessions`,
            {
                sessionId: 'whatsapp-session',
                sessionData: sessionData,
                timestamp: new Date().toISOString()
            }
        );

        console.log('✅ Session saved to MongoDB');
        return response.data;
    }

    async _loadFromMongoDB() {
        if (!this.mongoUri) {
            throw new Error('MongoDB URI required');
        }

        const response = await axios.get(
            `${this.mongoUri}/sessions/whatsapp-session`
        );

        console.log('✅ Session loaded from MongoDB');
        return response.data.sessionData;
    }

    async _saveToFile(sessionData) {
        // For local development or when external storage fails
        try {
            fs.mkdirSync(this.localPath, { recursive: true });
            const sessionFile = path.join(this.localPath, 'session-backup.json');
            fs.writeFileSync(sessionFile, JSON.stringify({
                sessionData: sessionData,
                timestamp: new Date().toISOString()
            }, null, 2));
            console.log('✅ Session saved to local file');
            return { success: true };
        } catch (error) {
            console.log('⚠️ Failed to save to local file, using memory only');
            return { success: false };
        }
    }

    async _loadFromFile() {
        try {
            const sessionFile = path.join(this.localPath, 'session-backup.json');
            if (fs.existsSync(sessionFile)) {
                const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
                console.log('✅ Session loaded from local file');
                return data.sessionData;
            }
        } catch (error) {
            console.log('⚠️ Failed to load from local file');
        }
        return null;
    }

    async clearSession() {
        try {
            switch (this.storageType) {
                case 'jsonbin':
                    await this._saveToJsonBin(null);
                    break;
                case 'mongodb':
                    await axios.delete(`${this.mongoUri}/sessions/whatsapp-session`);
                    break;
                case 'file':
                default:
                    const sessionFile = path.join(this.localPath, 'session-backup.json');
                    if (fs.existsSync(sessionFile)) {
                        fs.unlinkSync(sessionFile);
                    }
                    break;
            }
            console.log('✅ Session cleared');
        } catch (error) {
            console.error('❌ Failed to clear session:', error.message);
        }
    }
}

module.exports = ExternalSessionStorage;
