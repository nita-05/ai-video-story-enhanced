#!/usr/bin/env python3
"""
Force Tesseract Fix - Comprehensive Solution
This will either find existing Tesseract or provide alternative solutions
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_tesseract_installation():
    """Comprehensive check for Tesseract installation"""
    print("🔍 COMPREHENSIVE TESSERACT CHECK")
    print("=" * 50)
    
    # Check common installation paths
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(os.getenv('USERNAME')),
        r"C:\Tesseract-OCR\tesseract.exe",
        r"C:\tesseract\tesseract.exe",
        r"C:\ProgramData\Tesseract-OCR\tesseract.exe"
    ]
    
    found_paths = []
    for path in possible_paths:
        if os.path.exists(path):
            found_paths.append(path)
            print(f"✅ Found: {path}")
    
    # Check if tesseract is in PATH
    try:
        result = subprocess.run(['where', 'tesseract'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            path_in_path = result.stdout.strip().split('\n')[0]
            if path_in_path not in found_paths:
                found_paths.append(path_in_path)
                print(f"✅ Found in PATH: {path_in_path}")
    except:
        pass
    
    if not found_paths:
        print("❌ Tesseract not found in any common location")
        return None, "NOT_INSTALLED"
    
    # Test the first found path
    test_path = found_paths[0]
    try:
        result = subprocess.run([test_path, '--version'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ Tesseract working: {result.stdout.strip()}")
            return test_path, "WORKING"
        else:
            print(f"❌ Tesseract found but not working: {result.stderr}")
            return test_path, "BROKEN"
    except Exception as e:
        print(f"❌ Tesseract test failed: {e}")
        return test_path, "BROKEN"

def fix_enhanced_transcription(tesseract_path):
    """Fix the enhanced_transcription.py file"""
    print(f"\n🔧 FIXING ENHANCED_TRANSCRIPTION.PY")
    print("=" * 50)
    
    transcription_file = "enhanced_transcription.py"
    
    if not os.path.exists(transcription_file):
        print(f"❌ {transcription_file} not found")
        return False
    
    try:
        with open(transcription_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update tesseract configuration
        if "tesseract_cmd = 'tesseract'" in content:
            new_content = content.replace(
                "tesseract_cmd = 'tesseract'",
                f"tesseract_cmd = r'{tesseract_path}'"
            )
        elif "tesseract_cmd =" in content:
            # Find and replace existing tesseract_cmd
            import re
            pattern = r"tesseract_cmd\s*=\s*['\"][^'\"]*['\"]"
            new_content = re.sub(pattern, f"tesseract_cmd = r'{tesseract_path}'", content)
        else:
            print("❌ Could not find tesseract_cmd in file")
            return False
        
        with open(transcription_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Updated {transcription_file} with path: {tesseract_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating file: {e}")
        return False

def create_alternative_solution():
    """Create alternative solution if Tesseract is not available"""
    print(f"\n🔄 CREATING ALTERNATIVE SOLUTION")
    print("=" * 50)
    
    # Create a simple OCR fallback that at least tries to work
    fallback_code = '''
# Enhanced OCR Fallback
import cv2
import numpy as np
from PIL import Image
import pytesseract

def enhanced_ocr_fallback(video_path, max_frames=10):
    """Enhanced OCR fallback with better error handling"""
    try:
        # Try to find tesseract in common locations
        tesseract_paths = [
            r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
            r"C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
            "tesseract"  # Fallback to PATH
        ]
        
        for path in tesseract_paths:
            try:
                pytesseract.pytesseract.tesseract_cmd = path
                # Test if it works
                pytesseract.get_tesseract_version()
                print(f"✅ Using Tesseract at: {path}")
                break
            except:
                continue
        else:
            print("❌ No working Tesseract found")
            return "No OCR available - Tesseract not properly installed"
        
        # Extract frames and perform OCR
        cap = cv2.VideoCapture(video_path)
        all_text = []
        
        frame_count = 0
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert to PIL Image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            
            # Perform OCR
            try:
                text = pytesseract.image_to_string(pil_image, lang='eng')
                if text.strip():
                    all_text.append(text.strip())
            except Exception as e:
                print(f"OCR error on frame {frame_count}: {e}")
            
            frame_count += 1
        
        cap.release()
        
        if all_text:
            return "\\n".join(all_text)
        else:
            return "No text detected in video frames"
            
    except Exception as e:
        return f"OCR processing failed: {str(e)}"
'''
    
    # Write the fallback to a file
    with open("ocr_fallback.py", 'w', encoding='utf-8') as f:
        f.write(fallback_code)
    
    print("✅ Created enhanced OCR fallback")
    return True

def main():
    print("🚀 FORCE TESSERACT FIX - COMPREHENSIVE SOLUTION")
    print("=" * 60)
    
    # Check current status
    tesseract_path, status = check_tesseract_installation()
    
    if status == "WORKING":
        print(f"\n✅ TESSERACT IS WORKING!")
        print(f"📍 Path: {tesseract_path}")
        
        # Fix the configuration
        if fix_enhanced_transcription(tesseract_path):
            print("\n🎯 SOLUTION COMPLETE!")
            print("🔄 Restart your backend server")
            print("🎯 You should now see: 'REAL AI OCR: ENABLED (Tesseract)'")
        else:
            print("\n❌ Configuration update failed")
    
    elif status == "BROKEN":
        print(f"\n⚠️ TESSERACT FOUND BUT BROKEN")
        print(f"📍 Path: {tesseract_path}")
        print("🔧 Try reinstalling Tesseract")
    
    else:  # NOT_INSTALLED
        print(f"\n❌ TESSERACT NOT PROPERLY INSTALLED")
        print("\n🔧 INSTALLATION REQUIRED:")
        print("1. Download from: https://github.com/UB-Mannheim/tesseract/wiki")
        print("2. Install with 'Add to PATH' option checked")
        print("3. Restart computer")
        print("4. Run this script again")
        
        # Create alternative solution
        create_alternative_solution()
        print("\n🔄 Alternative OCR fallback created")

if __name__ == "__main__":
    main()
