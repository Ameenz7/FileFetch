import { useState } from 'react';
import { Download, Eye, Link, Upload, Globe, Shield, Zap, FileType } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDownload } from '@/hooks/use-download';
import { UrlInput } from './url-input';
import { FilePreview } from './file-preview';
import { DownloadHistoryComponent } from './download-history';
import { ThemeToggle } from './theme-toggle';
import { DownloadOption } from '@/types/download';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function FileDownloader() {
  const [url, setUrl] = useState('');
  const [downloadOption, setDownloadOption] = useState<DownloadOption>('direct');
  const [activeTab, setActiveTab] = useState('url');
  
  const {
    downloadState,
    downloadHistory,
    validateFileUrl,
    downloadFile,
    clearHistory,
    removeFromHistory,
    reset
  } = useDownload();

  const handleDownload = () => {
    downloadFile(downloadOption);
  };

  const handleHistoryDownload = (historyUrl: string) => {
    setUrl(historyUrl);
    validateFileUrl(historyUrl);
  };

  const isDownloading = downloadState.status === 'downloading';
  const canDownload = downloadState.status === 'ready' && downloadState.fileInfo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">FileFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {/* TODO: Show history modal */}}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Globe className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Professional File Downloader
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Download audio, video, documents, and other files directly from URLs with our secure, minimalist interface.
          </p>
        </motion.div>

        {/* Main Download Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-gray-200 dark:border-gray-700">
                <TabsList className="flex w-full bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="url" 
                    className="flex-1 py-4 px-6 text-center font-medium rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    <Link className="w-5 h-5 mr-2" />
                    URL Download
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="flex-1 py-4 px-6 text-center font-medium rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Drag & Drop
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="url" className="mt-0">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* URL Input */}
                    <UrlInput
                      value={url}
                      onChange={setUrl}
                      onValidate={validateFileUrl}
                      isValidating={downloadState.status === 'validating'}
                    />

                    {/* File Preview */}
                    <AnimatePresence>
                      {downloadState.fileInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FilePreview 
                            fileInfo={downloadState.fileInfo} 
                            isValid={downloadState.status !== 'error'}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Download Options */}
                    <AnimatePresence>
                      {canDownload && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <RadioGroup 
                            value={downloadOption} 
                            onValueChange={(value: DownloadOption) => setDownloadOption(value)}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          >
                            <div className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                              <RadioGroupItem value="direct" id="direct" />
                              <div className="flex-1">
                                <Label htmlFor="direct" className="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                                  Direct Download
                                </Label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Download file as-is</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                              <RadioGroupItem value="optimized" id="optimized" />
                              <div className="flex-1">
                                <Label htmlFor="optimized" className="block text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                                  Optimized
                                </Label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Compress for faster download</p>
                              </div>
                            </div>
                          </RadioGroup>

                          {/* Download Progress */}
                          {isDownloading && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="bg-primary/10 rounded-xl p-4 border border-primary/20"
                            >
                              <div className="flex items-center space-x-3 mb-2">
                                <Download className="w-5 h-5 text-primary animate-pulse" />
                                <span className="text-sm font-medium text-primary">Downloading...</span>
                                <span className="text-sm text-primary ml-auto">{downloadState.progress}%</span>
                              </div>
                              <Progress value={downloadState.progress} className="w-full" />
                              <p className="text-xs text-primary/70 mt-2">Please wait while we process your download</p>
                            </motion.div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              onClick={handleDownload}
                              disabled={!canDownload || isDownloading}
                              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
                            >
                              <Download className="w-5 h-5 mr-2" />
                              {isDownloading ? 'Downloading...' : 'Download File'}
                            </Button>
                            <Button 
                              variant="outline"
                              disabled={!canDownload}
                              className="inline-flex items-center justify-center px-6 py-3 font-medium rounded-xl"
                            >
                              <Eye className="w-5 h-5 mr-2" />
                              Preview
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Error State */}
                    {downloadState.status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                      >
                        <p className="text-sm font-medium text-red-900 dark:text-red-400">
                          {downloadState.error || 'An error occurred'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={reset}
                          className="mt-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Try Again
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <CardContent className="p-8">
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Drag & Drop Coming Soon
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      This feature will be available in a future update
                    </p>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Download History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <DownloadHistoryComponent
            history={downloadHistory}
            onDownload={handleHistoryDownload}
            onRemove={removeFromHistory}
            onClear={clearHistory}
          />
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Secure Downloads</h3>
            <p className="text-gray-600 dark:text-gray-400">All downloads are scanned and verified for safety before processing.</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400">Optimized download speeds with intelligent compression options.</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
              <FileType className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Universal Support</h3>
            <p className="text-gray-600 dark:text-gray-400">Support for all major file formats including video, audio, documents, and images.</p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">FileFlow</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Professional file downloading made simple and secure. Download any file format with confidence.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">URL Downloads</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">File Compression</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Download History</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Security Scanning</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 FileFlow. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                <Download className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
                <Globe className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
