import { useState } from 'react';
import { Download, Link, Clipboard, FileVideo, FileAudio, FileText, FileImage, Archive, File, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from './theme-toggle';
import { useToast } from '@/hooks/use-toast';

interface FileInfo {
  name: string;
  type: string;
  size: number;
  url: string;
  extension: string;
}

export function SimpleDownloader() {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getFileInfo = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const extension = pathname.split('.').pop() || '';
      const fileName = pathname.split('/').pop() || 'unknown-file';

      const fileTypes: Record<string, string> = {
        mp4: 'Video', avi: 'Video', mov: 'Video', wmv: 'Video', flv: 'Video', webm: 'Video', mkv: 'Video',
        mp3: 'Audio', wav: 'Audio', flac: 'Audio', aac: 'Audio', ogg: 'Audio', m4a: 'Audio',
        pdf: 'Document', doc: 'Document', docx: 'Document', txt: 'Document', rtf: 'Document',
        jpg: 'Image', jpeg: 'Image', png: 'Image', gif: 'Image', bmp: 'Image', svg: 'Image', webp: 'Image',
        zip: 'Archive', rar: 'Archive', '7z': 'Archive', tar: 'Archive', gz: 'Archive'
      };

      const type = fileTypes[extension] || 'File';

      return {
        name: decodeURIComponent(fileName),
        type,
        size: 0,
        url,
        extension: extension.toUpperCase()
      };
    } catch {
      return null;
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return FileVideo;
      case 'audio': return FileAudio;
      case 'document': return FileText;
      case 'image': return FileImage;
      case 'archive': return Archive;
      default: return File;
    }
  };

  const getIconColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'audio': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      case 'document': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'image': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400';
      case 'archive': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setFileInfo(null);
      setError(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const fileData = getFileInfo(inputUrl);
      if (!fileData) {
        setError('Invalid URL format');
        setFileInfo(null);
        setIsValidating(false);
        return;
      }

      // Try to get file size
      try {
        const response = await fetch(`/api/file-info?url=${encodeURIComponent(inputUrl)}`);
        if (response.ok) {
          const data = await response.json();
          fileData.size = data.size || 0;
        }
      } catch {
        // File size optional
      }

      setFileInfo(fileData);
    } catch {
      setError('Invalid URL');
      setFileInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Debounce validation
    clearTimeout((window as any).urlValidationTimeout);
    (window as any).urlValidationTimeout = setTimeout(() => {
      validateUrl(newUrl);
    }, 500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      validateUrl(text);
    } catch {
      toast({
        title: "Paste failed",
        description: "Could not read from clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async () => {
    if (!fileInfo) return;

    setIsDownloading(true);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileInfo.url, option: 'direct' })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileInfo.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast({
        title: "Download Complete!",
        description: `${fileInfo.name} saved to your Downloads folder`
      });

    } catch {
      toast({
        title: "Download Failed",
        description: "Please check the URL and try again",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return 'Size unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                FILE DOWNLOADER
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl mb-6">
            <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Download files directly from URLs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Paste any file URL below to download it instantly
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="url"
                      value={url}
                      onChange={handleUrlChange}
                      placeholder="https://example.com/file.mp4"
                      className="w-full pl-12 pr-16 py-4 text-lg rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isValidating || isDownloading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Link className="h-5 w-5 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handlePaste}
                      className="absolute inset-y-0 right-0 mr-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      disabled={isValidating || isDownloading}
                    >
                      <Clipboard className="h-5 w-5" />
                    </Button>
                  </div>
                  {isValidating && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">Validating URL...</p>
                  )}
                </div>

                {/* File Preview */}
                <AnimatePresence>
                  {fileInfo && !error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor(fileInfo.type)}`}>
                          {(() => {
                            const IconComponent = getIcon(fileInfo.type);
                            return <IconComponent className="w-6 h-6" />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                            {fileInfo.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {fileInfo.type} File • {formatFileSize(fileInfo.size)}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm font-medium text-red-900 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Download Button */}
                <AnimatePresence>
                  {fileInfo && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Button
                        onClick={downloadFile}
                        disabled={!fileInfo || isDownloading}
                        className="w-full py-4 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        {isDownloading ? 'Downloading...' : 'Download File'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}