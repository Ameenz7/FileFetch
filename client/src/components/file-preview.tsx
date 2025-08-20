import { Check, AlertCircle, File, FileVideo, FileAudio, FileText, FileImage, Archive } from 'lucide-react';
import { FileInfo } from '@/types/download';
import { formatFileSize } from '@/lib/file-utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface FilePreviewProps {
  fileInfo: FileInfo;
  isValid?: boolean;
}

export function FilePreview({ fileInfo, isValid = true }: FilePreviewProps) {
  const getIconColor = () => {
    switch (fileInfo.type.toLowerCase()) {
      case 'video': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
      case 'audio': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
      case 'document': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
      case 'image': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400';
      case 'archive': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getIconComponent = () => {
    switch (fileInfo.type.toLowerCase()) {
      case 'video': return FileVideo;
      case 'audio': return FileAudio;
      case 'document': return FileText;
      case 'image': return FileImage;
      case 'archive': return Archive;
      default: return File;
    }
  };

  const IconComponent = getIconComponent();

  return (
    <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor()}`}>
              <IconComponent className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {fileInfo.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fileInfo.type} File • {fileInfo.size > 0 ? formatFileSize(fileInfo.size) : 'Size unknown'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
              {fileInfo.url}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Badge 
              variant={isValid ? "default" : "destructive"}
              className={isValid 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400" 
                : ""
              }
            >
              {isValid ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Valid
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Invalid
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
