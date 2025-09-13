#!/usr/bin/env python3
"""
FFmpeg Auto-Installer for Windows
This script will download and install FFmpeg automatically
"""

import os
import sys
import subprocess
import zipfile
import requests
from pathlib import Path

def print_banner():
    print("\n" + "="*60)
    print("    FFMPEG AUTO-INSTALLER FOR WINDOWS")
    print("="*60 + "\n")

def check_ffmpeg():
    """Check if FFmpeg is already installed"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, check=True)
        print("✅ FFmpeg is already installed!")
        print(f"Version: {result.stdout.split('ffmpeg version ')[1].split()[0]}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def download_ffmpeg():
    """Download FFmpeg for Windows"""
    print("📥 Downloading FFmpeg...")
    
    # FFmpeg download URL (latest release)
    ffmpeg_url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    
    try:
        response = requests.get(ffmpeg_url, stream=True)
        response.raise_for_status()
        
        # Download to current directory
        zip_path = "ffmpeg.zip"
        total_size = int(response.headers.get('content-length', 0))
        
        with open(zip_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\r📥 Downloading... {progress:.1f}%", end='', flush=True)
        
        print(f"\n✅ Downloaded FFmpeg to {zip_path}")
        return zip_path
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return None

def install_ffmpeg(zip_path):
    """Extract and install FFmpeg"""
    print("🔧 Installing FFmpeg...")
    
    try:
        # Extract the zip file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall("ffmpeg_temp")
        
        # Find the bin directory
        bin_dir = None
        for root, dirs, files in os.walk("ffmpeg_temp"):
            if "bin" in dirs and "ffmpeg.exe" in os.listdir(os.path.join(root, "bin")):
                bin_dir = os.path.join(root, "bin")
                break
        
        if not bin_dir:
            print("❌ Could not find FFmpeg bin directory")
            return False
        
        # Copy to C:\ffmpeg
        install_dir = "C:\\ffmpeg"
        bin_install_dir = os.path.join(install_dir, "bin")
        
        os.makedirs(install_dir, exist_ok=True)
        os.makedirs(bin_install_dir, exist_ok=True)
        
        # Copy FFmpeg files
        import shutil
        for file in os.listdir(bin_dir):
            if file.endswith('.exe'):
                src = os.path.join(bin_dir, file)
                dst = os.path.join(bin_install_dir, file)
                shutil.copy2(src, dst)
                print(f"✅ Installed {file}")
        
        # Clean up
        shutil.rmtree("ffmpeg_temp")
        os.remove(zip_path)
        
        print(f"✅ FFmpeg installed to {bin_install_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False

def add_to_path():
    """Add FFmpeg to PATH environment variable"""
    print("🔧 Adding FFmpeg to PATH...")
    
    try:
        # Get current PATH
        current_path = os.environ.get('PATH', '')
        ffmpeg_path = "C:\\ffmpeg\\bin"
        
        if ffmpeg_path not in current_path:
            # Add to PATH for current session
            os.environ['PATH'] = ffmpeg_path + os.pathsep + current_path
            
            # Try to add to system PATH (requires admin)
            try:
                import winreg
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                                   "SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment", 
                                   0, winreg.KEY_ALL_ACCESS)
                
                current_system_path = winreg.QueryValueEx(key, "Path")[0]
                if ffmpeg_path not in current_system_path:
                    new_path = ffmpeg_path + os.pathsep + current_system_path
                    winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)
                    print("✅ Added FFmpeg to system PATH (requires restart)")
                else:
                    print("✅ FFmpeg already in system PATH")
                
                winreg.CloseKey(key)
                
            except Exception as e:
                print(f"⚠️ Could not add to system PATH: {e}")
                print("💡 Please manually add C:\\ffmpeg\\bin to your PATH environment variable")
                print("💡 Or restart your terminal to use FFmpeg in current session")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to update PATH: {e}")
        return False

def verify_installation():
    """Verify FFmpeg installation"""
    print("🔍 Verifying installation...")
    
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, check=True)
        print("✅ FFmpeg is working correctly!")
        print(f"Version: {result.stdout.split('ffmpeg version ')[1].split()[0]}")
        return True
    except Exception as e:
        print(f"❌ FFmpeg verification failed: {e}")
        return False

def main():
    print_banner()
    
    # Check if already installed
    if check_ffmpeg():
        return
    
    print("FFmpeg is not installed. Installing now...\n")
    
    # Download FFmpeg
    zip_path = download_ffmpeg()
    if not zip_path:
        print("❌ Installation failed at download step")
        return
    
    # Install FFmpeg
    if not install_ffmpeg(zip_path):
        print("❌ Installation failed at install step")
        return
    
    # Add to PATH
    if not add_to_path():
        print("❌ Installation failed at PATH update step")
        return
    
    # Verify installation
    if not verify_installation():
        print("❌ Installation failed at verification step")
        return
    
    print("\n" + "="*60)
    print("    🎉 FFMPEG INSTALLATION COMPLETE!")
    print("="*60)
    print("\n✅ FFmpeg is now installed and ready to use!")
    print("✅ Your AI Video Story Generator should now work properly!")
    print("\n💡 If you still get errors, please restart your terminal")
    print("💡 Or restart the backend server")

if __name__ == "__main__":
    main()
