# Cloudinary Integration Setup (Advanced)

This guide will help you set up Cloudinary with advanced image transformations, effects, and optimizations in your Next.js app using the latest `@cloudinary/url-gen` library.

## 🚀 Quick Setup

### 1. Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. Once logged in, go to your [Dashboard](https://cloudinary.com/console)

### 2. Get Your Credentials
From your Cloudinary Dashboard, you'll need:
- **Cloud Name** (found in the dashboard)
- **API Key** (found in the dashboard)
- **API Secret** (found in the dashboard)

### 3. Set Up Environment Variables
Create a `.env.local` file in your project root with:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Public variables (safe to expose to client)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

### 4. Create an Upload Preset (Optional but Recommended)
1. Go to Settings → Upload
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set it to "Unsigned" for client-side uploads
5. Configure allowed formats, max file size, etc.
6. Save and copy the preset name to your `.env.local`

## 📦 What's Been Installed

The following packages have been installed:
- `cloudinary` - Core Cloudinary SDK
- `@cloudinary/url-gen` - Advanced URL generation library with transformations
- `next-cloudinary` - Next.js specific Cloudinary integration

## 🛠️ Files Created

### 1. `/src/lib/cloudinary.ts`
Advanced Cloudinary utilities including:
- Image upload function (supports File, Buffer, URL)
- Image deletion function
- Advanced URL generation with `@cloudinary/url-gen`
- Pre-configured transformations (avatar, thumbnail, roomCard, taskImage, heroImage, profileBanner, productImage, artistic, vintage, blackAndWhite)
- Support for zoom, rotate, brightness, contrast, saturation, blur, sharpen, opacity, background, border effects

### 2. `/src/app/api/upload/route.ts`
API endpoint for handling image uploads from the client

### 3. `/src/components/ImageUpload.tsx`
Advanced reusable component for image uploads with:
- Drag & drop support
- File validation
- Preview functionality
- Progress indicators
- Error handling
- Two image display components: `OptimizedImage` and `AdvancedImage`

### 4. `/src/components/CloudinaryExample.tsx`
Comprehensive example component showing:
- Basic image uploads
- All pre-configured transformations
- Advanced transformations with effects
- Artistic filters (vintage, black & white, artistic)
- Enhancement effects (brightness, contrast, saturation, sharpen)

### 5. Updated `next.config.ts`
Added Cloudinary domain to image optimization

## 🎯 How to Use

### Basic Image Upload
```tsx
import ImageUpload from '@/components/ImageUpload';

function MyComponent() {
  const handleUpload = (url: string, publicId: string) => {
    console.log('Image uploaded:', url, publicId);
    // Save to your database
  };

  return (
    <ImageUpload
      onUploadComplete={handleUpload}
      folder="my-app"
      tags={['user-upload']}
    />
  );
}
```

### Display Optimized Images
```tsx
import { OptimizedImage } from '@/components/ImageUpload';

function UserAvatar({ publicId, name }) {
  return (
    <OptimizedImage
      publicId={publicId}
      alt={name}
      transformation="avatar"
      className="w-16 h-16 rounded-full"
    />
  );
}
```

### Advanced Image Transformations
```tsx
import { AdvancedImage } from '@/components/ImageUpload';

<AdvancedImage
  publicId="my-image-id"
  alt="Enhanced Image"
  width={400}
  height={300}
  brightness={10}
  contrast={15}
  saturation={20}
  sharpen={true}
  artistic="audrey"
  className="w-full h-64 object-cover rounded-lg"
/>
```

### Artistic Effects
```tsx
// Vintage effect
<AdvancedImage
  publicId="my-image-id"
  alt="Vintage Style"
  width={400}
  height={300}
  vintage={true}
  brightness={-10}
  saturation={-20}
  contrast={10}
  className="w-full h-64 object-cover rounded-lg"
/>

// Black & White with enhancement
<AdvancedImage
  publicId="my-image-id"
  alt="B&W Enhanced"
  width={400}
  height={300}
  blackAndWhite={true}
  brightness={5}
  contrast={20}
  sharpen={true}
  className="w-full h-64 object-cover rounded-lg"
/>
```

### Custom Transformations (Legacy)
```tsx
<OptimizedImage
  publicId="my-image-id"
  alt="Description"
  customTransformation={{
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    radius: 20,
    effect: 'blur:300'
  }}
  className="w-full h-64 object-cover rounded-lg"
/>
```

## 🎨 Pre-configured Transformations

### Avatar
- Size: 100x100px
- Crop: fill with face detection
- Quality: auto
- Format: auto

### Thumbnail
- Size: 300x200px
- Crop: fill
- Quality: auto
- Format: auto

### Room Card
- Size: 250x200px
- Crop: fill
- Quality: auto
- Format: auto
- Border radius: 20px

