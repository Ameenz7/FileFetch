import { useState } from 'react';
import { Download, Link, Clipboard, FileVideo, FileAudio, FileText, FileImage, Archive, File, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from './theme-toggle';
import { useToast } from '@/hooks/use-toast';

interface FileInfo {
  name: string;
  type: string;
  size: number;
  url: string;
  extension: string;
  isVideo?: boolean;
  isAudio?: boolean;
}

export function SimpleDownloader() {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('original');
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
        extension: extension.toUpperCase(),
        isVideo: type === 'Video',
        isAudio: type === 'Audio'
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

      // Get file info from server
      try {
        const response = await fetch(`/api/file-info?url=${encodeURIComponent(inputUrl)}`);
        if (response.ok) {
          const data = await response.json();
          fileData.size = data.size || 0;
          fileData.type = data.fileType || fileData.type;
          fileData.isVideo = data.isVideo || false;
          fileData.isAudio = data.isAudio || false;
        }
      } catch (error: any) {
        // Server validation may fail for some URLs, continue with client-side detection
        console.log('Server validation failed:', error.message);
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
        body: JSON.stringify({ url: fileInfo.url, format: selectedFormat })
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
            Paste a direct file URL below to download it instantly
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Use direct links ending with file extensions like .mp4, .mp3, .pdf, .jpg, etc.
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
                      placeholder="Paste any file URL or YouTube link here..."
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
                  {url && !isValidating && !fileInfo && !error && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        💡 <strong>Tip:</strong> Make sure you're using a direct file link. Right-click on the file and select "Copy link address" or look for direct download links.
                      </p>
                    </div>
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
                        {(fileInfo as any).thumbnail ? (
                          <div className="w-16 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            <img 
                              src={(fileInfo as any).thumbnail} 
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling!.classList.remove('hidden');
                              }}
                            />
                            <div className={`hidden w-full h-full rounded-xl flex items-center justify-center ${getIconColor(fileInfo.type)}`}>
                              {(() => {
                                const IconComponent = getIcon(fileInfo.type);
                                return <IconComponent className="w-6 h-6" />;
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor(fileInfo.type)}`}>
                            {(() => {
                              const IconComponent = getIcon(fileInfo.type);
                              return <IconComponent className="w-6 h-6" />;
                            })()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                                {fileInfo.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {fileInfo.type} File
                                {(fileInfo as any).isYouTube && (
                                  <> • <span className="text-red-500 font-medium">YouTube</span></>
                                )}
                                {(fileInfo as any).duration && (
                                  <> • {Math.floor((fileInfo as any).duration / 60)}:{((fileInfo as any).duration % 60).toString().padStart(2, '0')}</>
                                )}
                              </p>
                              {(fileInfo as any).author && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  by {(fileInfo as any).author}
                                </p>
                              )}
                            </div>

                            {/* File Details - Prominent Display */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <div className="grid grid-cols-2 gap-4">
                                {/* File Size - Large Display with Visual Indicator */}
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {fileInfo.size > 0 ? formatFileSize(fileInfo.size) : 'Unknown'}
                                  </div>
                                  <div className="text-xs font-medium text-blue-500 dark:text-blue-300 uppercase tracking-wide">
                                    File Size
                                  </div>
                                  {fileInfo.size > 0 && (
                                    <div className="mt-2">
                                      <div className="w-full bg-blue-100 dark:bg-blue-800 rounded-full h-2">
                                        <div 
                                          className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${Math.min((fileInfo.size / (100 * 1024 * 1024)) * 100, 100)}%`
                                          }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-blue-400 dark:text-blue-300 mt-1">
                                        {fileInfo.size < 1024 * 1024 ? 'Small' : 
                                         fileInfo.size < 10 * 1024 * 1024 ? 'Medium' : 
                                         fileInfo.size < 100 * 1024 * 1024 ? 'Large' : 'Very Large'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* File Type - Large Display with Category */}
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {fileInfo.extension}
                                  </div>
                                  <div className="text-xs font-medium text-blue-500 dark:text-blue-300 uppercase tracking-wide">
                                    File Type
                                  </div>
                                  <div className="mt-2">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                      fileInfo.type === 'Video' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                      fileInfo.type === 'Audio' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                      fileInfo.type === 'Image' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                      fileInfo.type === 'Document' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                      {fileInfo.type} File
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional Details */}
                              <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {(fileInfo as any).contentType && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-600 dark:text-blue-300 font-medium">Content Type:</span>
                                      <span className="font-mono text-gray-700 dark:text-gray-300 truncate max-w-32">
                                        {(fileInfo as any).contentType}
                                      </span>
                                    </div>
                                  )}
                                  {(fileInfo as any).lastModified && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-blue-600 dark:text-blue-300 font-medium">Modified:</span>
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {new Date((fileInfo as any).lastModified).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-blue-600 dark:text-blue-300 font-medium">Status:</span>
                                    <span className="text-green-600 dark:text-green-400 font-semibold">Ready to Download</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* URL Display */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Source URL</span>
                                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 break-all block">
                                  {url}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
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

                {/* Format Selection */}
                <AnimatePresence>
                  {fileInfo && !error && (fileInfo.isVideo || fileInfo.isAudio) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Download Format
                      </Label>
                      <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Original Format</SelectItem>
                          {fileInfo.isVideo && (
                            <>
                              <SelectItem value="mp4">MP4 Video</SelectItem>
                              <SelectItem value="mp3">MP3 Audio (Extract Audio)</SelectItem>
                            </>
                          )}
                          {fileInfo.isAudio && (
                            <SelectItem value="mp3">MP3 Audio</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedFormat !== 'original' && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          ⚠️ Format conversion is experimental and may not work for all files
                        </p>
                      )}
                      {(fileInfo as any).isYouTube && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            <strong>⚠️ YouTube Note:</strong> Direct YouTube downloads are currently unavailable due to API changes. 
                            For now, please use external tools like yt-dlp or online YouTube downloaders.
                          </p>
                        </div>
                      )}
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