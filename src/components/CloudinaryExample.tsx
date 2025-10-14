'use client';

import { useState } from 'react';
import ImageUpload, { OptimizedImage, AdvancedImage } from './ImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Example component showing how to use Cloudinary
export default function CloudinaryExample() {
  const [uploadedImages, setUploadedImages] = useState<Array<{
    url: string;
    publicId: string;
  }>>([]);

  const handleImageUpload = (url: string, publicId: string) => {
    setUploadedImages(prev => [...prev, { url, publicId }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Cloudinary Integration Example</h1>
        <p className="text-muted-foreground">
          Upload images and see them optimized with Cloudinary transformations
        </p>
      </div>

      {/* Image Upload Component */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            onUploadComplete={handleImageUpload}
            folder="requeue/examples"
            tags={['example', 'demo']}
            maxFileSize={5}
          />
        </CardContent>
      </Card>

      {/* Uploaded Images Display */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploadedImages.map((image, index) => (
                <div key={index} className="space-y-4">
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-2">
                      Original
                    </Badge>
                    <img
                      src={image.url}
                      alt={`Uploaded image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Avatar Transform
                    </Badge>
                    <OptimizedImage
                      publicId={image.publicId}
                      alt={`Avatar ${index + 1}`}
                      transformation="avatar"
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Thumbnail Transform
                    </Badge>
                    <OptimizedImage
                      publicId={image.publicId}
                      alt={`Thumbnail ${index + 1}`}
                      transformation="thumbnail"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Room Card Transform
                    </Badge>
                    <OptimizedImage
                      publicId={image.publicId}
                      alt={`Room card ${index + 1}`}
                      transformation="roomCard"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Artistic Effect
                    </Badge>
                    <AdvancedImage
                      publicId={image.publicId}
                      alt={`Artistic ${index + 1}`}
                      width={200}
                      height={150}
                      artistic="audrey"
                      brightness={5}
                      contrast={15}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Vintage Effect
                    </Badge>
                    <AdvancedImage
                      publicId={image.publicId}
                      alt={`Vintage ${index + 1}`}
                      width={200}
                      height={150}
                      vintage={true}
                      brightness={-10}
                      saturation={-20}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Black & White
                    </Badge>
                    <AdvancedImage
                      publicId={image.publicId}
                      alt={`B&W ${index + 1}`}
                      width={200}
                      height={150}
                      blackAndWhite={true}
                      brightness={5}
                      contrast={20}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>

                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Enhanced with Effects
                    </Badge>
                    <AdvancedImage
                      publicId={image.publicId}
                      alt={`Enhanced ${index + 1}`}
                      width={200}
                      height={150}
                      brightness={10}
                      contrast={10}
                      saturation={20}
                      sharpen={1}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Basic Image Upload</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<ImageUpload
  onUploadComplete={(url, publicId) => {
    console.log('Uploaded:', url, publicId);
  }}
  folder="my-app"
  tags={['user-upload']}
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Optimized Image Display</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<OptimizedImage
  publicId="my-image-public-id"
  alt="Description"
  transformation="avatar"
  className="w-16 h-16 rounded-full"
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Advanced Image Transformations</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<AdvancedImage
  publicId="my-image-public-id"
  alt="Description"
  width={400}
  height={300}
  brightness={10}
  contrast={15}
  saturation={20}
  sharpen={1}
  artistic="audrey"
  className="w-full h-64 object-cover rounded-lg"
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Artistic Effects</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<AdvancedImage
  publicId="my-image-public-id"
  alt="Vintage Style"
  width={400}
  height={300}
  vintage={true}
  brightness={-10}
  saturation={-20}
  contrast={10}
  className="w-full h-64 object-cover rounded-lg"
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">5. Black & White with Enhancement</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<AdvancedImage
  publicId="my-image-public-id"
  alt="B&W Enhanced"
  width={400}
  height={300}
  blackAndWhite={true}
  brightness={5}
  contrast={20}
  sharpen={2}
  className="w-full h-64 object-cover rounded-lg"
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">6. Custom Transformations (Legacy)</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<OptimizedImage
  publicId="my-image-public-id"
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
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