### Task Image
- Size: 400x300px
- Crop: fill
- Quality: auto
- Format: auto

### Hero Image
- Size: 1200x600px
- Crop: fill
- Quality: auto
- Format: auto
- Blur: 1
- Sharpen: 1
- Brightness: 10
- Contrast: 10

### Profile Banner
- Size: 800x300px
- Crop: fill
- Quality: auto
- Format: auto
- Saturation: 20
- Border radius: 10px

### Product Image
- Size: 500x500px
- Crop: fill
- Quality: auto
- Format: auto
- Background: white
- Border: 2px solid lightgray

### Artistic
- Size: 400x400px
- Crop: fill
- Quality: auto
- Format: auto
- Effect: art:audrey
- Brightness: 5
- Contrast: 15

### Vintage
- Size: 400x300px
- Crop: fill
- Quality: auto
- Format: auto
- Effect: vintage
- Brightness: -10
- Saturation: -20
- Contrast: 10

### Black & White
- Size: 400x300px
- Crop: fill
- Quality: auto
- Format: auto
- Effect: blackwhite
- Brightness: 5
- Contrast: 20

## 🔧 Integration Examples

### Room Creation with Image
```tsx
import ImageUpload from '@/components/ImageUpload';
import { useState } from 'react';

function CreateRoomDialog() {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [roomImagePublicId, setRoomImagePublicId] = useState<string | null>(null);

  const handleImageUpload = (url: string, publicId: string) => {
    setRoomImage(url);
    setRoomImagePublicId(publicId);
  };

  return (
    <div className="space-y-4">
      <ImageUpload
        onUploadComplete={handleImageUpload}
        folder="rooms"
        tags={['room-image']}
        preview={true}
      />
      {/* Other room creation form fields */}
    </div>
  );
}
```

### User Profile with Avatar
```tsx
import { OptimizedImage } from '@/components/ImageUpload';

function UserProfile({ user }) {
  return (
    <div className="flex items-center space-x-4">
      <OptimizedImage
        publicId={user.imagePublicId}
        alt={user.name}
        transformation="avatar"
        className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
      />
      <div>
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}
```

## 🚨 Important Notes

1. **Security**: Never expose your API secret in client-side code
2. **File Size**: Default max file size is 5MB (configurable)
3. **Formats**: Supports JPEG, PNG, and WebP by default
4. **Storage**: Images are stored in Cloudinary's cloud storage
5. **CDN**: All images are served through Cloudinary's global CDN

## 🔍 Testing

1. Start your development server: `npm run dev`
2. Navigate to a page with the ImageUpload component
3. Try uploading different image formats and sizes
4. Check the Network tab to see the upload requests
5. Verify images appear in your Cloudinary dashboard

## 🚀 Advanced Features

### New in this Integration:
- **Advanced URL Generation**: Using `@cloudinary/url-gen` for type-safe transformations
- **Artistic Effects**: Vintage, black & white, and artistic filters
- **Image Enhancement**: Brightness, contrast, saturation, sharpen effects
- **Zoom & Rotate**: Advanced geometric transformations
- **Background & Border**: Professional image styling
- **Multiple Components**: `OptimizedImage` and `AdvancedImage` for different use cases

### Supported Effects:
- **Brightness**: Adjust image brightness (-100 to 100)
- **Contrast**: Adjust image contrast (-100 to 100)
- **Saturation**: Adjust color saturation (-100 to 100)
- **Blur**: Add blur effect (1-2000)
- **Sharpen**: Enhance image sharpness
- **Opacity**: Adjust image transparency (0-100)
- **Zoom**: Scale image (0.1-3.0)
- **Rotate**: Rotate image (0-360 degrees)
- **Background**: Set background color
- **Border**: Add borders with custom styling

### Artistic Filters:
- **Vintage**: Classic film look
- **Black & White**: Monochrome conversion
- **Artistic**: AI-powered artistic styles (audrey, monet, etc.)

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary URL Generation SDK](https://cloudinary.com/documentation/javascript2_image_transformations)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Cloudinary Transformations](https://cloudinary.com/documentation/image_transformations)

## 🆘 Troubleshooting

### Common Issues:

1. **"Cloud Name not configured" error**
   - Check your `.env.local` file has the correct `CLOUDINARY_CLOUD_NAME`

2. **Upload fails**
   - Verify your API key and secret are correct
   - Check file size and format restrictions

3. **Images not displaying**
   - Ensure `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
   - Check that the public ID is correct

4. **CORS errors**
   - Make sure your domain is allowed in Cloudinary settings (if applicable)

For more help, check the [Cloudinary Support](https://support.cloudinary.com/) or the [Next.js Documentation](https://nextjs.org/docs).
