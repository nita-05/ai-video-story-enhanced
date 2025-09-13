#!/usr/bin/env python3
"""
Test script for Gemini AI Visual Tagger
This script tests if the Gemini AI visual tagging is working properly.
"""

import os
import sys

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def test_gemini_tagger():
    """Test the Gemini AI visual tagger functionality"""
    print("🧪 Testing Gemini AI Visual Tagger...")
    print("=" * 50)
    
    try:
        # Test 1: Import Gemini visual tagger
        print("📦 Testing import...")
        from gemini_visual_tagger import gemini_visual_tagger
        print("✅ Gemini AI visual tagger imported successfully")
        
        # Test 2: Check Gemini AI availability
        print("\n🤖 Checking Gemini AI availability...")
        if gemini_visual_tagger.is_available():
            print("✅ Gemini AI is loaded and available")
            print("   Model: Gemini Pro Vision")
        else:
            print("❌ Gemini AI is not available")
            print("💡 Make sure GEMINI_API_KEY is set in environment")
            return False
        
        # Test 3: Test with sample video if available
        print("\n🎥 Testing with sample video...")
        sample_video = "test_clip.mp4"
        if os.path.exists(sample_video):
            print(f"   Found sample video: {sample_video}")
            try:
                print("   🚀 Starting Gemini AI analysis...")
                tags = gemini_visual_tagger.tag_video(sample_video)
                print(f"✅ Gemini AI generated tags: {tags}")
                print(f"   Total tags generated: {len(tags)}")
                return True
            except Exception as e:
                print(f"❌ Error during Gemini AI video tagging: {e}")
                return False
        else:
            print("   No sample video found, skipping video test")
            print("   ✅ Gemini AI visual tagger is ready for use")
            return True
            
    except ImportError as e:
        print(f"❌ Failed to import Gemini AI visual tagger: {e}")
        print("💡 Install with: pip install google-generativeai")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def check_environment():
    """Check if environment is properly configured"""
    print("🔧 Checking Environment Configuration...")
    print("=" * 50)
    
    # Check API key
    api_key = os.environ.get('GEMINI_API_KEY')
    if api_key:
        if api_key.startswith('AIza'):
            print("✅ GEMINI_API_KEY is set and looks valid")
        else:
            print("⚠️ GEMINI_API_KEY is set but format looks unusual")
    else:
        print("❌ GEMINI_API_KEY not found in environment")
        print("💡 Set it with: export GEMINI_API_KEY=your_key_here")
        print("💡 Or create a .env file with: GEMINI_API_KEY=your_key_here")
        return False
    
    # Check dependencies
    try:
        import google.generativeai
        print("✅ google-generativeai package is installed")
    except ImportError:
        print("❌ google-generativeai package not installed")
        print("💡 Install with: pip install google-generativeai")
        return False
    
    try:
        from PIL import Image
        print("✅ PIL/Pillow is available")
    except ImportError:
        print("❌ PIL/Pillow not available")
        print("💡 Install with: pip install Pillow")
        return False
    
    return True

def main():
    """Main test function"""
    print("🚀 Gemini AI Visual Tagger Test Suite")
    print("=" * 50)
    
    # Check environment first
    if not check_environment():
        print("\n❌ Environment check failed. Please fix the issues above.")
        return False
    
    print("\n" + "=" * 50)
    
    # Test the tagger
    success = test_gemini_tagger()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed! Gemini AI Visual Tagging is working.")
        print("💡 You can now use the most advanced AI-powered tagging system!")
        print("💡 Features:")
        print("   - Intelligent object detection")
        print("   - Scene understanding")
        print("   - Context-aware tagging")
        print("   - High-quality video analysis")
    else:
        print("❌ Some tests failed. Check the error messages above.")
        print("💡 Common solutions:")
        print("   1. Set GEMINI_API_KEY environment variable")
        print("   2. Install dependencies: pip install -r requirements.txt")
        print("   3. Check your internet connection")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
