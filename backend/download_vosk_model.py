import os
import urllib.request
import zipfile
import shutil

def download_vosk_model():
    """Download Vosk English model for speech recognition"""
    
    # Model URL (small English model ~43MB)
    model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    model_name = "vosk-model-small-en-us-0.15"
    zip_path = f"{model_name}.zip"
    
    print("🔄 Downloading Vosk English model...")
    print(f"📥 URL: {model_url}")
    
    try:
        # Download the model
        print("⏳ Downloading... (this may take a few minutes)")
        urllib.request.urlretrieve(model_url, zip_path)
        print(f"✅ Download completed: {zip_path}")
        
        # Extract the zip file
        print("📦 Extracting model...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(".")
        print("✅ Model extracted successfully")
        
        # Clean up zip file
        os.remove(zip_path)
        print("🧹 Cleaned up zip file")
        
        # Verify model files exist
        if os.path.exists(model_name):
            print(f"✅ Vosk model ready: {model_name}")
            print("🎯 You can now use speech recognition!")
        else:
            print("❌ Model extraction failed")
            
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        print("💡 You can manually download from: https://alphacephei.com/vosk/models")
        print("📁 Extract to the backend directory")

if __name__ == "__main__":
    download_vosk_model()
