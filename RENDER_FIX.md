# 🔧 Render Deployment - Quick Fix Guide

## ✅ Your App is Live!

URL: **https://requeue.onrender.com**

But you need to add missing environment variables to fix errors.

---

## 🚨 **Fix These Issues NOW:**

### **1. Add Missing Environment Variables**

Go to your Render Dashboard → Your Service → **Environment** tab

**Add these TWO variables:**

```bash
NEXT_PUBLIC_APP_URL=https://requeue.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://requeue.onrender.com
```

After adding them, click **"Save Changes"** - Render will auto-redeploy in ~1 minute.

---

### **2. Update Clerk Settings**

The Clerk errors are happening because you're using **test keys** in production.

#### **Get Production Keys:**
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** tab
4. Switch to **Production** (top right toggle)
5. Copy these keys:
   - `Publishable key` (starts with `pk_live_`)
   - `Secret key` (starts with `sk_live_`)

#### **Add to Render:**
1. Go to Render → Environment
2. Update these variables:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
   CLERK_SECRET_KEY=sk_live_YOUR_SECRET_HERE
   ```
3. Click **"Save Changes"**

#### **Add Render URL to Clerk:**
1. In Clerk Dashboard → **Settings** → **URLs**
2. Add to **Allowed Origins**:
   ```
   https://requeue.onrender.com
   ```
3. Add to **Allowed Redirect URLs**:
   ```
   https://requeue.onrender.com/welcome
   https://requeue.onrender.com/room/*
   ```
4. Click **Save**

---

### **3. Fix Resend Email Error (Optional)**

The error:
> `The gmail.com domain is not verified`

This is because you're trying to send from `gmail.com` in your environment variables.

**Quick Fix:**
1. Go to Render → Environment
2. Update:
   ```bash
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
   (Use Resend's test email for now)

**Proper Fix (Later):**
- Add and verify your own domain in Resend
- Then use: `noreply@yourdomain.com`

---

## 🔄 **After Making These Changes:**

1. Render will automatically redeploy (takes ~1-2 minutes)
2. Watch the **Logs** tab for the deployment
3. Once it says "Your service is live 🎉", test your app
4. The Clerk errors should be gone
5. WebSocket should work!

---

## ✅ **Verify Everything Works:**

Visit: `https://requeue.onrender.com`

Test:
- [ ] Homepage loads
- [ ] Sign in works (Clerk)
- [ ] Can access protected pages
- [ ] WebSocket connection (check browser console)
- [ ] Online indicators work
- [ ] Can create/view tasks

---

## 🐛 **Still Having Issues?**

### **Check WebSocket Connection:**
Open browser console and look for:
```
Socket connected
```

If you see errors, verify:
- `NEXT_PUBLIC_SOCKET_URL=https://requeue.onrender.com` is set
- No trailing slashes in the URL

### **Check Clerk:**
If you still see Clerk errors:
- Verify you're using `pk_live_` not `pk_test_`
- Check Clerk's Allowed Origins includes your Render URL
- Clear browser cache and try again

---

## 📝 **Summary of Environment Variables Needed:**

```bash
# Database
DATABASE_URL=postgresql://...

# Clerk (PRODUCTION KEYS!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=dhwhdeemn
CLOUDINARY_API_KEY=897353599358434
CLOUDINARY_API_SECRET=MayB4gQtBbfrlYxPvccB5b0yLME
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhwhdeemn

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev

# App URLs (IMPORTANT!)
NEXT_PUBLIC_APP_URL=https://requeue.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://requeue.onrender.com

# Server
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

---

## 🎯 **Priority Order:**

1. **First**: Add `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SOCKET_URL`
2. **Second**: Switch to Clerk production keys
3. **Third**: Fix Resend email (if you need invites to work)

After step 1, WebSocket should work! 🚀

