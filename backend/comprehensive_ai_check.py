#!/usr/bin/env python3
"""
Comprehensive AI System Check - Verify All Models Are Using Real AI
"""

import os
import sys
import logging
from config import load_env_file

def check_speech_recognition():
    """Check Vosk Speech Recognition"""
    print("🎤 CHECKING SPEECH RECOGNITION (Vosk)")
    print("-" * 50)
    
    try:
        from vosk import Model, KaldiRecognizer
        model_path = "vosk-model-small-en-us-0.15"
        
        if os.path.exists(model_path):
            model = Model(model_path)
            print("✅ Vosk model loaded successfully")
            print("✅ REAL AI Speech Recognition: ENABLED")
            return True
        else:
            print("❌ Vosk model not found")
            print("❌ FALLBACK: No speech recognition")
            return False
    except Exception as e:
        print(f"❌ Vosk error: {e}")
        print("❌ FALLBACK: No speech recognition")
        return False

def check_ocr_extraction():
    """Check Tesseract OCR"""
    print("\n🔍 CHECKING OCR TEXT EXTRACTION (Tesseract)")
    print("-" * 50)
    
    try:
        import pytesseract
        from PIL import Image
        import numpy as np
        
        # Test Tesseract path
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            
            # Test OCR with a simple image
            test_image = Image.new('RGB', (100, 50), color='white')
            result = pytesseract.image_to_string(test_image)
            
            print("✅ Tesseract OCR working")
            print("✅ REAL AI OCR: ENABLED")
            return True
        else:
            print("❌ Tesseract not found at expected path")
            print("❌ FALLBACK: No OCR text extraction")
            return False
    except Exception as e:
        print(f"❌ Tesseract error: {e}")
        print("❌ FALLBACK: No OCR text extraction")
        return False

def check_visual_tagging():
    """Check Visual AI Tagging"""
    print("\n🤖 CHECKING VISUAL AI TAGGING (YOLO + CLIP)")
    print("-" * 50)
    
    try:
        from ultralytics import YOLO
        import torch
        from transformers import CLIPProcessor, CLIPModel
        
        # Check YOLO
        yolo_model = YOLO('yolov8n.pt')
        print("✅ YOLO model loaded")
        
        # Check CLIP
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("✅ CLIP model loaded")
        
        print("✅ REAL AI Visual Tagging: ENABLED")
        return True
    except Exception as e:
        print(f"❌ Visual tagging error: {e}")
        print("❌ FALLBACK: Simple visual tagging")
        return False

def check_semantic_search():
    """Check Semantic Search"""
    print("\n🔍 CHECKING SEMANTIC SEARCH (Sentence Transformers)")
    print("-" * 50)
    
    try:
        from sentence_transformers import SentenceTransformer
        import faiss
        import numpy as np
        
        # Test model loading
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Sentence Transformers model loaded")
        
        # Test FAISS
        dimension = 384
        index = faiss.IndexFlatIP(dimension)
        print("✅ FAISS vector search working")
        
        print("✅ REAL AI Semantic Search: ENABLED")
        return True
    except Exception as e:
        print(f"❌ Semantic search error: {e}")
        print("❌ FALLBACK: Traditional keyword search")
        return False

def check_story_generation():
    """Check Story Generation"""
    print("\n📚 CHECKING STORY GENERATION (Gemini AI)")
    print("-" * 50)
    
    try:
        load_env_file()
        api_key = os.environ.get('GEMINI_API_KEY')
        
        if not api_key:
            print("❌ Gemini API key not configured")
            print("❌ FALLBACK: Simple algorithmic story generation")
            return False
        
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Test generation
        response = model.generate_content("Say 'Gemini is working!'")
        if response.text:
            print("✅ Gemini AI working")
            print("✅ REAL AI Story Generation: ENABLED")
            return True
        else:
            print("❌ Gemini response empty")
            print("❌ FALLBACK: Simple algorithmic story generation")
            return False
            
    except Exception as e:
        print(f"❌ Gemini error: {e}")
        print("❌ FALLBACK: Simple algorithmic story generation")
        return False

def check_collective_narration():
    """Check Collective Story Narration"""
    print("\n🎬 CHECKING COLLECTIVE STORY NARRATION (TTS)")
    print("-" * 50)
    
    try:
        from gtts import gTTS
        import tempfile
        import subprocess
        
        # Test gTTS
        test_text = "Test narration"
        tts = gTTS(text=test_text, lang='en')
        
        # Test file creation
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tts.save(tmp.name)
            if os.path.exists(tmp.name):
                os.unlink(tmp.name)
                print("✅ gTTS working")
                print("✅ REAL AI Narration: ENABLED")
                return True
        
        print("❌ gTTS file creation failed")
        print("❌ FALLBACK: Silent audio")
        return False
        
    except Exception as e:
        print(f"❌ TTS error: {e}")
        print("❌ FALLBACK: Silent audio")
        return False

def main():
    print("🚀 COMPREHENSIVE AI SYSTEM CHECK")
    print("=" * 60)
    print("Checking all AI models to ensure 100% real AI usage...")
    print()
    
    # Check all AI components
    results = {
        'Speech Recognition': check_speech_recognition(),
        'OCR Text Extraction': check_ocr_extraction(),
        'Visual AI Tagging': check_visual_tagging(),
        'Semantic Search': check_semantic_search(),
        'Story Generation': check_story_generation(),
        'Collective Narration': check_collective_narration()
    }
    
    # Calculate AI perfection score
    total_models = len(results)
    working_models = sum(results.values())
    perfection_score = (working_models / total_models) * 100
    
    print("\n" + "=" * 60)
    print("🎯 FINAL AI SYSTEM STATUS")
    print("=" * 60)
    
    for component, status in results.items():
        status_icon = "✅" if status else "❌"
        status_text = "REAL AI" if status else "FALLBACK"
        print(f"{status_icon} {component}: {status_text}")
    
    print(f"\n🏆 AI PERFECTION SCORE: {perfection_score:.0f}% ({working_models}/{total_models})")
    
    if perfection_score == 100:
        print("🎉 PERFECT! All AI models are using REAL AI!")
        print("🚀 Your system is ready for deployment with 100% AI perfection!")
    elif perfection_score >= 80:
        print("✅ EXCELLENT! Most AI models are working with real AI")
        print("🔧 Fix the remaining fallbacks for 100% perfection")
    elif perfection_score >= 60:
        print("⚠️ GOOD! Some AI models are working with real AI")
        print("🔧 Several components need attention")
    else:
        print("❌ NEEDS WORK! Many AI models are using fallbacks")
        print("🔧 Significant improvements needed")
    
    return perfection_score

if __name__ == "__main__":
    main()
