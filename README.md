# 🎬 AI Video Story Platform

> **A cutting-edge AI-powered video story platform with professional UI/UX, advanced transcription, and intelligent search capabilities.**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/ai-video-story-enhanced?style=social)](https://github.com/yourusername/ai-video-story-enhanced)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/ai-video-story-enhanced?style=social)](https://github.com/yourusername/ai-video-story-enhanced)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎥 **Advanced Video Processing**
- **Multi-modal Transcription**: Speech-to-text (Vosk), embedded subtitles (FFmpeg), and OCR (Tesseract)
- **AI-Powered Visual Tagging**: YOLO + CLIP for intelligent content recognition
- **Smart Story Generation**: Gemini AI for creating compelling narratives
- **Collective Story Creation**: Combine multiple videos into cohesive stories

### 🔍 **Intelligent Search**
- **Semantic Search**: AI-powered vector similarity search using Sentence Transformers
- **Traditional Search**: MongoDB text search with relevance scoring
- **Global Search**: Search across all users' content
- **Smart Deduplication**: Eliminate duplicate and irrelevant results

### 🎨 **Professional UI/UX**
- **Modern Design**: Glassmorphism, gradient overlays, and smooth animations
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Interactive Elements**: Hover effects, loading states, and micro-interactions
- **Accessibility**: WCAG compliant with keyboard navigation support

### 🔐 **Authentication & Security**
- **Google OAuth**: Seamless sign-in with Google accounts
- **JWT Tokens**: Secure session management
- **CORS Protection**: Cross-origin request security
- **User Management**: Profile management with avatar support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB Atlas account
- Google OAuth credentials
- Gemini AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-video-story-enhanced.git
   cd ai-video-story-enhanced
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Copy the template file
   cd backend
   cp env.template .env
   
   # Edit .env with your actual values:
   # MONGODB_URI=your_mongodb_atlas_uri
   # GEMINI_API_KEY=your_gemini_api_key
   # JWT_SECRET=your_jwt_secret
   # GOOGLE_CLIENT_ID=your_google_client_id
   # GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

5. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and context
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Production-ready motion library
- **Lucide React**: Beautiful icon library

### Backend Stack
- **Flask**: Lightweight Python web framework
- **MongoDB**: NoSQL database for scalability
- **Vosk**: Offline speech recognition
- **Tesseract**: OCR for text extraction
- **Gemini AI**: Advanced AI for content generation
- **Sentence Transformers**: Semantic search embeddings

### AI Models
- **Vosk**: Speech-to-text transcription
- **Tesseract**: Optical character recognition
- **YOLO**: Object detection for visual tagging
- **CLIP**: Image-text understanding
- **Gemini**: Large language model for story generation
- **Sentence Transformers**: Text embeddings for semantic search

## 📁 Project Structure

```
ai-video-story-enhanced/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── utils/          # Utility functions
│   │   └── main.jsx        # Application entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Flask backend application
│   ├── app.py              # Main Flask application
│   ├── enhanced_transcription.py  # Advanced transcription logic
│   ├── semantic_search.py  # AI-powered search
│   ├── requirements.txt    # Backend dependencies
│   └── uploads/            # User uploaded files
├── docs/                   # Documentation
└── README.md              # This file
```

## 🎯 Key Components

### 🏠 **Home Page**
- Cinematic landing page with animated background
- Feature showcase with interactive cards
- Call-to-action buttons with shimmer effects
- Responsive design for all devices

### 📊 **Dashboard**
- User video library with grid layout
- Upload interface with drag-and-drop
- Search and filter capabilities
- User profile management

### 🔐 **Authentication**
- Google OAuth integration
- Secure JWT token management
- User session handling
- Profile picture support

### 🎬 **Video Player**
- Custom video player with controls
- Transcript display with timestamps
- Video metadata and statistics
- Social features (likes, views)

### 📖 **Story Generation**
- AI-powered story creation
- Multiple video combination
- Custom story prompts
- Voice narration with TTS

### 🔍 **Search Interface**
- Global video search
- AI-powered semantic search
- Filter and sort options
- Trending searches

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Netlify
1. Import repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### GitHub Pages
1. Enable GitHub Pages in repository settings
2. Set source to main branch
3. Access via GitHub Pages URL

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Vosk** for offline speech recognition
- **Tesseract** for OCR capabilities
- **Gemini AI** for advanced language processing
- **Framer Motion** for smooth animations
- **Tailwind CSS** for utility-first styling

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/ai-video-story-enhanced/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-video-story-enhanced/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-video-story-enhanced/discussions)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/ai-video-story-enhanced&type=Date)](https://star-history.com/#yourusername/ai-video-story-enhanced&Date)

---

**Made with ❤️ by [Your Name](https://github.com/yourusername)**

**⭐ Star this repository if you found it helpful!**"# ai-video-story-enhanced" 
"# ai-video-story" 
