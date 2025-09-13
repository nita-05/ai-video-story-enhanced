#!/usr/bin/env python3
"""
Test Gemini API Configuration
"""

import os
import sys
from config import load_env_file

def test_gemini_api():
    print("🔍 TESTING GEMINI API CONFIGURATION")
    print("=" * 50)
    
    # Load environment variables
    load_env_file()
    
    # Check API key
    api_key = os.environ.get('GEMINI_API_KEY')
    print(f"✅ API Key: {'CONFIGURED' if api_key else 'NOT CONFIGURED'}")
    
    if api_key:
        print(f"📍 Key length: {len(api_key)} characters")
        print(f"📍 Key starts with: {api_key[:10]}...")
        
        # Test Gemini import and configuration
        try:
            import google.generativeai as genai
            print("✅ Google Generative AI library imported successfully")
            
            genai.configure(api_key=api_key)
            print("✅ Gemini API configured successfully")
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            print("✅ Gemini model loaded successfully")
            
            # Test a simple generation
            response = model.generate_content("Say 'Hello, Gemini is working!'")
            print(f"✅ Test generation successful: {response.text}")
            
            print("\n🎯 STORY GENERATION STATUS:")
            print("✅ REAL AI (Gemini) - ENABLED")
            print("🎉 Your story generation will use REAL AI!")
            
            return True
            
        except Exception as e:
            print(f"❌ Gemini test failed: {e}")
            print("\n🔄 STORY GENERATION STATUS:")
            print("❌ FALLBACK MODE - Simple Algorithm")
            print("🔧 Check your API key or internet connection")
            return False
    else:
        print("❌ No API key found in environment")
        return False

if __name__ == "__main__":
    test_gemini_api()
