import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const downloadImage = async (url: string, filename: string) => {
  const isInstagramOrFB = /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
  
  // Construct absolute URL for the raw image
  let absoluteUrl = url;
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const separator = url.startsWith("/") ? "" : "/";
      absoluteUrl = `${window.location.origin}${separator}${url}`;
    }
  } catch (e) {
    console.error("Failed to construct absolute URL:", e);
  }

  if (isInstagramOrFB) {
    // Show a user-friendly instruction toast
    toast.info("Instagram does not support direct downloads. The image has been opened. Long-press the image and choose Save Image.", {
      duration: 6000,
    });
    
    // Open the raw image URL directly
    setTimeout(() => {
      try {
        const opened = window.open(absoluteUrl, '_blank');
        if (!opened) {
          window.location.href = absoluteUrl;
        }
      } catch (e) {
        window.location.href = absoluteUrl;
      }
    }, 1000);
    return;
  }

  // Show a loading toast since high-res files can take a moment to fetch
  const toastId = toast.loading(`Preparing download for ${filename}...`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
    
    toast.dismiss(toastId);
    toast.success(`Downloaded ${filename} successfully!`);
  } catch (error) {
    console.error("Direct download failed:", error);
    toast.dismiss(toastId);
    
    // Fallback: direct navigation or new tab if fetch fails (e.g. CORS/network issues)
    try {
      const link = document.createElement('a');
      link.href = absoluteUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.location.href = absoluteUrl;
    }
  }
};

export const getFilenameFromUrl = (url: string, defaultName: string) => {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) {
      const ext = lastPart.split('.').pop();
      return `${defaultName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    }
  } catch (e) {}
  return `${defaultName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
};
