// External session storage for Render free tier
// Supports multiple storage backends: JSONBin, MongoDB Atlas, or file-based

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ExternalSessionStorage {
    constructor() {
        this.storageType = process.env.SESSION_STORAGE_TYPE || 'file';
        this.jsonbinApiKey = process.env.JSONBIN_API_KEY;
        this.jsonbinBinId = process.env.JSONBIN_BIN_ID;
        this.mongoUri = process.env.MONGODB_URI;
        this.localPath = path.join(__dirname, '.wwebjs_auth');
        
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
        }
    }

    async saveSession(sessionData) {
        try {
            console.log(`💾 Saving session to ${this.storageType} storage...`);
            
            switch (this.storageType) {
                case 'jsonbin':
                    if (!this.jsonbinApiKey || !this.jsonbinBinId) {
                        console.log('⚠️ JSONBin credentials missing, falling back to file storage');
                        return await this._saveToFile(sessionData);
                    }
                    return await this._saveToJsonBin(sessionData);
                case 'mongodb':
                    if (!this.mongoUri) {
                        console.log('⚠️ MongoDB URI missing, falling back to file storage');
                        return await this._saveToFile(sessionData);
                    }
                    return await this._saveToMongoDB(sessionData);
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

        console.log(`🔑 Using JSONBin API Key: ${this.jsonbinApiKey.substring(0, 10)}...`);
        console.log(`📦 Using JSONBin Bin ID: ${this.jsonbinBinId}`);

        // Try X-Master-Key first, fallback to X-Access-Key
        const headers = {
            'Content-Type': 'application/json'
        };

        // First try with X-Master-Key
        headers['X-Master-Key'] = this.jsonbinApiKey;

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

            console.log('✅ Session saved to JSONBin successfully');
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('⚠️ X-Master-Key failed, trying X-Access-Key...');
                
                // Try with X-Access-Key instead
                const accessHeaders = {
                    'Content-Type': 'application/json',
                    'X-Access-Key': this.jsonbinApiKey
                };

                const retryResponse = await axios.put(
                    `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}`,
                    {
                        sessionData: sessionData,
                        timestamp: new Date().toISOString(),
                        version: '2.0'
                    },
                    {
                        headers: accessHeaders,
                        timeout: 30000
                    }
                );

                console.log('✅ Session saved to JSONBin with X-Access-Key');
                return retryResponse.data;
            }
            throw error;
        }
    }

    async _loadFromJsonBin() {
        if (!this.jsonbinApiKey || !this.jsonbinBinId) {
            throw new Error('JSONBin API key and Bin ID required');
        }

        console.log(`🔑 Using JSONBin API Key: ${this.jsonbinApiKey.substring(0, 10)}...`);
        console.log(`📦 Using JSONBin Bin ID: ${this.jsonbinBinId}`);

        // Try X-Master-Key first, fallback to X-Access-Key
        try {
            const response = await axios.get(
                `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}/latest`,
                {
                    headers: {
                        'X-Master-Key': this.jsonbinApiKey
                    },
                    timeout: 30000
                }
            );

            console.log('✅ Session loaded from JSONBin successfully');
            return response.data.record.sessionData;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('⚠️ X-Master-Key failed, trying X-Access-Key...');
                
                const retryResponse = await axios.get(
                    `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}/latest`,
                    {
                        headers: {
                            'X-Access-Key': this.jsonbinApiKey
                        },
                        timeout: 30000
                    }
                );

                console.log('✅ Session loaded from JSONBin with X-Access-Key');
                return retryResponse.data.record.sessionData;
            }
            throw error;
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
