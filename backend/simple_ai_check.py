#!/usr/bin/env python3
"""
Simple AI Status Check - No heavy model loading
"""

import os

def check_ai_status():
    print("🚀 SIMPLE AI STATUS CHECK")
    print("=" * 40)
    
    # Check file existence for AI models
    checks = {
        "Vosk Speech Model": "vosk-model-small-en-us-0.15",
        "Tesseract OCR": r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        "YOLO Model": "yolov8n.pt",
        "Gemini API Key": "GEMINI_API_KEY in .env"
    }
    
    results = {}
    
    for name, path in checks.items():
        if name == "Gemini API Key":
            # Check environment variable
            try:
                from config import load_env_file
                load_env_file()
                api_key = os.environ.get('GEMINI_API_KEY')
                if api_key:
                    print(f"✅ {name}: CONFIGURED")
                    results[name] = True
                else:
                    print(f"❌ {name}: NOT CONFIGURED")
                    results[name] = False
            except:
                print(f"❌ {name}: ERROR CHECKING")
                results[name] = False
        else:
            if os.path.exists(path):
                print(f"✅ {name}: FOUND")
                results[name] = True
            else:
                print(f"❌ {name}: NOT FOUND")
                results[name] = False
    
    # Calculate score
    total = len(results)
    working = sum(results.values())
    score = (working / total) * 100
    
    print(f"\n🏆 AI COMPONENTS READY: {score:.0f}% ({working}/{total})")
    
    if score == 100:
        print("🎉 ALL AI COMPONENTS READY!")
        print("✅ Speech Recognition: Vosk model found")
        print("✅ OCR Text Extraction: Tesseract found") 
        print("✅ Visual AI Tagging: YOLO model found")
        print("✅ Story Generation: Gemini API configured")
        print("🚀 Your system should use REAL AI for all features!")
    elif score >= 75:
        print("✅ MOST AI COMPONENTS READY!")
        print("🔧 Some components may use fallbacks")
    else:
        print("⚠️ SOME AI COMPONENTS MISSING")
        print("🔧 Several features will use fallbacks")
    
    return score

if __name__ == "__main__":
    check_ai_status()
