# 🚂 Railway Deployment Guide for Requeue

## Why Railway Instead of Vercel?

Your app uses a **custom Node.js server** (`server.js`) with **Socket.io** for real-time features. Vercel doesn't support custom servers, but Railway does!

---

## 🚀 Quick Deployment Steps

### 1. **Sign Up / Sign In to Railway**
- Go to [railway.app](https://railway.app)
- Sign in with your GitHub account

### 2. **Create New Project**
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **`requeue`** repository
4. Railway will automatically detect it's a Node.js app

### 3. **Configure Build Settings** (Auto-detected, but verify)

Railway should auto-detect:
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Port**: `3000` (from your `server.js`)

If not, set them manually in **Settings → Deploy**.

### 4. **Add Environment Variables**

Go to **Variables** tab and add these:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_cuRYtl2CQmM8@ep-morning-sky-adh7jv7y-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Clerk Authentication (PRODUCTION KEYS!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_SECRET

# Cloudinary
CLOUDINARY_CLOUD_NAME=dhwhdeemn
CLOUDINARY_API_KEY=897353599358434
CLOUDINARY_API_SECRET=MayB4gQtBbfrlYxPvccB5b0yLME
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhwhdeemn

# Email Service
RESEND_API_KEY=re_Mj3Bnk7H_DJHHwVquZ3xSTeKeFSxjBaZY
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URLs (UPDATE AFTER DEPLOYMENT!)
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_SOCKET_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Server Settings
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

**Important**: Railway provides `${{RAILWAY_PUBLIC_DOMAIN}}` variable that auto-updates with your deployment URL!

### 5. **Generate a Public Domain**

1. Go to **Settings → Networking**
2. Click **"Generate Domain"**
3. Railway will give you a URL like: `your-app.up.railway.app`
4. (Optional) Add your custom domain later

### 6. **Deploy!**

Click **"Deploy"** and watch the logs. Your app will be live in ~2-3 minutes!

---

## 🔄 Auto-Deployment

Railway automatically redeploys when you push to your `main` branch on GitHub!

---

## ✅ Post-Deployment Checklist

After deployment, test these:

1. **Visit your Railway URL** - Does the homepage load?
2. **Test Authentication** - Can you sign in with Clerk?
3. **Test WebSocket** - Do online indicators work?
4. **Test Database** - Can you create/view tasks?
5. **Test Image Upload** - Does Cloudinary work?
6. **Test Invitations** - Do emails send?

---

## 🔒 Update Clerk Settings

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your app
3. Go to **Settings → URLs**
4. Add your Railway domain to **Allowed Origins**:
   - `https://your-app.up.railway.app`

---

## 💰 Pricing

- **Free Tier**: $5 credit/month (usually enough for hobby projects)
- **Pro Plan**: $20/month with $20 included usage
- Your app will likely use ~$2-5/month on the free tier

---

## 🐛 Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`

### App Won't Start
- Check **Settings → Deploy** for correct start command
- Verify `PORT` environment variable is set to `3000`

### WebSocket Not Working
- Ensure `NEXT_PUBLIC_SOCKET_URL` matches your Railway domain
- Check CORS settings in `server.js`

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if Neon database allows connections from Railway's IP

---

## 📊 Monitoring

Railway provides:
- **Real-time logs** (Deployments → Logs)
- **Metrics** (CPU, Memory, Network usage)
- **Deployment history**

---

## 🎯 You're Ready!

Your app is production-ready for Railway. The custom server with Socket.io will work perfectly! 🚀

