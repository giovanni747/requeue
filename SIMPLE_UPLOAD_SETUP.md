# Simple Image Upload Setup for Room Images

## 🎯 What's Been Added

I've implemented a simple image upload system specifically for room images with the following features:

### ✅ **Room Creation with Image Upload**
- Room owners can now upload an image when creating a room
- Images are stored in Cloudinary with proper folder organization
- Fallback to default images if no upload is provided

### ✅ **Room Image Editing (Owner Only)**
- Room owners can edit/change their room's image through Settings
- Real-time preview and update functionality
- Proper permission checks (owner-only feature)

## 📁 **Files Created/Modified**

### **New Files:**
- `src/components/RoomImageUpload.tsx` - Simple upload component for room images
- `src/app/api/upload/route.ts` - API endpoint for image uploads

### **Modified Files:**
- `src/app/page.tsx` - Added image upload to room creation dialog
- `src/app/room/[id]/page.tsx` - Added image editing to room settings
- `src/lib/actions.ts` - Added `createRoom`, `getUserRooms`, and `updateRoomImage` functions
- `next.config.ts` - Added Cloudinary domain support

## 🚀 **How to Use**

### **1. Create Room with Image**
1. Click "Create New Room" button
2. Enter room name
3. Click "Upload Image" to add a room cover image (optional)
4. Select an image file (max 5MB, JPG/PNG/WebP)
5. Click "Create" to create the room

### **2. Edit Room Image (Owner Only)**
1. Open room settings (gear icon)
2. Scroll to "Room Image" section
3. Click "Upload Image" or "Change Image"
4. Select new image file
5. Click "Update Room Image" to save changes

## 🔧 **Environment Setup Required**

You need to add these environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Public Cloudinary (for frontend)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## 📊 **Database Schema Updates Needed**

Add these columns to your `rooms` table:

```sql
ALTER TABLE rooms ADD COLUMN image_url TEXT;
ALTER TABLE rooms ADD COLUMN image_public_id TEXT;
```

## 🎨 **Features**

### **Upload Component Features:**
- ✅ File validation (type and size)
- ✅ Image preview
- ✅ Error handling
- ✅ Loading states
- ✅ Remove/cancel functionality
- ✅ Responsive design

### **Security Features:**
- ✅ Owner-only image editing
- ✅ Proper authentication checks
- ✅ File type validation
- ✅ Size limits (5MB max)

### **User Experience:**
- ✅ Real-time previews
- ✅ Toast notifications
- ✅ Loading indicators
- ✅ Error messages
- ✅ Cancel options

## 🔄 **API Endpoints**

### **POST /api/upload**
- Uploads images to Cloudinary
- Returns secure URL and public ID
- Handles file validation and errors

## 📝 **Usage Examples**

### **Basic Room Creation:**
```tsx
<RoomImageUpload
  onUploadComplete={(url, publicId) => {
    // Handle upload completion
    setRoomImage(url);
    setRoomImagePublicId(publicId);
  }}
/>
```

### **Room Image Editing:**
```tsx
<RoomImageUpload
  onUploadComplete={handleRoomImageUpload}
  currentImage={roomData?.image_url}
  currentImagePublicId={roomData?.image_public_id}
/>
```

## 🎯 **Next Steps**

1. **Set up Cloudinary account** and add environment variables
2. **Update database schema** to add image columns
3. **Test the upload functionality** in room creation and editing
4. **Customize styling** if needed for your design

The system is now ready to use! Room owners can upload and manage room images through a simple, user-friendly interface. 🚀
