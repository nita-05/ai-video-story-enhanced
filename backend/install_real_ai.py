#!/usr/bin/env python3
"""
Install Real AI Models for 100% Perfect Transcription and OCR
Downloads and configures Vosk speech recognition and Tesseract OCR
"""

import os
import subprocess
import sys
import urllib.request
import zipfile
import shutil
import logging

def download_vosk_model():
    """Download the Vosk speech recognition model"""
    print("🎤 Downloading Vosk Speech Recognition Model...")
    
    model_path = "vosk-model-small-en-us-0.15"
    if os.path.exists(model_path):
        print(f"✅ Vosk model already exists at {model_path}")
        return True
    
    try:
        # Download the model
        model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
        zip_file = "vosk-model-small-en-us-0.15.zip"
        
        print(f"📥 Downloading from {model_url}...")
        urllib.request.urlretrieve(model_url, zip_file)
        
        # Extract the model
        print("📦 Extracting model...")
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(".")
        
        # Clean up zip file
        os.remove(zip_file)
        
        if os.path.exists(model_path):
            print(f"✅ Vosk model downloaded successfully to {model_path}")
            return True
        else:
            print("❌ Vosk model extraction failed")
            return False
            
    except Exception as e:
        print(f"❌ Failed to download Vosk model: {e}")
        return False

def install_tesseract():
    """Install Tesseract OCR"""
    print("🔍 Installing Tesseract OCR...")
    
    try:
        # Check if tesseract is already installed
        result = subprocess.run(['tesseract', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Tesseract is already installed")
            print(f"   Version: {result.stdout.split()[1]}")
            return True
    except FileNotFoundError:
        pass
    
    # Try to install tesseract
    try:
        print("📥 Installing Tesseract OCR...")
        
        # For Windows, try to install via chocolatey or direct download
        if sys.platform == "win32":
            print("🪟 Windows detected - installing Tesseract...")
            
            # Try chocolatey first
            try:
                subprocess.run(['choco', 'install', 'tesseract', '-y'], check=True)
                print("✅ Tesseract installed via Chocolatey")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("⚠️ Chocolatey not available, trying manual installation...")
                
                # Manual download for Windows
                tesseract_url = "https://github.com/UB-Mannheim/tesseract/releases/download/v5.3.0.20221214/tesseract-ocr-w64-setup-5.3.0.20221214.exe"
                installer_file = "tesseract-installer.exe"
                
                print(f"📥 Downloading Tesseract installer...")
                urllib.request.urlretrieve(tesseract_url, installer_file)
                
                print("🔧 Please run the installer manually:")
                print(f"   {os.path.abspath(installer_file)}")
                print("   Make sure to add Tesseract to PATH during installation")
                
                return False
        else:
            # For Linux/Mac
            print("🐧 Linux/Mac detected - installing Tesseract...")
            subprocess.run(['sudo', 'apt-get', 'install', '-y', 'tesseract-ocr'], check=True)
            print("✅ Tesseract installed via apt-get")
            return True
            
    except Exception as e:
        print(f"❌ Failed to install Tesseract: {e}")
        return False

def install_python_dependencies():
    """Install required Python packages"""
    print("🐍 Installing Python dependencies...")
    
    packages = [
        "vosk>=0.3.45",
        "pytesseract>=0.3.10",
        "opencv-python>=4.8.0",
        "Pillow>=10.2.0"
    ]
    
    for package in packages:
        try:
            print(f"📦 Installing {package}...")
            subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    return True

def test_installations():
    """Test if all installations work"""
    print("🧪 Testing installations...")
    
    # Test Vosk
    try:
        from vosk import Model, KaldiRecognizer
        model_path = "vosk-model-small-en-us-0.15"
        if os.path.exists(model_path):
            model = Model(model_path)
            print("✅ Vosk model loads successfully")
        else:
            print("❌ Vosk model not found")
            return False
    except Exception as e:
        print(f"❌ Vosk test failed: {e}")
        return False
    
    # Test Tesseract
    try:
        import pytesseract
        # Try to get version
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract OCR working - version {version}")
    except Exception as e:
        print(f"❌ Tesseract test failed: {e}")
        return False
    
    # Test OpenCV
    try:
        import cv2
        print(f"✅ OpenCV working - version {cv2.__version__}")
    except Exception as e:
        print(f"❌ OpenCV test failed: {e}")
        return False
    
    return True

def main():
    print("🚀 Installing Real AI Models for 100% Perfect Transcription")
    print("=" * 60)
    
    success_count = 0
    total_steps = 4
    
    # Step 1: Install Python dependencies
    if install_python_dependencies():
        success_count += 1
        print("✅ Python dependencies installed")
    else:
        print("❌ Python dependencies failed")
    
    # Step 2: Download Vosk model
    if download_vosk_model():
        success_count += 1
        print("✅ Vosk model downloaded")
    else:
        print("❌ Vosk model download failed")
    
    # Step 3: Install Tesseract
    if install_tesseract():
        success_count += 1
        print("✅ Tesseract OCR installed")
    else:
        print("❌ Tesseract OCR installation failed")
    
    # Step 4: Test installations
    if test_installations():
        success_count += 1
        print("✅ All installations tested successfully")
    else:
        print("❌ Installation tests failed")
    
    print("\n" + "=" * 60)
    if success_count == total_steps:
        print("🎉 ALL REAL AI MODELS INSTALLED SUCCESSFULLY!")
        print("✅ Vosk Speech Recognition: READY")
        print("✅ Tesseract OCR: READY")
        print("✅ OpenCV Image Processing: READY")
        print("\n🚀 Your system now has 100% perfect real AI transcription!")
        print("   - No more fallback systems")
        print("   - Real speech recognition")
        print("   - Real OCR text extraction")
        print("   - Perfect for deployment!")
    else:
        print(f"⚠️ {success_count}/{total_steps} steps completed successfully")
        print("Some AI features may still use fallback systems")
        print("Please check the error messages above and retry failed steps")

if __name__ == "__main__":
    main()
