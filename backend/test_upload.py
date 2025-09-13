#!/usr/bin/env python3
"""
Test script to verify upload functionality
"""

import requests
import os

def test_upload():
    """Test the upload endpoint"""
    url = "http://127.0.0.1:5000/upload"
    
    # Check if test video exists
    test_video = "test_clip.mp4"
    if not os.path.exists(test_video):
        print(f"❌ Test video {test_video} not found")
        return False
    
    # Prepare form data
    files = {'video': open(test_video, 'rb')}
    data = {
        'userId': 'test_user',
        'userEmail': 'test@example.com',
        'collectionName': 'Test Collection',
        'collectionDescription': 'Test upload'
    }
    
    try:
        print(f"🔄 Testing upload of {test_video}...")
        response = requests.post(url, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Video ID: {result.get('videoId')}")
            print(f"   Duration: {result.get('duration')}s")
            print(f"   File Size: {result.get('fileSize')} bytes")
            return True
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Upload timeout - server not responding")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - server not running")
        return False
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False
    finally:
        files['video'].close()

if __name__ == "__main__":
    print("🧪 Testing Upload Functionality")
    print("=" * 40)
    
    success = test_upload()
    
    if success:
        print("\n✅ Upload test PASSED - Backend is working correctly!")
    else:
        print("\n❌ Upload test FAILED - Check backend logs")
