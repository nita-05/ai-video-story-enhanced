#!/usr/bin/env python3
"""
Environment Setup Script for AI Video Story Backend
This script helps set up the required environment variables and checks dependencies.
"""

import os
import sys
import subprocess

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'flask', 'flask_cors', 'pymongo', 'python-dotenv', 
        'vosk', 'numpy', 'Pillow'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n📦 Install missing packages:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_mongodb():
    """Check MongoDB connection"""
    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ MongoDB is running locally")
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("💡 Make sure MongoDB is running on localhost:27017")
        return False

def create_env_file():
    """Create .env file with default values"""
    env_content = """# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=footageflow

# Gemini AI Configuration (optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# File Upload Configuration
MAX_CONTENT_LENGTH=524288000
UPLOAD_FOLDER=uploads
"""
    
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        print(f"⚠️ .env file already exists at {env_path}")
        return
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"✅ Created .env file at {env_path}")
        print("💡 Edit the file to customize your configuration")
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")

def main():
    """Main setup function"""
    print("🚀 AI Video Story Backend Environment Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return
    
    print("\n📦 Checking Dependencies:")
    if not check_dependencies():
        print("\n💡 Run 'pip install -r requirements.txt' to install dependencies")
        return
    
    print("\n🗄️ Checking MongoDB:")
    check_mongodb()
    
    print("\n🔧 Setting up Environment:")
    create_env_file()
    
    print("\n🎯 Next Steps:")
    print("1. Make sure MongoDB is running")
    print("2. Edit .env file if needed")
    print("3. Run: python backend/app.py")
    print("4. Or run: python start_footage_flow.py")

if __name__ == "__main__":
    main()
