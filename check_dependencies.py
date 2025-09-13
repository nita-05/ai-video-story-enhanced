#!/usr/bin/env python3
"""
Dependency Checker for Footage Flow
Quickly check the status of all dependencies and identify issues.
"""

import sys
import subprocess
import importlib.util

def check_package(package_name, import_name=None):
    """Check if a package is installed and can be imported"""
    try:
        if import_name:
            module = importlib.import_module(import_name)
        else:
            module = importlib.import_module(package_name)
        
        # Try to get version
        version = "unknown"
        try:
            if hasattr(module, '__version__'):
                version = module.__version__
            elif hasattr(module, 'version'):
                version = module.version
        except:
            pass
        
        print(f"✓ {package_name} (v{version})")
        return True
    except ImportError as e:
        print(f"✗ {package_name} - NOT INSTALLED")
        return False
    except Exception as e:
        print(f"⚠ {package_name} - ERROR: {str(e)}")
        return False

def check_pip_package(package_name):
    """Check if a package is installed via pip"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "show", package_name],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("=" * 60)
    print("FOOTAGE FLOW - DEPENDENCY CHECKER")
    print("=" * 60)
    
    print(f"\nPython version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    
    # Critical dependencies
    print("\n[CRITICAL DEPENDENCIES]")
    critical_deps = [
        ("numpy", "numpy"),
        ("opencv-python", "cv2"),
        ("Flask", "flask"),
        ("Flask-CORS", "flask_cors"),
        ("Werkzeug", "werkzeug"),
        ("google-genai", "google.genai"),
        ("google-auth", "google.auth"),
        ("google-cloud-speech", "google.cloud.speech"),
        ("google-cloud-vision", "google.cloud.vision"),
        ("google-cloud-storage", "google.cloud.storage"),
        ("SpeechRecognition", "speech_recognition"),
        ("Pillow", "PIL"),
        ("pandas", "pandas"),
        ("requests", "requests"),
        ("python-dotenv", "dotenv")
    ]
    
    critical_success = 0
    for package, import_name in critical_deps:
        if check_package(package, import_name):
            critical_success += 1
    
    # Development dependencies
    print("\n[DEVELOPMENT DEPENDENCIES]")
    dev_deps = [
        ("pytest", "pytest"),
        ("pytest-cov", "pytest_cov"),
        ("psutil", "psutil")
    ]
    
    dev_success = 0
    for package, import_name in dev_deps:
        if check_package(package, import_name):
            dev_success += 1
    
    # Check for corrupted packages
    print("\n[CORRUPTED PACKAGES CHECK]")
    corrupted_packages = ["~erkzeug"]
    for package in corrupted_packages:
        if check_pip_package(package):
            print(f"⚠ {package} - CORRUPTED PACKAGE DETECTED")
        else:
            print(f"✓ {package} - Not found (good)")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Critical dependencies: {critical_success}/{len(critical_deps)} working")
    print(f"Development dependencies: {dev_success}/{len(dev_deps)} working")
    
    if critical_success >= len(critical_deps) * 0.8:
        print("\n✅ Most dependencies are working correctly!")
        if critical_success == len(critical_deps):
            print("🎉 All critical dependencies are working!")
    else:
        print("\n❌ Many dependencies are missing or broken!")
        print("\nTo fix dependencies, run:")
        print("python install_dependencies.py")
    
    # Check NumPy version specifically
    try:
        import numpy
        print(f"\nNumPy version: {numpy.__version__}")
        if numpy.__version__.startswith('1.24'):
            print("✅ NumPy version is compatible with OpenCV")
        elif numpy.__version__.startswith('2.'):
            print("⚠️  NumPy 2.x detected - may cause OpenCV issues")
            print("   Consider downgrading to NumPy 1.24.3")
        else:
            print("⚠️  Unknown NumPy version")
    except:
        print("\n❌ NumPy not installed")
    
    # Check OpenCV specifically
    try:
        import cv2
        print(f"OpenCV version: {cv2.__version__}")
        print("✅ OpenCV is working")
    except Exception as e:
        print(f"❌ OpenCV error: {e}")

if __name__ == "__main__":
    main()
