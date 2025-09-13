#!/usr/bin/env python3
"""
Gemini API Key Setup Script
This script helps you set up your Gemini API key for the AI Video Story application.
"""

import os
import sys

def setup_gemini_api():
    print("🔑 Gemini API Key Setup")
    print("=" * 50)
    
    # Check if API key is already set
    current_key = os.getenv('GEMINI_API_KEY')
    if current_key and current_key != 'YOUR_ACTUAL_API_KEY_HERE':
        print(f"✅ API Key already set: {current_key[:10]}...")
        return True
    
    print("❌ No valid Gemini API key found!")
    print("\n📋 To get your API key:")
    print("1. Go to: https://aistudio.google.com/app/apikey")
    print("2. Sign in with your Google account")
    print("3. Click 'Create API Key'")
    print("4. Copy the generated key")
    print("\n🔧 To set the API key:")
    print("Option 1 - Set environment variable:")
    print("   set GEMINI_API_KEY=YOUR_ACTUAL_API_KEY")
    print("\nOption 2 - Create .env file in backend folder:")
    print("   Create file: backend/.env")
    print("   Add line: GEMINI_API_KEY=YOUR_ACTUAL_API_KEY")
    
    # Try to create .env file
    env_file = os.path.join('backend', '.env')
    if not os.path.exists(env_file):
        try:
            with open(env_file, 'w') as f:
                f.write("# Gemini AI API Key\n")
                f.write("# Replace YOUR_API_KEY_HERE with your actual Gemini API key\n")
                f.write("GEMINI_API_KEY=YOUR_API_KEY_HERE\n")
                f.write("\n# Other environment variables\n")
                f.write("FLASK_ENV=development\n")
                f.write("FLASK_DEBUG=True\n")
            print(f"\n✅ Created {env_file} template")
            print("📝 Please edit this file and replace YOUR_API_KEY_HERE with your actual API key")
        except Exception as e:
            print(f"❌ Could not create .env file: {e}")
    
    return False

def test_gemini_connection():
    """Test if Gemini API is working"""
    try:
        import google.genai as genai
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'YOUR_ACTUAL_API_KEY_HERE':
            print("❌ No valid API key found")
            return False
        
        # Initialize Gemini client
        client = genai.Client(api_key=api_key)
        
        # Test with a simple prompt
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Hello, this is a test message."
        )
        
        print("✅ Gemini API connection successful!")
        print(f"📝 Test response: {response.text[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ Gemini API test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AI Video Story - Gemini API Setup")
    print("=" * 50)
    
    # Setup API key
    if setup_gemini_api():
        # Test connection
        print("\n🧪 Testing Gemini API connection...")
        test_gemini_connection()
    else:
        print("\n⚠️  Please set up your API key first, then run this script again.")
    
    print("\n📚 Next steps:")
    print("1. Get your API key from https://aistudio.google.com/app/apikey")
    print("2. Set the GEMINI_API_KEY environment variable")
    print("3. Restart the backend server")
    print("4. Test story generation again")
