import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import ytdl from "ytdl-core";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to check if URL is a YouTube URL
  const isYouTubeUrl = (url: string): boolean => {
    try {
      return ytdl.validateURL(url);
    } catch {
      // Fallback check for YouTube URLs
      return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
    }
  };

  // Helper function to get YouTube video info
  const getYouTubeInfo = async (url: string) => {
    try {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      return {
        title: videoDetails.title || 'YouTube Video',
        duration: parseInt(videoDetails.lengthSeconds || '0'),
        thumbnail: videoDetails.thumbnails?.[0]?.url,
        author: videoDetails.author?.name || 'Unknown',
        formats: info.formats.filter(format => format.hasVideo || format.hasAudio)
      };
    } catch (error) {
      console.error('YouTube API Error:', error);
      // Return basic info if ytdl fails
      const videoId = extractVideoId(url);
      return {
        title: `YouTube Video ${videoId}`,
        duration: 0,
        thumbnail: null,
        author: 'YouTube',
        formats: []
      };
    }
  };

  // Helper to extract video ID from YouTube URL
  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : 'unknown';
  };

  // File info endpoint - get file metadata from URL
  app.get("/api/file-info", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Check if it's a YouTube URL
      if (isYouTubeUrl(url)) {
        try {
          const youtubeInfo = await getYouTubeInfo(url);
          return res.json({
            size: 0, // YouTube videos don't have a fixed size
            contentType: 'video/youtube',
            fileType: 'Video',
            fileName: `${youtubeInfo.title}.mp4`,
            isVideo: true,
            isAudio: false,
            isYouTube: true,
            duration: youtubeInfo.duration,
            thumbnail: youtubeInfo.thumbnail,
            author: youtubeInfo.author
          });
        } catch (error) {
          console.error('YouTube error:', error);
          // Return basic YouTube video info even if ytdl fails
          const videoId = extractVideoId(url);
          return res.json({
            size: 0,
            contentType: 'video/youtube',
            fileType: 'Video',
            fileName: `YouTube_Video_${videoId}.mp4`,
            isVideo: true,
            isAudio: false,
            isYouTube: true,
            duration: 0,
            thumbnail: null,
            author: 'YouTube'
          });
        }
      }

      // Make HEAD request to get file info
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ error: 'File not accessible or requires authentication' });
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      // Get basic file info from URL
      const urlPath = new URL(url).pathname;
      const fileName = urlPath.split('/').pop() || 'download';
      
      // Determine file type from content-type or URL
      let fileType = 'File';
      let isVideo = false;
      let isAudio = false;
      
      if (contentType) {
        if (contentType.includes('video/')) {
          fileType = 'Video';
          isVideo = true;
        } else if (contentType.includes('audio/')) {
          fileType = 'Audio';
          isAudio = true;
        } else if (contentType.includes('image/')) {
          fileType = 'Image';
        } else if (contentType.includes('application/pdf')) {
          fileType = 'Document';
        }
      } else {
        // Fallback to extension detection
        const ext = fileName.toLowerCase().split('.').pop() || '';
        if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(ext)) {
          fileType = 'Video';
          isVideo = true;
        } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
          fileType = 'Audio';
          isAudio = true;
        } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
          fileType = 'Image';
        } else if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
          fileType = 'Document';
        }
      }
      
      res.json({
        size: contentLength ? parseInt(contentLength, 10) : 0,
        contentType: contentType || 'application/octet-stream',
        fileType,
        fileName: decodeURIComponent(fileName),
        isVideo,
        isAudio,
        lastModified: response.headers.get('last-modified'),
        etag: response.headers.get('etag')
      });

    } catch (error) {
      console.error('File info error:', error);
      res.status(500).json({ error: 'Failed to fetch file information' });
    }
  });

  // Download endpoint - proxy file download with format options
  app.post("/api/download", async (req, res) => {
    try {
      const { url, format } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Handle YouTube URLs
      if (isYouTubeUrl(url)) {
        try {
          const info = await ytdl.getInfo(url);
          const videoDetails = info.videoDetails;
          
          let filename = `${videoDetails.title.replace(/[^a-zA-Z0-9\s]/g, '')}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
          
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          
          if (format === 'mp3') {
            // Audio only
            res.setHeader('Content-Type', 'audio/mpeg');
            const audioStream = ytdl(url, { 
              quality: 'highestaudio',
              filter: 'audioonly'
            });
            audioStream.pipe(res);
          } else {
            // Video (original or mp4)
            res.setHeader('Content-Type', 'video/mp4');
            const videoStream = ytdl(url, { 
              quality: 'highest',
              filter: 'audioandvideo'
            });
            videoStream.pipe(res);
          }
          
          return;
        } catch (error) {
          console.error('YouTube download error:', error);
          return res.status(500).json({ error: 'Failed to download YouTube video' });
        }
      }

      // Fetch the file with proper headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Referer': new URL(url).origin
        }
      });

      if (!response.ok) {
        return res.status(400).json({ error: `Failed to download file: ${response.status} ${response.statusText}` });
      }

      // Get filename from URL or Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = '';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      if (!filename) {
        const urlPath = new URL(url).pathname;
        filename = decodeURIComponent(urlPath.split('/').pop() || 'download');
      }

      // Handle format conversion
      if (format && format !== 'original') {
        const ext = filename.split('.').pop() || '';
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        
        if (format === 'mp3' && ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext.toLowerCase())) {
          filename = `${nameWithoutExt}.mp3`;
          // Note: In a real implementation, you'd need ffmpeg or similar for conversion
          // For now, we'll just rename but this won't actually convert the file
          res.setHeader('X-Format-Note', 'Format conversion requires additional setup');
        } else if (format === 'mp4' && ['avi', 'mov', 'mkv', 'webm'].includes(ext.toLowerCase())) {
          filename = `${nameWithoutExt}.mp4`;
          res.setHeader('X-Format-Note', 'Format conversion requires additional setup');
        }
      }

      // Set response headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length')!);
      }

      // Stream the file
      if (response.body) {
        const reader = response.body.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (streamError) {
          console.error('Stream error:', streamError);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Download stream interrupted' });
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        res.status(500).json({ error: 'No response body from remote server' });
      }

    } catch (error) {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process download request' });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}