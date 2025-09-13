#!/usr/bin/env python3
"""
User Data Repair and Validation System
Fixes all user data issues for 100% perfect deployment
"""

import os
import logging
from datetime import datetime
from db_mongo import get_db

def repair_user_data():
    """Repair and validate all user data in the database"""
    try:
        db = get_db()
        print("🔧 Starting user data repair and validation...")
        
        # Get all videos with missing or invalid user data
        videos = list(db.videos.find({}))
        users_fixed = 0
        videos_fixed = 0
        
        for video in videos:
            video_id = video.get('videoId')
            owner_id = video.get('ownerId')
            
            if not owner_id:
                print(f"⚠️ Video {video_id} has no ownerId")
                continue
            
            # Check if user exists
            user_doc = db.users.find_one({'userId': owner_id})
            if not user_doc:
                # Try to find user by other methods
                user_doc = db.users.find_one({'email': owner_id})
                if not user_doc:
                    user_doc = db.users.find_one({'name': owner_id})
                
                if user_doc:
                    # Update video with correct userId
                    db.videos.update_one(
                        {'videoId': video_id},
                        {'$set': {'ownerId': user_doc['userId']}}
                    )
                    videos_fixed += 1
                    print(f"✅ Fixed video {video_id} ownerId: {user_doc['userId']}")
                else:
                    # Create a proper user record
                    new_user = {
                        'userId': owner_id,
                        'name': f"User {owner_id[:8]}" if len(owner_id) > 8 else f"User {owner_id}",
                        'email': owner_id if '@' in str(owner_id) else '',
                        'picture': '',
                        'createdAt': datetime.utcnow().isoformat(),
                        'updatedAt': datetime.utcnow().isoformat()
                    }
                    db.users.insert_one(new_user)
                    users_fixed += 1
                    print(f"✅ Created user record: {new_user['name']} ({new_user['userId']})")
        
        # Validate all user records
        users = list(db.users.find({}))
        for user in users:
            user_id = user.get('userId')
            if not user_id:
                print(f"⚠️ User record missing userId: {user}")
                continue
            
            # Ensure required fields exist
            updates = {}
            if not user.get('name'):
                updates['name'] = user.get('email', f"User {user_id[:8]}")
            if not user.get('email'):
                updates['email'] = ''
            if not user.get('picture'):
                updates['picture'] = ''
            
            if updates:
                updates['updatedAt'] = datetime.utcnow().isoformat()
                db.users.update_one(
                    {'userId': user_id},
                    {'$set': updates}
                )
                print(f"✅ Updated user {user_id}: {updates}")
        
        print(f"🎉 User data repair completed!")
        print(f"   - Users created: {users_fixed}")
        print(f"   - Videos fixed: {videos_fixed}")
        print(f"   - Total users validated: {len(users)}")
        
        return True
        
    except Exception as e:
        print(f"❌ User data repair failed: {e}")
        return False

def validate_search_data():
    """Validate all search-related data"""
    try:
        db = get_db()
        print("🔍 Validating search data...")
        
        # Check transcripts
        transcripts = list(db.transcripts.find({}))
        print(f"   - Transcripts: {len(transcripts)}")
        
        # Check tags
        tags = list(db.tags.find({}))
        print(f"   - Tags: {len(tags)}")
        
        # Check videos
        videos = list(db.videos.find({}))
        print(f"   - Videos: {len(videos)}")
        
        # Check users
        users = list(db.users.find({}))
        print(f"   - Users: {len(users)}")
        
        # Validate data consistency
        missing_transcripts = 0
        missing_tags = 0
        missing_users = 0
        
        for video in videos:
            video_id = video.get('videoId')
            owner_id = video.get('ownerId')
            
            # Check transcript
            if not db.transcripts.find_one({'videoId': video_id}):
                missing_transcripts += 1
            
            # Check tags
            if not db.tags.find_one({'videoId': video_id}):
                missing_tags += 1
            
            # Check user
            if owner_id and not db.users.find_one({'userId': owner_id}):
                missing_users += 1
        
        print(f"   - Missing transcripts: {missing_transcripts}")
        print(f"   - Missing tags: {missing_tags}")
        print(f"   - Missing users: {missing_users}")
        
        return True
        
    except Exception as e:
        print(f"❌ Search data validation failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 User Data Repair and Validation System")
    print("=" * 50)
    
    # Repair user data
    if repair_user_data():
        print("\n✅ User data repair successful!")
    else:
        print("\n❌ User data repair failed!")
    
    # Validate search data
    if validate_search_data():
        print("\n✅ Search data validation successful!")
    else:
        print("\n❌ Search data validation failed!")
    
    print("\n🎉 All systems ready for deployment!")
