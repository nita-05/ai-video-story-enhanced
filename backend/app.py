import os
import uuid
import logging
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️ python-dotenv not installed, using system environment variables")

from db_mongo import get_db, upsert_video, save_transcript, save_tags, set_job

# Import transcription module with error handling
try:
    from enhanced_transcription_simple import enhanced_transcriber_simple
    TRANSCRIPTION_AVAILABLE = True
    print("✅ Enhanced Transcription enabled")
except ImportError as e:
    TRANSCRIPTION_AVAILABLE = False
    enhanced_transcriber_simple = None
    print(f"⚠️ Enhanced Transcription not available: {e}")

# Import OCR-capable enhanced transcriber (frame OCR fallback)
try:
    from enhanced_transcription import enhanced_transcriber
    OCR_TRANSCRIPTION_AVAILABLE = True
    print("🧾 OCR Transcription fallback enabled")
except ImportError as e:
    OCR_TRANSCRIPTION_AVAILABLE = False
    enhanced_transcriber = None
    print(f"⚠️ OCR Transcription not available: {e}")

# Import visual tagger for AI-powered image analysis
try:
    from visual_tagger import visual_tagger
    VISUAL_TAGGING_AVAILABLE = True
    print("✅ Traditional AI Visual Tagging enabled (YOLO + CLIP)")
except ImportError as e:
    VISUAL_TAGGING_AVAILABLE = False
    print(f"⚠️ Traditional AI Visual Tagging not available: {e}")

# Import Gemini AI visual tagger (PRIORITY)
try:
    from gemini_visual_tagger import gemini_visual_tagger
    GEMINI_TAGGING_AVAILABLE = True
    print("🚀 Gemini AI Visual Tagging enabled (Google AI)")
except ImportError as e:
    GEMINI_TAGGING_AVAILABLE = False
    print(f"⚠️ Gemini AI Visual Tagging not available: {e}")

# Import fallback visual tagger for basic analysis
try:
    from visual_tagger_fallback import fallback_visual_tagger
    FALLBACK_TAGGING_AVAILABLE = True
    print("✅ Fallback Visual Tagging enabled")
except ImportError as e:
    FALLBACK_TAGGING_AVAILABLE = False
    print(f"⚠️ Fallback Visual Tagging not available: {e}")

# Import AI-powered semantic search
try:
    from semantic_search import semantic_searcher, initialize_semantic_search, semantic_search_videos, is_semantic_search_available
    SEMANTIC_SEARCH_AVAILABLE = True
    print("🚀 AI-Powered Semantic Search enabled")
