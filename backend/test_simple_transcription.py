#!/usr/bin/env python3
"""Test the simplified enhanced transcription system"""

import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_simple_transcription():
    """Test the simplified enhanced transcription system"""
    try:
        print("🧪 Testing Simplified Enhanced Transcription System...")
        
        # Import the simplified enhanced transcription
        from enhanced_transcription_simple import enhanced_transcriber_simple
        
        print("✅ Simplified enhanced transcription imported successfully")
        
        # Check if Vosk model is available
        if enhanced_transcriber_simple.vosk_model:
            print("✅ Vosk model loaded")
        else:
            print("⚠️ Vosk model not loaded")
        
        # Test with a sample video
        sample_video = "test_clip.mp4"
        if os.path.exists(sample_video):
            print(f"🎬 Testing with sample video: {sample_video}")
            
            # Test transcription
            transcript, segments = enhanced_transcriber_simple.transcribe_video(sample_video)
            
            print(f"📝 Transcript: {transcript[:100]}...")
            print(f"🔢 Segments: {len(segments)}")
            
            if segments:
                print("📊 Sample segments:")
                for i, seg in enumerate(segments[:3]):
                    print(f"  {i+1}. {seg['word']} ({seg['start_time']:.2f}s - {seg['end_time']:.2f}s)")
            
            print("✅ Simplified enhanced transcription test completed!")
            
        else:
            print(f"⚠️ Sample video not found: {sample_video}")
            print("💡 Upload a video to test transcription")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple_transcription()
