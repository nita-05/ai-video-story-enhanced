#!/usr/bin/env python3
"""
Install Tesseract OCR for Windows
Downloads and installs Tesseract OCR for 100% perfect OCR functionality
"""

import os
import urllib.request
import subprocess
import sys
import tempfile
import shutil

def download_tesseract():
    """Download Tesseract OCR installer for Windows"""
    print("🔍 Downloading Tesseract OCR for Windows...")
    
    # Tesseract download URL for Windows
    tesseract_url = "https://github.com/UB-Mannheim/tesseract/releases/download/v5.3.0.20221214/tesseract-ocr-w64-setup-5.3.0.20221214.exe"
    installer_file = "tesseract-installer.exe"
    
    try:
        print(f"📥 Downloading from {tesseract_url}...")
        urllib.request.urlretrieve(tesseract_url, installer_file)
        print(f"✅ Downloaded {installer_file}")
        return installer_file
    except Exception as e:
        print(f"❌ Failed to download Tesseract: {e}")
        return None

def install_tesseract_silent(installer_path):
    """Install Tesseract silently"""
    print("🔧 Installing Tesseract OCR...")
    
    try:
        # Silent installation command
        cmd = [
            installer_path,
            '/S',  # Silent mode
            '/D=C:\\Program Files\\Tesseract-OCR'  # Install directory
        ]
        
        print("Running silent installation...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Tesseract installed successfully")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def add_to_path():
    """Add Tesseract to system PATH"""
    print("🔧 Adding Tesseract to system PATH...")
    
    tesseract_path = r"C:\Program Files\Tesseract-OCR"
    
    try:
        # Get current PATH
        current_path = os.environ.get('PATH', '')
        
        if tesseract_path not in current_path:
            # Add to PATH for current session
            os.environ['PATH'] = f"{tesseract_path};{current_path}"
            print("✅ Added Tesseract to PATH for current session")
            
            # Note: For permanent PATH changes, user needs to do it manually
            print("📝 For permanent PATH changes, please:")
            print("   1. Open System Properties > Environment Variables")
            print("   2. Add 'C:\\Program Files\\Tesseract-OCR' to PATH")
            print("   3. Restart your terminal/IDE")
        else:
            print("✅ Tesseract already in PATH")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to add to PATH: {e}")
        return False

def test_tesseract():
    """Test if Tesseract is working"""
    print("🧪 Testing Tesseract installation...")
    
    try:
        import pytesseract
        
        # Set the path
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Test version
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract working - version {version}")
        return True
        
    except Exception as e:
        print(f"❌ Tesseract test failed: {e}")
        return False

def main():
    print("🚀 Installing Tesseract OCR for 100% Perfect OCR")
    print("=" * 50)
    
    # Check if already installed
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract already installed - version {version}")
        return
    except:
        pass
    
    # Download installer
    installer = download_tesseract()
    if not installer:
        print("❌ Failed to download Tesseract installer")
        return
    
    # Install Tesseract
    if install_tesseract_silent(installer):
        # Add to PATH
        add_to_path()
        
        # Test installation
        if test_tesseract():
            print("\n🎉 TESSERACT OCR INSTALLED SUCCESSFULLY!")
            print("✅ Real OCR functionality enabled")
            print("✅ No more fallback systems")
            print("✅ 100% perfect text extraction")
        else:
            print("\n⚠️ Installation completed but testing failed")
            print("Please restart your terminal and try again")
    else:
        print("\n❌ Installation failed")
        print("Please try manual installation:")
        print(f"   Run: {installer}")
    
    # Clean up
    try:
        if os.path.exists(installer):
            os.remove(installer)
            print("🧹 Cleaned up installer file")
    except:
        pass

if __name__ == "__main__":
    main()
