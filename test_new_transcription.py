#!/usr/bin/env python3
"""
Test the new transcription system
"""
import requests
import time
import os

def test_new_transcription():
    """Test the updated transcription system"""
    print("🧪 TESTING NEW TRANSCRIPTION SYSTEM")
    print("=" * 50)
    
    # Wait a moment for backend to start
    print("⏳ Waiting for backend to start...")
    time.sleep(3)
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend not healthy")
            return
    except:
        print("❌ Backend not running. Please start it manually:")
        print("   python start_backend.py")
        return
    
    # Find test video
    videos_dir = "backend/uploads/videos"
    if os.path.exists(videos_dir):
        videos = [f for f in os.listdir(videos_dir) if f.endswith('.mp4')]
        if videos:
            test_video = os.path.join(videos_dir, videos[0])
            print(f"📹 Testing with: {videos[0]}")
        else:
            print("❌ No videos found")
            return
    else:
        print("❌ Videos directory not found")
        return
    
    print("\n🔄 Testing new transcription system...")
    print("(This should now give 155+ words instead of 124)")
    
    try:
        with open(test_video, 'rb') as f:
            files = {'file': f}
            response = requests.post(
                "http://localhost:5000/transcribe-direct", 
                files=files, 
                timeout=300  # 5 minutes
            )
        
        if response.status_code == 200:
            result = response.json()
            word_count = result.get('word_count', 0)
            
            print(f"\n✅ TRANSCRIPTION COMPLETE!")
            print(f"🎯 Word count: {word_count}")
            print(f"📝 Language: {result.get('language', 'Unknown')}")
            print(f"⏱️ Word timestamps: {len(result.get('word_timestamps', []))}")
            
            transcript = result.get('transcript', '')
            print(f"\n📄 TRANSCRIPT ({len(transcript)} characters):")
            print("-" * 40)
            print(transcript)
            print("-" * 40)
            
            if word_count > 124:
                print(f"\n🎉 SUCCESS! Got {word_count} words (more than 124)!")
                print("✅ The new transcription system is working!")
            elif word_count == 124:
                print(f"\n⚠️ Still getting {word_count} words - the backend might not be using the new code")
                print("🔧 Try restarting the backend completely")
            else:
                print(f"\n❌ Got {word_count} words (less than 124) - something is wrong")
                
        else:
            print(f"❌ Transcription failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == "__main__":
    test_new_transcription()
