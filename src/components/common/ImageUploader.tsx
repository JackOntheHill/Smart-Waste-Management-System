import React, { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  minImages?: number;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  minImages = 3,
  maxImages = 6,
  label = 'Garbage Photographs (Minimum 3 Required)',
  helperText = 'Capture or upload at least 3 distinct photographs from different angles (close-up, wide-view, access point).',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg('');
    const newFiles: File[] = Array.from(files);

    if (images.length + newFiles.length > maxImages) {
      setErrorMsg(`Maximum of ${maxImages} images allowed. Please select fewer images.`);
      return;
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    for (const file of newFiles) {
      if (!validMimes.includes(file.type)) {
        setErrorMsg(`"${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds the 10MB limit. Please select a smaller file.`);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      // Build FormData for multipart upload
      const formData = new FormData();
      newFiles.forEach((file) => formData.append('images', file));

      setUploadProgress(50);
      const res = await authFetch('/api/upload/multiple', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.urls)) {
        setUploadProgress(100);
        const combined = [...images, ...data.urls];
        onChange(combined);
      } else {
        // Fallback: Read as data URLs if multipart upload route failed
        const readerPromises = newFiles.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        );
        const dataUrls = await Promise.all(readerPromises);
        onChange([...images, ...dataUrls]);
      }
    } catch (err: any) {
      setErrorMsg('Failed to process uploaded images. Please retry.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddSamplePhotos = () => {
    // Convenience helper for desktop environments without a physical camera
    const sample1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f1f5f9"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23e2e8f0"/><polygon points="200,280 300,120 400,280" fill="%23285943"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Photo Angle 1 - Front Elevation</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Sample Image ${Date.now()}</text></svg>`;
    const sample2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23cbd5e1"/><circle cx="300" cy="200" r="70" fill="%23a8b9a1"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23334155">Photo Angle 2 - Sidewalk Context</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%23475569">Sample Image ${Date.now() + 1}</text></svg>`;
    const sample3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f0fdf4"/><rect x="40" y="80" width="520" height="260" rx="12" fill="%23dcfce7"/><polygon points="120,290 280,180 460,290" fill="%2316a34a"/><text x="50" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23166534">Photo Angle 3 - Drainage Proximity</text><text x="50" y="370" font-family="monospace" font-size="14" fill="%2315803d">Sample Image ${Date.now() + 2}</text></svg>`;
    onChange([sample1, sample2, sample3]);
  };

  const meetsRequirement = images.length >= minImages;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider">
            {label}
          </label>
          <p className="text-xs text-[#69716B] mt-0.5">{helperText}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono tabular-nums ${
              meetsRequirement ? 'text-[#2E7D32] font-semibold' : 'text-[#C53030] font-semibold'
            }`}
          >
            {images.length} / {minImages} minimum
          </span>
          {meetsRequirement && (
            <span className="text-xs text-[#2E7D32] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Met
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-[#C53030]/10 border border-[#C53030]/20 rounded text-xs text-[#C53030] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Preview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((imgUrl, index) => (
          <div
            key={index}
            className="group relative aspect-4/3 bg-neutral-100 rounded-md border border-[#E1E5DF] overflow-hidden"
          >
            <img
              src={imgUrl}
              alt={`Garbage evidence #${index + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="p-1.5 bg-[#C53030] text-white rounded-md hover:bg-[#a52828] transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded font-mono">
              Photo {index + 1}
            </div>
          </div>
        ))}

        {/* Upload Trigger Tile */}
        {images.length < maxImages && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-4/3 border-2 border-dashed rounded-md flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors ${
              uploading
                ? 'border-[#285943] bg-[#285943]/5'
                : 'border-[#E1E5DF] hover:border-[#285943] hover:bg-neutral-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFilesSelected}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-1">
                <RefreshCw className="w-5 h-5 text-[#285943] animate-spin mx-auto" />
                <span className="text-[11px] text-[#285943] font-medium block">
                  Processing ({uploadProgress}%)
                </span>
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[#285943]/10 text-[#285943] flex items-center justify-center mb-1.5">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#252B27]">Add Photo</span>
                <span className="text-[10px] text-[#69716B]">Camera / Browse</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Helper Bar: Sample Photos Generator for Quick Testing */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[#69716B]">
          Supports JPEG, PNG, WebP (up to 10MB per image).
        </span>
        {images.length === 0 && (
          <button
            type="button"
            onClick={handleAddSamplePhotos}
            className="text-[11px] text-[#285943] hover:underline font-medium cursor-pointer"
          >
            Load 3 Demonstration Photos
          </button>
        )}
      </div>
    </div>
  );
};
