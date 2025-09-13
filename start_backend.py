#!/usr/bin/env python3
"""
Footage Flow - Backend Server Only
Simple script to start just the Flask backend
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_banner():
    print("\n" + "="*50)
    print("    FOOTAGE FLOW - BACKEND SERVER")
    print("="*50 + "\n")

def start_backend():
    """Start the backend server"""
    print("[INFO] Starting Backend Server...")
    
    backend_dir = Path(__file__).parent / "backend"
    if not backend_dir.exists():
        print("[ERROR] Backend directory not found!")
        return False
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Use global Python installation since dependencies are already installed
    python_path = sys.executable
    
    # Check if dependencies are available
    print("[INFO] Checking dependencies...")
    try:
        # Try to import Flask to check if dependencies are installed
        subprocess.run([python_path, "-c", "import flask"], check=True, capture_output=True)
        print("[INFO] Dependencies already installed")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Dependencies not found: {e}")
        print("[INFO] Please install dependencies using: pip install -r requirements.txt")
        return False
    
    # Start the server
    print("[INFO] Starting Flask server...")
    print("[INFO] Backend will run on: http://127.0.0.1:5000")
    print("[INFO] Health Check: http://127.0.0.1:5000/health")
    print("\n[INFO] Press Ctrl+C to stop the server...")
    
    try:
        subprocess.run([python_path, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n[INFO] Backend server stopped.")
    except Exception as e:
        print(f"[ERROR] Server failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print_banner()
    start_backend()
