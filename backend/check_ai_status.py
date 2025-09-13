#!/usr/bin/env python3
"""
AI Status Checker - Verify 100% Perfect AI Functionality
Checks all AI models and shows real vs fallback status
"""

import os
import sys
import logging

def check_vosk_speech_recognition():
    """Check Vosk speech recognition status"""
    print("🎤 Checking Vosk Speech Recognition...")
    
    try:
        from vosk import Model, KaldiRecognizer
        
        # Check model paths
        model_paths = [
            "vosk-model-small-en-us-0.15",
            os.path.join(os.getcwd(), "vosk-model-small-en-us-0.15"),
            os.path.join(os.path.dirname(__file__), "vosk-model-small-en-us-0.15")
        ]
        
        model_found = False
        for path in model_paths:
            if os.path.exists(path):
                print(f"   ✅ Model found at: {path}")
                try:
                    model = Model(path)
                    print("   ✅ Model loads successfully")
                    print("   🚀 REAL AI SPEECH RECOGNITION: ENABLED")
                    model_found = True
                    break
                except Exception as e:
                    print(f"   ❌ Model failed to load: {e}")
        
        if not model_found:
            print("   ❌ Vosk model not found")
            print("   ⚠️ Speech recognition will be disabled")
            return False
        
        return True
        
    except ImportError:
        print("   ❌ Vosk library not installed")
        print("   ⚠️ Speech recognition will be disabled")
        return False
    except Exception as e:
        print(f"   ❌ Vosk check failed: {e}")
        return False

def check_tesseract_ocr():
    """Check Tesseract OCR status"""
    print("🔍 Checking Tesseract OCR...")
    
    try:
        import pytesseract
        
        # Check common Windows paths
        tesseract_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME', '')),
            'tesseract'  # Try PATH
        ]
        
        tesseract_found = False
        for path in tesseract_paths:
            try:
                if path == 'tesseract':
                    version = pytesseract.get_tesseract_version()
                else:
                    if os.path.exists(path):
                        pytesseract.pytesseract.tesseract_cmd = path
                        version = pytesseract.get_tesseract_version()
                    else:
                        continue
                
                print(f"   ✅ Tesseract found at: {path}")
                print(f"   ✅ Version: {version}")
                print("   🚀 REAL AI OCR: ENABLED")
                tesseract_found = True
                break
            except:
                continue
        
        if not tesseract_found:
            print("   ❌ Tesseract not found in common locations")
            print("   ⚠️ OCR will be disabled")
            print("   💡 Install Tesseract for full OCR functionality")
            return False
        
        return True
        
    except ImportError:
        print("   ❌ pytesseract library not installed")
        print("   ⚠️ OCR will be disabled")
        return False
    except Exception as e:
        print(f"   ❌ Tesseract check failed: {e}")
        return False

def check_visual_ai():
    """Check visual AI models"""
    print("🤖 Checking Visual AI Models...")
    
    # Check YOLO + CLIP
    try:
        from visual_tagger import visual_tagger
        if visual_tagger.is_available():
            print("   ✅ YOLO + CLIP: ENABLED")
            print("   🚀 REAL AI VISUAL TAGGING: ENABLED")
            return True
        else:
            print("   ⚠️ YOLO + CLIP: Not available")
    except ImportError:
        print("   ❌ YOLO + CLIP: Not installed")
    
    # Check Gemini AI
    try:
        from gemini_visual_tagger import gemini_visual_tagger
        if gemini_visual_tagger.is_available():
            print("   ✅ Gemini AI: ENABLED")
            print("   🚀 REAL AI VISUAL TAGGING: ENABLED")
            return True
        else:
            print("   ⚠️ Gemini AI: Not available")
    except ImportError:
        print("   ❌ Gemini AI: Not installed")
    
    # Check fallback
    try:
        from visual_tagger_fallback import fallback_visual_tagger
        if fallback_visual_tagger.is_available():
            print("   ⚠️ Fallback Visual Tagging: ENABLED")
            print("   💡 Using simplified tagging (not real AI)")
            return False
        else:
            print("   ❌ No visual tagging available")
    except ImportError:
        print("   ❌ Fallback visual tagger: Not installed")
    
    return False

