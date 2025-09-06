# 🔑 JSONBin Session Storage Setup Guide

## Why Set This Up?

Without persistent session storage, you'll need to scan the QR code every time your Render service restarts. With JSONBin, you scan once and the session persists forever!

## 🚀 Quick Setup (5 minutes)

### Step 1: Create JSONBin Account
1. Go to [jsonbin.io](https://jsonbin.io)
2. Click "Sign Up" (it's free!)
3. Use GitHub/Google login for quick signup

### Step 2: Get Your Credentials
1. After login, go to [API Keys](https://jsonbin.io/api-keys)
2. Copy your **API Key** (starts with `$2a$10$...`)
3. Create a new bin:
   - Click "Create Bin" 
   - Name it "whatsapp-session"
   - Set it to Private
   - Put any dummy JSON: `{"session": "placeholder"}`
   - Copy the **Bin ID** from the URL (looks like `67xxxxx`)

### Step 3: Add to Render Environment Variables
1. Go to your Render service dashboard
2. Click "Environment" tab
3. Add these 3 variables:

```
SESSION_STORAGE_TYPE=jsonbin
JSONBIN_API_KEY=your_api_key_here
JSONBIN_BIN_ID=your_bin_id_here
```

### Step 4: Deploy and Test
1. Save environment variables in Render
2. Trigger a new deployment
3. Check logs - should see: `📦 Session Storage: jsonbin`
4. Scan QR code once
5. Session will now persist across all future deployments!

## 🔍 How to Verify It's Working

### Check the logs for these messages:
```
📦 Session Storage: jsonbin                    ✅ Good
💾 Saving session to jsonbin storage...        ✅ Saving works
✅ Session saved to external storage           ✅ Success
```

### On next deployment:
```
🔄 Attempting to load session from jsonbin storage...  ✅ Loading
✅ Session restored successfully from external storage  ✅ No QR needed!
```

## 🆘 Troubleshooting

### "JSONBin credentials not found, falling back to file storage"
- Double-check your API key and Bin ID in Render environment variables
- Make sure variable names are exact: `JSONBIN_API_KEY` and `JSONBIN_BIN_ID`

### "Failed to save session to jsonbin"
- Verify your API key has write permissions
- Check if your bin is set to private (public bins may have issues)
- Try creating a new bin

### Still scanning QR after setup?
- Check Render logs for session storage messages
- Verify environment variables are set correctly
- Make sure you've deployed after adding the variables

## 💡 Pro Tips

1. **Keep your credentials secure** - Don't share your API key
2. **One bin per bot** - Don't reuse bins for multiple bots
3. **Monitor your JSONBin usage** - Free tier has limits but should be plenty
4. **Test locally first** - Set the same env vars locally to test

## 🎯 Alternative: MongoDB Atlas

If you prefer MongoDB:
```
SESSION_STORAGE_TYPE=mongodb
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/whatsapp
```

But JSONBin is simpler and perfect for this use case!

---

**After setup, you'll only need to scan the QR code ONCE! 🎉**