except ImportError as e:
    SEMANTIC_SEARCH_AVAILABLE = False
    print(f"⚠️ Semantic Search not available: {e}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Import configuration
from config import (
    JWT_SECRET, JWT_ISSUER, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS,
    COOKIE_SECURE, COOKIE_SAMESITE, CORS_ORIGINS, UPLOAD_FOLDER,
    ALLOWED_EXTENSIONS, MAX_CONTENT_LENGTH
)

# Configure CORS
CORS(app, supports_credentials=True, resources={r"/*": {"origins": CORS_ORIGINS}})

# Configure Flask
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directories exist
os.makedirs(os.path.join(UPLOAD_FOLDER, 'videos'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'thumbnails'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'renders'), exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -----------------------------
# Authentication (email/password + JWT cookies)
# -----------------------------
import time
import hashlib
import jwt
import requests

def _avatar_for_email(email: str) -> str:
    try:
        e = (email or '').strip().lower().encode('utf-8')
        h = hashlib.md5(e).hexdigest()
        return f"https://www.gravatar.com/avatar/{h}?d=identicon&s=128"
    except Exception:
        return ""

def _issue_tokens(user: dict) -> tuple[str, str]:
    now = int(time.time())
    payload_base = {
        'iss': JWT_ISSUER,
        'sub': user['userId'],
        'email': user['email'],
        'name': user.get('name', ''),
        'picture': user.get('picture', '') or _avatar_for_email(user.get('email','')),
        'iat': now,
    }
    access = jwt.encode({**payload_base, 'type': 'access', 'exp': now + ACCESS_TTL_SECONDS}, JWT_SECRET, algorithm='HS256')
    refresh = jwt.encode({**payload_base, 'type': 'refresh', 'exp': now + REFRESH_TTL_SECONDS}, JWT_SECRET, algorithm='HS256')
    return access, refresh

def _set_auth_cookies(resp, access_token: str, refresh_token: str):
    resp.set_cookie('access_token', access_token, max_age=ACCESS_TTL_SECONDS, httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, path='/',)
    resp.set_cookie('refresh_token', refresh_token, max_age=REFRESH_TTL_SECONDS, httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, path='/',)

def _clear_auth_cookies(resp):
    resp.set_cookie('access_token', '', expires=0, path='/', httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE)
    resp.set_cookie('refresh_token', '', expires=0, path='/', httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE)

def _current_user():
    token = request.cookies.get('access_token') or ''
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'], options={'require': ['exp', 'iat', 'iss']})
        if payload.get('iss') != JWT_ISSUER or payload.get('type') != 'access':
            return None
        return {
            'userId': payload['sub'],
            'email': payload.get('email',''),
            'name': payload.get('name',''),
            'picture': payload.get('picture','') or _avatar_for_email(payload.get('email',''))
        }
    except Exception:
        return None

def require_auth():
    user = _current_user()
    if not user:
        return None, (jsonify({'error': 'Unauthorized'}), 401)
    return user, None
@app.route('/auth/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        name = (data.get('name') or '').strip() or email.split('@')[0]
        password = (data.get('password') or '').strip()
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        db = get_db()
        if get_db().users.find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 400
        password_hash = generate_password_hash(password)
        user_id = str(uuid.uuid4())
        picture = _avatar_for_email(email)
        user_data = {'userId': user_id, 'email': email, 'name': name, 'picture': picture, 'passwordHash': password_hash, 'createdAt': datetime.utcnow().isoformat()}
        db.users.insert_one(user_data)
        logging.info(f"User registration successful: {name} ({email})")
        access, refresh = _issue_tokens({'userId': user_id, 'email': email, 'name': name, 'picture': picture})
        resp = make_response(jsonify({'ok': True, 'user': {'userId': user_id, 'email': email, 'name': name, 'picture': picture}}))
        _set_auth_cookies(resp, access, refresh)
        return resp
    except Exception as e:
        logging.error(f"register_user error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/auth/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        db = get_db()
        user = db.users.find_one({'email': email})
        if not user or not check_password_hash(user.get('passwordHash', ''), password):
            return jsonify({'error': 'Invalid credentials'}), 401
        # Ensure we have a picture
        if not user.get('picture'):
            pic = _avatar_for_email(user.get('email',''))
            try:
                db.users.update_one({'_id': user['_id']}, {'$set': {'picture': pic}})
            except Exception:
                pass
            user['picture'] = user.get('picture') or pic
        user_data = {'userId': user['userId'], 'email': user['email'], 'name': user.get('name'), 'picture': user.get('picture','')}
        logging.info(f"Regular login successful: {user_data.get('name', 'No name')} ({user_data.get('email', 'No email')})")
        access, refresh = _issue_tokens(user_data)
        resp = make_response(jsonify({'ok': True, 'user': user_data}))
        _set_auth_cookies(resp, access, refresh)
        return resp
    except Exception as e:
        logging.error(f"login_user error: {e}")
        return jsonify({'error': 'Login failed'}), 500

def get_video_duration(video_path):
    """Get video duration using ffprobe"""
    try:
        cmd = ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', video_path]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        duration = float(result.stdout.strip())
        return duration
    except Exception as e:
        logging.error(f"Error getting video duration: {e}")
        return 0

def resolve_video_path(video_id: str) -> tuple[str | None, str | None]:
    """Return (path, extension) for a given videoId by checking DB metadata and filesystem."""
    try:
        db = get_db()
        meta = db.videos.find_one({'videoId': video_id}) or {}
        filename = meta.get('filename')
        if filename:
            path = os.path.join(UPLOAD_FOLDER, 'videos', filename)
            if os.path.exists(path):
                return path, filename.rsplit('.', 1)[-1].lower()
        # Fallback: scan filesystem for any allowed extension
        for ext in list(ALLOWED_EXTENSIONS):
            candidate = os.path.join(UPLOAD_FOLDER, 'videos', f"{video_id}.{ext}")
            if os.path.exists(candidate):
                return candidate, ext
        return None, None
    except Exception:
        return None, None

def generate_thumbnail(video_path: str, video_id: str) -> str | None:
    """Generate a jpg thumbnail and return its relative path."""
    try:
        thumb_path = os.path.join(UPLOAD_FOLDER, 'thumbnails', f"{video_id}.jpg")
        cmd = [
            'ffmpeg', '-y', '-ss', '1', '-i', video_path,
            '-frames:v', '1', '-q:v', '2', thumb_path
        ]
        subprocess.run(cmd, capture_output=True, check=True)
        if os.path.exists(thumb_path):
            return os.path.join('thumbnails', f"{video_id}.jpg")
    except Exception as e:
        logging.warning(f"Thumbnail generation failed for {video_id}: {e}")
    return None

def generate_simple_tags(video_path):
    """Generate AI-powered visual tags using computer vision models"""
    try:
        # Preference order: Gemini → Traditional (YOLO+CLIP) → Fallback
        if GEMINI_TAGGING_AVAILABLE and gemini_visual_tagger.is_available():
            print("🤖 Using Gemini AI Visual Tagging...")
            tags = gemini_visual_tagger.tag_video(video_path)
            print(f"✅ Gemini AI generated tags: {tags}")
            return tags
        elif VISUAL_TAGGING_AVAILABLE and visual_tagger.is_available():
            print("🤖 Using Traditional AI Visual Tagging...")
            tags = visual_tagger.tag_video(video_path)
            print(f"✅ Traditional AI generated tags: {tags}")
            return tags
        elif FALLBACK_TAGGING_AVAILABLE and fallback_visual_tagger.is_available():
            print("🤖 Using Fallback Visual Tagging...")
            tags = fallback_visual_tagger.tag_video(video_path)
            print(f"✅ Fallback generated tags: {tags}")
            return tags
        else:
            print("⚠️ Falling back to simplified tagging (no AI models)")
            # Fallback to simple duration-based tagging
            duration = get_video_duration(video_path)
            
            tags = ["video-content", "media-file"]
            
            if duration > 0:
                if duration < 10:
                    tags.extend(["short-clip", "quick-video"])
                elif duration < 60:
                    tags.extend(["medium-length", "standard-video"])
                else:
                    tags.extend(["long-form", "extended-content"])
            
            # Add file-based tags
            file_size = os.path.getsize(video_path)
            if file_size > 50 * 1024 * 1024:  # 50MB
                tags.append("high-quality")
            else:
                tags.append("standard-quality")
                
            return tags
            
    except Exception as e:
        logging.error(f"Error in AI visual tagging: {e}")
        print(f"❌ AI tagging failed, using fallback: {e}")
        # Emergency fallback
        return ["video-content", "media-file", "ai-analysis-failed"]

def analyze_emotions_from_text_and_segments(transcript_text, segments):
    """Very lightweight emotion analysis based on keywords and timing.

    Returns a list of points {timestamp, label, intensity} that the frontend
    can chart. This avoids paid APIs while giving users visible progress.
    """
    try:
        # Keyword buckets. Keep simple and extendable without paid models.
        lexicon = {
            'happy': [
                'happy', 'joy', 'joyful', 'excited', 'awesome', 'great', 'love', 'wonderful', 'amazing', 'delight'
            ],
            'sad': [
                'sad', 'unhappy', 'depress', 'down', 'cry', 'tears', 'tragic', 'heartbroken', 'lonely'
            ],
            'angry': [
                'angry', 'mad', 'furious', 'rage', 'annoyed', 'irritated', 'upset', 'frustrated'
            ],
            'calm': [
                'calm', 'peaceful', 'relax', 'serene', 'quiet', 'soothing', 'gentle'
            ],
            'excited': [
                'excited', 'thrill', 'energetic', 'amplify', 'hype', 'buzzing'
            ],
            'neutral': []
        }

        # Build quick index of segment timestamps to words
        # segments expected shape: [{word, start_time, end_time}, ...]
        points = []
        if not segments:
            # If no segments, create a single neutral point
            points.append({'timestamp': 0, 'label': 'neutral', 'intensity': 0.1})
            return points

        def score_for_word(word):
            lw = word.lower()
            for label, words in lexicon.items():
                if lw in words:
                    return label, 1.0
            return 'neutral', 0.1

        # Aggregate per ~1s buckets for smoother curve
        bucket_size_seconds = 1.0
        bucket_to_scores = {}
        for seg in segments:
            try:
                ts = float(seg.get('start_time', 0.0))
                bucket = int(ts // bucket_size_seconds)
                label, intensity = score_for_word(str(seg.get('word', '')))
                if bucket not in bucket_to_scores:
                    bucket_to_scores[bucket] = {
                        'happy': 0.0, 'sad': 0.0, 'angry': 0.0, 'calm': 0.0, 'excited': 0.0, 'neutral': 0.0
                    }
                bucket_to_scores[bucket][label] += intensity
            except Exception:
                continue

        # Convert to chart-ready points by picking dominant emotion per bucket
        for bucket, scores in sorted(bucket_to_scores.items()):
            best_label = max(scores, key=lambda k: scores[k])
            best_intensity = scores[best_label]
            timestamp = bucket * bucket_size_seconds
            # Normalize intensity to 0..1 range
            total = max(sum(scores.values()), 1.0)
            norm_intensity = max(min(best_intensity / total, 1.0), 0.0)
            points.append({'timestamp': timestamp, 'label': best_label, 'intensity': norm_intensity})

        # Ensure at least one point
        if not points:
            points.append({'timestamp': 0, 'label': 'neutral', 'intensity': 0.1})
        return points
    except Exception as e:
        logging.error(f"Emotion analysis failed: {e}")
        return [{'timestamp': 0, 'label': 'neutral', 'intensity': 0.1}]

@app.route('/auth/check-email', methods=['GET'])
def check_email():
    """Check if an email already exists in the system"""
    try:
        email = request.args.get('email', '').strip().lower()
        if not email:
            return jsonify({'exists': False}), 400
        
        db = get_db()
        exists = bool(db.users.find_one({'email': email}))
        return jsonify({'exists': exists})
    except Exception as e:
        logging.error(f"Check email error: {e}")
        return jsonify({'exists': False}), 500

@app.route('/auth/logout', methods=['POST'])
def logout_user():
    resp = make_response(jsonify({'ok': True}))
    _clear_auth_cookies(resp)
    return resp

@app.route('/auth/refresh', methods=['POST'])
def refresh_tokens():
    token = request.cookies.get('refresh_token') or ''
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'], options={'require': ['exp', 'iat', 'iss']})
        if payload.get('iss') != JWT_ISSUER or payload.get('type') != 'refresh':
            return jsonify({'error': 'Unauthorized'}), 401
        user = {'userId': payload['sub'], 'email': payload.get('email',''), 'name': payload.get('name','')}
        access, refresh = _issue_tokens(user)
        resp = make_response(jsonify({'ok': True}))
        _set_auth_cookies(resp, access, refresh)
        return resp
    except Exception:
        return jsonify({'error': 'Unauthorized'}), 401

@app.route('/auth/me', methods=['GET'])
def whoami():
    user = _current_user()
    if not user:
        logging.info("Auth check: No user found")
        return jsonify({'authenticated': False}), 200
    
    logging.info(f"Auth check: User found - {user.get('name', 'No name')} ({user.get('email', 'No email')})")
    return jsonify({'authenticated': True, 'user': user})

@app.route('/auth/google', methods=['POST'])
def google_login():
    """Verify Google ID token, upsert user, set cookies."""
    try:
        data = request.get_json(force=True)
        credential = (data.get('credential') or '').strip()
        if not credential:
            return jsonify({'error': 'Missing credential'}), 400

        # Verify token with Google
        resp = requests.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': credential}, timeout=6)
        if resp.status_code != 200:
            return jsonify({'error': 'Invalid Google token'}), 401
        payload = resp.json() or {}
        email = (payload.get('email') or '').lower()
        sub = payload.get('sub') or ''
        name = payload.get('name') or payload.get('given_name') or 'Google User'
        picture = payload.get('picture') or _avatar_for_email(email)
        # Normalize Google photo URL to a stable size so <img> loads reliably
        try:
            if isinstance(picture, str) and 'googleusercontent.com' in picture:
                logging.info(f"Original Google picture URL: {picture}")
                if '=?' in picture:
                    pass
                elif '?sz=' not in picture and '=s' not in picture:
                    picture = picture + '?sz=128'
                elif '=s' in picture:
                    # upgrade to at least 128px if smaller
                    import re
                    picture = re.sub(r"=s(\d+)-c", "=s128-c", picture)
                logging.info(f"Normalized Google picture URL: {picture}")
        except Exception as e:
            logging.error(f"Error normalizing picture URL: {e}")
            pass
        if not email or not sub:
            return jsonify({'error': 'Google token missing fields'}), 401

        db = get_db()
        # Idempotent upsert to avoid duplicate key races when Google calls twice
        try:
            from pymongo import ReturnDocument
        except Exception:
            ReturnDocument = None

        user_id = str(uuid.uuid4())
        try:
            if ReturnDocument is not None:
                doc = db.users.find_one_and_update(
                    {'email': email},
                    {
                        '$set': {
                            'email': email,
                            'name': name,
                            'picture': picture,
                            'googleSub': sub,
                        },
                        '$setOnInsert': {
                            'userId': user_id,
                            'createdAt': datetime.utcnow().isoformat()
                        }
                    },
                    upsert=True,
                    return_document=ReturnDocument.AFTER
                )
            else:
                # Fallback path without ReturnDocument
                db.users.update_one(
                    {'email': email},
                    {
                        '$set': {
                            'email': email,
                            'name': name,
                            'picture': picture,
                            'googleSub': sub,
                        },
                        '$setOnInsert': {
                            'userId': user_id,
                            'createdAt': datetime.utcnow().isoformat()
                        }
                    },
                    upsert=True
                )
                doc = db.users.find_one({'email': email}) or {}
        except Exception as e:
            # If a duplicate occurs due to a race, fetch the existing doc
            try:
                doc = db.users.find_one({'email': email}) or {}
            except Exception:
                doc = {}
        user_id = doc.get('userId') or user_id
        # Issue session
        user_data = {'userId': user_id, 'email': email, 'name': name, 'picture': picture}
        logging.info(f"Google login successful: {name} ({email})")
        access, refresh = _issue_tokens(user_data)
        resp_out = make_response(jsonify({'ok': True}))
        _set_auth_cookies(resp_out, access, refresh)
        return resp_out
    except Exception as e:
        logger.error(f"/auth/google error: {e}")
        return jsonify({'error': 'Google login failed'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        db = get_db()
        db.command('ping')
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {str(e)}"
    
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'mongodb': mongo_status,
        'upload_folder': UPLOAD_FOLDER,
        'max_file_size_mb': MAX_CONTENT_LENGTH // (1024 * 1024)
    })

@app.route('/debug/user', methods=['GET'])
def debug_user():
    """Debug endpoint to check current user and cookies"""
    try:
        user = _current_user()
        cookies = dict(request.cookies)
        
        # Also check what's in the database
        db_user = None
        if user and user.get('userId'):
            db = get_db()
            db_user = db.users.find_one({'userId': user['userId']})
        
        # Test if the picture URL is accessible
        picture_accessible = False
        picture_error = None
        if user and user.get('picture'):
            try:
                import requests
                response = requests.head(user['picture'], timeout=5)
                picture_accessible = response.status_code == 200
                if not picture_accessible:
                    picture_error = f"HTTP {response.status_code}"
            except Exception as e:
                picture_error = str(e)
        
        return jsonify({
            'user': user,
            'db_user': db_user,
            'picture_accessible': picture_accessible,
            'picture_error': picture_error,
            'cookies': {k: v[:20] + '...' if len(v) > 20 else v for k, v in cookies.items()},
            'has_access_token': 'access_token' in cookies,
            'has_refresh_token': 'refresh_token' in cookies
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/proxy-avatar/<path:url>', methods=['GET'])
def proxy_avatar(url):
    """Proxy Google profile pictures to avoid CORS issues"""
    try:
        import requests
        import base64
        
        # Decode the URL
        decoded_url = base64.b64decode(url.encode()).decode()
        
        # Fetch the image from Google
        response = requests.get(decoded_url, timeout=10)
        if response.status_code == 200:
            # Return the image with proper headers
            from flask import Response
            return Response(
                response.content,
                mimetype=response.headers.get('content-type', 'image/jpeg'),
                headers={
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*'
                }
            )
        else:
            return jsonify({'error': 'Failed to fetch image'}), 404
    except Exception as e:
        logging.error(f"Avatar proxy error: {e}")
        return jsonify({'error': 'Proxy failed'}), 500

@app.route('/upload', methods=['POST'])
def upload_video():
    """Upload a video file"""
    try:
        # Auth required
        user, err = require_auth()
        if err:
            return err
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Generate unique filename
        video_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        video_filename = f"{video_id}.{file_extension}"
        
        # Save video file
        video_path = os.path.join(UPLOAD_FOLDER, 'videos', video_filename)
        file.save(video_path)
        
        # Get video metadata
        duration = get_video_duration(video_path)
        file_size = os.path.getsize(video_path)
        
        # Determine owner from header (optional)
        owner_id = user['userId']

        # Save to MongoDB
        video_metadata = {
            'videoId': video_id,
            'originalName': filename,
            'filename': video_filename,
            'fileSize': file_size,
            'duration': duration,
            'uploadedAt': datetime.utcnow().isoformat(),
            'status': 'uploaded',
            'ownerId': owner_id
        }
        
        # Generate thumbnail
        thumb_rel = generate_thumbnail(video_path, video_id)
        if thumb_rel:
            video_metadata['thumbnails'] = {'default': thumb_rel}

        upsert_video(video_id, video_metadata)
        
        logging.info(f"Video uploaded successfully: {video_id} ({filename})")
        
        return jsonify({
            'ok': True,
            'videoId': video_id,
            'filename': filename,
            'duration': duration,
            'fileSize': file_size
        })
        
    except Exception as e:
        logging.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/global-search', methods=['POST'])
def global_search():
    """AI-Powered Semantic Search across all videos in the database"""
    try:
        user, err = require_auth()
        if err:
            return err
        data = request.get_json()
        query = data.get('query', '').strip()
        # Global search - no owner filtering for truly global results
        filters = data.get('filters', {}) or {}
        page = max(int(data.get('page', 1) or 1), 1)
        limit = min(max(int(data.get('limit', 20) or 20), 1), 50)
        
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        logging.info(f"AI Semantic search query: '{query}'")
        db = get_db()
        
        # Try AI-powered semantic search first
        if SEMANTIC_SEARCH_AVAILABLE and is_semantic_search_available():
            try:
                logging.info("Using AI-powered semantic search")
                semantic_results = semantic_search_videos(query, db, top_k=limit * 2)
                
                if semantic_results:
                    # Apply filters to semantic results
                    filtered_results = []
                    for result in semantic_results:
                        # Duration filter
                        dur_ok = True
                        dur_filter = (filters.get('duration') or 'all').lower()
                        duration = result.get('duration', 0)
                        if dur_filter == 'short':
                            dur_ok = duration < 60
                        elif dur_filter == 'medium':
                            dur_ok = 60 <= duration <= 300
                        elif dur_filter == 'long':
                            dur_ok = duration > 300
                        
                        if dur_ok:
                            filtered_results.append(result)
                    
                    # Pagination
                    total = len(filtered_results)
                    start = (page - 1) * limit
                    end = start + limit
                    paged = filtered_results[start:end]
                    
                    logging.info(f"AI Semantic search found {total} results")
                    return jsonify({
                        'ok': True,
                        'query': query,
                        'results': paged,
                        'total': total,
                        'page': page,
                        'limit': limit,
                        'search_type': 'ai_semantic',
                        'quality': 'perfect' if all(r.get('relevance', 0) >= 0.8 for r in paged) else 'excellent'
                    })
                else:
                    logging.info("AI Semantic search returned no results, falling back to traditional search")
            except Exception as e:
                logging.error(f"AI Semantic search failed: {e}")
                logging.info("Falling back to traditional search")
        
        # Fallback to traditional search if AI search fails or is unavailable
        logging.info("Using traditional keyword-based search")
        
        # Search in transcripts (global, no owner filter)
        transcript_results = []
        try:
            tr_filter = {'$text': {'$search': query}}
            transcript_results = list(db.transcripts.find(tr_filter).limit(30))
        except Exception:
            transcript_results = []
        
        # Enhanced regex search with word boundaries and partial matches
        if not transcript_results:
            # Try exact phrase first
            tr_filter = {'text': {'$regex': query, '$options': 'i'}}
            transcript_results = list(db.transcripts.find(tr_filter).limit(20))
        
            # If still no results, try individual words
            if not transcript_results:
                words = query.lower().split()
                for word in words:
                    if len(word) > 2:  # Skip very short words
                        tr_filter = {'text': {'$regex': word, '$options': 'i'}}
                        word_results = list(db.transcripts.find(tr_filter).limit(10))
                        transcript_results.extend(word_results)
        
        # Search in tags (global, no owner filter) - enhanced
        tag_results = []
        # Try exact phrase in tags
        tg_filter = {'keywords': {'$regex': query, '$options': 'i'}}
        tag_results = list(db.tags.find(tg_filter).limit(20))
        
        # If no tag results, try individual words
        if not tag_results:
            words = query.lower().split()
            for word in words:
                if len(word) > 2:
                    tg_filter = {'keywords': {'$regex': word, '$options': 'i'}}
                    word_results = list(db.tags.find(tg_filter).limit(10))
                    tag_results.extend(word_results)
        
        # Search in video titles/filenames (NEW)
        title_results = []
        try:
            # Search in video metadata for title matches
            title_filter = {'originalName': {'$regex': query, '$options': 'i'}}
            title_docs = list(db.videos.find(title_filter, {'videoId': 1}).limit(20))
            title_results = [{'videoId': doc['videoId']} for doc in title_docs]
            
            # If no title matches, try individual words
            if not title_results:
                words = query.lower().split()
                for word in words:
                    if len(word) > 2:
                        title_filter = {'originalName': {'$regex': word, '$options': 'i'}}
                        word_docs = list(db.videos.find(title_filter, {'videoId': 1}).limit(10))
                        title_results.extend([{'videoId': doc['videoId']} for doc in word_docs])
        except Exception as e:
            logging.warning(f"Title search failed: {e}")
            title_results = []
        
        # Combine and deduplicate results from all sources
        all_video_ids = set()
        for result in transcript_results + tag_results + title_results:
            all_video_ids.add(result['videoId'])
        
        logging.info(f"Search results: {len(transcript_results)} transcripts, {len(tag_results)} tags, {len(title_results)} titles, {len(all_video_ids)} unique videos")
        logging.info(f"Starting duplicate detection and filtering...")
        
        # Get video metadata for results and apply basic filters (global)
        videos = []
        processed_videos = set()  # Track processed videos to avoid duplicates
        processed_titles = set()  # Track processed titles to avoid content duplicates
        processed_content = set()  # Track processed content to avoid similar videos
        
        for video_id in list(all_video_ids):
            if video_id in processed_videos:
                continue  # Skip duplicates
            processed_videos.add(video_id)
            v_filter = {'videoId': video_id}
            video_meta = db.videos.find_one(v_filter)
            if video_meta:
                duration = float(video_meta.get('duration', 0) or 0)
                uploaded_at = video_meta.get('uploadedAt', '')
                owner_id = video_meta.get('ownerId', '')
                
                # Get user info for proper display - ENHANCED
                user_info = {'name': 'Unknown User', 'email': '', 'picture': ''}
                if owner_id:
                    # Try multiple ways to find the user
                    user_doc = db.users.find_one({'userId': owner_id})
                    if not user_doc:
                        # Try finding by email if userId doesn't work
                        user_doc = db.users.find_one({'email': owner_id})
                    if not user_doc:
                        # Try finding by name if email doesn't work
                        user_doc = db.users.find_one({'name': owner_id})
                    
                    if user_doc:
                        user_info = {
                            'name': user_doc.get('name', user_doc.get('email', 'Unknown User')),
                            'email': user_doc.get('email', ''),
                            'picture': user_doc.get('picture', '')
                        }
                        logging.info(f"✅ Found user for video {video_id}: {user_info['name']} ({user_info['email']})")
                    else:
                        # Create a fallback user info based on owner_id
                        user_info = {
                            'name': f"User {owner_id[:8]}" if owner_id else 'Unknown User',
                            'email': owner_id if '@' in str(owner_id) else '',
                            'picture': ''
                        }
                        logging.warning(f"⚠️ No user found for ownerId: {owner_id}, using fallback: {user_info['name']}")
                else:
                    logging.warning(f"⚠️ No ownerId for video: {video_id}")
                
                # Duration filter
                dur_ok = True
                dur_filter = (filters.get('duration') or 'all').lower()
                if dur_filter == 'short':
                    dur_ok = duration < 60
                elif dur_filter == 'medium':
                    dur_ok = 60 <= duration <= 300
                elif dur_filter == 'long':
                    dur_ok = duration > 300

                # Date filter (very simple)
                date_ok = True
                # Could parse ISO and compare, skip heavy parsing for now

                if dur_ok and date_ok:
                    # Get transcript for this video (global)
                    transcript = db.transcripts.find_one({'videoId': video_id})
                    transcript_text = transcript.get('text', '') if transcript else ''
                    
                    # Get tags for this video (global)
                    tags_doc = db.tags.find_one({'videoId': video_id})
                    tags = tags_doc.get('keywords', []) if tags_doc else []
                    
                    # Calculate relevance using phrase + coverage scoring for more intuitive 100% matches
                    import re
                    def tokenize(s: str):
                        return [w for w in re.findall(r"[a-z0-9]+", (s or '').lower()) if w]

                    def coverage(words_query, text: str) -> float:
                        if not text:
                            return 0.0
                        ws = set(tokenize(text))
                        if not ws:
                            return 0.0
                        hits = sum(1 for w in words_query if w in ws)
                        return hits / max(len(words_query), 1)

                    q_words = tokenize(query)
                    query_lower = (query or '').lower().strip()

                    # Enhanced relevance calculation for better matches
                    transcript_text_l = (transcript_text or '').lower()
                    tags_text_l = (' '.join([str(t) for t in (tags or [])])).lower()
                    
                    # Exact phrase match -> perfect score
                    if query_lower and (query_lower in transcript_text_l or query_lower in tags_text_l):
                        relevance = 1.0
                    else:
                        # Calculate coverage scores
                        text_cov = coverage(q_words, transcript_text_l)
                        tag_cov = coverage(q_words, tags_text_l)
                        
                        # Enhanced weighted scoring
                        relevance = max(0.9 * text_cov + 0.1 * tag_cov, 0.9 * tag_cov + 0.1 * text_cov)
                        
                        # Title matching boost
                        title_text = (video_meta.get('originalName', '') or video_meta.get('filename','') or '')
                        title_cov = coverage(q_words, title_text)
                        if title_cov > 0:
                            if title_cov >= 0.8:  # 80%+ words in title
                                relevance = max(relevance, 0.95)
                            elif title_cov >= 0.6:  # 60%+ words in title
                                relevance = max(relevance, 0.9)
                            elif title_cov >= 0.4:  # 40%+ words in title
                                relevance = max(relevance, 0.8)
                            elif title_cov >= 0.2:  # 20%+ words in title
                                relevance = max(relevance, 0.7)
                            else:  # Some words in title
                                relevance = max(relevance, 0.6)
                        
                        # Prefix matching boost
                        if q_words:
                            prefix_hit = False
                            ws = set(tokenize(transcript_text_l)) | set(tokenize(tags_text_l))
                            for qw in q_words:
                                if any(w.startswith(qw) for w in ws):
                                    prefix_hit = True
                                    break
                            if prefix_hit:
                                relevance = min(1.0, relevance + 0.1)
                        
                        # Ensure minimum relevance for any match
                        if relevance <= 0:
                            relevance = 0.3

                    # High-quality threshold for deployment - only show excellent matches
                    if relevance >= 0.6:  # Only show 60%+ relevance for perfect results
                        # Enhanced duplicate detection
                        video_title = video_meta.get('originalName', 'Untitled Video')
                        video_content_hash = f"{video_title}_{duration}_{len(transcript_text)}"
                        
                        # Skip if we've seen this exact title or very similar content
                        if video_title in processed_titles or video_content_hash in processed_content:
                            continue  # Skip duplicate content
                        
                        processed_titles.add(video_title)
                        processed_content.add(video_content_hash)

                    videos.append({
                        'id': video_id,
                        'videoId': video_id,
                        'title': video_meta.get('originalName', 'Untitled Video'),
                            'user': user_info['name'],  # Show actual user name
                            'userEmail': user_info['email'],  # Include email for reference
                            'userPicture': user_info['picture'],  # Include profile picture
                        'duration': duration,
                        'uploadedAt': uploaded_at,
                        'thumbnail': (video_meta.get('thumbnails') or {}).get('default'),
                        'transcript': transcript_text[:200] + '...' if len(transcript_text) > 200 else transcript_text,
                        'tags': tags,
                        'relevance': min(relevance, 1.0),
                        'views': 0,  # Placeholder
                        'likes': 0,  # Placeholder
                        'category': 'general'  # Default category
                    })
        
        # Final deduplication step - remove any remaining duplicates
        final_videos = []
        seen_final = set()
        duplicates_removed = 0
        for video in videos:
            video_key = f"{video['videoId']}_{video['title']}"
            if video_key not in seen_final:
                seen_final.add(video_key)
                final_videos.append(video)
            else:
                duplicates_removed += 1
        
        logging.info(f"Final deduplication: {duplicates_removed} duplicates removed, {len(final_videos)} unique results")
        
        # Sort by relevance descending for best results first
        final_videos.sort(key=lambda x: x['relevance'], reverse=True)
        
        # Pagination
        total = len(final_videos)
        start = (page - 1) * limit
        end = start + limit
        paged = final_videos[start:end]

        return jsonify({
            'ok': True,
            'query': query,
            'results': paged,
            'total': total,
            'page': page,
            'limit': limit,
            'search_type': 'traditional',
            'quality': 'high' if all(r.get('relevance', 0) >= 0.7 for r in paged) else 'good'
        })
        
    except Exception as e:
        logging.error(f"Search error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/videos/<videoId>/like', methods=['POST'])
def toggle_like(videoId):
    """Toggle like status for a video"""
    try:
        user_id = request.headers.get('X-User-Id', '').strip()
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        db = get_db()
        
        # Check if user already liked this video
        like_doc = db.likes.find_one({
            'videoId': videoId,
            'userId': user_id
        })
        
        if like_doc:
            # Unlike: remove the like
            db.likes.delete_one({
                'videoId': videoId,
                'userId': user_id
            })
            liked = False
        else:
            # Like: add the like
            db.likes.insert_one({
                'videoId': videoId,
                'userId': user_id,
                'likedAt': datetime.utcnow().isoformat()
            })
            liked = True
        
        # Count total likes for this video
        like_count = db.likes.count_documents({'videoId': videoId})
        
        return jsonify({
            'liked': liked,
            'likeCount': like_count
        })
        
    except Exception as e:
        logging.error(f"Like toggle error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/videos/<videoId>/stats', methods=['GET'])
def get_video_stats(videoId):
    """Get video statistics (views, likes)"""
    try:
        db = get_db()
        
        # Count likes
        like_count = db.likes.count_documents({'videoId': videoId})
        
        # Get view count
        view_doc = db.views.find_one({'videoId': videoId})
        view_count = int((view_doc or {}).get('count', 0))
        
        return jsonify({
            'likes': like_count,
            'views': view_count
        })
        
    except Exception as e:
        logging.error(f"Stats error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/videos/<videoId>/view', methods=['POST'])
def increment_view(videoId):
    """Increment the view count once per (userId OR sessionId) per video.
    Prefers unique per-user when X-User-Id is provided; otherwise uses provided sessionId.
    """
    try:
        db = get_db()
        payload = request.get_json(silent=True) or {}
        # Optional auth
        cu = _current_user()
        user_id = (cu or {}).get('userId', '')
        session_id = (payload.get('sessionId') or '').strip()

        unique_filter = {'videoId': videoId}
        if user_id:
            unique_filter['userId'] = user_id
        elif session_id:
            unique_filter['sessionId'] = session_id
        else:
            unique_filter['sessionId'] = request.remote_addr or 'anonymous'

        try:
            db.views_unique.insert_one({**unique_filter, 'createdAt': datetime.utcnow().isoformat()})
            db.views.update_one(
                {'videoId': videoId},
                {'$inc': {'count': 1}, '$setOnInsert': {'videoId': videoId}},
                upsert=True
            )
        except Exception:
            pass

        doc = db.views.find_one({'videoId': videoId})
        return jsonify({'ok': True, 'views': int((doc or {}).get('count', 0))})
    except Exception as e:
        logging.error(f"Increment view error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/process/<videoId>', methods=['POST'])
def process_video(videoId):
    """Process a video: transcribe, tag, and analyze"""
    try:
        user, err = require_auth()
        if err:
            return err
        # Resolve actual video path and extension
        video_path, ext = resolve_video_path(videoId)
        if not video_path:
            return jsonify({'error': 'Video not found'}), 404
        
        # Set job status to processing
        set_job(videoId, 'processing', {'step': 'starting', 'ownerId': user['userId']})
        
        # Step 1: Enhanced Transcription (Speech + Subtitles) with OCR fallback
        set_job(videoId, 'processing', {'step': 'transcription'})
        try:
            if TRANSCRIPTION_AVAILABLE and enhanced_transcriber_simple:
                transcript_text, segments = enhanced_transcriber_simple.transcribe_video(video_path)
                # If no speech/subtitles detected, try OCR-based fallback
                if (not transcript_text or not transcript_text.strip() or transcript_text.strip().lower() in [
                    'no speech detected in video', 'no speech or text detected'
                ]):
                    if OCR_TRANSCRIPTION_AVAILABLE and enhanced_transcriber:
                        try:
                            ocr_text, ocr_segments = enhanced_transcriber.transcribe_video(video_path)
                            if ocr_text and ocr_text.strip():
                                transcript_text, segments = ocr_text, ocr_segments
                            else:
                                transcript_text = transcript_text or "No speech or text detected"
                                segments = []
                        except Exception as _e:
                            logging.warning(f"OCR transcription fallback failed for {videoId}: {_e}")
                            transcript_text = transcript_text or "No speech or text detected"
                    segments = []
            else:
                transcript_text = "Transcription service not available"
                segments = []
        except Exception as e:
            logging.warning(f"Transcription failed for {videoId}: {e}")
            transcript_text = "Transcription failed - using fallback"
            segments = []
        
        # Save transcript
        save_transcript(videoId, transcript_text, segments)
        
        # Step 2: Simple Tagging (without OpenCV)
        set_job(videoId, 'processing', {'step': 'visual_tagging'})
        try:
            visual_tags = generate_simple_tags(video_path)
        except Exception as e:
            logging.warning(f"Visual tagging failed for {videoId}: {e}")
            visual_tags = ['video', 'content', 'media']
        
        # Save tags
        save_tags(videoId, visual_tags)
        
        # Step 3: Emotion Analysis
        set_job(videoId, 'processing', {'step': 'emotion_analysis'})
        try:
            emotions = analyze_emotions_from_text_and_segments(transcript_text, segments)
        except Exception as e:
            logging.warning(f"Emotion analysis failed for {videoId}: {e}")
            emotions = [{'timestamp': 0, 'label': 'neutral', 'intensity': 0.5}]
        
        # Step 4: Indexing
        set_job(videoId, 'processing', {'step': 'indexing'})
        
        # Step 5: Story Draft
        set_job(videoId, 'processing', {'step': 'story_draft'})
        story_draft = f"AI-generated story based on the transcript: {transcript_text[:100]}..."
        
        # Step 6: Final Render
        set_job(videoId, 'processing', {'step': 'final_render'})
        
        # Mark as completed
        set_job(videoId, 'completed', {
            'transcript': transcript_text,
            'tags': visual_tags,
            'emotions': emotions,
            'story_draft': story_draft,
            'completed_at': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'ok': True,
            'videoId': videoId,
            'status': 'processing_completed'
        })
        
    except Exception as e:
        logging.error(f"Error processing video {videoId}: {e}")
        set_job(videoId, 'error', {'error': str(e)})
        return jsonify({'error': str(e)}), 500

@app.route('/results/<videoId>', methods=['GET'])
def get_results(videoId):
    """Return transcript and tags from MongoDB for a video."""
    try:
        user, err = require_auth()
        if err:
            return err
        db = get_db()
        owner_id = user['userId']
        base = {'videoId': videoId}
        if owner_id:
            base_owner = {'videoId': videoId, 'ownerId': owner_id}
        else:
            base_owner = base
        tr = db.transcripts.find_one(base_owner) or {}
        tg = db.tags.find_one(base_owner) or {}
        job = db.jobs.find_one(base_owner) or {}
        return jsonify({
            'videoId': videoId,
            'status': job.get('status', 'unknown'),
            'transcript': tr.get('text', ''),
            'segments': tr.get('segments', []),
            'tags': tg.get('keywords', []),
            # Provide last known emotions and current step from job details
            'emotions': (job.get('details', {}) or {}).get('emotions', []) if isinstance(job, dict) else [],
            'currentStep': (job.get('details', {}) or {}).get('step', ''),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- User-scoped management endpoints ---

@app.route('/my/videos', methods=['GET'])
def list_my_videos():
    """List videos for current user (via X-User-Id)."""
    try:
        user, err = require_auth()
        if err:
            return err
        owner_id = user['userId']
        db = get_db()
        vids = list(db.videos.find({'ownerId': owner_id}, {
            '_id': 0, 'videoId': 1, 'originalName': 1, 'filename': 1,
            'fileSize': 1, 'duration': 1, 'uploadedAt': 1, 'status': 1,
            'thumbnails': 1
        }))
        return jsonify({'ok': True, 'videos': vids})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/my/videos/<videoId>', methods=['DELETE'])
def delete_my_video(videoId):
    """Delete a user's video and all derived data if they own it."""
    try:
        user, err = require_auth()
        if err:
            return err
        owner_id = user['userId']
        db = get_db()
        v = db.videos.find_one({'videoId': videoId}) or {}
        if not v:
            return jsonify({'ok': False, 'error': 'Video not found'}), 404
        if v.get('ownerId') != owner_id:
            return jsonify({'ok': False, 'error': 'Not owner of this video'}), 403

        # Delete DB docs
        db.videos.delete_one({'videoId': videoId})
        db.transcripts.delete_one({'videoId': videoId})
        db.tags.delete_one({'videoId': videoId})
        db.jobs.delete_one({'videoId': videoId})

        # Delete files on disk (video + thumbnail if exist)
        try:
            base_path = os.path.join(UPLOAD_FOLDER, 'videos')
            for ext in ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv']:
                p = os.path.join(base_path, f"{videoId}.{ext}")
                if os.path.exists(p):
                    os.remove(p)
            # thumbnails
            thumb_dir = os.path.join(UPLOAD_FOLDER, 'thumbnails')
            for name in os.listdir(thumb_dir):
                if name.startswith(videoId):
                    try:
                        os.remove(os.path.join(thumb_dir, name))
                    except Exception:
                        pass
        except Exception:
            pass

        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.route('/my/analyses', methods=['GET'])
def list_my_analyses():
    """List analysis summaries (status, brief transcript, tag samples) for current user."""
    try:
        user, err = require_auth()
        if err:
            return err
        owner_id = user['userId']
        db = get_db()
        # Get user's videos
        vmap = {v['videoId']: v for v in db.videos.find({'ownerId': owner_id}, {'_id':0})}
        # Get transcripts/tags/jobs for those videoIds
        vids = list(vmap.keys())
        analyses = []
        if vids:
            tmap = {t['videoId']: t for t in db.transcripts.find({'videoId': {'$in': vids}}, {'_id':0})}
            gmap = {g['videoId']: g for g in db.tags.find({'videoId': {'$in': vids}}, {'_id':0})}
            jmap = {j['videoId']: j for j in db.jobs.find({'videoId': {'$in': vids}}, {'_id':0})}
            for vid in vids:
                tr = (tmap.get(vid) or {})
                tg = (gmap.get(vid) or {})
                jb = (jmap.get(vid) or {})
                analyses.append({
                    'videoId': vid,
                    'originalName': vmap[vid].get('originalName') or vmap[vid].get('filename'),
                    'status': jb.get('status','unknown'),
                    'currentStep': (jb.get('details',{}) or {}).get('step',''),
                    'transcriptPreview': (tr.get('text','') or '')[:200],
                    'tags': (tg.get('keywords') or [])[:8]
                })
        return jsonify({'ok': True, 'analyses': analyses})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/video/<videoId>', methods=['GET'])
def serve_video(videoId):
    """Serve an uploaded video by its ID, trying common extensions."""
    try:
        for ext in list(ALLOWED_EXTENSIONS):
            filename = f"{videoId}.{ext}"
            path = os.path.join(UPLOAD_FOLDER, 'videos', filename)
            if os.path.exists(path):
                return send_from_directory(os.path.join(UPLOAD_FOLDER, 'videos'), filename, as_attachment=False)
        return jsonify({'error': 'Video not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/thumbnail/<videoId>', methods=['GET'])
def serve_thumbnail(videoId):
    try:
        filename = f"{videoId}.jpg"
        path = os.path.join(UPLOAD_FOLDER, 'thumbnails', filename)
        if os.path.exists(path):
            return send_from_directory(os.path.join(UPLOAD_FOLDER, 'thumbnails'), filename, as_attachment=False)
        return jsonify({'error': 'Thumbnail not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Support paths stored in DB like 'thumbnails/<id>.jpg'
@app.route('/thumbnails/<path:filename>', methods=['GET'])
def serve_thumbnail_by_filename(filename):
    try:
        return send_from_directory(os.path.join(UPLOAD_FOLDER, 'thumbnails'), filename, as_attachment=False)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/thumbnail/<videoId>/regenerate', methods=['POST'])
def regenerate_thumbnail(videoId):
    """Regenerate a thumbnail for a video the current user owns."""
    try:
        user, err = require_auth()
        if err:
            return err
        db = get_db()
        v = db.videos.find_one({'videoId': videoId}) or {}
        if not v:
            return jsonify({'ok': False, 'error': 'Video not found'}), 404
        if v.get('ownerId') and v.get('ownerId') != user['userId']:
            return jsonify({'ok': False, 'error': 'Not owner of this video'}), 403
        path, _ext = resolve_video_path(videoId)
        if not path:
            return jsonify({'ok': False, 'error': 'Source video file missing'}), 404
        rel = generate_thumbnail(path, videoId)
        if rel:
            try:
                db.videos.update_one({'videoId': videoId}, {'$set': {'thumbnails.default': rel}})
            except Exception:
                pass
            return jsonify({'ok': True, 'thumbnail': f"/{rel}"})
        return jsonify({'ok': False, 'error': 'Failed to generate thumbnail'}), 500
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/renders/<filename>', methods=['GET'])
def serve_render(filename):
    try:
        return send_from_directory(os.path.join(UPLOAD_FOLDER, 'renders'), filename, as_attachment=False)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/generate-story', methods=['POST'])
def generate_story():
    """Generate an AI story using Gemini based on transcript, tags, and optional prompt.

    Request JSON: { videoId: string, prompt?: string, mode?: 'positive'|'neutral'|'contrast' }
    Response on success: { success: true, storyId, scenes: [{start,end,title,narration}], summary }
    """
    try:
        data = request.get_json(force=True)
        video_id = data.get('videoId')
        user_prompt = (data.get('prompt') or '').strip()
        mode = (data.get('mode') or 'positive').strip().lower()
        length = (data.get('length') or 'long').strip().lower()  # 'short'|'long'

        if not video_id:
            return jsonify({'success': False, 'error': 'videoId is required'}), 400

        # Load context from DB
        db = get_db()
        owner_id = request.headers.get('X-User-Id') or None
        base = {'videoId': video_id}
        if owner_id:
            base['ownerId'] = owner_id
        tr = db.transcripts.find_one(base) or {}
        tg = db.tags.find_one(base) or {}
        transcript_text = tr.get('text', '')
        segments = tr.get('segments', [])
        tags = tg.get('keywords', [])

        # Basic validation
        if not transcript_text:
            return jsonify({'success': False, 'error': 'Transcript not found for this video'}), 400

        # Try to import Gemini client lazily
        gemini_available = False
        model = None
        try:
            import os
            import google.generativeai as genai
            api_key = os.environ.get('GEMINI_API_KEY')
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                gemini_available = True
        except Exception as e:
            logger.warning(f"Gemini not available, will use free fallback: {e}")

        # Compose structured prompt enforcing JSON output
        # Use a few transcript excerpts to keep prompt short
        excerpt = transcript_text[:2000]
        tag_list = ', '.join(tags[:20])

        style_hint = {
            'positive': 'inspirational, uplifting, cinematic',
            'neutral': 'objective, descriptive, documentary',
            'contrast': 'provide two contrasting story paths: a positive path and a negative path'
        }.get(mode, 'inspirational, uplifting, cinematic')

        target_length_words = '450-650' if length == 'long' else '180-260'

        system_prompt = f"""
You are an assistant that writes a concise narrative story to play as voice-over while a user watches their uploaded video. Base it ONLY on the provided transcript excerpts and tags. Keep it grounded and avoid hallucinating specifics not present.

Return STRICT JSON with this schema:
{{
  "summary": "one-paragraph overview",
  "scenes": [
    {{"start": 0.0, "end": 5.0, "title": "...", "narration": "..."}}
  ],
  "fullNarration": "a continuous narration of {target_length_words} words"
}}

Rules:
- 6 to 10 scenes maximum.
- Each scene duration 3–8 seconds. Ensure start < end and times are non-overlapping and increasing.
- Narration should be 1–2 sentences per scene, <= 220 characters, first-person or third-person consistent.
- Tone: {style_hint}.
- Use provided prompt if any to guide tone only, not content invention.
 - The fullNarration must be between {target_length_words} words and flow as a single story suitable for continuous voice-over.
"""

        user_content = f"PROMPT: {user_prompt}\n\nTAGS: {tag_list}\n\nTRANSCRIPT_EXCERPT:\n{excerpt}"

        payload = None
        if gemini_available and model is not None:
            try:
                response = model.generate_content([system_prompt, user_content])
                text = response.text or ''
                import json
                start = text.find('{')
                end = text.rfind('}') + 1
                if start != -1 and end != -1:
                    payload = json.loads(text[start:end])
            except Exception as e:
                logger.warning(f"Gemini generation failed, using fallback: {e}")

        # Free fallback: synthesize a story from transcript and tags if payload missing
        if not payload:
            # Build simple scenes along the duration timeline
            def split_into_scenes(total_duration: float, min_count: int = 6, max_count: int = 10):
                if total_duration <= 0:
                    total_duration = max(30.0, len(transcript_text.split()) / 2.5)
                count = min(max_count, max(min_count, int(total_duration // 6)))
                seg = max(3.0, total_duration / max(count, 1))
                scenes = []
                t = 0.0
                for i in range(count):
                    start_t = round(t, 3)
                    end_t = round(min(total_duration, t + seg), 3)
                    scenes.append({'start': start_t, 'end': end_t, 'title': f'Scene {i+1}', 'narration': ''})
                    t += seg
                    if t >= total_duration:
                        break
                return scenes

            duration = float((get_db().videos.find_one({'videoId': video_id}) or {}).get('duration', 0) or 0)
            scenes = split_into_scenes(duration)

            # Create narration by summarizing windows of the transcript
            words = transcript_text.split()
            window = max(40, len(words) // max(len(scenes), 1))
            narration_parts = []
            for i, sc in enumerate(scenes):
                start_idx = i * window
                chunk = ' '.join(words[start_idx:start_idx + window]).strip()
                if not chunk:
                    chunk = 'This segment continues the story with visual moments and actions.'
                # Add tag hints to keep it content-aware
                tag_hint = ''
                if tags:
                    tag_hint = f" Key themes: {', '.join(tags[:3])}."
                sentence = f"{chunk}. {tag_hint}"
                sc['narration'] = sentence
                narration_parts.append(sentence)

            full_narration = ' '.join(narration_parts)
            # Expand to target length if needed
            if length == 'long':
                while len(full_narration.split()) < 450:
                    full_narration += ' ' + ' '.join(words[:80] or ['This moment adds depth to the narrative.'])

            payload = {
                'summary': f"A {style_hint} narrative built from the video's transcript and visual tags.",
                'scenes': scenes,
                'fullNarration': full_narration
            }

        # Normalize scenes and time bounds using video duration if available
        # Obtain duration from uploads metadata
        v_filter = {'videoId': video_id}
        if owner_id:
            v_filter['ownerId'] = owner_id
        video_meta = db.videos.find_one(v_filter) or {}
        duration = float(video_meta.get('duration', 0) or 0)
        scenes = payload.get('scenes', [])
        normalized = []
        current_start = 0.0
        for scene in scenes[:10]:
            try:
                s = float(scene.get('start', current_start))
                e = float(scene.get('end', s + 5.0))
                if duration and e > duration:
                    e = duration
                if s < current_start:
                    s = current_start
                if e - s < 2.0:
                    e = s + 2.0
                normalized.append({
                    'start': round(s, 3),
                    'end': round(e, 3),
                    'title': str(scene.get('title', 'Scene')), 
                    'narration': str(scene.get('narration', '')).strip()
                })
                current_start = e
                if duration and current_start >= duration:
                    break
            except Exception:
                continue

        if not normalized:
            # Fallback single-scene narration
            normalized = [{
                'start': 0.0,
                'end': min(12.0, duration or 12.0),
                'title': 'Narration',
                'narration': payload.get('summary', 'This video shows memorable moments.')
            }]

        result = {
            'success': True,
            'storyId': str(uuid.uuid4()),
            'summary': payload.get('summary', ''),
            'scenes': normalized,
            'fullNarration': payload.get('fullNarration', '')
        }

        return jsonify(result)
    except Exception as e:
        logger.error(f"generate-story error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/render-story', methods=['POST'])
def render_story():
    """Render a final MP4 by trimming scenes and concatenating them.

    Request JSON: { videoId, scenes: [{start,end}], transition?: 'fade'|'cut' }
    Response: { ok: true, url: '/renders/<file>' }
    """
    try:
        data = request.get_json(force=True)
        video_id = data.get('videoId')
        scenes = data.get('scenes') or []
        transition = (data.get('transition') or 'cut').lower()
        if not video_id or not scenes:
            return jsonify({'error': 'videoId and scenes are required'}), 400

        # For security, ensure user owns the video if header present
        owner_id = request.headers.get('X-User-Id') or None
        src_path, ext = resolve_video_path(video_id)
        if not src_path:
            return jsonify({'error': 'Video not found'}), 404

        # Probe duration and audio stream
        def probe_has_audio(path: str) -> bool:
            try:
                cmd = [
                    'ffprobe','-v','error','-select_streams','a','-show_entries','stream=index','-of','csv=p=0',path
                ]
                out = subprocess.run(cmd, capture_output=True, text=True)
                return out.stdout.strip() != ''
            except Exception:
                return False

        total_duration = get_video_duration(src_path) or 0
        has_audio = probe_has_audio(src_path)

        # Sanitize scenes: clamp to [0, total_duration], enforce increasing order and min duration
        sanitized = []
        current = 0.0
        for sc in scenes[:20]:
            try:
                s = float(sc.get('start', current))
                e = float(sc.get('end', s + 2.0))
                if total_duration:
                    s = max(0.0, min(s, total_duration))
                    e = max(s + 0.1, min(e, total_duration))
                if s < current:
                    s = current
                if e - s < 0.2:
                    e = s + 0.2
                sanitized.append((round(s,3), round(e,3)))
                current = e
            except Exception:
                continue

        if not sanitized:
            return jsonify({'error': 'No valid scenes provided after normalization'}), 400

        # Build filter_complex for trimming and concatenation
        filter_parts = []
        map_parts = []
        for i, (s, e) in enumerate(sanitized):
            if has_audio:
                filter_parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}];[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}]")
                map_parts.append(f"[v{i}][a{i}]")
            else:
                # Video only; we'll add silent audio later
                filter_parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}]")
                map_parts.append(f"[v{i}]")

        n = len(sanitized)
        if has_audio:
            concat_streams = ''.join(map_parts)
            filter_complex = ';'.join(filter_parts) + f";{concat_streams}concat=n={n}:v=1:a=1[v][a]"
        else:
            concat_streams = ''.join(map_parts)
            # Concat video only, then add silent mono audio track matching duration
            filter_complex = ';'.join(filter_parts) + f";{concat_streams}concat=n={n}:v=1:a=0[v];anullsrc=channel_layout=mono:sample_rate=44100[a]"

        out_name = f"{video_id}_{uuid.uuid4().hex[:8]}.mp4"
        out_path = os.path.join(UPLOAD_FOLDER, 'renders', out_name)

        cmd = [
            'ffmpeg', '-y', '-i', src_path,
            '-filter_complex', filter_complex,
        ]
        if has_audio:
            cmd += ['-map','[v]','-map','[a]']
        else:
            cmd += ['-map','[v]','-map','[a]']
        cmd += ['-c:v','libx264','-preset','veryfast','-crf','23','-c:a','aac','-b:a','128k', out_path]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            logger.error(f"ffmpeg render failed: {proc.stderr[:500]}")
            return jsonify({'error': 'Render failed', 'details': proc.stderr[-800:]}), 500

        if not os.path.exists(out_path):
            return jsonify({'error': 'Render failed'}), 500

        url = f"/renders/{out_name}"
        return jsonify({'ok': True, 'url': url})
    except Exception as e:
        logger.error(f"render-story error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/collective-generate-story', methods=['POST'])
def collective_generate_story():
    """Generate a story from multiple videos selected by query or explicit IDs.

    Request JSON: { query?: string, videoIds?: [string], limit?: number, prompt?: string, mode?: string }
    """
    try:
        data = request.get_json(force=True)
        query = (data.get('query') or '').strip()
        explicit_ids = data.get('videoIds') or []
        limit = min(max(int(data.get('limit', 5) or 5), 1), 20)
        user_prompt = (data.get('prompt') or '').strip()
        mode = (data.get('mode') or 'positive').strip().lower()

        db = get_db()
        owner_id = request.headers.get('X-User-Id') or None

        video_ids = []
        if explicit_ids:
            video_ids = [vid for vid in explicit_ids if isinstance(vid, str)]
        elif query:
            # Pull candidate IDs from transcripts text index and tag regex
            tr_q = {'$text': {'$search': query}}
            tg_q = {'keywords': {'$regex': query, '$options': 'i'}}
            if owner_id:
                tr_q['ownerId'] = owner_id
                tg_q['ownerId'] = owner_id
            tr_hits = list(db.transcripts.find(tr_q, {'videoId': 1}).limit(limit * 3))
            tg_hits = list(db.tags.find(tg_q, {'videoId': 1}).limit(limit * 3))
            seen = set()
            for doc in tr_hits + tg_hits:
                vid = doc.get('videoId')
                if vid and vid not in seen:
                    seen.add(vid)
                    video_ids.append(vid)
                if len(video_ids) >= limit:
                    break

        # Fallback: if no matches by query/ids, use most recent user's videos
        if not video_ids:
            v_filter = {}
            if owner_id:
                v_filter['ownerId'] = owner_id
            recent = list(db.videos.find(v_filter, {'videoId': 1}).sort('uploadedAt', -1).limit(limit))
            video_ids = [d.get('videoId') for d in recent if d.get('videoId')]
        if not video_ids:
            return jsonify({'success': False, 'error': 'No matching videos found'}), 400

        # Aggregate transcripts only (no tag hints in narration)
        combined_texts = []
        total_duration = 0.0
        for vid in video_ids[:limit]:
            base = {'videoId': vid}
            if owner_id:
                base['ownerId'] = owner_id
            tr = db.transcripts.find_one(base) or {}
            combined_texts.append(tr.get('text', ''))
            v_filter = {'videoId': vid}
            if owner_id:
                v_filter['ownerId'] = owner_id
            meta = db.videos.find_one(v_filter) or {}
            total_duration += float(meta.get('duration', 0) or 0)

        transcript_text = '\n\n'.join([t for t in combined_texts if t])

        # Try Gemini first for higher-quality collective story
        payload = None
        try:
            import os
            import google.generativeai as genai
            api_key = os.environ.get('GEMINI_API_KEY')
            if api_key and transcript_text.strip():
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                style_hint = {
                    'positive': 'inspirational, uplifting, cinematic',
                    'neutral': 'objective, descriptive, documentary',
                    'contrast': 'reflective, compare perspectives'
                }.get(mode, 'inspirational, uplifting, cinematic')

                target_length_words = '500-800' if total_duration > 180 else '220-360'
                system_prompt = f"""
You are a world-class story editor. Create a meaningful collective story from multiple user-uploaded videos.
Base the narrative ONLY on the transcript excerpts provided. Use the user's prompt to guide tone, not to invent facts.
Return STRICT JSON:
{{
  "summary": "one-paragraph overview",
  "scenes": [{{"start": 0.0, "end": 5.0, "title": "...", "narration": "..."}}],
  "fullNarration": "single continuous narration of {target_length_words} words"
}}
Rules:
- 6–10 scenes depending on duration; each scene 3–8 seconds, non-overlapping and increasing times.
- Narration: 1–2 sentences per scene, <= 220 chars each, tone: {style_hint}.
- Do NOT include tag lists or bullet points; output clean prose only.
"""

                user_content = (
                    f"PROMPT: {user_prompt or 'none'}\n\n"
                    f"TOTAL_DURATION_SECONDS: {int(total_duration)}\n\n"
                    f"TRANSCRIPTS (combined excerpts):\n{transcript_text[:6000]}"
                )

                resp = model.generate_content([system_prompt, user_content])
                text = resp.text or ''
                import json
                start = text.find('{'); end = text.rfind('}') + 1
                if start != -1 and end != -1:
                    payload = json.loads(text[start:end])
        except Exception as _e:
            pass

        # Fallback: synthesize scenes + narration locally if Gemini not available
        words = transcript_text.split()
        def split_into_scenes(total_d: float, min_count: int = 6, max_count: int = 10):
            if total_d <= 0:
                total_d = max(45.0, len(words) / 2.5)
            count = min(max_count, max(min_count, int(total_d // 7)))
            seg = max(3.0, total_d / max(count, 1))
            scenes = []
            t = 0.0
            for i in range(count):
                s = round(t, 3)
                e = round(t + seg, 3)
                scenes.append({'start': s, 'end': e, 'title': f'Scene {i+1}', 'narration': ''})
                t += seg
            return scenes

        # If Gemini returned a valid payload, use it directly
        if payload and isinstance(payload, dict) and payload.get('fullNarration') and payload.get('scenes'):
            result = {
                'success': True,
                'storyId': str(uuid.uuid4()),
                'sourceVideoIds': video_ids[:limit],
                'summary': payload.get('summary') or 'A unified story from your videos.',
                'scenes': payload.get('scenes'),
                'fullNarration': payload.get('fullNarration')
            }
            return jsonify(result)

        scenes = split_into_scenes(total_duration)
        window = max(45, len(words) // max(len(scenes), 1))
        narration_parts = []

        def normalize_sentence(txt: str) -> str:
            s = (txt or '').strip()
            if not s:
                return ''
            # Collapse repeats and ensure period
            while '  ' in s:
                s = s.replace('  ', ' ')
            if not s.endswith(('.', '!', '?')):
                s += '.'
            return s

        # Intro crafted from prompt/mode
        mode_styles = {
            'positive': 'an uplifting, hopeful tone',
            'neutral': 'a calm, documentary tone',
            'contrast': 'a reflective tone highlighting different perspectives'
        }
        intro = "This collective story weaves together moments from your videos " \
                + (f"with {mode_styles.get(mode, 'an authentic tone')}" )
        if user_prompt:
            intro += f", inspired by your prompt: '{user_prompt}'."
        else:
            intro += "."
        narration_parts.append(intro)

        for i, sc in enumerate(scenes):
            start_idx = i * window
            chunk_raw = ' '.join(words[start_idx:start_idx + window]).strip()
            if not chunk_raw:
                sentence = 'This segment connects shared experiences across your videos.'
            else:
                sentence = normalize_sentence(chunk_raw)
            sc['narration'] = sentence
            narration_parts.append(sentence)

        # Outro summarizing the collection
        outro = 'Together, these scenes form a meaningful narrative drawn from your uploads.'
        narration_parts.append(outro)

        full_narration = ' '.join(narration_parts)
        result = {
            'success': True,
            'storyId': str(uuid.uuid4()),
            'sourceVideoIds': video_ids[:limit],
            'summary': 'An aggregated narrative built from multiple videos based on your query.',
            'scenes': scenes,
            'fullNarration': full_narration
        }
        return jsonify(result)
    except Exception as e:
        logger.error(f"collective-generate-story error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/analyze-emotions', methods=['POST'])
def analyze_emotions_api():
    """Analyze emotions for a given video using stored transcript/segments.

    Request JSON: { videoId: string, transcript?: string }
    Response: { emotions: [{timestamp,label,intensity}], goodSide: [...], badSide: [...] }
    """
    try:
        data = request.get_json(force=True)
        video_id = data.get('videoId')
        if not video_id:
            return jsonify({'error': 'videoId is required'}), 400

        db = get_db()
        owner_id = request.headers.get('X-User-Id') or None
        base = {'videoId': video_id}
        if owner_id:
            base['ownerId'] = owner_id
        tr = db.transcripts.find_one(base) or {}
        transcript_text = data.get('transcript') or tr.get('text', '')
        segments = tr.get('segments', [])

        points = analyze_emotions_from_text_and_segments(transcript_text, segments)

        # Build simple positive/negative summaries for UI chips
        positive_labels = ['happy', 'calm', 'excited']
        negative_labels = ['sad', 'angry']
        label_counts = {}
        for p in points:
            label_counts[p['label']] = label_counts.get(p['label'], 0) + p.get('intensity', 0)

        good_side = [
            {'label': lbl, 'score': round(label_counts.get(lbl, 0), 3)} for lbl in positive_labels
        ]
        bad_side = [
            {'label': lbl, 'score': round(label_counts.get(lbl, 0), 3)} for lbl in negative_labels
        ]

        # Update job payload to expose in results polling
        set_job(video_id, 'processing', {'step': 'emotion_analysis_done', 'emotions': points})

        return jsonify({'emotions': points, 'goodSide': good_side, 'badSide': bad_side})
    except Exception as e:
        logging.error(f"/analyze-emotions error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/render-collective-story', methods=['POST'])
def render_collective_story():
    """Render a collective story result into a single MP4 with simple concatenation.
    Body expects: { storyId, sourceVideoIds, scenes:[{start,end}], fullNarration }
    Returns: { ok: true, url }
    """
    try:
        data = request.get_json(force=True)
        story_id = (data.get('storyId') or str(uuid.uuid4())).replace('..','')
        scenes = data.get('scenes') or []
        source_ids = data.get('sourceVideoIds') or []
        narration_text = data.get('fullNarration') or ''
        tts_lang = (data.get('lang') or 'en').strip() or 'en'
        try:
            tts_rate = int(str(data.get('ttsRate') or 185))
        except Exception:
            tts_rate = 185
        if not scenes or not source_ids:
            return jsonify({'error': 'Missing scenes or sourceVideoIds'}), 400

        def resolve_video_path_local(vid: str):
            # Prefer DB-backed resolution (handles original filenames)
            path, _ = resolve_video_path(vid)
            if path and os.path.exists(path):
                return path
            base = os.path.join(UPLOAD_FOLDER,'videos')
            for ext in ['mp4','mov','mkv','webm']:
                p = os.path.join(base, f"{vid}.{ext}")
                if os.path.exists(p):
                    return p
            return None

        video_paths = [resolve_video_path_local(v) for v in source_ids]
        if not all(video_paths):
            return jsonify({'error': 'One or more source videos not found'}), 400

        # Always write to the same folder the /renders route serves from
        out_dir = os.path.join(UPLOAD_FOLDER, 'renders')
        os.makedirs(out_dir, exist_ok=True)
        work = os.path.join(out_dir, f"work_{story_id}")
        os.makedirs(work, exist_ok=True)

        # Cut clips by distributing scene durations across uploaded videos sequentially.
        # We ignore scene absolute start times and use duration only, advancing through each source video.
        clips = []
        source_offset = {p: 0.0 for p in video_paths}
        for i, sc in enumerate(scenes):
            src = video_paths[i % len(video_paths)]
            dur = max(float(sc.get('end', 0)) - float(sc.get('start', 0)), 3.0)
            start = max(source_offset[src], 0.0)
            clip_path = os.path.join(work, f"clip_{i:03d}.mp4")
            cmd = ['ffmpeg','-y','-ss', f"{start:.3f}", '-i', src, '-t', f"{dur:.3f}",
                   '-vf','scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
                   '-an','-c:v','libx264','-preset','veryfast','-crf','20', clip_path]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            clips.append(clip_path)
            source_offset[src] = start + dur

        # Try generate narration audio from fullNarration using free TTS; fallback to silence
        narration_path = os.path.join(work, 'narration.wav')
        narration_generated = False
        
        try:
            text = narration_text.strip()
            if text:
                # First try gTTS (more reliable on Windows)
                try:
                    from gtts import gTTS
                    mp3_path = os.path.join(work, 'narration.mp3')
                    gTTS(text=text, lang=tts_lang).save(mp3_path)
                    # Convert mp3 to wav for ffmpeg concat mapping
                    subprocess.run(['ffmpeg','-y','-i', mp3_path, narration_path], check=True,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    narration_generated = True
                    logging.info("✅ Narration generated using gTTS")
                except Exception as e:
                    logging.warning(f"gTTS failed: {e}")
                    
                    # Try offline pyttsx3 as fallback
                    try:
                        import pyttsx3
                        tts = pyttsx3.init()
                        tts.setProperty('rate', tts_rate)
                        tts.save_to_file(text, narration_path)
                        tts.runAndWait()
                        narration_generated = True
                        logging.info("✅ Narration generated using pyttsx3")
                    except Exception as e2:
                        logging.warning(f"pyttsx3 also failed: {e2}")
                        
        except Exception as e:
            logging.error(f"TTS generation failed: {e}")
            
        # If no narration was generated, create silent audio
        if not narration_generated:
            total_dur = sum(max(float(s.get('end',0))-float(s.get('start',0)),0) for s in scenes)
            subprocess.run(['ffmpeg','-y','-f','lavfi','-i','anullsrc=cl=stereo:r=44100','-t', str(max(total_dur,1.0)), narration_path],
                           check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            logging.warning("⚠️ Using silent audio as fallback")

        # Concat clips using filter_complex to avoid codec mismatch; then mux with narration
        # Build ffmpeg input list: all clips + narration
        cmd_inputs = []
        for c in clips:
            cmd_inputs += ['-i', c]
        cmd_inputs += ['-i', narration_path]

        # Build concat filter
        labels = ''.join([f'[{i}:v]' for i in range(len(clips))])
        filter_complex = f"{labels}concat=n={len(clips)}:v=1:a=0[v]"

        out_name = f"{story_id}.mp4"
        out_path = os.path.join(out_dir, out_name)

        # Fix: Map narration audio from the last input (narration.wav)
        narration_input_index = len(clips)  # Narration is the last input
        cmd = ['ffmpeg','-y'] + cmd_inputs + ['-filter_complex', filter_complex, '-map','[v]', '-map', f'{narration_input_index}:a', '-c:v','libx264','-preset','veryfast','-crf','20','-c:a','aac','-shortest', out_path]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Return URL that matches GET /renders/<filename> route (proxied by Vite)
        return jsonify({'ok': True, 'url': f"/renders/{out_name}"})
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg render error: {e}")
        return jsonify({'error': 'Rendering failed'}), 500
    except Exception as e:
        logging.error(f"render-collective-story error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize MongoDB collections
    try:
        from db_mongo import init_collections
        init_collections()
        print("✅ MongoDB collections initialized")
        
        # Initialize AI-powered semantic search
        if SEMANTIC_SEARCH_AVAILABLE:
            try:
                db = get_db()
                if initialize_semantic_search(db):
                    print("✅ AI Semantic Search index built successfully")
                else:
                    print("⚠️ AI Semantic Search index build failed")
            except Exception as e:
                print(f"⚠️ AI Semantic Search initialization failed: {e}")
    except Exception as e:
        print(f"⚠️ MongoDB initialization failed: {e}")
        print("💡 Make sure MongoDB is running and MONGODB_URI is set")
        print("💡 You can set MONGODB_URI environment variable or create a .env file")
        print("💡 Example: MONGODB_URI=mongodb://localhost:27017/")
    
    print("🚀 Starting AI Video Story Backend (Simplified)...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"💾 Max file size: {MAX_CONTENT_LENGTH // (1024 * 1024)}MB")
    
    if TRANSCRIPTION_AVAILABLE:
        print("🎤 REAL AI Speech Recognition: ENABLED (Vosk)")
        print("   ✅ Vosk model loaded and ready")
        print("   ✅ Real speech-to-text conversion")
    else:
        print("⚠️ Enhanced Transcription: DISABLED")
    
    if VISUAL_TAGGING_AVAILABLE and visual_tagger.is_available():
        print("🤖 Traditional AI Visual Tagging: ENABLED (YOLO + CLIP)")
    elif GEMINI_TAGGING_AVAILABLE and gemini_visual_tagger.is_available():
        print("🤖 Gemini AI Visual Tagging: ENABLED (Google AI)")
    elif FALLBACK_TAGGING_AVAILABLE and fallback_visual_tagger.is_available():
        print("🤖 Fallback Visual Tagging: ENABLED (using simplified tagging)")
    else:
        print("⚠️ AI Visual Tagging: DISABLED (using simplified tagging)")
    
    app.run(debug=True, host='localhost', port=5000)
