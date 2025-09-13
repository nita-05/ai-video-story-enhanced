"""
Configuration file for AI Video Story Backend
"""

import os
from pathlib import Path

# Load environment variables from .env file if it exists
def load_env_file():
    """Load environment variables from .env file"""
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load environment variables
load_env_file()

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ai-video-story-secret-key-2024-production-ready')
JWT_ISSUER = os.environ.get('JWT_ISSUER', 'aivideostory')
ACCESS_TTL_SECONDS = int(os.environ.get('ACCESS_TTL_SECONDS', '900'))  # 15 minutes
REFRESH_TTL_SECONDS = int(os.environ.get('REFRESH_TTL_SECONDS', '2592000'))  # 30 days

# Cookie Configuration
COOKIE_SECURE = os.environ.get('COOKIE_SECURE', 'false').lower() == 'true'
COOKIE_SAMESITE = os.environ.get('COOKIE_SAMESITE', 'Lax')

# MongoDB Configuration
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/aivideostory')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# Gemini AI Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

# Environment
APP_ENV = os.environ.get('APP_ENV', 'development')

# Upload Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'}
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max file size

# CORS Configuration
CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
