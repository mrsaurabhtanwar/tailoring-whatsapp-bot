# Quick Azure Fix Instructions

## Option A: Add Environment Variable via Azure Portal
1. Go to https://portal.azure.com
2. Navigate to your App Service: `tailoring-whatsapp-bot-esgvfsbtbeh4eefp`
3. Go to Settings → Configuration → Application settings
4. Click "New application setting"
5. Add (RECOMMENDED – prevents 401 errors):
   - Name: `BROWSER_WS_URL`
   - Value: `wss://chrome.browserless.io?token=YOUR_TOKEN`
   - Why: A plain `wss://chrome.browserless.io` often returns `401 Unauthorized`, which matches your log: "Unexpected server response: 401".
6. Click Save → Continue, then Restart the app

Verify the setting:
- Portal → App Service → Configuration → Application settings → confirm `BROWSER_WS_URL` exists
- Log Stream: Portal → App Service → Log stream → you should NOT see 401 after restart

## Option B: Use Free Remote Chrome Service
1. Sign up at https://www.browserless.io (free tier)
2. Get your token
3. Set environment variable:
   - Name: `BROWSER_WS_URL` 
   - Value: `wss://chrome.browserless.io?token=YOUR_TOKEN`
4. Restart the app and watch Log stream; QR should appear within 30–90s

## Option C: Scale Up Temporarily (Paid)
If you want to use local Chrome on Azure:
1. Go to App Service → Scale up
2. Change from F1 to B1 Basic (minimal cost ~$13/month)
3. After QR setup, scale back to F1

## Option D: Deploy Updated Code
Your current code should work with remote Chrome. Just redeploy:

```bash
git add .
git commit -m "Azure Chrome optimization"
git push origin main
```

The GitHub Action will deploy automatically.

## Testing
After setting BROWSER_WS_URL:
1. Restart your Azure app
2. Watch logs: Portal → App Service → Log stream
   - If you see `Unexpected server response: 401`, your `BROWSER_WS_URL` is missing/invalid token
3. Check: https://tailoring-whatsapp-bot-esgvfsbtbeh4eefp.centralindia-01.azurewebsites.net/qr
4. Should show QR within 30–90 seconds

## Where to see logs (Azure)
- Portal → App Service → Log stream (live application logs)
- Kudu logs: https://<app-name>.scm.<region>.azurewebsites.net/api/vfs/LogFiles/
- Common errors:
  - `401 Unauthorized`: Use `BROWSER_WS_URL` with a valid token (see Option A/B)
  - `Protocol error / Session closed`: Chrome crashed on F1; use `BROWSER_WS_URL` or scale to B1

## Log stream decoder (what “it” means in your logs)

Use this quick map to understand the messages you’re seeing and how to fix them:

- "Unable to open a connection to your app…": Your current network can’t reach the app. Most common causes: Access Restrictions or site is stopped. Fix: App Service → Networking → Access restrictions (App and SCM) → ensure Public access is On and there are no Deny rules blocking your IP; then Restart.

- "Site startup probe failed": The platform health probe didn’t get a 200 from your container in time. Fixes:
   - Ensure your server listens on `process.env.PORT` and binds `0.0.0.0`.
   - Give the app a minute after restart (cold start on F1).
   - Check your app logs for runtime errors.

- "Container pull image interrupted. Revert by terminate.": Pull of the Node runtime image was interrupted (often transient on F1). Fix: Retry later or temporarily use Node 18; if it keeps happening, scale to B1 temporarily, let it start, then scale back.

- "Volume: DiagnosticServer cannot be mounted at /diagServer…": Platform transient. Fix: Restart the app. If persistent, scale up once or open a support ticket.

- "Site container … terminated during site startup": Your app exited or failed health checks very quickly. Fix: Open Log stream just before restart, look for preceding errors, verify the start command and that the server starts without exceptions.

- "Site is running with patch version: 18.20.8 | 20.19.3": Indicates Node major version (18.x vs 20.x) currently running. Mismatches with your expectation usually mean the Stack setting or deployment slot settings differ.

- "Unexpected server response: 401": Remote Chrome rejected the WebSocket. Fix: Set `BROWSER_WS_URL` to a tokenized URL (e.g., `wss://chrome.browserless.io?token=YOUR_TOKEN`).

- "Nested mountpoint", "Creating pipes for streaming container io", "Container is running", "Site startup probe succeeded", "Site started": Normal lifecycle messages.

- "Stop and delete container. Retry count = 0": Normal when the platform rolls instances during restarts/redeploys.

Quick fixes (in order):
1) Networking → Access restrictions (App and SCM): Public access On; remove/adjust Deny rules; allow your client IP if needed.
2) Configuration → Application settings: set `BROWSER_WS_URL` with a valid token; Save and Restart.
3) General settings → Stack: prefer Node 20 LTS; if image pulls keep failing on F1, run Node 18 for now or temporarily scale to B1 to warm up, then switch back.
4) After restart, wait 30–90s, then check `/healthz` and `/qr` on your app URL.
5) If probes still fail, verify your server binds to `process.env.PORT` on `0.0.0.0` and inspect Log stream for stack traces.
