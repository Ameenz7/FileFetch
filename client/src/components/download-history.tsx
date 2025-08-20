import { Download, ExternalLink, Trash2, History } from 'lucide-react';
import { DownloadHistory } from '@/types/download';
import { formatFileSize } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DownloadHistoryProps {
  history: DownloadHistory[];
  onDownload: (url: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function DownloadHistoryComponent({ 
  history, 
  onDownload, 
  onRemove, 
  onClear 
}: DownloadHistoryProps) {
  const getIconColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'video': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'audio': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      case 'document': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'image': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400';
      case 'archive': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (history.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <History className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
            Recent Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No downloads yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Start by downloading a file to see your history here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <History className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
            Recent Downloads
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {history.slice(0, 5).map((item) => {
            const IconComponent = require('lucide-react')[item.icon.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join('')] || require('lucide-react').File;

            return (
              <div 
                key={item.id} 
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(item.fileType)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.fileName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.fileType} • {formatFileSize(item.fileSize)} • {formatDate(item.downloadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(item.url)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(item.url, '_blank')}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
                      className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {history.length > 5 && (
          <div className="px-6 py-4 text-center border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" className="text-sm text-primary hover:text-primary/80 font-medium">
              View All Downloads
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
