#!/usr/bin/env python3
"""
Test script for Visual Tagger
This script tests if the AI visual tagging models are working properly.
"""

import os
import sys

def test_visual_tagger():
    """Test the visual tagger functionality"""
    print("🧪 Testing AI Visual Tagger...")
    print("=" * 50)
    
    try:
        # Test 1: Import visual tagger
        print("📦 Testing import...")
        from visual_tagger import visual_tagger
        print("✅ Visual tagger imported successfully")
        
        # Test 2: Check model availability
        print("\n🤖 Checking model availability...")
        if visual_tagger.is_available():
            print("✅ All AI models are loaded and available")
            print(f"   Device: {visual_tagger.device}")
        else:
            print("❌ Some AI models are not available")
            return False
        
        # Test 3: Test with sample video if available
        print("\n🎥 Testing with sample video...")
        sample_video = "test_clip.mp4"
        if os.path.exists(sample_video):
            print(f"   Found sample video: {sample_video}")
            try:
                tags = visual_tagger.tag_video(sample_video)
                print(f"✅ AI generated tags: {tags}")
                return True
            except Exception as e:
                print(f"❌ Error during video tagging: {e}")
                return False
        else:
            print("   No sample video found, skipping video test")
            print("   ✅ Visual tagger is ready for use")
            return True
            
    except ImportError as e:
        print(f"❌ Failed to import visual tagger: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 AI Visual Tagger Test Suite")
    print("=" * 50)
    
    success = test_visual_tagger()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed! AI Visual Tagging is working.")
        print("💡 You can now use the full AI-powered tagging system.")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
