#!/usr/bin/env python3
"""
Dependency Fix Script for Footage Flow
This script fixes NumPy/OpenCV compatibility issues and other dependency conflicts.
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n[INFO] {description}")
    print(f"Running: {command}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"[SUCCESS] {description}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("=" * 60)
    print("FOOTAGE FLOW - DEPENDENCY FIX SCRIPT")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists("backend"):
        print("[ERROR] Please run this script from the project root directory")
        sys.exit(1)
    
    print("\n[INFO] Starting dependency fix process...")
    
    # Step 1: Uninstall problematic packages
    print("\n[STEP 1] Uninstalling problematic packages...")
    
    packages_to_remove = [
        "numpy",
        "opencv-python",
        "opencv-contrib-python",
        "~erkzeug"  # This appears to be a corrupted package
    ]
    
    for package in packages_to_remove:
        run_command(f"pip uninstall -y {package}", f"Uninstalling {package}")
    
    # Step 2: Clean pip cache
    print("\n[STEP 2] Cleaning pip cache...")
    run_command("pip cache purge", "Cleaning pip cache")
    
    # Step 3: Install NumPy first (specific version for OpenCV compatibility)
    print("\n[STEP 3] Installing NumPy 1.24.3...")
    if not run_command("pip install numpy==1.24.3", "Installing NumPy 1.24.3"):
        print("[ERROR] Failed to install NumPy. Exiting.")
        sys.exit(1)
    
    # Step 4: Install OpenCV
    print("\n[STEP 4] Installing OpenCV...")
    if not run_command("pip install opencv-python==4.8.1.78", "Installing OpenCV"):
        print("[ERROR] Failed to install OpenCV. Exiting.")
        sys.exit(1)
    
    # Step 5: Install all other requirements
    print("\n[STEP 5] Installing all other requirements...")
    if not run_command("pip install -r requirements.txt", "Installing all requirements"):
        print("[ERROR] Failed to install requirements. Exiting.")
        sys.exit(1)
    
    # Step 6: Verify installation
    print("\n[STEP 6] Verifying installation...")
    
    verification_script = """
import sys
try:
    import numpy
    print(f"✓ NumPy version: {numpy.__version__}")
except ImportError as e:
    print(f"✗ NumPy import failed: {e}")
    sys.exit(1)

try:
    import cv2
    print(f"✓ OpenCV version: {cv2.__version__}")
except ImportError as e:
    print(f"✗ OpenCV import failed: {e}")
    sys.exit(1)

try:
    import flask
    print(f"✓ Flask version: {flask.__version__}")
except ImportError as e:
    print(f"✗ Flask import failed: {e}")
    sys.exit(1)

try:
    import google.genai
    print("✓ Google GenAI imported successfully")
except ImportError as e:
    print(f"✗ Google GenAI import failed: {e}")
    sys.exit(1)

print("\\n[SUCCESS] All critical dependencies verified!")
"""
    
    with open("verify_deps.py", "w") as f:
        f.write(verification_script)
    
    if run_command("python verify_deps.py", "Verifying dependencies"):
        print("\n[SUCCESS] All dependencies installed and verified successfully!")
    else:
        print("\n[ERROR] Dependency verification failed!")
        sys.exit(1)
    
    # Clean up
    if os.path.exists("verify_deps.py"):
        os.remove("verify_deps.py")
    
    print("\n" + "=" * 60)
    print("DEPENDENCY FIX COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nYou can now run the backend server with:")
    print("python start_backend.py")

if __name__ == "__main__":
    main()
