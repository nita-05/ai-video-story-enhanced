#!/usr/bin/env python3
"""
Robust Backend Startup Script
This script ensures all dependencies are installed and starts the backend reliably.
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def install_dependencies():
    """Install all required dependencies"""
    print("🔧 Installing dependencies...")
    
    dependencies = [
        "brotlicffi",
        "brotli", 
        "requests",
        "urllib3",
        "pymongo",
        "flask",
        "flask-cors",
        "pyjwt",
        "google-auth",
        "google-auth-oauthlib",
        "google-auth-httplib2",
        "vosk",
        "opencv-python",
        "pillow",
        "numpy",
        "torch",
        "torchvision",
        "transformers",
        "google-generativeai"
    ]
    
    for dep in dependencies:
        try:
            print(f"Installing {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✅ {dep} installed successfully")
        except subprocess.CalledProcessError:
            print(f"⚠️  {dep} installation failed, continuing...")

def check_backend_health():
    """Check if backend is running and healthy"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get("status") == "healthy"
    except:
        pass
    return False

def start_backend():
    """Start the backend server"""
    print("🚀 Starting backend server...")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Start the Flask app
    try:
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend failed to start: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    print("🎯 AI Video Story Backend Startup")
    print("=" * 50)
    
    # Install dependencies
    install_dependencies()
    
    # Wait a moment for installations to complete
    time.sleep(2)
    
    # Start backend
    print("\n🚀 Starting backend...")
    start_backend()

if __name__ == "__main__":
    main()
