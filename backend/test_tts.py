#!/usr/bin/env python3
"""
Test Text-to-Speech Libraries for Collective Story Narration
"""

def test_tts_libraries():
    print("🔍 TESTING TEXT-TO-SPEECH LIBRARIES")
    print("=" * 50)
    
    # Test pyttsx3
    try:
        import pyttsx3
        print("✅ pyttsx3 is available")
        
        # Test if it can initialize
        try:
            tts = pyttsx3.init()
            print("✅ pyttsx3 can initialize")
            
            # Test if it can save to file
            try:
                tts.setProperty('rate', 185)
                print("✅ pyttsx3 can set properties")
                pyttsx3_available = True
            except Exception as e:
                print(f"❌ pyttsx3 property setting failed: {e}")
                pyttsx3_available = False
        except Exception as e:
            print(f"❌ pyttsx3 initialization failed: {e}")
            pyttsx3_available = False
    except ImportError:
        print("❌ pyttsx3 not installed")
        pyttsx3_available = False
    
    print()
    
    # Test gTTS
    try:
        from gtts import gTTS
        print("✅ gTTS is available")
        
        # Test if it can create TTS object
        try:
            tts = gTTS(text="Test", lang='en')
            print("✅ gTTS can create TTS object")
            gtts_available = True
        except Exception as e:
            print(f"❌ gTTS creation failed: {e}")
            gtts_available = False
    except ImportError:
        print("❌ gTTS not installed")
        gtts_available = False
    
    print()
    print("🎯 TTS STATUS FOR COLLECTIVE STORY NARRATION:")
    if pyttsx3_available:
        print("✅ REAL AI NARRATION: pyttsx3 (Offline TTS)")
    elif gtts_available:
        print("✅ REAL AI NARRATION: gTTS (Google TTS)")
    else:
        print("❌ FALLBACK NARRATION: Silent audio (No TTS available)")
        print("🔧 Install TTS libraries to fix narration issue")
    
    return pyttsx3_available or gtts_available

if __name__ == "__main__":
    test_tts_libraries()
