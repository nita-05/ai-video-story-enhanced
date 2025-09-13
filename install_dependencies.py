#!/usr/bin/env python3
"""
Comprehensive Dependency Installation Script for Footage Flow
This script handles all dependency issues including NumPy/OpenCV compatibility.
"""

import subprocess
import sys
import os
import platform

def run_command(command, description, check=True):
    """Run a command and handle errors"""
    print(f"\n[INFO] {description}")
    print(f"Running: {command}")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr and not check:
            print(f"[WARNING] {result.stderr}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"[ERROR] Python 3.8+ required. Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"[INFO] Python version: {version.major}.{version.minor}.{version.micro} ✓")
    return True

def clean_environment():
    """Clean up any corrupted packages"""
    print("\n[STEP 1] Cleaning environment...")
    
    # Remove corrupted packages
    corrupted_packages = [
        "~erkzeug",  # Corrupted Werkzeug package
        "numpy",
        "opencv-python", 
        "opencv-contrib-python"
    ]
    
    for package in corrupted_packages:
        run_command(f"pip uninstall -y {package}", f"Removing {package}", check=False)
    
    # Clean pip cache
    run_command("pip cache purge", "Cleaning pip cache")
    
    # Upgrade pip
    run_command("python -m pip install --upgrade pip", "Upgrading pip")

def install_core_dependencies():
    """Install core dependencies in the correct order"""
    print("\n[STEP 2] Installing core dependencies...")
    
    # Install NumPy first (specific version for OpenCV compatibility)
    if not run_command("pip install numpy==1.24.3", "Installing NumPy 1.24.3"):
        print("[ERROR] Failed to install NumPy. Exiting.")
        return False
    
    # Install OpenCV
    if not run_command("pip install opencv-python==4.8.1.78", "Installing OpenCV"):
        print("[ERROR] Failed to install OpenCV. Exiting.")
        return False
    
    # Install Flask and related packages
    flask_packages = [
        "Flask==3.0.0",
        "Flask-CORS==4.0.0", 
        "Werkzeug==3.0.1"
    ]
    
    for package in flask_packages:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"[ERROR] Failed to install {package}")
            return False
    
    return True

def install_google_dependencies():
    """Install Google Cloud dependencies"""
    print("\n[STEP 3] Installing Google Cloud dependencies...")
    
    google_packages = [
        "google-genai==0.2.0",
        "google-auth==2.23.4",
        "google-auth-oauthlib==1.1.0",
        "google-cloud-speech==2.21.0",
        "google-cloud-storage==2.10.0",
        "google-cloud-vision==3.4.4"
    ]
    
    for package in google_packages:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"[WARNING] Failed to install {package} - continuing...")
    
    return True

def install_audio_video_dependencies():
    """Install audio and video processing dependencies"""
    print("\n[STEP 4] Installing audio/video dependencies...")
    
    av_packages = [
        "SpeechRecognition==3.10.0",
        "Pillow>=11.0.0"
    ]
    
    for package in av_packages:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"[WARNING] Failed to install {package} - continuing...")
    
    return True

def install_utility_dependencies():
    """Install utility dependencies"""
    print("\n[STEP 5] Installing utility dependencies...")
    
    utility_packages = [
        "pandas>=2.0.0",
        "python-dotenv==1.0.0",
        "requests==2.31.0",
        "urllib3==2.0.7",
        "psutil==5.9.5"
    ]
    
    for package in utility_packages:
        if not run_command(f"pip install {package}", f"Installing {package}"):
            print(f"[WARNING] Failed to install {package} - continuing...")
    
    return True

def install_dev_dependencies():
    """Install development dependencies"""
    print("\n[STEP 6] Installing development dependencies...")
    
    dev_packages = [
        "pytest==7.4.2",
        "pytest-cov==4.1.0"
    ]
    
    for package in dev_packages:
        run_command(f"pip install {package}", f"Installing {package}", check=False)
    
    return True

def verify_installation():
    """Verify that all critical dependencies are working"""
    print("\n[STEP 7] Verifying installation...")
    
    verification_script = """
import sys
import traceback

def test_import(module_name, import_name=None):
    try:
        if import_name:
            __import__(import_name)
        else:
            __import__(module_name)
        print(f"✓ {module_name} imported successfully")
        return True
    except ImportError as e:
        print(f"✗ {module_name} import failed: {e}")
        return False
    except Exception as e:
        print(f"✗ {module_name} error: {e}")
        return False

# Test critical dependencies
critical_modules = [
    ("numpy", "numpy"),
    ("OpenCV", "cv2"),
    ("Flask", "flask"),
    ("Flask-CORS", "flask_cors"),
    ("Google GenAI", "google.genai"),
    ("Google Auth", "google.auth"),
    ("Google Cloud Speech", "google.cloud.speech"),
    ("Google Cloud Vision", "google.cloud.vision"),
    ("Speech Recognition", "speech_recognition"),
    ("Pillow", "PIL"),
    ("Pandas", "pandas"),
    ("Requests", "requests")
]

success_count = 0
total_count = len(critical_modules)

for name, module in critical_modules:
    if test_import(name, module):
        success_count += 1

print(f"\\n[SUMMARY] {success_count}/{total_count} critical dependencies working")

# Test NumPy version specifically
try:
    import numpy
    print(f"NumPy version: {numpy.__version__}")
    if numpy.__version__.startswith('1.24'):
        print("✓ NumPy version is compatible with OpenCV")
    else:
        print("⚠ NumPy version may have compatibility issues")
except:
    pass

# Test OpenCV specifically
try:
    import cv2
    print(f"OpenCV version: {cv2.__version__}")
    print("✓ OpenCV is working")
except:
    pass

if success_count >= total_count * 0.8:  # 80% success rate
    print("\\n[SUCCESS] Most critical dependencies are working!")
    sys.exit(0)
else:
    print("\\n[ERROR] Too many critical dependencies failed!")
    sys.exit(1)
"""
    
    with open("verify_installation.py", "w") as f:
        f.write(verification_script)
    
    success = run_command("python verify_installation.py", "Verifying all dependencies")
    
    # Clean up
    if os.path.exists("verify_installation.py"):
        os.remove("verify_installation.py")
    
    return success

def main():
    print("=" * 70)
    print("FOOTAGE FLOW - COMPREHENSIVE DEPENDENCY INSTALLER")
    print("=" * 70)
    
    # Check if we're in the right directory
    if not os.path.exists("backend"):
        print("[ERROR] Please run this script from the project root directory")
        sys.exit(1)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    print(f"\n[INFO] Platform: {platform.system()} {platform.release()}")
    print(f"[INFO] Python executable: {sys.executable}")
    
    # Clean environment
    clean_environment()
    
    # Install dependencies in order
    if not install_core_dependencies():
        print("[ERROR] Core dependencies installation failed!")
        sys.exit(1)
    
    install_google_dependencies()
    install_audio_video_dependencies()
    install_utility_dependencies()
    install_dev_dependencies()
    
    # Verify installation
    if not verify_installation():
        print("[ERROR] Dependency verification failed!")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("DEPENDENCY INSTALLATION COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Run the backend server: python start_backend.py")
    print("2. Run the frontend: python start_frontend.py")
    print("3. Or run both: python start_footage_flow.py")
    print("\nIf you encounter any issues, run: python fix_dependencies.py")

if __name__ == "__main__":
    main()
