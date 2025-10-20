# 🔧 Clerk Production Fix Guide

## 🚨 **Current Issue:**
```
Error: Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()
```

## 🎯 **Root Cause:**
Missing or incorrect Clerk environment variables in production (Render).

---

## ✅ **Step-by-Step Fix:**

### **1. Get Your Production Clerk Keys**

Go to [Clerk Dashboard](https://dashboard.clerk.com/) → Your App → **API Keys**

Copy these **Production** keys:
- `CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
- `CLERK_SECRET_KEY` (starts with `sk_live_`)

### **2. Add Environment Variables to Render**

In your Render dashboard:

1. Go to your **Web Service**
2. Click **Environment** tab
3. Add these variables:

```
CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
```

### **3. Update Clerk Allowed Origins**

In Clerk Dashboard:
1. Go to **Settings** → **Domains**
2. Add your Render URL: `https://requeue.onrender.com`
3. Add your custom domain: `https://requeue.it.com` (if using)

### **4. Redeploy**

After adding environment variables:
1. Click **Manual Deploy** in Render
2. Wait for deployment to complete

---

## 🔍 **Verify Fix:**

1. **Check logs** - should see "Middleware executing for: /path"
2. **Test authentication** - try signing in/out
3. **Check protected routes** - should redirect to sign-in

---

## 🚨 **If Still Not Working:**

### **Check Environment Variables:**
```bash
# In Render logs, you should see:
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### **Verify Middleware:**
- File exists at `src/middleware.ts` ✅
- Uses `clerkMiddleware()` ✅
- Has proper matcher config ✅

### **Test Locally First:**
```bash
# Copy production keys to .env.local
CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key

# Test locally
npm run dev
```

---

## 📋 **Complete Environment Variables List:**

```
# Clerk (Production)
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# App URLs
NEXT_PUBLIC_APP_URL=https://requeue.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://requeue.onrender.com

# Database
DATABASE_URL=your_neon_url

# Resend
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🎉 **Expected Result:**

After fix:
- ✅ No more Clerk middleware errors
- ✅ Authentication works properly
- ✅ Protected routes redirect correctly
- ✅ WebSocket connections work
- ✅ Room invitations work

---

## 🆘 **Still Having Issues?**

1. **Check Render logs** for specific errors
2. **Verify Clerk keys** are production keys (not test keys)
3. **Ensure domains** are added to Clerk dashboard
4. **Test locally** with production keys first
