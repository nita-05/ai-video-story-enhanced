# 🚀 Quick Startup Guide

## ⚡ Get Running in 3 Steps

### Step 1: Install Dependencies
```bash
# Install Python packages
pip install -r requirements.txt

# Install frontend packages
cd frontend
npm install
cd ..
```

### Step 2: Set Up Environment
Create a `.env` file in the root directory with **only your Gemini API key**:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**That's it!** Everything now uses Gemini AI:
- ✅ AI Story Generation
- ✅ AI Transcription  
- ✅ AI Visual Tagging
- ✅ AI Text Tagging
- ✅ Google Account Login (automatic)

### Step 3: Start the Application
```bash
python start_footage_flow.py
```

Open http://localhost:5173 and start creating! 🎉

## 🔧 Alternative Startup Options

**Backend Only:**
```bash
python start_backend.py
```

**Frontend Only:**
```bash
python start_frontend.py
```

## 🆘 Need Help?

- Check README.md for detailed instructions
- Ensure Python 3.8+ and Node.js 16+ are installed
- For FFmpeg issues on Windows, run `python install_ffmpeg.py`
