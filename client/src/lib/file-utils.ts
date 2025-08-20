import { FileInfo } from '@/types/download';

export function getFileTypeFromUrl(url: string): { type: string; icon: string; extension: string } {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname.toLowerCase();
  const extension = pathname.split('.').pop() || '';

  const fileTypes: Record<string, { type: string; icon: string }> = {
    // Video
    mp4: { type: 'Video', icon: 'video' },
    avi: { type: 'Video', icon: 'video' },
    mov: { type: 'Video', icon: 'video' },
    wmv: { type: 'Video', icon: 'video' },
    flv: { type: 'Video', icon: 'video' },
    webm: { type: 'Video', icon: 'video' },
    mkv: { type: 'Video', icon: 'video' },
    
    // Audio
    mp3: { type: 'Audio', icon: 'file-audio' },
    wav: { type: 'Audio', icon: 'file-audio' },
    flac: { type: 'Audio', icon: 'file-audio' },
    aac: { type: 'Audio', icon: 'file-audio' },
    ogg: { type: 'Audio', icon: 'file-audio' },
    m4a: { type: 'Audio', icon: 'file-audio' },
    
    // Documents
    pdf: { type: 'Document', icon: 'file-text' },
    doc: { type: 'Document', icon: 'file-text' },
    docx: { type: 'Document', icon: 'file-text' },
    txt: { type: 'Document', icon: 'file-text' },
    rtf: { type: 'Document', icon: 'file-text' },
    
    // Images
    jpg: { type: 'Image', icon: 'file-image' },
    jpeg: { type: 'Image', icon: 'file-image' },
    png: { type: 'Image', icon: 'file-image' },
    gif: { type: 'Image', icon: 'file-image' },
    bmp: { type: 'Image', icon: 'file-image' },
    svg: { type: 'Image', icon: 'file-image' },
    webp: { type: 'Image', icon: 'file-image' },
    
    // Archives
    zip: { type: 'Archive', icon: 'file-archive' },
    rar: { type: 'Archive', icon: 'file-archive' },
    '7z': { type: 'Archive', icon: 'file-archive' },
    tar: { type: 'Archive', icon: 'file-archive' },
    gz: { type: 'Archive', icon: 'file-archive' },
  };

  const fileType = fileTypes[extension] || { type: 'File', icon: 'file' };
  
  return {
    ...fileType,
    extension: extension.toUpperCase()
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || 'unknown-file';
    return decodeURIComponent(fileName);
  } catch {
    return 'unknown-file';
  }
}

export async function validateUrl(url: string): Promise<FileInfo | null> {
  try {
    // Basic URL validation
    new URL(url);
    
    const fileName = getFileNameFromUrl(url);
    const { type, icon, extension } = getFileTypeFromUrl(url);
    
    // Try to get file size from HEAD request
    let size = 0;
    try {
      const response = await fetch(`/api/file-info?url=${encodeURIComponent(url)}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        size = data.size || 0;
      }
    } catch {
      // Fallback if we can't get size
      size = 0;
    }
    
    return {
      name: fileName,
      type,
      size,
      url,
      extension,
      icon
    };
  } catch {
    return null;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
