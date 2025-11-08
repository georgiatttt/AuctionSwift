import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

export function ImageDropzone({ onImageUpload, existingImage, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState(existingImage || null);

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

  const processFile = (file) => {
    // Generate a mock placeholder URL (in real app, would upload to server)
    const mockUrl = `https://placehold.co/400x300/gray/white?text=${encodeURIComponent(file.name.substring(0, 20))}`;
    setImagePreview(mockUrl);
    if (onImageUpload) {
      onImageUpload(mockUrl);
    }
  };

  const handleRemove = () => {
    setImagePreview(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="w-full">
      {imagePreview ? (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-border">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "w-full h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-accent/50",
            isDragging ? "border-primary bg-accent/50" : "border-border"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-center px-2">
            <p className="text-xs font-medium">Drop image or click to upload</p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}
    </div>
  );
}
