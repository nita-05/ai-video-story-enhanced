#!/usr/bin/env python3
"""
Master Deployment Script for AI Video Story
This script handles the complete deployment process.
"""

import subprocess
import sys
import os
import time
import requests
import threading
from pathlib import Path

class DeploymentManager:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        self.backend_process = None
        self.frontend_process = None
    
    def print_banner(self):
        """Print deployment banner"""
        print("🎬 AI VIDEO STORY - DEPLOYMENT MANAGER")
        print("=" * 60)
        print("🚀 Starting complete deployment process...")
        print("=" * 60)
    
    def install_backend_dependencies(self):
        """Install backend dependencies"""
        print("\n🔧 Installing backend dependencies...")
        os.chdir(self.backend_dir)
        
        dependencies = [
            "brotlicffi", "brotli", "requests", "urllib3", "pymongo",
            "flask", "flask-cors", "pyjwt", "google-auth", 
            "google-auth-oauthlib", "google-auth-httplib2",
            "vosk", "opencv-python", "pillow", "numpy", "torch",
            "torchvision", "transformers", "google-generativeai"
        ]
        
        for dep in dependencies:
            try:
                print(f"  Installing {dep}...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", dep], 
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"  ✅ {dep}")
            except subprocess.CalledProcessError:
                print(f"  ⚠️  {dep} failed, continuing...")
    
    def install_frontend_dependencies(self):
        """Install frontend dependencies"""
        print("\n🔧 Installing frontend dependencies...")
        os.chdir(self.frontend_dir)
        
        try:
            subprocess.check_call(["npm", "install"], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("  ✅ npm packages installed")
        except subprocess.CalledProcessError:
            print("  ❌ npm install failed")
            return False
        except FileNotFoundError:
            print("  ❌ npm not found. Please install Node.js first.")
            return False
        
        return True
    
    def start_backend(self):
        """Start backend server"""
        print("\n🚀 Starting backend server...")
        os.chdir(self.backend_dir)
        
        try:
            self.backend_process = subprocess.Popen([sys.executable, "app.py"])
            print("  ✅ Backend process started")
            return True
        except Exception as e:
            print(f"  ❌ Backend failed to start: {e}")
            return False
    
    def start_frontend(self):
        """Start frontend server"""
        print("\n🚀 Starting frontend server...")
        os.chdir(self.frontend_dir)
        
        try:
            self.frontend_process = subprocess.Popen(["npm", "run", "dev"])
            print("  ✅ Frontend process started")
            return True
        except Exception as e:
            print(f"  ❌ Frontend failed to start: {e}")
            return False
    
    def wait_for_backend(self, timeout=30):
        """Wait for backend to be healthy"""
        print("\n⏳ Waiting for backend to be ready...")
        
        for i in range(timeout):
            try:
                response = requests.get("http://localhost:5000/health", timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "healthy":
                        print("  ✅ Backend is healthy and ready!")
                        return True
            except:
                pass
            
            print(f"  ⏳ Waiting... ({i+1}/{timeout})")
            time.sleep(1)
        
        print("  ❌ Backend failed to start within timeout")
        return False
    
    def wait_for_frontend(self, timeout=30):
        """Wait for frontend to be ready"""
        print("\n⏳ Waiting for frontend to be ready...")
        
        for i in range(timeout):
            try:
                response = requests.get("http://localhost:5173", timeout=2)
                if response.status_code == 200:
                    print("  ✅ Frontend is ready!")
                    return True
            except:
                pass
            
            print(f"  ⏳ Waiting... ({i+1}/{timeout})")
            time.sleep(1)
        
        print("  ❌ Frontend failed to start within timeout")
        return False
    
    def show_status(self):
        """Show deployment status"""
        print("\n" + "=" * 60)
        print("🎉 DEPLOYMENT COMPLETE!")
        print("=" * 60)
        print("📱 Frontend: http://localhost:5173")
        print("🔧 Backend:  http://localhost:5000")
        print("📊 Health:   http://localhost:5000/health")
        print("=" * 60)
        print("✅ Both servers are running successfully!")
        print("🌐 Open http://localhost:5173 in your browser")
        print("=" * 60)
        print("\nPress Ctrl+C to stop both servers")
    
    def cleanup(self):
        """Cleanup processes"""
        print("\n🛑 Stopping servers...")
        
        if self.backend_process:
            self.backend_process.terminate()
            print("  ✅ Backend stopped")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            print("  ✅ Frontend stopped")
    
    def deploy(self):
        """Main deployment function"""
        try:
            self.print_banner()
            
            # Install dependencies
            self.install_backend_dependencies()
            if not self.install_frontend_dependencies():
                return False
            
            # Start servers
            if not self.start_backend():
                return False
            
            if not self.wait_for_backend():
                return False
            
            if not self.start_frontend():
                return False
            
            if not self.wait_for_frontend():
                return False
            
            # Show status
            self.show_status()
            
            # Keep running until interrupted
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
            
            return True
            
        except Exception as e:
            print(f"\n❌ Deployment failed: {e}")
            return False
        finally:
            self.cleanup()

def main():
    """Main function"""
    manager = DeploymentManager()
    success = manager.deploy()
    
    if success:
        print("\n🎉 Deployment completed successfully!")
    else:
        print("\n❌ Deployment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
