import os
import subprocess

print('🔍 CHECKING TESSERACT INSTALLATION')
print('=' * 50)

# Check common paths
paths = [
    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME')),
    r'C:\Tesseract-OCR\tesseract.exe'
]

found = False
working_path = None

for path in paths:
    if os.path.exists(path):
        print(f'✅ Found Tesseract: {path}')
        found = True
        working_path = path
        
        # Test if it works
        try:
            result = subprocess.run([path, '--version'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f'✅ Tesseract working: {result.stdout.strip()}')
            else:
                print(f'❌ Tesseract broken: {result.stderr}')
        except Exception as e:
            print(f'❌ Tesseract test failed: {e}')
        break

if not found:
    print('❌ Tesseract not found in common locations')
    print('🔧 TESSERACT NEEDS TO BE REINSTALLED')
    print('1. Download from: https://github.com/UB-Mannheim/tesseract/wiki')
    print('2. Install with Add to PATH option')
    print('3. Restart computer')
else:
    print('✅ Tesseract installation found!')
    if working_path:
        print(f'📍 Working path: {working_path}')
