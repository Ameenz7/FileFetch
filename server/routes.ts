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

      // Check if URL looks like a direct file link
      const urlPath = new URL(url).pathname.toLowerCase();
      const hasFileExtension = /\.(mp4|mp3|wav|pdf|jpg|jpeg|png|gif|zip|rar|txt|doc|docx|avi|mov|mkv|webm|flac|aac|ogg|m4a|bmp|svg|webp|7z|tar|gz)$/i.test(urlPath);
      
      if (!hasFileExtension) {
        return res.status(400).json({ error: 'URL does not appear to be a direct file link. Please use a direct file URL.' });
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
      
      // Verify this is actually a file and not HTML
      if (contentType && contentType.includes('text/html')) {
        return res.status(400).json({ error: 'URL points to a webpage, not a direct file. Please use a direct file URL.' });
      }
      
      res.json({
        size: contentLength ? parseInt(contentLength, 10) : 0,
        contentType: contentType || 'application/octet-stream',
        lastModified: response.headers.get('last-modified'),
        etag: response.headers.get('etag')
      });

    } catch (error) {
      console.error('File info error:', error);
      res.status(500).json({ error: 'Failed to fetch file information' });
    }
  });

  // Download endpoint - proxy file download
  app.post("/api/download", async (req, res) => {
    try {
      const { url, option } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Check if URL looks like a direct file link
      const urlPath = new URL(url).pathname.toLowerCase();
      const hasFileExtension = /\.(mp4|mp3|wav|pdf|jpg|jpeg|png|gif|zip|rar|txt|doc|docx|avi|mov|mkv|webm|flac|aac|ogg|m4a|bmp|svg|webp|7z|tar|gz)$/i.test(urlPath);
      
      if (!hasFileExtension) {
        return res.status(400).json({ error: 'URL does not appear to be a direct file link. Please use a direct file URL.' });
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

      // Check content type to ensure it's not HTML
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        return res.status(400).json({ error: 'URL points to a webpage, not a direct file. Please use a direct file URL.' });
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

      // Set response headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType || 'application/octet-stream');
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
