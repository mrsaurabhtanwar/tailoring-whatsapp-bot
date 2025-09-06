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
        
        console.log(`📦 Session Storage: ${this.storageType}`);
    }

    async saveSession(sessionData) {
        try {
            switch (this.storageType) {
                case 'jsonbin':
                    return await this._saveToJsonBin(sessionData);
                case 'mongodb':
                    return await this._saveToMongoDB(sessionData);
                case 'file':
                default:
                    return await this._saveToFile(sessionData);
            }
        } catch (error) {
            console.error('❌ Failed to save session:', error.message);
            throw error;
        }
    }

    async loadSession() {
        try {
            switch (this.storageType) {
                case 'jsonbin':
                    return await this._loadFromJsonBin();
                case 'mongodb':
                    return await this._loadFromMongoDB();
                case 'file':
                default:
                    return await this._loadFromFile();
            }
        } catch (error) {
            console.log('ℹ️ No existing session found or failed to load');
            return null;
        }
    }

    async _saveToJsonBin(sessionData) {
        if (!this.jsonbinApiKey || !this.jsonbinBinId) {
            throw new Error('JSONBin API key and Bin ID required');
        }

        const response = await axios.put(
            `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}`,
            {
                sessionData: sessionData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.jsonbinApiKey
                }
            }
        );

        console.log('✅ Session saved to JSONBin');
        return response.data;
    }

    async _loadFromJsonBin() {
        if (!this.jsonbinApiKey || !this.jsonbinBinId) {
            throw new Error('JSONBin API key and Bin ID required');
        }

        const response = await axios.get(
            `https://api.jsonbin.io/v3/b/${this.jsonbinBinId}/latest`,
            {
                headers: {
                    'X-Master-Key': this.jsonbinApiKey
                }
            }
        );

        console.log('✅ Session loaded from JSONBin');
        return response.data.record.sessionData;
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
