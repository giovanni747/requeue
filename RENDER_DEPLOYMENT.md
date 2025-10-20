# 🎨 Render Free Deployment Guide for Requeue

## Why Render?

✅ **100% FREE** - No credit card required  
✅ **Custom Node.js Server** - Your `server.js` works  
✅ **WebSocket Support** - Socket.io compatible  
✅ **Auto-Deploy** - GitHub integration  
✅ **Free SSL** - Automatic HTTPS  

⚠️ **Free Tier Limitation**: App sleeps after 15 mins of inactivity (wakes up in ~30 seconds on first request)

---

## 🚀 Deploy to Render in 5 Steps

### **Step 1: Sign Up / Sign In**
- Go to [render.com](https://render.com)
- Click **"Get Started for Free"**
- Sign up with your GitHub account
- **No credit card required!**

---

### **Step 2: Create New Web Service**
1. Click **"New +"** → **"Web Service"**
2. Click **"Connect account"** to link GitHub
3. Find and select your **`requeue`** repository
4. Click **"Connect"**

---

### **Step 3: Configure Build Settings**

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `requeue` (or any name you want) |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | **Free** ⭐ |

---

### **Step 4: Add Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

Add each of these:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_cuRYtl2CQmM8@ep-morning-sky-adh7jv7y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Clerk Authentication (GET PRODUCTION KEYS!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET

# Cloudinary
CLOUDINARY_CLOUD_NAME=dhwhdeemn
CLOUDINARY_API_KEY=897353599358434
CLOUDINARY_API_SECRET=MayB4gQtBbfrlYxPvccB5b0yLME
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhwhdeemn

# Email Service
RESEND_API_KEY=re_Mj3Bnk7H_DJHHwVquZ3xSTeKeFSxjBaZY
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Server Settings
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**⚠️ IMPORTANT - Add these AFTER first deployment:**
```bash
# Add these after you get your Render URL
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com
```

---

### **Step 5: Deploy!**

1. Click **"Create Web Service"** at the bottom
2. Render will start building (takes 2-5 minutes)
3. Watch the build logs in real-time
4. When you see ✅ **"Live"** - your app is deployed!

---

## 🔄 **After First Deployment**

### **1. Get Your Render URL**
Your app will be at: `https://your-app.onrender.com`

### **2. Add Missing Environment Variables**
1. Go to **Dashboard** → Your service → **Environment**
2. Add these two variables:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com
   ```
3. Click **"Save Changes"**
4. Render will auto-redeploy

### **3. Update Clerk Settings**
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **Settings → URLs**
4. Add to **Allowed Origins**:
   - `https://your-app.onrender.com`
5. **Get Production Keys**:
   - Go to **API Keys** → **Production** tab
   - Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - Copy `CLERK_SECRET_KEY` (starts with `sk_live_`)
   - Update these in Render environment variables
   - **IMPORTANT**: Also add to Clerk's **Allowed Redirect URLs**:
     - `https://your-app.onrender.com/welcome`

---

## 📊 **Free Tier Details**

### **What You Get FREE:**
- ✅ 750 hours/month (enough for 24/7 operation)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Auto SSL certificates
- ✅ Custom domains (optional)
- ✅ Unlimited deployments

### **Free Tier Limitations:**
- ⚠️ **Sleeps after 15 minutes** of inactivity
- ⚠️ **~30 second wake-up** time on first request
- ⚠️ **Shared resources** (slower than paid)

### **Workaround for Sleep Issue:**
Use a free uptime monitor to ping your app every 10 minutes:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Cron-job.org](https://cron-job.org) (free)

---

## 🔄 **Auto-Deployment**

Render automatically redeploys when you push to your `main` branch on GitHub!

---

## ✅ **Post-Deployment Checklist**

Test these features:

- [ ] **Homepage loads** at your Render URL
- [ ] **Authentication works** (Clerk sign in/up)
- [ ] **Database works** (create/view tasks)
- [ ] **WebSocket works** (online indicators)
- [ ] **Image upload works** (Cloudinary)
- [ ] **Email invites work** (Resend)

---

## 🐛 **Troubleshooting**

### **Build Fails**
- Check **Logs** tab for errors
- Ensure all dependencies are in `package.json`
- Verify build command: `npm install && npm run build`

### **App Won't Start**
- Check start command: `npm run start:prod`
- Verify `PORT=3000` in environment variables
- Check **Logs** for startup errors

### **"Sign-in URL is not valid" Error**
- Update Clerk's **Allowed Origins** with your Render URL
- Switch to Clerk **Production Keys** (`pk_live_` not `pk_test_`)

### **WebSocket Not Connecting**
- Ensure `NEXT_PUBLIC_SOCKET_URL` matches your Render domain
- Check if app is awake (free tier sleeps)

### **App is Slow/Sleeps**
- This is normal for free tier
- Use UptimeRobot to keep it awake
- Or upgrade to paid ($7/month for always-on)

---

## 💰 **Upgrade Later (Optional)**

If you want to remove sleep limitation:
- **Starter Plan**: $7/month
  - No sleep
  - Better performance
  - More resources

---

## 📈 **Monitoring**

Render provides:
- **Real-time Logs** (Logs tab)
- **Metrics** (CPU, Memory, Requests)
- **Deploy History**
- **Health Checks**

---

## 🎯 **You're Ready!**

Render's free tier is perfect for:
- Development/testing
- Portfolio projects
- Low-traffic apps

Your app will work great on Render! 🚀

---

## 🔗 **Quick Links**

- [Render Dashboard](https://dashboard.render.com)
- [Render Docs](https://render.com/docs)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Support](https://render.com/docs/support)

