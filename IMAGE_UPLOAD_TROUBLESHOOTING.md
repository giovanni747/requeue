# Image Upload Troubleshooting Guide

## 🚨 **"Failed to upload image" Error**

The image upload is failing. Here's how to fix it:

## 🔍 **Step 1: Check Cloudinary Configuration**

### **Run the environment check:**
```bash
node check-cloudinary.js
```

### **Expected output:**
```
✅ CLOUDINARY_CLOUD_NAME: abc12345...
✅ CLOUDINARY_API_KEY: 12345678...
✅ CLOUDINARY_API_SECRET: 87654321...
✅ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: abc12345...
```

## 🔧 **Step 2: Set Up Cloudinary Environment Variables**

### **Create/Update `.env.local` file:**
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Public Cloudinary (for frontend)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### **Get credentials from:**
1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Sign up/Login to your account
3. Copy your credentials from the dashboard

## 🧪 **Step 3: Test the Upload API**

### **Check server logs:**
After trying to upload an image, check your terminal/console for:
- `Uploading file to Cloudinary:` - Shows the file details
- `Upload successful:` - Shows the upload result
- Any error messages

### **Common error messages and fixes:**

**"Image upload service not configured"**
- ❌ Missing environment variables
- ✅ Add Cloudinary credentials to `.env.local`

**"Invalid cloud_name"**
- ❌ Wrong cloud name
- ✅ Check your Cloudinary dashboard for correct cloud name

**"Invalid API key"**
- ❌ Wrong API key
- ✅ Regenerate API key in Cloudinary dashboard

**"File must be an image"**
- ❌ Uploading non-image file
- ✅ Only upload JPG, PNG, WebP, GIF files

**"File size must be less than 5MB"**
- ❌ File too large
- ✅ Compress image or choose smaller file

## 🔄 **Step 4: Restart Development Server**

After adding environment variables:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

## 🎯 **Step 5: Test Upload**

1. **Try uploading an image** in room creation or room settings
2. **Check the browser console** for any JavaScript errors
3. **Check the server terminal** for upload logs
4. **Verify the image appears** in the preview

## 🛠️ **Alternative: Test with Simple Upload**

If the issue persists, test with a simple curl command:

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/your/image.jpg" \
  -F "folder=test"
```

## 📋 **Complete Checklist**

- [ ] Cloudinary account created
- [ ] Environment variables added to `.env.local`
- [ ] Development server restarted
- [ ] Database has `image_public_id` column
- [ ] File is an image (JPG, PNG, WebP, GIF)
- [ ] File size is under 5MB
- [ ] No JavaScript errors in browser console
- [ ] Server logs show upload attempts

## 🆘 **Still Not Working?**

### **Check these files:**
1. `.env.local` - Environment variables
2. `src/app/api/upload/route.ts` - Upload API
3. `src/lib/cloudinary.ts` - Cloudinary configuration
4. Browser Network tab - API request/response

### **Common Issues:**
- **Wrong file path** for `.env.local`
- **Missing restart** after adding env vars
- **Invalid Cloudinary credentials**
- **Network/firewall blocking** Cloudinary API
- **File format not supported**

### **Get Help:**
1. Check server logs for specific error messages
2. Verify Cloudinary credentials are correct
3. Test with a simple image file (small JPG)
4. Check browser developer tools for network errors

---

**Once working, you'll see successful uploads in your server logs and images will appear in the UI!** 🎉
