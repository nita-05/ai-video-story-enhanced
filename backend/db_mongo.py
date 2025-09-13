import os
from datetime import datetime
from typing import Tuple

from pymongo import MongoClient


_client = None
_db = None


def get_db():
    global _client, _db
    if _db is not None:
        return _db

    uri = os.environ.get("MONGODB_URI")
    db_name = os.environ.get("MONGODB_DB", "footageflow")
    
    if not uri:
        # Try to load from .env file
        try:
            from dotenv import load_dotenv
            load_dotenv()
            uri = os.environ.get("MONGODB_URI")
        except ImportError:
            pass
        
        if not uri:
            # Use default local MongoDB
            uri = "mongodb://localhost:27017/"
            print("⚠️ MONGODB_URI not set, using default local MongoDB")
            print("💡 Set MONGODB_URI environment variable or create .env file for custom connection")

    try:
        _client = MongoClient(uri)
        _db = _client[db_name]
        
        # Test connection
        _client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {db_name}")
        
        # Ensure basic indexes
        try:
            _db.videos.create_index([("videoId", 1)], unique=True)
            _db.transcripts.create_index([("videoId", 1)], unique=True)
            _db.transcripts.create_index([("text", "text")])
            _db.tags.create_index([("videoId", 1)], unique=True)
            _db.tags.create_index([("keywords", 1)])
            _db.jobs.create_index([("jobId", 1)], unique=True)
            _db.jobs.create_index([("videoId", 1)])
        except Exception:
            # If indexes already exist or fail, don't block app startup
            pass

        return _db
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        print("💡 Make sure MongoDB is running and accessible")
        raise RuntimeError(f"MongoDB connection failed: {e}")


def upsert_video(video_id: str, metadata: dict | None = None):
    """Upsert video document with flexible metadata.

    Supports legacy calls that only provide filename by mapping to metadata.
    """
    db = get_db()
    update_set = {"updatedAt": datetime.utcnow()}
    if metadata:
        # Only allow simple JSON-serializable fields to be set
        allowed_fields = {
            "videoId", "originalName", "filename", "fileSize", "duration",
            "uploadedAt", "status", "thumbnails", "ownerId", "public"
        }
        for key, value in metadata.items():
            if key in allowed_fields:
                update_set[key] = value

    # Remove videoId from update_set to avoid conflict with $setOnInsert
    if "videoId" in update_set:
        del update_set["videoId"]

    db.videos.update_one(
        {"videoId": video_id},
        {
            "$setOnInsert": {
                "createdAt": datetime.utcnow(),
                "videoId": video_id,
            },
            "$set": update_set,
        },
        upsert=True,
    )


def save_transcript(video_id: str, transcript_text: str, segments: list | None = None):
    db = get_db()
    db.transcripts.update_one(
        {"videoId": video_id},
        {
            "$set": {
                "videoId": video_id,
                "text": transcript_text,
                "segments": segments or [],
                "ownerId": metadata_owner(video_id),
                "updatedAt": datetime.utcnow(),
            }
        },
        upsert=True,
    )


def save_tags(video_id: str, tags: list[str]):
    db = get_db()
    db.tags.update_one(
        {"videoId": video_id},
        {
            "$set": {
                "videoId": video_id,
                "keywords": tags,
                "count": len(tags),
                "ownerId": metadata_owner(video_id),
                "updatedAt": datetime.utcnow(),
            }
        },
        upsert=True,
    )


def set_job(video_id: str, status: str, details: dict | None = None):
    db = get_db()
    db.jobs.update_one(
        {"videoId": video_id},
        {
            "$set": {
                "jobId": video_id,  # ensure unique non-null for unique index
                "videoId": video_id,
                "status": status,
                "details": details or {},
                "ownerId": metadata_owner(video_id),
                "updatedAt": datetime.utcnow(),
            },
            "$setOnInsert": {"createdAt": datetime.utcnow()},
        },
        upsert=True,
    )

def metadata_owner(video_id: str) -> str | None:
    """Lookup ownerId from videos metadata if available."""
    try:
        db = get_db()
        v = db.videos.find_one({"videoId": video_id}) or {}
        return v.get("ownerId")
    except Exception:
        return None


def init_collections():
    """Initialize MongoDB collections and indexes"""
    try:
        db = get_db()
        
        # Create collections if they don't exist
        collections = ['videos', 'transcripts', 'tags', 'jobs', 'likes', 'views', 'views_unique', 'users']
        for collection_name in collections:
            if collection_name not in db.list_collection_names():
                db.create_collection(collection_name)
        
        # Ensure indexes
        db.videos.create_index([("videoId", 1)], unique=True)
        db.transcripts.create_index([("videoId", 1)], unique=True)
        db.transcripts.create_index([("text", "text")])
        db.tags.create_index([("videoId", 1)], unique=True)
        db.tags.create_index([("keywords", 1)])
        db.jobs.create_index([("jobId", 1)], unique=True)
        db.jobs.create_index([("videoId", 1)])
        db.likes.create_index([("videoId", 1), ("userId", 1)], unique=True)
        db.likes.create_index([("videoId", 1)])
        db.views.create_index([("videoId", 1)], unique=True)
        # For deduped views
        db.views_unique.create_index([("videoId", 1), ("userId", 1)], unique=True, sparse=True)
        db.views_unique.create_index([("videoId", 1), ("sessionId", 1)], unique=True, sparse=True)
        db.users.create_index([("email", 1)], unique=True)
        
        print("✅ MongoDB collections and indexes initialized successfully")
        
    except Exception as e:
        print(f"⚠️ Error initializing MongoDB collections: {e}")
        raise


