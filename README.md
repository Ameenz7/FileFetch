# Minimalist File Downloader

## Project Overview
A clean, professional React-based web application for downloading files directly from URLs. Features a minimalist design with immediate download functionality - no history tracking, just paste and download.

## User Preferences
- Professional, minimalist design aesthetic
- No download history - keep it simple
- Direct download functionality without unnecessary features
- Focus on clean UX with immediate file download

## Architecture
- **Frontend**: React with Vite, Tailwind CSS, shadcn/ui components
- **Styling**: Minimalist design with professional appearance
- **File Handling**: Direct download using file-saver library
- **Storage**: No persistent storage needed (no history requirement)

## Key Features
- URL input field with file type detection
- Professional UI with rounded containers and subtle animations
- Error handling for invalid URLs
- Responsive design (mobile-first)
- Dark/light mode toggle
- Direct file download functionality

## Tech Stack
- React.js with Vite
- Tailwind CSS for styling
- shadcn/ui for components
- lucide-react for icons
- framer-motion for animations
- file-saver for downloads
- axios for HTTP requests

## Recent Changes
- Initial project setup (August 20, 2025)
- Added YouTube URL detection and file information display (August 21, 2025)
- Enhanced file preview with detailed information (URL, content type, last modified)
- Added format selection UI for video/audio files (MP4, MP3 conversion options)
- Implemented fallback system for YouTube API issues
- Note: YouTube downloads currently disabled due to ytdl-core library limitations
- Focused on comprehensive file information display before download per user request
