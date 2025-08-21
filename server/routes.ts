import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
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