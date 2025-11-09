# 🔐 Clerk Dashboard Configuration Guide

## Complete setup instructions for Multi-Factor Authentication and Session Management

---

## 📋 Prerequisites

- Access to your Clerk Dashboard at https://dashboard.clerk.com
- Admin permissions for your IntegrityX application
- Approximately 5-10 minutes

---

## 🔒 **STEP 1: Enable Multi-Factor Authentication (MFA)**

### Why MFA is Critical for IntegrityX:
- Financial applications require enhanced security
- Protects against password theft and phishing
- Industry compliance (SOC 2, ISO 27001)
- Builds customer trust in your platform

### Instructions:

1. **Navigate to MFA Settings**
   - Log into Clerk Dashboard: https://dashboard.clerk.com
   - Select your **IntegrityX** application
   - Go to **User & Authentication** → **Multi-factor**

2. **Enable MFA**
   - Toggle **"Enable multi-factor authentication"** to **ON**
   - This allows users to set up 2FA for their accounts

3. **Configure MFA Methods** (Recommended Setup):

   **✅ Authenticator App (TOTP)** - PRIMARY
   - Enable: **Google Authenticator, Authy, 1Password, etc.**
   - Most secure option
   - Works offline
   - **Recommended**: Keep this ENABLED

   **✅ SMS Code** - BACKUP
   - Enable: **SMS-based verification**
   - Good fallback option
   - Requires phone number
   - **Recommended**: Enable as backup

   **✅ Backup Codes** - EMERGENCY
   - Enable: **One-time recovery codes**
   - Used if user loses phone/authenticator
   - **Recommended**: Enable for recovery

4. **Require MFA (Optional but HIGHLY Recommended)**

   To FORCE all users to enable MFA:
   - Look for **"Require multi-factor authentication"** option
   - Toggle to **ON**
   - All existing users will be prompted to set up MFA on next sign-in
   - New users must set up MFA during registration

   **⚠️ Important**: If you enable "Require MFA", notify your users first!

5. **Save Settings**
   - Click **"Save"** or **"Update"** at the bottom of the page
   - Settings apply immediately

### Verification:

After enabling MFA, test it:
1. Sign in to your IntegrityX app
2. Go to user account settings
3. You should see an option to "Enable Two-Factor Authentication"
4. Follow the setup flow to test

---

## ⏱️ **STEP 2: Configure Session Timeouts**

### Why Session Management Matters:
- Prevents unauthorized access on shared computers
- Complies with financial security standards
- Reduces risk of session hijacking
- Forces re-authentication for sensitive operations

### Instructions:

1. **Navigate to Session Settings**
   - In Clerk Dashboard, go to **Sessions & Tokens** → **Session & JWT templates**
   - Or direct link: https://dashboard.clerk.com/apps/[YOUR_APP_ID]/sessions

2. **Configure Inactivity Timeout**

   **Recommended for IntegrityX: 15 minutes**

   - Find **"Inactivity timeout"** setting
   - Set to: **15 minutes** (900 seconds)
   - This means: User is logged out after 15 minutes of NO activity

   **What counts as activity?**
   - Page navigation
   - API requests
   - Token refresh (automatic in background)

   **If user closes browser:**
   - They remain signed in (unless you set max lifetime)
   - Next visit auto-refreshes session if still within timeout

3. **Configure Maximum Session Lifetime**

   **Recommended for IntegrityX: 8 hours (workday)**

   - Find **"Maximum lifetime"** setting
   - Set to: **8 hours** (28800 seconds)
   - This means: User MUST sign in again after 8 hours, even if active

   **Why 8 hours?**
   - Covers a typical workday
   - Forces fresh authentication daily
   - Balances security with usability

4. **Multi-Session Handling** (Advanced)

   **Recommended for IntegrityX: DISABLE**

   - Find **"Multi-session handling"** setting
   - Set to: **"Single active session"** or **Disable concurrent sessions**
   - This means: User can only be signed in on ONE device at a time
   - If they sign in elsewhere, previous session is invalidated

   **Why disable multi-session?**
   - Better security (prevents session sharing)
   - Easier audit trail (one user = one session)
   - Prevents account sharing

   **Alternative**: Keep enabled if users need access from multiple devices

5. **Token Lifetime Settings** (Advanced - Optional)

   - **Session Token Lifetime**: Keep default (60 seconds)
   - **Refresh Token Lifetime**: Keep default (7 days)
   - These work automatically - no need to change unless you have specific requirements

6. **Save Settings**
   - Click **"Save"** at the bottom
   - Changes apply immediately to new sessions
   - Existing sessions continue until they expire

### Session Configuration Summary:

```
✅ Inactivity Timeout: 15 minutes
✅ Maximum Lifetime: 8 hours
✅ Multi-Session: Disabled (single session only)
✅ Session Token: 60 seconds (default)
✅ Refresh Token: 7 days (default)
```

---

## 🧪 **STEP 3: Testing Your Configuration**

### Test MFA:

1. **Create a Test User** (or use your own account):
   - Sign up for a new account in IntegrityX
   - Complete email verification

2. **Set Up MFA**:
   - Go to user account/profile page
   - Click "Enable Two-Factor Authentication"
   - Scan QR code with authenticator app
   - Enter 6-digit code to verify
   - Save backup codes (if enabled)

