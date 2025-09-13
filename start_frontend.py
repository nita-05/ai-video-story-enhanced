#!/usr/bin/env python3
"""
Footage Flow - Frontend Server Only
Simple script to start just the React frontend
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_banner():
    print("\n" + "="*50)
    print("    FOOTAGE FLOW - FRONTEND SERVER")
    print("="*50 + "\n")

def start_frontend():
    """Start the frontend server"""
    print("[INFO] Starting Frontend Server...")
    
    frontend_dir = Path(__file__).parent / "frontend"
    if not frontend_dir.exists():
        print("[ERROR] Frontend directory not found!")
        return False
    
    print(f"[INFO] Frontend directory: {frontend_dir}")
    
    # Change to frontend directory
    os.chdir(frontend_dir)
    print(f"[INFO] Current working directory: {os.getcwd()}")
    
    # Check if node_modules exists
    if not (frontend_dir / "node_modules").exists():
        print("[INFO] Installing Node.js dependencies...")
        try:
            # Use shell=True for Windows compatibility
            if platform.system() == "Windows":
                result = subprocess.run("npm install", shell=True, check=True, capture_output=True, text=True)
            else:
                result = subprocess.run(["npm", "install"], check=True, capture_output=True, text=True)
            print("[INFO] Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"[ERROR] Failed to install dependencies: {e}")
            if hasattr(e, 'stdout'):
                print(f"STDOUT: {e.stdout}")
            if hasattr(e, 'stderr'):
                print(f"STDERR: {e.stderr}")
            return False
        except FileNotFoundError:
            print("[ERROR] npm not found. Please install Node.js")
            return False
    else:
        print("[INFO] Dependencies already installed")
    
    # Start the development server
    print("[INFO] Starting React development server...")
    print("[INFO] Frontend will run on: http://localhost:5173")
    print("\n[INFO] Press Ctrl+C to stop the server...")
    
    try:
        # Use shell=True for Windows compatibility
        if platform.system() == "Windows":
            subprocess.run("npm run dev", shell=True, check=False)
        else:
            subprocess.run(["npm", "run", "dev"], check=False)
    except KeyboardInterrupt:
        print("\n[INFO] Frontend server stopped.")
    except Exception as e:
        print(f"[ERROR] Server failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print_banner()
    start_frontend()
