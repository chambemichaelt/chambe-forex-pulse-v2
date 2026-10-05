# Forex Pulse Copy Trading App

A clean, production-ready foundation for a Deriv-based copy-trading dashboard.

## Quick run

```bash
npm install
npm run dev
```

## Production environment

Create a `.env.local` file with the values below:

```bash
NEXT_PUBLIC_DERIV_APP_ID=34yYmvMto9OabbxhKj2Rz
NEXT_PUBLIC_DERIV_REDIRECT_URI=https://chambe-forex-pulse-v2.vercel.app
NEXT_PUBLIC_DERIV_APP_NAME=Forex Pulse
NEXT_PUBLIC_DERIV_SHOW_APP_NAME=true
NEXT_PUBLIC_DERIV_REFERRAL_LINK=https://t.deriv.link?t=7VWTAVCN8423
NEXT_PUBLIC_DERIV_OAUTH_SCOPES=read,trade
NEXT_PUBLIC_DERIV_ENV=production
NEXT_PUBLIC_FONT_FAMILY=Poppins
```

## Architecture

- master broadcaster dashboard
- follower account links
- broadcast / read-only / independent modes
- 3% commission tracking
- live trade feed

## Important note

This repo is the clean foundation for the real product. The actual live Deriv OAuth token exchange and trade execution must be completed on the live Vercel deployment with the real Deriv app credentials and allowed redirect URL.