3. **Test MFA Login**:
   - Sign out
   - Sign back in with email/password
   - Should prompt for 6-digit MFA code
   - Enter code from authenticator app
   - Successfully sign in ✅

### Test Session Timeout:

1. **Test Inactivity Timeout** (15 minutes):
   - Sign in to IntegrityX
   - Leave tab open but don't interact
   - Wait 16 minutes
   - Try to navigate to a protected page
   - Should redirect to sign-in (session expired) ✅

2. **Test Maximum Lifetime** (8 hours):
   - Sign in to IntegrityX
   - Keep using the app for 8+ hours
   - After 8 hours, should be forced to sign in again ✅

   *Note: This test takes 8 hours - you can verify the setting is applied by checking session creation time vs current time*

3. **Test Single Session** (if enabled):
   - Sign in on Browser 1 (Chrome)
   - Sign in on Browser 2 (Firefox) with same account
   - Go back to Browser 1
   - Try to navigate - should be signed out ✅

---

## 📊 **STEP 4: Monitor & Adjust**

### Where to Monitor Sessions:

1. **Clerk Dashboard** → **Users**
   - Click on any user
   - See "Sessions" tab
   - View all active sessions
   - Can manually revoke sessions

2. **Clerk Dashboard** → **Logs**
   - See all sign-in attempts
   - See MFA verifications
   - See session expirations
   - Useful for debugging

### When to Adjust Settings:

**Increase timeout if:**
- Users complain about signing in too often
- Long document upload/processing times
- Users work on complex tasks over 15 minutes

**Decrease timeout if:**
- Heightened security requirements
- Compliance audit findings
- Users work in high-risk environments

**Recommended Adjustments**:
- Start with 15 min / 8 hour settings
- Monitor user feedback for 1-2 weeks
- Adjust based on actual usage patterns

---

## 🎯 **Quick Reference: Clerk Dashboard URLs**

```
Main Dashboard:
https://dashboard.clerk.com

Multi-Factor Settings:
https://dashboard.clerk.com/apps/[YOUR_APP_ID]/user-authentication/multi-factor

Session Settings:
https://dashboard.clerk.com/apps/[YOUR_APP_ID]/sessions

User Management:
https://dashboard.clerk.com/apps/[YOUR_APP_ID]/users

Activity Logs:
https://dashboard.clerk.com/apps/[YOUR_APP_ID]/logs
```

Replace `[YOUR_APP_ID]` with your actual Clerk application ID.

---

## ✅ **Configuration Checklist**

Use this checklist to verify you've completed all steps:

### MFA Configuration:
- [ ] MFA enabled in dashboard
- [ ] Authenticator app (TOTP) enabled
- [ ] SMS codes enabled (backup)
- [ ] Backup codes enabled (recovery)
- [ ] (Optional) MFA required for all users
- [ ] Tested MFA sign-in flow
- [ ] Users notified about MFA requirement

### Session Configuration:
- [ ] Inactivity timeout set to 15 minutes
- [ ] Maximum lifetime set to 8 hours
- [ ] Multi-session handling set to "single session"
- [ ] Tested inactivity logout
- [ ] (If time permits) Tested 8-hour max lifetime
- [ ] (If enabled) Tested single-session enforcement

### Documentation:
- [ ] Users informed of new security settings
- [ ] Help documentation updated with MFA setup instructions
- [ ] Session timeout behavior documented
- [ ] Support team briefed on new settings

---

## 🆘 **Troubleshooting**

### Problem: MFA option not showing in app

**Solution:**
- Verify MFA is enabled in Clerk Dashboard
- Clear browser cache and reload
- Check that Clerk SDK is up to date in `package.json`
- Verify `@clerk/nextjs` is latest version

### Problem: Users locked out after enabling "Require MFA"

**Solution:**
- In Clerk Dashboard → Users → Select user
- Click "Remove MFA" to reset
- Have user set up MFA again
- Or: Disable "Require MFA" temporarily

### Problem: Session not expiring after 15 minutes

**Solution:**
- Check that time was saved in dashboard
- Verify inactivity is true inactivity (no background API calls)
- Clear browser cookies and test again
- Check SessionManager component isn't interfering

### Problem: Can't find session settings in dashboard

**Solution:**
- Look for "Sessions & Tokens" or "JWT Templates"
- Different Clerk plans may have different UI
- Check Clerk documentation for your plan tier
- Contact Clerk support if still can't find

---

## 📚 **Additional Resources**

- **Clerk MFA Documentation**: https://clerk.com/docs/security/multi-factor-authentication
- **Clerk Session Management**: https://clerk.com/docs/guides/secure/session-options
- **Clerk Security Best Practices**: https://clerk.com/docs/security/overview
- **OWASP Authentication Guidelines**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **NIST Digital Identity Guidelines**: https://pages.nist.gov/800-63-3/

---

## 🎉 **You're Done!**

Your IntegrityX application now has:
- ✅ Multi-factor authentication for enhanced security
- ✅ Automatic session timeouts (15 min inactivity / 8 hour max)
- ✅ Single-session enforcement (if enabled)
- ✅ Financial-grade security configuration

**Next Steps:**
1. Notify your users about MFA (if required)
2. Update your user documentation/help center
3. Monitor Clerk logs for any issues
4. Enjoy peace of mind! 🛡️

---

**Questions?** Check the Clerk Dashboard or contact support at support@clerk.com
