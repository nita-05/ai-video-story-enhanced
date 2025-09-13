#!/usr/bin/env python3
"""
Quick AI Status Check - Fast verification without loading heavy models
"""

import os
import sys
from config import load_env_file

def quick_ai_status():
    print("🚀 QUICK AI STATUS CHECK")
    print("=" * 50)
    
    results = {}
    
    # 1. Check Vosk Speech Recognition
    print("🎤 Speech Recognition (Vosk): ", end="")
    try:
        from vosk import Model
        model_path = "vosk-model-small-en-us-0.15"
        if os.path.exists(model_path):
            print("✅ REAL AI")
            results['Speech'] = True
        else:
            print("❌ FALLBACK")
            results['Speech'] = False
    except:
        print("❌ FALLBACK")
        results['Speech'] = False
    
    # 2. Check Tesseract OCR
    print("🔍 OCR Text Extraction (Tesseract): ", end="")
    try:
        import pytesseract
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            print("✅ REAL AI")
            results['OCR'] = True
        else:
            print("❌ FALLBACK")
            results['OCR'] = False
    except:
        print("❌ FALLBACK")
        results['OCR'] = False
    
    # 3. Check Visual Tagging (without loading models)
    print("🤖 Visual AI Tagging (YOLO + CLIP): ", end="")
    try:
        from ultralytics import YOLO
        from transformers import CLIPModel
        if os.path.exists('yolov8n.pt'):
            print("✅ REAL AI")
            results['Visual'] = True
        else:
            print("❌ FALLBACK")
            results['Visual'] = False
    except:
        print("❌ FALLBACK")
        results['Visual'] = False
    
    # 4. Check Semantic Search
    print("🔍 Semantic Search (Sentence Transformers): ", end="")
    try:
        from sentence_transformers import SentenceTransformer
        import faiss
        print("✅ REAL AI")
        results['Semantic'] = True
    except:
        print("❌ FALLBACK")
        results['Semantic'] = False
    
    # 5. Check Story Generation
    print("📚 Story Generation (Gemini): ", end="")
    try:
        load_env_file()
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            import google.generativeai as genai
            print("✅ REAL AI")
            results['Story'] = True
        else:
            print("❌ FALLBACK")
            results['Story'] = False
    except:
        print("❌ FALLBACK")
        results['Story'] = False
    
    # 6. Check Collective Narration
    print("🎬 Collective Narration (TTS): ", end="")
    try:
        from gtts import gTTS
        print("✅ REAL AI")
        results['Narration'] = True
    except:
        print("❌ FALLBACK")
        results['Narration'] = False
    
    # Calculate score
    total = len(results)
    working = sum(results.values())
    score = (working / total) * 100
    
    print("\n" + "=" * 50)
    print(f"🏆 AI PERFECTION SCORE: {score:.0f}% ({working}/{total})")
    
    if score == 100:
        print("🎉 PERFECT! All AI models using REAL AI!")
    elif score >= 80:
        print("✅ EXCELLENT! Most AI models working with real AI")
    elif score >= 60:
        print("⚠️ GOOD! Some AI models working with real AI")
    else:
        print("❌ NEEDS WORK! Many AI models using fallbacks")
    
    return score

if __name__ == "__main__":
    quick_ai_status()
