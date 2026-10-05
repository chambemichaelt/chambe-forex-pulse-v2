# Deriv Setup Checklist

## Pre-Deployment

- [ ] Vercel app deployed to: https://chambe-forex-pulse-v2.vercel.app
- [ ] Environment variables set in Vercel
- [ ] GitHub repo connected to Vercel
- [ ] All code pushed to main branch

## Deriv OAuth Configuration

### 1. Access Deriv Developer Dashboard
- [ ] Go to https://deriv.com/app/account-settings
- [ ] Click **"Security"** or find **"OAuth Applications"**
- [ ] Find your app: **Forex Pulse**
- [ ] App ID: **34yYmvMto9OabbxhKj2Rz**

### 2. Register Redirect URLs (CRITICAL)

**Add these URLs to "Authorized Redirect URIs":**

```
https://chambe-forex-pulse-v2.vercel.app
https://chambe-forex-pulse-v2.vercel.app/api/deriv/callback
```

**Steps:**
- [ ] Click **"Edit"** on your app
- [ ] Scroll to **"Redirect URIs"** or **"Authorized Redirect URIs"**
- [ ] Add: `https://chambe-forex-pulse-v2.vercel.app`
- [ ] Add: `https://chambe-forex-pulse-v2.vercel.app/api/deriv/callback`
- [ ] Click **"Save"**

### 3. Verify OAuth Scopes

**Required scopes should be enabled:**
- [ ] **read** - Read account information
- [ ] **trade** - Execute trades on user's behalf

**Steps:**
- [ ] In your app settings, check **"OAuth Scopes"**
- [ ] Verify **"read"** is checked
- [ ] Verify **"trade"** is checked
- [ ] Click **"Save"**

### 4. Copy App Credentials (for reference)

- [ ] App ID: `34yYmvMto9OabbxhKj2Rz`
- [ ] App Name: `Forex Pulse`
- [ ] Status: Should show **"Active"** (not Suspended)

## Production Verification

### Test OAuth Flow

1. [ ] Visit: https://chambe-forex-pulse-v2.vercel.app
2. [ ] Click **"Connect Deriv Account"** button
3. [ ] Should redirect to Deriv OAuth login page
4. [ ] Log in with your Deriv credentials
5. [ ] You should be asked to authorize ("Forex Pulse" wants to access your account)
6. [ ] Click **"Authorize"** or **"Accept"**
7. [ ] Should redirect back to https://chambe-forex-pulse-v2.vercel.app
8. [ ] Should see user panel with:
   - [ ] Your email address
   - [ ] Your account ID
   - [ ] Your balance
   - [ ] Your currency
9. [ ] Click **"Logout"** button
10. [ ] Should return to login screen

### Dashboard Features Test

- [ ] After login, see trading dashboard
- [ ] See stats: Open Trades, Followers, Volume, Fee
- [ ] Mode buttons work: Broadcast, Read Only, Independent
- [ ] Can select symbols: EURUSD, USDJPY, GBPUSD, XAUUSD
- [ ] Can select direction: CALL, PUT
- [ ] Can enter stake amount
- [ ] Can click "Broadcast Trade to Followers"
- [ ] Recent trade feed appears
- [ ] User panel shows on right side
- [ ] Logout button works

## Troubleshooting

### Issue: "OAuth error: invalid_request"
**Solution:** Check that redirect URIs are exact in Deriv settings

### Issue: "Session expired" after login
**Solution:** Session is 24 hours; restart browser or clear cookies

### Issue: User panel shows "Loading..."
**Solution:** Check browser console for API errors; check Vercel logs

### Issue: Deriv login doesn't redirect back
**Solution:** 
- Verify both redirect URLs are whitelisted in Deriv
- Check exact spelling: https://chambe-forex-pulse-v2.vercel.app
- Clear browser cache and cookies

### Issue: "Not authenticated" on login
**Solution:** Check that session cookie is set; check httpOnly setting

## Support URLs

- **Your App:** https://chambe-forex-pulse-v2.vercel.app
- **OAuth Login:** https://chambe-forex-pulse-v2.vercel.app/api/deriv/login
- **OAuth Callback:** https://chambe-forex-pulse-v2.vercel.app/api/deriv/callback
- **User Info:** https://chambe-forex-pulse-v2.vercel.app/api/auth/user
- **Logout:** https://chambe-forex-pulse-v2.vercel.app/api/auth/logout

## Final Checklist

- [ ] All environment variables set in Vercel
- [ ] Vercel deployment successful (no build errors)
- [ ] Both redirect URLs whitelisted in Deriv
- [ ] OAuth scopes enabled in Deriv
- [ ] App status is "Active" in Deriv
- [ ] Can log in successfully
- [ ] User panel displays correctly
- [ ] Can log out successfully
- [ ] Ready for production use

✅ **App is production-ready!**
