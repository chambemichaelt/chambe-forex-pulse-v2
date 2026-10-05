# Forex Pulse - Production Deployment Guide

## Quick Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` with:

```bash
# Deriv OAuth Configuration
NEXT_PUBLIC_DERIV_APP_ID=34yYmvMto9OabbxhKj2Rz
NEXT_PUBLIC_DERIV_REDIRECT_URI=https://chambe-forex-pulse-v2.vercel.app
NEXT_PUBLIC_DERIV_APP_NAME=Forex Pulse
NEXT_PUBLIC_DERIV_SHOW_APP_NAME=true
NEXT_PUBLIC_DERIV_REFERRAL_LINK=https://t.deriv.link?t=7VWTAVCN8423
NEXT_PUBLIC_DERIV_OAUTH_SCOPES=read,trade
NEXT_PUBLIC_DERIV_ENV=production
NEXT_PUBLIC_FONT_FAMILY=Poppins
```

## Vercel Deployment

### Step 1: Connect to Vercel
1. Go to https://vercel.com
2. Click **"New Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub repo: `chambemichaelt/chambe-forex-pulse-v2`
5. Click **"Import"**

### Step 2: Add Environment Variables
1. In Vercel project settings, go to **"Environment Variables"**
2. Add each variable:

```
NEXT_PUBLIC_DERIV_APP_ID = 34yYmvMto9OabbxhKj2Rz
NEXT_PUBLIC_DERIV_REDIRECT_URI = https://chambe-forex-pulse-v2.vercel.app
NEXT_PUBLIC_DERIV_APP_NAME = Forex Pulse
NEXT_PUBLIC_DERIV_SHOW_APP_NAME = true
NEXT_PUBLIC_DERIV_REFERRAL_LINK = https://t.deriv.link?t=7VWTAVCN8423
NEXT_PUBLIC_DERIV_OAUTH_SCOPES = read,trade
NEXT_PUBLIC_DERIV_ENV = production
NEXT_PUBLIC_FONT_FAMILY = Poppins
```

3. Click **"Save"**

### Step 3: Deploy
1. Vercel will auto-deploy on push to main
2. Or click **"Deploy"** manually
3. Wait for build to complete (should take ~2 minutes)
4. Check deployment at: https://chambe-forex-pulse-v2.vercel.app

## Deriv Dashboard Setup

### Step 1: Register Callback URLs
1. Go to https://deriv.com/app/account-settings
2. Click **"Security"** or **"OAuth Applications"**
3. Find your app: **Forex Pulse** (App ID: 34yYmvMto9OabbxhKj2Rz)
4. Add these URLs to **"Authorized Redirect URIs"**:
   - `https://chambe-forex-pulse-v2.vercel.app`
   - `https://chambe-forex-pulse-v2.vercel.app/api/deriv/callback`
5. Click **"Save"**

### Step 2: Verify OAuth Scopes
1. In your Deriv app settings, ensure these scopes are enabled:
   - **read** (read account info)
   - **trade** (execute trades)
2. Click **"Save"**

## Verification Checklist

- [ ] Repo pushed to GitHub
- [ ] Environment variables set in Vercel
- [ ] App deployed to vercel.app domain
- [ ] Redirect URLs whitelisted in Deriv
- [ ] Visit https://chambe-forex-pulse-v2.vercel.app
- [ ] Click **"Connect Deriv Account"**
- [ ] Redirects to Deriv OAuth login
- [ ] After login, redirects back to app
- [ ] User panel shows account info
- [ ] "Logout" button works

## Live Features

✅ Deriv OAuth authentication
✅ Session management (24-hour expiry)
✅ User account display (email, balance, currency)
✅ Three trading modes: broadcast, read-only, independent
✅ Real-time trade feed (5-second polling)
✅ Commission tracking (3% on close)
✅ Follower account management
✅ Master trade panel

## Production Notes

- Sessions are in-memory; upgrade to Redis for production scaling
- Trade data is mock; integrate real Deriv API for live trades
- Follower accounts are mock; implement real follower sync
- Add rate limiting on API routes for security
- Add logging and monitoring for production stability

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Deriv app settings
4. Verify environment variables are set
