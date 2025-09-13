# 🎬 AI Video Story - Complete Deployment Guide

## 🚀 Quick Start (Recommended)

### Option 1: One-Click Deployment
```bash
# Windows
start.bat

# Or manually
python deploy.py
```

### Option 2: Manual Deployment
```bash
# 1. Start Backend
cd backend
python start_backend.py

# 2. Start Frontend (in new terminal)
cd frontend
python start_frontend.py
```

## 📋 Prerequisites

### Required Software
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **MongoDB** (local or Atlas)

### Required API Keys
- **Google OAuth** (already configured)
- **Gemini AI** (optional, for story generation)

## 🔧 Configuration

### Backend Configuration
The backend uses `backend/config.py` for configuration. Key settings:

```python
# JWT Configuration
JWT_SECRET = 'ai-video-story-secret-key-2024-production-ready'
JWT_ISSUER = 'aivideostory'

# Cookie Configuration
COOKIE_SECURE = False  # Set to True for production
COOKIE_SAMESITE = 'Lax'

# CORS Configuration
CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
```

### Frontend Configuration
The frontend uses environment variables in `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=724469503053-q51vpuo0i4orso28upcotfs3lpsrtevs.apps.googleusercontent.com
```

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔍 Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
# Install missing dependencies
pip install brotlicffi brotli requests urllib3 pymongo flask flask-cors pyjwt
```

#### 2. Frontend Won't Start
```bash
# Install npm dependencies
cd frontend
npm install
```

#### 3. Authentication Issues
- Clear browser cookies for localhost:5173 and localhost:5000
- Log out and log back in
- Check that both servers are running

#### 4. Upload Issues
- Check that backend is running on port 5000
- Verify file size is under 500MB
- Check browser console for errors

### Debug Commands

```bash
# Check backend health
curl http://localhost:5000/health

# Check authentication
curl -H "Cookie: access_token=test" http://localhost:5000/auth/me

# Check frontend
curl http://localhost:5173
```

## 📁 Project Structure

```
aivideostory/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── config.py             # Configuration settings
│   ├── start_backend.py      # Backend startup script
│   └── uploads/              # Uploaded files
├── frontend/
│   ├── src/                  # React source code
│   ├── start_frontend.py     # Frontend startup script
│   └── package.json          # npm dependencies
├── deploy.py                 # Master deployment script
├── start.bat                 # Windows quick start
└── DEPLOYMENT_GUIDE.md       # This file
```

## 🚀 Production Deployment

### Environment Variables
Set these environment variables for production:

```bash
# JWT Configuration
export JWT_SECRET="your-secure-secret-key"
export JWT_ISSUER="aivideostory"

# Cookie Configuration
export COOKIE_SECURE="true"
export COOKIE_SAMESITE="Strict"

# Database
export MONGODB_URI="mongodb://your-production-db"

# API Keys
export GEMINI_API_KEY="your-gemini-api-key"
```

### Security Checklist
- [ ] Change JWT_SECRET to a secure random string
- [ ] Set COOKIE_SECURE=true for HTTPS
- [ ] Use production MongoDB instance
- [ ] Configure proper CORS origins
- [ ] Set up SSL certificates
- [ ] Configure firewall rules

## 🎯 Features

### ✅ Working Features
- **Google OAuth Authentication** - Login with Google account
- **Video Upload** - Upload videos up to 500MB
- **AI Transcription** - Automatic speech-to-text using Vosk
- **Visual Tagging** - AI-powered visual content analysis
- **Emotion Analysis** - Sentiment analysis of video content
- **Story Generation** - AI-generated stories from video content
- **Video Rendering** - Create final video with narration
- **Global Search** - Search across all uploaded videos

### 🔧 Technical Stack
- **Backend**: Python Flask, MongoDB, Vosk, OpenCV, Gemini AI
- **Frontend**: React, Vite, Tailwind CSS
- **Authentication**: Google OAuth, JWT tokens
- **AI Services**: Vosk (speech), YOLO+CLIP (vision), Gemini (story)

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check the console logs for errors
4. Ensure both backend and frontend are running
5. Try the debug commands listed above

## 🎉 Success!

Once everything is running, you should see:
- Frontend at http://localhost:5173
- Backend health check passing
- Google login working
- Video upload and processing working
- All AI features functioning

Enjoy your AI Video Story application! 🎬✨
