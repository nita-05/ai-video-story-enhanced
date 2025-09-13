#!/usr/bin/env python3
"""
Robust Frontend Startup Script
This script ensures all dependencies are installed and starts the frontend reliably.
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def install_dependencies():
    """Install all required dependencies"""
    print("🔧 Installing frontend dependencies...")
    
    frontend_dir = Path(__file__).parent
    os.chdir(frontend_dir)
    
    try:
        # Install npm dependencies
        print("Installing npm packages...")
        subprocess.check_call(["npm", "install"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("✅ npm packages installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ npm install failed: {e}")
        return False
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm first.")
        return False
    
    return True

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

def start_frontend():
    """Start the frontend development server"""
    print("🚀 Starting frontend server...")
    
    frontend_dir = Path(__file__).parent
    os.chdir(frontend_dir)
    
    try:
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Frontend stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend failed to start: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    print("🎯 AI Video Story Frontend Startup")
    print("=" * 50)
    
    # Check if backend is running
    print("🔍 Checking backend status...")
    if not check_backend_health():
        print("⚠️  Backend is not running. Please start the backend first.")
        print("   Run: python start_backend.py")
        return
    
    print("✅ Backend is healthy")
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Wait a moment for installations to complete
    time.sleep(2)
    
    # Start frontend
    print("\n🚀 Starting frontend...")
    start_frontend()

if __name__ == "__main__":
    main()
