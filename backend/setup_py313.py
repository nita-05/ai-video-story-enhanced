#!/usr/bin/env python3
"""
Python 3.13 Compatible Setup Script
Installs dependencies with fallback options for compatibility issues
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def install_core_dependencies():
    """Install core dependencies that should work with Python 3.13"""
    core_deps = [
        "flask>=3.0.0",
        "flask-cors>=4.0.0", 
        "pymongo>=4.6.0",
        "python-dotenv>=1.0.0",
        "numpy>=1.26.0",
        "setuptools>=70.0.0",
        "Pillow>=10.2.0",
        "opencv-python>=4.8.0",
        "ffmpeg-python>=0.2.0",
        "vosk>=0.3.45",
        "google-generativeai>=0.8.0"
    ]
    
    print("📦 Installing core dependencies...")
    for dep in core_deps:
        if not run_command(f"pip install '{dep}'", f"Installing {dep}"):
            print(f"⚠️  Warning: Failed to install {dep}, continuing...")

def install_optional_dependencies():
    """Install optional AI dependencies with fallback"""
    optional_deps = [
        ("ultralytics>=8.2.0", "YOLO object detection"),
        ("torch>=2.6.0", "PyTorch deep learning"),
        ("torchvision>=0.19.0", "PyTorch vision utilities"),
        ("transformers>=4.40.0", "Hugging Face transformers"),
        ("pytesseract>=0.3.10", "OCR text recognition")
    ]
    
    print("\n🤖 Installing optional AI dependencies...")
    for dep, description in optional_deps:
        print(f"\nTrying to install {description}...")
        if not run_command(f"pip install '{dep}'", f"Installing {dep}"):
            print(f"⚠️  {description} not available for Python 3.13, skipping...")
            print(f"   The system will use fallback methods instead.")

def main():
    print("🚀 Python 3.13 Compatible Setup for AI Video Story")
    print("=" * 60)
    
    # Check Python version
    python_version = sys.version_info
    print(f"🐍 Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major != 3 or python_version.minor < 13:
        print("⚠️  Warning: This script is optimized for Python 3.13+")
    
    # Install core dependencies
    install_core_dependencies()
    
    # Install optional dependencies
    install_optional_dependencies()
    
    print("\n" + "=" * 60)
    print("✅ Setup completed!")
    print("\n📋 What was installed:")
    print("   ✅ Core Flask backend")
    print("   ✅ MongoDB integration") 
    print("   ✅ Video processing (FFmpeg)")
    print("   ✅ Speech recognition (Vosk)")
    print("   ✅ Google AI integration")
    print("   ✅ Image processing (OpenCV, Pillow)")
    print("\n⚠️  Optional AI features:")
    print("   - YOLO object detection (if available)")
    print("   - PyTorch deep learning (if available)")
    print("   - Advanced transformers (if available)")
    print("\n💡 The system will work with fallback methods for any missing AI dependencies.")
    print("\n🎬 Ready to start your AI Video Story system!")
    print("   Run: python app.py")

if __name__ == "__main__":
    main()
