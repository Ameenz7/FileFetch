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
          'User-Agent': 'FileFlow-Downloader/1.0'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ error: 'File not accessible' });
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
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

      // Fetch the file
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FileFlow-Downloader/1.0'
        }
      });

      if (!response.ok) {
        return res.status(400).json({ error: 'Failed to download file' });
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
        filename = urlPath.split('/').pop() || 'download';
      }

      // Set response headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      
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
          res.status(500).json({ error: 'Download stream interrupted' });
        } finally {
          reader.releaseLock();
        }
      } else {
        res.status(500).json({ error: 'No response body' });
      }

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to process download request' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
