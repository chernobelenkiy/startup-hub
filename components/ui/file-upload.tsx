"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Allowed MIME types for file upload
 * Must match the server-side validation in /api/upload
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * Human-readable file type names
 */
const ALLOWED_TYPE_NAMES = "PNG, JPG, GIF, WebP";

interface FileUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[FileUpload] handleFileSelect triggered", e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log("[FileUpload] File selected:", file.name, file.type, file.size);
      await uploadFile(file);
    }
    // Reset input value to allow re-selecting the same file
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    console.log("[FileUpload] uploadFile called", { name: file.name, type: file.type, size: file.size });
    setError(null);

    // Validate file type against allowed MIME types
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      console.log("[FileUpload] Invalid file type:", file.type);
      setError(`Invalid file type. Allowed types: ${ALLOWED_TYPE_NAMES}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      console.log("[FileUpload] File too large:", file.size);
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    console.log("[FileUpload] Validation passed, starting upload...");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("[FileUpload] Sending request to /api/upload");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("[FileUpload] Response status:", response.status);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();
      console.log("[FileUpload] Upload success:", url);
      onChange(url);
    } catch (err) {
      console.error("[FileUpload] Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  if (value) {
    return (
      <div className={cn("relative rounded-md overflow-hidden", className)}>
        <img
          src={value}
          alt="Uploaded preview"
          className="w-full h-48 object-cover rounded-md border border-border"
        />
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="size-4" />
            <span className="sr-only">Remove image</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-8 rounded-md border-2 border-dashed transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        console.log("[FileUpload] Click handler triggered, disabled:", disabled);
        if (!disabled) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="sr-only"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <>
          <Loader2 className="size-10 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </>
      ) : (
        <>
          <div className="size-12 rounded-full bg-surface-elevated flex items-center justify-center mb-3">
            {isDragging ? (
              <Upload className="size-6 text-primary" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm font-medium mb-1">
            {isDragging ? "Drop to upload" : "Click or drag to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            {ALLOWED_TYPE_NAMES} up to {maxSize}MB
          </p>
        </>
      )}

      {error && (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