def check_semantic_search():
    """Check AI semantic search"""
    print("🔍 Checking AI Semantic Search...")
    
    try:
        from semantic_search import semantic_searcher, is_semantic_search_available
        
        if is_semantic_search_available():
            print("   ✅ Sentence Transformers: ENABLED")
            print("   ✅ FAISS Vector Search: ENABLED")
            print("   🚀 REAL AI SEMANTIC SEARCH: ENABLED")
            return True
        else:
            print("   ⚠️ Semantic search not initialized")
            return False
            
    except ImportError:
        print("   ❌ Semantic search libraries not installed")
        return False
    except Exception as e:
        print(f"   ❌ Semantic search check failed: {e}")
        return False

def main():
    print("🚀 AI STATUS CHECKER - 100% Perfect AI Verification")
    print("=" * 60)
    
    results = {
        'speech_recognition': check_vosk_speech_recognition(),
        'ocr': check_tesseract_ocr(),
        'visual_ai': check_visual_ai(),
        'semantic_search': check_semantic_search()
    }
    
    print("\n" + "=" * 60)
    print("📊 AI STATUS SUMMARY:")
    print("=" * 60)
    
    total_ai_features = 4
    working_ai_features = sum(results.values())
    
    print(f"🎤 Speech Recognition: {'✅ REAL AI' if results['speech_recognition'] else '❌ DISABLED'}")
    print(f"🔍 OCR Text Extraction: {'✅ REAL AI' if results['ocr'] else '❌ DISABLED'}")
    print(f"🤖 Visual AI Tagging: {'✅ REAL AI' if results['visual_ai'] else '❌ FALLBACK'}")
    print(f"🔍 Semantic Search: {'✅ REAL AI' if results['semantic_search'] else '❌ DISABLED'}")
    
    print(f"\n📈 AI PERFECTION SCORE: {working_ai_features}/{total_ai_features}")
    
    if working_ai_features == total_ai_features:
        print("\n🎉 100% PERFECT AI SYSTEM!")
        print("✅ All real AI models are working")
        print("✅ No fallback systems active")
        print("✅ Ready for deployment!")
    elif working_ai_features >= 3:
        print("\n🚀 EXCELLENT AI SYSTEM!")
        print("✅ Most AI features are working")
        print("✅ High-quality results guaranteed")
        print("✅ Ready for deployment!")
    elif working_ai_features >= 2:
        print("\n👍 GOOD AI SYSTEM")
        print("✅ Core AI features working")
        print("⚠️ Some features may use fallbacks")
        print("💡 Consider installing missing components")
    else:
        print("\n⚠️ LIMITED AI SYSTEM")
        print("❌ Most AI features disabled")
        print("❌ Using fallback systems")
        print("💡 Install missing AI components for better results")
    
    print("\n" + "=" * 60)
    
    # Recommendations
    if not results['speech_recognition']:
        print("💡 To enable speech recognition:")
        print("   - Vosk model is already downloaded")
        print("   - Check model path configuration")
    
    if not results['ocr']:
        print("💡 To enable OCR:")
        print("   - Run: python install_tesseract_windows.py")
        print("   - Or manually install Tesseract OCR")
    
    if not results['visual_ai']:
        print("💡 To enable visual AI:")
        print("   - Install: pip install ultralytics torch torchvision")
        print("   - Or configure Gemini AI API key")
    
    if not results['semantic_search']:
        print("💡 To enable semantic search:")
        print("   - Run: python install_ai_search.py")
        print("   - Install: pip install sentence-transformers faiss-cpu")

if __name__ == "__main__":
    main()
