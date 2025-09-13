#!/usr/bin/env python3
"""
Footage Flow Startup Script
This script starts both backend and frontend servers together
"""

import os
import sys
import subprocess
import time
import platform
import signal
import threading
from pathlib import Path

def print_banner():
    """Print the startup banner"""
    print("\n" + "="*50)
    print("    FOOTAGE FLOW - STARTUP SCRIPT")
    print("="*50 + "\n")


def resolve_command(command_name: str) -> str | None:
    """Resolve an executable command, handling Windows extensions and shims.

    Returns the resolved command string to execute, or None if not found.
    """
    candidates: list[str]
    if platform.system() == "Windows":
        candidates = [f"{command_name}.cmd", f"{command_name}.exe", f"{command_name}.bat", command_name]
    else:
        candidates = [command_name]

    for candidate in candidates:
        try:
            result = subprocess.run([candidate, "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                return candidate
        except FileNotFoundError:
            continue
    return None


def check_requirements():
    """Check if Python and Node.js are installed"""
    print("[INFO] Checking system requirements...")
    
    # Check Python
    try:
        result = subprocess.run([sys.executable, "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"[INFO] Python found: {result.stdout.strip()}")
    except subprocess.CalledProcessError:
        print("[ERROR] Python is not properly installed!")
        return False
    
    # Check Node.js and npm
    try:
        result = subprocess.run(["node", "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"[INFO] Node.js found: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[ERROR] Node.js is not installed or not in PATH!")
        return False

    npm_cmd = resolve_command("npm")
    if npm_cmd:
        print(f"[INFO] npm found: {npm_cmd}")
    else:
        # On Windows, npm sometimes only works via shell
        if platform.system() == "Windows":
            print("[WARNING] npm not directly resolvable; will use 'cmd /c npm' fallback")
        else:
            print("[ERROR] npm not found. Please install Node.js which includes npm.")
            return False
    
    return True


def check_ports():
    """Check if required ports are available"""
    print("[INFO] Checking port availability...")
    
    import socket
    
    ports_to_check = [5000, 5173]
    for port in ports_to_check:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                print(f"[INFO] Port {port} is available")
        except OSError:
            print(f"[WARNING] Port {port} is already in use")
            if platform.system() == "Windows":
                try:
                    # Try to kill process using the port
                    result = subprocess.run(f"netstat -ano | findstr :{port}", 
                                          shell=True, capture_output=True, text=True)
                    if result.stdout:
                        lines = result.stdout.strip().split('\n')
                        for line in lines:
                            if f":{port}" in line:
                                parts = line.split()
                                if len(parts) >= 5:
                                    pid = parts[-1]
                                    subprocess.run(f"taskkill /F /PID {pid}", 
                                                 shell=True, capture_output=True)
                                    print(f"[INFO] Killed process using port {port}")
                                    time.sleep(2)
                except:
                    pass


def setup_backend():
    """Set up and start the backend server"""
    print("[INFO] Setting up backend...")
    
    backend_dir = Path(__file__).parent / "backend"
    if not backend_dir.exists():
        print("[ERROR] Backend directory not found!")
        return None
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Check if virtual environment exists
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("[INFO] Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    
    # Activate virtual environment and install dependencies
    if platform.system() == "Windows":
        pip_path = venv_dir / "Scripts" / "pip.exe"
        python_path = venv_dir / "Scripts" / "python.exe"
        activate_script = venv_dir / "Scripts" / "activate.bat"
    else:
        pip_path = venv_dir / "bin" / "pip"
        python_path = venv_dir / "bin" / "python"
        activate_script = venv_dir / "bin" / "activate"
    
    # Install dependencies with better error handling
    print("[INFO] Installing Python dependencies...")
    try:
        # Install requirements with verbose output
        print("[INFO] Installing main dependencies...")
        res = subprocess.run([str(pip_path), "install", "-r", "requirements.txt"], 
                           check=True, capture_output=True, text=True)
        if res.stdout:
            print("[INFO] Dependencies installed successfully")
        
        # Install additional Google packages
        print("[INFO] Installing Google Cloud packages...")
        google_packages = [
            "google-cloud-speech==2.21.0",
            "google-cloud-vision==3.4.5"
        ]
        for package in google_packages:
            try:
                subprocess.run([str(pip_path), "install", package], 
                             check=True, capture_output=True, text=True)
                print(f"[INFO] {package} installed successfully")
            except subprocess.CalledProcessError as e:
                print(f"[WARNING] Failed to install {package}: {e}")
                
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Dependency installation failed: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return None
    
    return python_path


def setup_frontend():
    """Set up and start the frontend server"""
    print("[INFO] Setting up frontend...")
    
    frontend_dir = Path(__file__).parent / "frontend"
    if not frontend_dir.exists():
        print("[ERROR] Frontend directory not found!")
        return None
    
    # Change to frontend directory
    os.chdir(frontend_dir)
    
    # Install dependencies
    print("[INFO] Installing Node.js dependencies...")
    try:
        npm_cmd = resolve_command("npm")
        if npm_cmd:
            subprocess.run([npm_cmd, "install"], check=True)
        else:
            if platform.system() == "Windows":
                # Fallback to shell invocation to pick up npm shim
                subprocess.run(["cmd", "/c", "npm", "install"], check=True)
            else:
                raise FileNotFoundError("npm not found in PATH")
    except FileNotFoundError as e:
        print(f"[ERROR] npm not found. Please ensure Node.js is installed and npm is in PATH. {e}")
        # Try to show where node/npm are
        try:
            where_res = subprocess.run(["where", "npm"], capture_output=True, text=True, shell=True)
            print(where_res.stdout or where_res.stderr)
        except Exception:
            pass
        return None
    except subprocess.CalledProcessError as e:
        print("[WARNING] npm install failed.")
        # Re-run with verbose output for diagnostics
        try:
            subprocess.run(["cmd", "/c", "npm", "install", "--verbose"], check=True)
        except Exception:
            pass
    
    # Skip build step for development mode
    print("[INFO] Ready to start development server...")
    
    return frontend_dir


def start_backend_server(python_path):
    """Start the backend server in a separate process"""
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    print("[INFO] Starting Backend Server...")
    print("[INFO] Backend will run on: http://127.0.0.1:5000")
    
    # Verify Python path exists
    if not Path(python_path).exists():
        print(f"[ERROR] Python executable not found at: {python_path}")
        return None
    
    # Start backend server with proper environment
    try:
        backend_process = subprocess.Popen([str(python_path), "app.py"],
                                          stdout=subprocess.PIPE,
                                          stderr=subprocess.PIPE,
                                          text=True,
                                          cwd=str(backend_dir))
        
        # Wait a moment for server to start
        time.sleep(5)
        
        # Check if server is responding
        try:
            import urllib.request
            response = urllib.request.urlopen("http://127.0.0.1:5000/health", timeout=10)
            if response.getcode() == 200:
                print("[SUCCESS] Backend server is responding!")
            else:
                print(f"[WARNING] Backend server responded with status: {response.getcode()}")
        except Exception as e:
            print(f"[WARNING] Backend server may not be fully ready: {e}")
            print("[INFO] This is normal during startup, server will be ready shortly...")
        
        return backend_process
        
    except Exception as e:
        print(f"[ERROR] Failed to start backend server: {e}")
        return None


def start_frontend_server(frontend_dir):
    """Start the frontend server in a separate process"""
    os.chdir(frontend_dir)
    
    print("[INFO] Starting Frontend Server...")
    print("[INFO] Frontend will run on: http://localhost:5173")
    
    # Start frontend server
    try:
        # Use development mode directly (it has built-in SPA routing support)
        print("[INFO] Using development mode (with built-in SPA routing)...")
        npm_cmd = resolve_command("npm")
        if npm_cmd:
            frontend_process = subprocess.Popen([npm_cmd, "run", "dev", "--port", "5173", "--host"],
                                               stdout=subprocess.PIPE,
                                               stderr=subprocess.PIPE,
                                               text=True,
                                               cwd=str(frontend_dir))
        else:
            if platform.system() == "Windows":
                frontend_process = subprocess.Popen(["cmd", "/c", "npm", "run", "dev", "--port", "5173", "--host"],
                                                    stdout=subprocess.PIPE,
                                                    stderr=subprocess.PIPE,
                                                    text=True,
                                                    cwd=str(frontend_dir))
            else:
                raise FileNotFoundError("npm not found in PATH")
        
        # Wait a moment for server to start
        time.sleep(8)
        
        # Check if frontend is responding
        try:
            import urllib.request
            response = urllib.request.urlopen("http://localhost:5173", timeout=10)
            if response.getcode() == 200:
                print("[SUCCESS] Frontend server is responding!")
            else:
                print(f"[WARNING] Frontend server responded with status: {response.getcode()}")
        except Exception as e:
            print(f"[WARNING] Frontend server may not be fully ready: {e}")
            print("[INFO] This is normal during startup, server will be ready shortly...")
        
        return frontend_process
        
    except FileNotFoundError as e:
        print(f"[ERROR] npm not found. Cannot start frontend. {e}")
        raise
    except Exception as e:
        print(f"[ERROR] Failed to start frontend server: {e}")
        return None


def verify_servers():
    """Verify that both servers are responding"""
    print("[INFO] Verifying servers are working...")
    
    # Check backend
    try:
        import urllib.request
        response = urllib.request.urlopen("http://127.0.0.1:5000/health", timeout=10)
        if response.getcode() == 200:
            print("[✅] Backend server is working!")
        else:
            print(f"[⚠️] Backend server responded with status: {response.getcode()}")
    except Exception as e:
        print(f"[❌] Backend server not responding: {e}")
        return False
    
    # Check frontend
    try:
        response = urllib.request.urlopen("http://localhost:5173", timeout=10)
        if response.getcode() == 200:
            print("[✅] Frontend server is working!")
        else:
            print(f"[⚠️] Frontend server responded with status: {response.getcode()}")
    except Exception as e:
        print(f"[❌] Frontend server not responding: {e}")
        return False
    
    return True

def open_browser():
    """Open the application in the default browser"""
    import webbrowser
    
    print("[INFO] Opening application in browser...")
    webbrowser.open("http://localhost:5173")


def main():
    """Main function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        input("Press Enter to exit...")
        return
    
    # Check ports
    check_ports()
    
    # Setup backend
    python_path = setup_backend()
    if not python_path:
        print("[ERROR] Backend setup failed. Please check the error messages above.")
        input("Press Enter to exit...")
        return
    
    # Setup frontend
    frontend_dir = setup_frontend()
    if not frontend_dir:
        print("[ERROR] Frontend setup failed. Please check the error messages above.")
        input("Press Enter to exit...")
        return
    
    print("\n[INFO] Starting both servers...")
    
    # Start backend server
    backend_process = start_backend_server(python_path)
    if not backend_process:
        print("[ERROR] Failed to start backend server.")
        input("Press Enter to exit...")
        return
    
    # Start frontend server
    frontend_process = start_frontend_server(frontend_dir)
    if not frontend_process:
        print("[ERROR] Failed to start frontend server.")
        print("[INFO] Stopping backend server...")
        backend_process.terminate()
        input("Press Enter to exit...")
        return
    
    # Verify both servers are working
    if verify_servers():
        print("\n" + "="*50)
        print("    FOOTAGE FLOW STARTED SUCCESSFULLY!")
        print("="*50)
        print("\n[SUCCESS] Backend Server: http://127.0.0.1:5000")
        print("[SUCCESS] Frontend Server: http://localhost:5173")
        print("[SUCCESS] Health Check: http://127.0.0.1:5000/health")
        print("\n[INFO] Both servers are now running and responding.")
        print("[INFO] Keep this window open while using the application.")
        
        # Open browser
        try:
            open_browser()
        except:
            print("[INFO] Please manually open: http://localhost:5173")
    else:
        print("\n[⚠️] Some servers may not be fully ready yet.")
        print("[INFO] Please wait a moment and try accessing the URLs manually.")
    
    print("\n[INFO] Press Ctrl+C to stop both servers...")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping servers...")
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("[INFO] Servers stopped.")
        print("[INFO] You can close this window now.")

if __name__ == "__main__":
    main()
