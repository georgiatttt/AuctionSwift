import { useState, useCallback } from 'react';
import { Upload, X, Star } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * Modern single dropzone for uploading 1-5 images
 * First image is automatically Primary, others are Aux
 * If Primary is removed, next image becomes Primary
 */
export function ImageUploadZone({ images = [], onChange, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  // Generate unique ID for this component instance
  const componentId = useState(() => crypto.randomUUID().substring(0, 8))[0];

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_IMAGES = 5;
  const MIN_IMAGES = 1;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  // Validate and process files
  const processFiles = useCallback((files) => {
    setError('');
    
    const fileArray = Array.from(files);
    const validFiles = [];
    
    for (const file of fileArray) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`);
        continue;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    
    if (validFiles.length > remainingSlots) {
      setError(`Can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}. Maximum is ${MAX_IMAGES} images.`);
      return;
    }

    // Add new images
    const newImages = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 // First image is primary
    }));

    onChange([...images, ...newImages]);
  }, [images, onChange]);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  // Handle drag events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Handle file input
  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [processFiles]);

  // Remove image
  const handleRemove = useCallback((imageId) => {
    const removedImage = images.find(img => img.id === imageId);
    const newImages = images.filter(img => img.id !== imageId);

    // If removed image was primary and there are other images, make the first one primary
    if (removedImage?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    onChange(newImages);

    // Show error if no images left
    if (newImages.length === 0) {
      setError('At least 1 image is required.');
    }
  }, [images, onChange]);

  // Make image primary
  const handleMakePrimary = useCallback((imageId) => {
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onChange(newImages);
  }, [images, onChange]);

  const canUploadMore = images.length < MAX_IMAGES;
  const primaryImage = images.find(img => img.isPrimary);
  const auxImages = images.filter(img => !img.isPrimary);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all",
          isDragging && !disabled
            ? "border-sky-400 bg-sky-50 dark:bg-sky-950"
            : "border-gray-300 dark:border-gray-700",
          !disabled && canUploadMore && "hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          id={`image-upload-${componentId}`}
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={disabled || !canUploadMore}
          className="hidden"
        />
        
        <label
          htmlFor={`image-upload-${componentId}`}
          className={cn(
            "flex flex-col items-center justify-center py-12 px-6",
            !disabled && canUploadMore && "cursor-pointer"
          )}
        >
          <Upload className={cn(
            "h-12 w-12 mb-4",
            isDragging ? "text-sky-400" : "text-gray-400"
          )} />
          
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {canUploadMore
              ? isDragging
                ? "Drop images here"
                : "Click to upload or drag and drop"
              : "Maximum images reached (5/5)"
            }
          </p>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {canUploadMore
              ? `JPG or PNG • Max 10MB per file • ${images.length}/${MAX_IMAGES} images • ${MAX_IMAGES - images.length} remaining`
              : "Remove an image to upload more"
            }
          </p>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Image thumbnails grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploaded Images ({images.length}/{MAX_IMAGES})
            </h4>
            <p className="text-xs text-gray-500">
              First image is used as primary
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Primary Image */}
            {primaryImage && (
              <div className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-sky-400 dark:border-sky-300 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={primaryImage.preview}
                    alt="Primary"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Primary badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-sky-400 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                  <Star className="h-3 w-3 fill-white" />
                  Primary
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(primaryImage.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Aux Images */}
            {auxImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={image.preview}
                    alt="Auxiliary"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Aux badge */}
                <div className="absolute top-2 left-2 bg-gray-600 dark:bg-gray-700 text-white text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                  Aux
                </div>

                {/* Action buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMakePrimary(image.id)}
                    disabled={disabled}
                    className="text-xs"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Make Primary
                  </Button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(image.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation message */}
      {images.length === 0 && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Upload at least {MIN_IMAGES} image to continue
        </p>
      )}
    </div>
  );
}
