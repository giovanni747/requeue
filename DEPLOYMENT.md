# 🚀 Production Deployment Guide

## Prerequisites

1. **Database**: Set up a production PostgreSQL database (Neon, Supabase, or AWS RDS)
2. **Authentication**: Configure Clerk for production
3. **Image Storage**: Set up Cloudinary account
4. **Email Service**: Set up Resend account
5. **Hosting Platform**: Choose a platform (Vercel, Railway, Render, etc.)

## Environment Variables

Set these environment variables in your hosting platform:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Email Service
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=your_verified_email@domain.com

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com

# Server
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0
```

## Deployment Steps

### 1. Build the Application
```bash
npm run build
```

### 2. Test Production Build Locally
```bash
npm run start:prod
```

### 3. Deploy to Hosting Platform

#### Option A: Vercel (Recommended for Next.js)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Option B: Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy with custom server

#### Option C: Render
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm run start:prod`
4. Set environment variables

## Post-Deployment Checklist

- [ ] Database connection working
- [ ] Authentication (Clerk) working
- [ ] Image uploads (Cloudinary) working
- [ ] Email invitations (Resend) working
- [ ] WebSocket connections working
- [ ] All pages loading correctly
- [ ] SSL certificate active
- [ ] Domain configured

## Monitoring

- Set up error tracking (Sentry)
- Monitor database performance
- Monitor WebSocket connections
- Set up uptime monitoring

## Security

- All environment variables are secure
- Database credentials are protected
- API keys are not exposed in client code
- CORS is properly configured
- Security headers are enabled

## Performance

- Images are optimized with Cloudinary
- Static assets are cached
- Database queries are optimized
- WebSocket connections are efficient
