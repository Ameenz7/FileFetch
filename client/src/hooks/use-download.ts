import { useState, useCallback } from 'react';
import { DownloadState, FileInfo, DownloadHistory, DownloadOption } from '@/types/download';
import { validateUrl } from '@/lib/file-utils';
import { useToast } from '@/hooks/use-toast';

export function useDownload() {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: 'idle',
    progress: 0
  });
  
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('download-history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const { toast } = useToast();

  const validateFileUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setDownloadState({ status: 'idle', progress: 0 });
      return;
    }

    setDownloadState({ status: 'validating', progress: 0 });

    try {
      const fileInfo = await validateUrl(url);
      
      if (fileInfo) {
        setDownloadState({
          status: 'ready',
          progress: 0,
          fileInfo
        });
      } else {
        setDownloadState({
          status: 'error',
          progress: 0,
          error: 'Invalid URL or unsupported file type'
        });
      }
    } catch (error) {
      setDownloadState({
        status: 'error',
        progress: 0,
        error: 'Failed to validate URL'
      });
    }
  }, []);

  const downloadFile = useCallback(async (option: DownloadOption = 'direct') => {
    if (!downloadState.fileInfo) return;

    setDownloadState(prev => ({ ...prev, status: 'downloading', progress: 0 }));

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: downloadState.fileInfo.url,
          option
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get the filename from the response headers or use the original
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : downloadState.fileInfo.name;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Add to history
      const historyItem: DownloadHistory = {
        id: Date.now().toString(),
        fileName: filename,
        fileSize: downloadState.fileInfo.size,
        fileType: downloadState.fileInfo.type,
        downloadedAt: new Date(),
        url: downloadState.fileInfo.url,
        icon: downloadState.fileInfo.icon
      };

      const newHistory = [historyItem, ...downloadHistory.slice(0, 9)]; // Keep last 10
      setDownloadHistory(newHistory);
      localStorage.setItem('download-history', JSON.stringify(newHistory));

      setDownloadState(prev => ({ ...prev, status: 'success', progress: 100 }));
      
      toast({
        title: "Download Complete!",
        description: "File saved to your Downloads folder",
      });

      // Reset to ready after 2 seconds
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, status: 'ready', progress: 0 }));
      }, 2000);

    } catch (error) {
      setDownloadState(prev => ({
        ...prev,
        status: 'error',
        progress: 0,
        error: 'Download failed. Please try again.'
      }));
      
      toast({
        title: "Download Failed",
        description: "Please check the URL and try again",
        variant: "destructive"
      });
    }
  }, [downloadState.fileInfo, downloadHistory, toast]);

  const clearHistory = useCallback(() => {
    setDownloadHistory([]);
    localStorage.removeItem('download-history');
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    const newHistory = downloadHistory.filter(item => item.id !== id);
    setDownloadHistory(newHistory);
    localStorage.setItem('download-history', JSON.stringify(newHistory));
  }, [downloadHistory]);

  const reset = useCallback(() => {
    setDownloadState({ status: 'idle', progress: 0 });
  }, []);

  return {
    downloadState,
    downloadHistory,
    validateFileUrl,
    downloadFile,
    clearHistory,
    removeFromHistory,
    reset
  };
}
