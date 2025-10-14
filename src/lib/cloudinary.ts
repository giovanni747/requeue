import { v2 as cloudinary } from 'cloudinary';
import { Cloudinary } from '@cloudinary/url-gen';
import { CloudinaryImage } from '@cloudinary/url-gen/assets/CloudinaryImage';
import { Resize } from '@cloudinary/url-gen/actions/resize';
import { Delivery } from '@cloudinary/url-gen/actions/delivery';
import { Effect } from '@cloudinary/url-gen/actions/effect';
import { Adjust } from '@cloudinary/url-gen/actions/adjust';
import { Reshape } from '@cloudinary/url-gen/actions/reshape';
import { Rotate } from '@cloudinary/url-gen/actions/rotate';
import { RoundCorners } from '@cloudinary/url-gen/actions/roundCorners';
import { Border } from '@cloudinary/url-gen/actions/border';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Cloudinary URL generation
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  },
});

export { cloudinary, cld };

// Utility function to upload images
export async function uploadImage(
  file: File | Buffer | string,
  options?: {
    folder?: string;
    public_id?: string;
    transformation?: any;
    tags?: string[];
  }
) {
  try {
    let uploadResult;
    
    if (file instanceof Buffer) {
      // Convert buffer to base64 string for Cloudinary
      const base64String = file.toString('base64');
      uploadResult = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64String}`,
        {
          folder: options?.folder || 'requeue',
          public_id: options?.public_id,
          transformation: options?.transformation,
          tags: options?.tags,
          resource_type: 'auto',
        }
      );
    } else if (typeof file === 'string') {
      // Direct URL upload
      uploadResult = await cloudinary.uploader.upload(file, {
        folder: options?.folder || 'requeue',
        public_id: options?.public_id,
        transformation: options?.transformation,
        tags: options?.tags,
        resource_type: 'auto',
      });
    } else {
      // File object - convert to buffer first
      const bytes = await (file as File).arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64String = buffer.toString('base64');
      uploadResult = await cloudinary.uploader.upload(
        `data:${(file as File).type};base64,${base64String}`,
        {
          folder: options?.folder || 'requeue',
          public_id: options?.public_id,
          transformation: options?.transformation,
          tags: options?.tags,
          resource_type: 'auto',
        }
      );
    }
    
    return uploadResult;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

// Utility function to delete images
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

// Advanced URL generation using @cloudinary/url-gen
export function getOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
    crop?: string;
    gravity?: string;
    radius?: number;
    effect?: string;
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
    overlay?: string;
    underlay?: string;
  }
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured');
  }

  // Create Cloudinary image instance
  const img = new CloudinaryImage(publicId, {
    cloudName,
  });

  // Apply transformations
  if (options) {
    // Resize transformations
    if (options.width || options.height) {
      if (options.crop === 'fill') {
        img.resize(Resize.fill(options.width, options.height));
      } else if (options.crop === 'fit') {
        img.resize(Resize.fit(options.width, options.height));
      } else if (options.crop === 'scale') {
        img.resize(Resize.scale(options.width, options.height));
      } else if (options.crop === 'crop') {
        img.resize(Resize.crop(options.width, options.height));
      } else if (options.crop === 'thumbnail') {
        img.resize(Resize.thumbnail(options.width, options.height));
      } else if (options.crop === 'pad') {
        img.resize(Resize.pad(options.width, options.height));
      } else {
        // Default to fill
        img.resize(Resize.fill(options.width, options.height));
      }
    }

    // Zoom effect
    if (options.zoom) {
      img.resize(Resize.scale(options.zoom * 100));
    }

    // Rotate
    if (options.rotate) {
      img.rotate(Rotate.byAngle(options.rotate));
    }

    // Quality and format
    if (options.quality) {
      if (options.quality === 'auto') {
        img.delivery(Delivery.quality('auto'));
      } else {
        img.delivery(Delivery.quality(options.quality));
      }
    }

    if (options.format) {
      if (options.format === 'auto') {
        img.delivery(Delivery.format('auto'));
      } else {
        img.delivery(Delivery.format(options.format));
      }
    }

    // Effects
    if (options.blur) {
      img.effect(Effect.blur(options.blur));
    }

    if (options.sharpen) {
      img.effect(Effect.enhance());
    }

    // Adjustments
    if (options.brightness) {
      img.adjust(Adjust.brightness(options.brightness));
    }

    if (options.contrast) {
      img.adjust(Adjust.contrast(options.contrast));
    }

    if (options.saturation) {
      img.adjust(Adjust.saturation(options.saturation));
    }

    if (options.opacity) {
      img.adjust(Adjust.opacity(options.opacity));
    }

    // Border radius
    if (options.radius) {
      img.roundCorners(RoundCorners.byRadius(options.radius));
    }

    // Background color
    if (options.background) {
      img.backgroundColor(options.background);
    }

    // Border
    if (options.border) {
      img.border(Border.solid(2, options.border));
    }
  }

  return img.toURL();
}

// Legacy function for backward compatibility
export function getSimpleOptimizedImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
    crop?: string;
    gravity?: string;
    radius?: number;
    effect?: string;
  }
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is not configured');
  }

  let url = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  
  if (options) {
    const transformations = [];
    
    if (options.width || options.height) {
      transformations.push(`w_${options.width || 'auto'},h_${options.height || 'auto'}`);
    }
    
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }
    
    if (options.gravity) {
      transformations.push(`g_${options.gravity}`);
    }
    
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }
    
    if (options.radius) {
      transformations.push(`r_${options.radius}`);
    }
    
    if (options.effect) {
      transformations.push(`e_${options.effect}`);
    }
    
    if (transformations.length > 0) {
      url += transformations.join(',') + '/';
    }
  }
  
  url += publicId;
  
  return url;
}

// Pre-configured image transformations
export const imageTransformations = {
  avatar: {
    width: 100,
    height: 100,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  },
  thumbnail: {
    width: 300,
    height: 200,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  },
  roomCard: {
    width: 250,
    height: 200,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    radius: 20,
  },
  taskImage: {
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
  },
  // Advanced transformations
  heroImage: {
    width: 1200,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    blur: 1,
    sharpen: 1,
    brightness: 10,
    contrast: 10,
  },
  profileBanner: {
    width: 800,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    saturation: 20,
    radius: 10,
  },
  productImage: {
    width: 500,
    height: 500,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    background: 'white',
    border: '2px_solid_lightgray',
  },
  artistic: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    effect: 'art:audrey',
    brightness: 5,
    contrast: 15,
  },
  vintage: {
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    effect: 'vintage',
    brightness: -10,
    saturation: -20,
    contrast: 10,
  },
  blackAndWhite: {
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    effect: 'blackwhite',
    brightness: 5,
    contrast: 20,
  },
};
