#!/usr/bin/env python3
"""
Fix Tesseract PATH and Configuration
This script will find Tesseract installation and configure it properly
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def find_tesseract():
    """Find Tesseract installation on Windows"""
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(os.getenv('USERNAME')),
        r"C:\Tesseract-OCR\tesseract.exe",
        r"C:\tesseract\tesseract.exe"
    ]
    
    print("🔍 Searching for Tesseract installation...")
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✅ Found Tesseract at: {path}")
            return path
    
    # Try to find in PATH
    try:
        result = subprocess.run(['where', 'tesseract'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            path = result.stdout.strip().split('\n')[0]
            print(f"✅ Found Tesseract in PATH: {path}")
            return path
    except:
        pass
    
    print("❌ Tesseract not found in common locations")
    return None

def test_tesseract(path):
    """Test if Tesseract works"""
    try:
        result = subprocess.run([path, '--version'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ Tesseract test successful: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ Tesseract test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Tesseract test error: {e}")
        return False

def update_environment_file():
    """Update the environment configuration"""
    tesseract_path = find_tesseract()
    
    if not tesseract_path:
        print("❌ Cannot fix Tesseract - installation not found")
        print("\n🔧 MANUAL FIX REQUIRED:")
        print("1. Reinstall Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki")
        print("2. Make sure to check 'Add Tesseract to PATH' during installation")
        print("3. Restart your computer after installation")
        return False
    
    if not test_tesseract(tesseract_path):
        print("❌ Tesseract found but not working properly")
        return False
    
    # Update the enhanced_transcription.py file with the correct path
    transcription_file = "enhanced_transcription.py"
    
    if os.path.exists(transcription_file):
        print(f"🔧 Updating {transcription_file} with correct Tesseract path...")
        
        with open(transcription_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update the tesseract path configuration
        new_content = content.replace(
            "tesseract_cmd = 'tesseract'",
            f"tesseract_cmd = r'{tesseract_path}'"
        )
        
        with open(transcription_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Updated {transcription_file} with path: {tesseract_path}")
        return True
    else:
        print(f"❌ {transcription_file} not found")
        return False

def main():
    print("🚀 Tesseract PATH Fix Tool")
    print("=" * 50)
    
    success = update_environment_file()
    
    if success:
        print("\n✅ TESSERACT FIXED SUCCESSFULLY!")
        print("🔄 Please restart your backend server to apply changes")
        print("🎯 You should now see: 'REAL AI OCR: ENABLED (Tesseract)'")
    else:
        print("\n❌ TESSERACT FIX FAILED")
        print("🔧 Manual intervention required")

if __name__ == "__main__":
    main()
