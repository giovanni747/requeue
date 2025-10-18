'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/ui/image-uploader';
import toast from 'react-hot-toast';

interface RoomImageUploadProps {
  onUploadComplete: (url: string, publicId: string) => void;
  currentImage?: string;
  currentImagePublicId?: string;
  disabled?: boolean;
}

export default function RoomImageUpload({
  onUploadComplete,
  currentImage,
  currentImagePublicId,
  disabled = false,
}: RoomImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | string | null>(currentImage || null);

  const handleImageChange = async (file: File | string | null) => {
    setImageFile(file);
    
    if (!file) {
      // Image removed
      onUploadComplete('', '');
      return;
    }

    if (typeof file === 'string') {
      // Already uploaded URL
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      setImageFile(currentImage || null);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      setImageFile(currentImage || null);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'rooms');
      formData.append('tags', 'room-image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageFile(result.secureUrl);
        onUploadComplete(result.secureUrl, result.publicId);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(result.error || 'Upload failed');
        setImageFile(currentImage || null);
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error('Upload error:', error);
      setImageFile(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <ImageUploadField
        value={imageFile}
        onChange={handleImageChange}
        disabled={disabled}
        isLoading={uploading}
        className="w-48 h-48 mx-auto"
        aspectRatio={1}
        maxSize={5 * 1024 * 1024}
        defaultImage={currentImage}
      />

      <p className="text-xs text-muted-foreground text-center">
        Max size: 5MB • Formats: JPG, PNG, WebP
      </p>
    </div>
  );
}
