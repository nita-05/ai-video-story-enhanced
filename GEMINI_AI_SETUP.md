# 🚀 Gemini AI Visual Tagging Setup Guide

## What is Gemini AI Visual Tagging?

**Gemini AI Visual Tagging** is Google's most advanced AI model that can:
- 🎯 **Intelligently analyze video frames** and understand context
- 🏷️ **Generate descriptive tags** based on actual content, not just metadata
- 🌍 **Understand scenes, objects, actions, and emotions** in videos
- 🔍 **Provide context-aware tagging** for better video search and organization

## 🆚 Comparison: Traditional vs Gemini AI

| Feature | Traditional (YOLO+CLIP) | Gemini AI |
|---------|-------------------------|-----------|
| **Object Detection** | ✅ Pre-trained objects only | ✅ Any object, any context |
| **Scene Understanding** | ⚠️ Limited categories | ✅ Rich, contextual descriptions |
| **Tag Quality** | ⚠️ Generic tags | ✅ Intelligent, descriptive tags |
| **Context Awareness** | ❌ No context | ✅ Full context understanding |
| **Learning Ability** | ❌ Static model | ✅ Continuously improving |

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Gemini AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Step 2: Set Environment Variable
```bash
# Windows (Command Prompt)
set GEMINI_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"

# Linux/Mac
export GEMINI_API_KEY=your_api_key_here
```

**OR** create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=footageflow
```

### Step 3: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

## 🧪 Test Gemini AI

Run the test script to verify everything is working:
```bash
cd backend
python test_gemini_tagger.py
```

## 🎯 How It Works

### 1. **Frame Extraction**
- Extracts 3 key frames from your video using FFmpeg
- Optimizes frames for Gemini AI analysis

### 2. **AI Analysis**
- Sends each frame to Gemini Pro Vision model
- AI analyzes content, context, and meaning
- Generates structured JSON response with:
  - Objects detected
  - Scene description
  - Lighting and colors
  - Action happening
  - Quality assessment
  - Relevant tags

### 3. **Smart Tag Generation**
- Combines analysis from all frames
- Removes duplicates and prioritizes important tags
- Generates 15-20 intelligent, searchable tags

## 🔍 Example Output

**Input Video**: A person cooking in a kitchen

**Traditional Tags**: `["person", "kitchen", "cooking", "indoor"]`

**Gemini AI Tags**: `["person-cooking", "kitchen-scene", "food-preparation", "home-cooking", "chef-activity", "kitchen-appliances", "cooking-process", "indoor-activity", "domestic-scene", "culinary-content"]`

## 🛠️ Troubleshooting

### ❌ "GEMINI_API_KEY not found"
- Set the environment variable correctly
- Check if `.env` file exists and has correct format
- Restart your terminal/IDE after setting variables

### ❌ "google-generativeai not installed"
```bash
pip install google-generativeai
```

### ❌ "API key invalid"
- Verify your API key is correct
- Check if you have quota remaining
- Ensure you're using the right Google account

### ❌ "Rate limit exceeded"
- Gemini AI has usage limits
- Wait a few minutes and try again
- Consider upgrading your Google AI Studio plan

## 💰 Cost Information

- **Free Tier**: 15 requests per minute, 1000 requests per day
- **Paid Plans**: Starting at $0.00025 per 1K characters
- **Video Analysis**: Typically 3-5 requests per video (3 frames)

## 🎉 Benefits

1. **Better Search**: Find videos by content, not just filename
2. **Smart Organization**: Automatically categorize videos
3. **Content Discovery**: Find similar videos easily
4. **Professional Quality**: Enterprise-grade AI analysis
5. **Future-Proof**: Uses Google's latest AI technology

## 🔄 Integration

The system automatically uses Gemini AI when available:
1. **Priority 1**: Gemini AI (if API key is set)
2. **Priority 2**: Traditional AI (YOLO + CLIP)
3. **Priority 3**: Fallback analysis (basic frame analysis)
4. **Priority 4**: Simple duration-based tagging

## 📞 Support

- **Google AI Studio**: [makersuite.google.com](https://makersuite.google.com)
- **API Documentation**: [ai.google.dev](https://ai.google.dev)
- **Community**: [Google AI Discord](https://discord.gg/googleai)

---

**🎯 Ready to revolutionize your video tagging? Set up Gemini AI today!**
