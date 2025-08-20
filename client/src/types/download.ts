export interface FileInfo {
  name: string;
  type: string;
  size: number;
  url: string;
  extension: string;
  icon: string;
}

export interface DownloadState {
  status: 'idle' | 'validating' | 'ready' | 'downloading' | 'success' | 'error';
  progress: number;
  error?: string;
  fileInfo?: FileInfo;
}

export interface DownloadHistory {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadedAt: Date;
  url: string;
  icon: string;
}

export type DownloadOption = 'direct' | 'optimized';
