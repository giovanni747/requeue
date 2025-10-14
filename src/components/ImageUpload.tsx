'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getOptimizedImageUrl, getSimpleOptimizedImageUrl, imageTransformations } from '@/lib/cloudinary';

interface ImageUploadProps {
  onUploadComplete: (url: string, publicId: string) => void;
  onUploadStart?: () => void;
  folder?: string;
  tags?: string[];
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  preview?: boolean;
  className?: string;
}

export default function ImageUpload({
  onUploadComplete,
  onUploadStart,
  folder = 'requeue',
  tags = [],
  maxFileSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  preview = true,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`File type must be one of: ${acceptedFormats.join(', ')}`);
      return;
    }

    setError(null);
    
    // Create preview URL
    if (preview) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Start upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (tags.length > 0) {
        formData.append('tags', tags.join(','));
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete(result.secureUrl, result.publicId);
        setError(null);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-upload" className="text-sm font-medium">
              Upload Image
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: {maxFileSize}MB • Formats: {acceptedFormats.join(', ')}
            </p>
          </div>

          {/* Preview */}
          {preview && previewUrl && (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemovePreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </>
            )}
          </Button>

          {/* Hidden File Input */}
          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Optimized Image Component
interface OptimizedImageProps {
  publicId: string;
  alt: string;
  transformation?: keyof typeof imageTransformations;
  customTransformation?: any;
  className?: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({
  publicId,
  alt,
  transformation,
  customTransformation,
  className = '',
  width,
  height,
}: OptimizedImageProps) {
  const imageUrl = getOptimizedImageUrl(
    publicId,
    transformation ? imageTransformations[transformation] : customTransformation
  );

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
    />
  );
}

// Advanced Image component with more transformation options
interface AdvancedImageProps {
  publicId: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  // Advanced transformation options
  zoom?: number;
  rotate?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  sharpen?: number;
  opacity?: number;
  background?: string;
  border?: string;
  artistic?: string;
  vintage?: boolean;
  blackAndWhite?: boolean;
}

export function AdvancedImage({
  publicId,
  alt,
  className = '',
  width,
  height,
  zoom,
  rotate,
  brightness,
  contrast,
  saturation,
  blur,
  sharpen,
  opacity,
  background,
  border,
  artistic,
  vintage,
  blackAndWhite,
}: AdvancedImageProps) {
  const transformationOptions: any = {
    width,
    height,
    quality: 'auto',
    format: 'auto',
  };

  // Add advanced transformations
  if (zoom) transformationOptions.zoom = zoom;
  if (rotate) transformationOptions.rotate = rotate;
  if (brightness) transformationOptions.brightness = brightness;
  if (contrast) transformationOptions.contrast = contrast;
  if (saturation) transformationOptions.saturation = saturation;
  if (blur) transformationOptions.blur = blur;
  if (sharpen) transformationOptions.sharpen = sharpen;
  if (opacity) transformationOptions.opacity = opacity;
  if (background) transformationOptions.background = background;
  if (border) transformationOptions.border = border;

  // Add effects
  if (artistic) transformationOptions.effect = `art:${artistic}`;
  if (vintage) transformationOptions.effect = 'vintage';
  if (blackAndWhite) transformationOptions.effect = 'blackwhite';

  const imageUrl = getOptimizedImageUrl(publicId, transformationOptions);

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
    />
  );
}
