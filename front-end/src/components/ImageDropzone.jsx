import { useCallback, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

export function ImageDropzone({ onImageUpload, existingImage, onRemove, itemId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState(existingImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  }, []);

  const processFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError(null);
    
    // Show preview immediately using local file URL
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);
    
    // Store the file for later upload
    setUploadedFile(file);
    
    // Pass the file object to parent component
    if (onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleRemove = () => {
    // Revoke the object URL to free memory
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setImagePreview(null);
    setUploadedFile(null);
    setUploadError(null);
    
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="w-full space-y-2">
      {uploadError && (
        <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded">
          {uploadError}
        </div>
      )}
      
      {/* Always show dropzone */}
      <div
        className={cn(
          "w-full h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-accent/50",
          isDragging ? "border-primary bg-accent/50" : "border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${itemId}`)?.click()}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <div className="text-center px-2">
          <p className="text-xs font-medium">Drop image or click to upload</p>
          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
        </div>
        <input
          id={`file-input-${itemId}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
      
      {/* Show preview thumbnail below dropzone when image is uploaded */}
      {imagePreview && (
        <div className="relative w-full h-24 rounded-lg overflow-hidden border-2 border-border bg-gray-50">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="absolute bottom-1 left-1 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
            Preview
          </div>
        </div>
      )}
    </div>
  );
}
