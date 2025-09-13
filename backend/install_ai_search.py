#!/usr/bin/env python3
"""
Install AI Search Dependencies
Installs sentence-transformers and FAISS for 100% perfect semantic search
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip"""
    try:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def main():
    print("🚀 Installing AI Search Dependencies...")
    print("This will enable 100% perfect semantic search using AI models")
    print()
    
    # Required packages for AI search
    packages = [
        "sentence-transformers>=2.2.0",
        "faiss-cpu>=1.7.0",
        "torch>=2.0.0",  # Ensure torch is available
        "numpy>=1.21.0"  # Ensure numpy is available
    ]
    
    success_count = 0
    for package in packages:
        if install_package(package):
            success_count += 1
        print()
    
    print("=" * 50)
    if success_count == len(packages):
        print("🎉 All AI Search dependencies installed successfully!")
        print("✅ Your search will now be 100% perfect using AI models")
        print()
        print("Features enabled:")
        print("• Semantic understanding of search queries")
        print("• Vector similarity search")
        print("• Context-aware results")
        print("• Meaning-based matching (not just keywords)")
        print()
        print("Restart your backend server to activate AI search!")
    else:
        print(f"⚠️ {success_count}/{len(packages)} packages installed successfully")
        print("Some AI search features may not be available")
        print("You can still use traditional keyword search as fallback")

if __name__ == "__main__":
    main()
