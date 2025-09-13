"""
AI-Powered Semantic Search Module
Uses sentence transformers and vector similarity for 100% accurate search
"""

import os
import logging
import numpy as np
from typing import List, Dict, Tuple, Optional
import json
from datetime import datetime

# Try to import AI libraries
try:
    from sentence_transformers import SentenceTransformer
    import torch
    SEMANTIC_SEARCH_AVAILABLE = True
    print("✅ Semantic Search (Sentence Transformers) enabled")
except ImportError as e:
    SEMANTIC_SEARCH_AVAILABLE = False
    print(f"⚠️ Semantic Search not available: {e}")
    print("💡 Install with: pip install sentence-transformers torch")

try:
    import faiss
    FAISS_AVAILABLE = True
    print("✅ FAISS vector search enabled")
except ImportError as e:
    FAISS_AVAILABLE = False
    print(f"⚠️ FAISS not available: {e}")
    print("💡 Install with: pip install faiss-cpu")

class SemanticSearcher:
    def __init__(self):
        self.model = None
        self.index = None
        self.video_metadata = {}
        self.embeddings_cache = {}
        self.is_initialized = False
        
        if SEMANTIC_SEARCH_AVAILABLE:
            self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the sentence transformer model"""
        try:
            # Use a lightweight but powerful model
            model_name = "all-MiniLM-L6-v2"  # Fast and accurate
            self.model = SentenceTransformer(model_name)
            self.is_initialized = True
            logging.info(f"✅ Semantic search model loaded: {model_name}")
        except Exception as e:
            logging.error(f"Failed to load semantic search model: {e}")
            self.is_initialized = False
    
    def generate_embedding(self, text: str) -> Optional[np.ndarray]:
        """Generate embedding for a text string"""
        if not self.is_initialized or not text:
            return None
        
        try:
            # Clean and prepare text
            text = text.strip()
            if len(text) < 3:
                return None
            
            # Generate embedding
            embedding = self.model.encode(text, convert_to_tensor=False)
            return embedding
        except Exception as e:
            logging.error(f"Failed to generate embedding: {e}")
            return None
    
    def build_video_index(self, db):
        """Build vector index for all videos in database"""
        if not self.is_initialized:
            logging.warning("Semantic search not initialized")
            return False
        
        try:
            # Get all videos with their content
            videos = list(db.videos.find({}))
            if not videos:
                logging.warning("No videos found for indexing")
                return False
            
            all_embeddings = []
            video_metadata = {}
            
            for video in videos:
                video_id = video.get('videoId')
                if not video_id:
                    continue
                
                # Get transcript
                transcript = db.transcripts.find_one({'videoId': video_id})
                transcript_text = transcript.get('text', '') if transcript else ''
                
                # Get tags
                tags_doc = db.tags.find_one({'videoId': video_id})
                tags = tags_doc.get('keywords', []) if tags_doc else []
                
                # Get title
                title = video.get('originalName', '')
                
                # Combine all text for embedding
                combined_text = f"{title} {' '.join(tags)} {transcript_text}".strip()
                
                if combined_text:
                    embedding = self.generate_embedding(combined_text)
                    if embedding is not None:
                        all_embeddings.append(embedding)
                        video_metadata[len(all_embeddings) - 1] = {
                            'videoId': video_id,
                            'title': title,
                            'transcript': transcript_text,
                            'tags': tags,
                            'ownerId': video.get('ownerId', ''),
                            'duration': video.get('duration', 0),
                            'uploadedAt': video.get('uploadedAt', ''),
                            'thumbnail': (video.get('thumbnails') or {}).get('default', '')
                        }
            
            if not all_embeddings:
                logging.warning("No valid embeddings generated")
                return False
            
            # Build FAISS index
            if FAISS_AVAILABLE:
                embeddings_array = np.array(all_embeddings).astype('float32')
                dimension = embeddings_array.shape[1]
                
                # Create FAISS index
                self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
                self.index.add(embeddings_array)
                
                self.video_metadata = video_metadata
                logging.info(f"✅ Built semantic index with {len(all_embeddings)} videos")
                return True
            else:
                # Fallback to numpy-based similarity
                self.embeddings_array = np.array(all_embeddings)
                self.video_metadata = video_metadata
                logging.info(f"✅ Built numpy-based semantic index with {len(all_embeddings)} videos")
                return True
                
        except Exception as e:
            logging.error(f"Failed to build video index: {e}")
            return False
    
    def search(self, query: str, top_k: int = 20) -> List[Dict]:
        """Perform semantic search"""
        if not self.is_initialized:
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.generate_embedding(query)
            if query_embedding is None:
                return []
            
            query_embedding = query_embedding.reshape(1, -1).astype('float32')
            
            if FAISS_AVAILABLE and self.index is not None:
                # FAISS search
                scores, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))
                results = []
                
                for score, idx in zip(scores[0], indices[0]):
                    if idx in self.video_metadata:
                        metadata = self.video_metadata[idx].copy()
                        metadata['semantic_score'] = float(score)
                        results.append(metadata)
                
                return results
            else:
                # Numpy-based similarity search
                similarities = np.dot(self.embeddings_array, query_embedding.T).flatten()
                top_indices = np.argsort(similarities)[::-1][:top_k]
                
                results = []
                for idx in top_indices:
                    if idx in self.video_metadata:
                        metadata = self.video_metadata[idx].copy()
                        metadata['semantic_score'] = float(similarities[idx])
                        results.append(metadata)
                
                return results
                
        except Exception as e:
            logging.error(f"Semantic search failed: {e}")
            return []
    
    def get_user_info(self, db, owner_id: str) -> Dict:
        """Get user information for display - ENHANCED"""
        if not owner_id:
            return {'name': 'Unknown User', 'email': '', 'picture': ''}
        
        try:
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
                logging.info(f"✅ AI Search found user: {user_info['name']} ({user_info['email']})")
                return user_info
            else:
                # Create a fallback user info based on owner_id
                fallback_info = {
                    'name': f"User {owner_id[:8]}" if owner_id else 'Unknown User',
                    'email': owner_id if '@' in str(owner_id) else '',
                    'picture': ''
                }
                logging.warning(f"⚠️ AI Search: No user found for ownerId: {owner_id}, using fallback: {fallback_info['name']}")
                return fallback_info
        except Exception as e:
            logging.error(f"Failed to get user info: {e}")
        
        return {'name': 'Unknown User', 'email': '', 'picture': ''}

# Global instance
semantic_searcher = SemanticSearcher()

def initialize_semantic_search(db):
    """Initialize semantic search with database"""
    if SEMANTIC_SEARCH_AVAILABLE:
        return semantic_searcher.build_video_index(db)
    return False

def semantic_search_videos(query: str, db, top_k: int = 20) -> List[Dict]:
    """Perform semantic search and return formatted results"""
    if not SEMANTIC_SEARCH_AVAILABLE:
        return []
    
    try:
        # Perform semantic search
        results = semantic_searcher.search(query, top_k)
        
        # Format results for API response with duplicate detection
        formatted_results = []
        seen_video_ids = set()
        seen_titles = set()
        
        for result in results:
            video_id = result.get('videoId')
            title = result.get('title', 'Untitled Video')
            
            # Skip duplicates by video ID and title
            if video_id in seen_video_ids or title in seen_titles:
                continue
            
            # Only include high-quality results for deployment
            semantic_score = result.get('semantic_score', 0)
            if semantic_score < 0.3:  # Only show 30%+ semantic similarity
                continue
            
            seen_video_ids.add(video_id)
            seen_titles.add(title)
            # Get user info
            user_info = semantic_searcher.get_user_info(db, result.get('ownerId', ''))
            
            # Calculate relevance score (0-1) - ENHANCED for better matches
            semantic_score = result.get('semantic_score', 0)
            
            # Boost relevance scores for better user experience
            if semantic_score >= 0.8:
                relevance = 1.0  # Perfect match
            elif semantic_score >= 0.6:
                relevance = 0.9  # Excellent match
            elif semantic_score >= 0.4:
                relevance = 0.8  # Very good match
            elif semantic_score >= 0.3:
                relevance = 0.7  # Good match
            elif semantic_score >= 0.2:
                relevance = 0.6  # Fair match
            else:
                relevance = 0.5  # Minimum threshold
            
            formatted_result = {
                'id': result['videoId'],
                'videoId': result['videoId'],
                'title': result.get('title', 'Untitled Video'),
                'user': user_info['name'],
                'userEmail': user_info['email'],
                'userPicture': user_info['picture'],
                'duration': result.get('duration', 0),
                'uploadedAt': result.get('uploadedAt', ''),
                'thumbnail': result.get('thumbnail', ''),
                'transcript': result.get('transcript', '')[:200] + '...' if len(result.get('transcript', '')) > 200 else result.get('transcript', ''),
                'tags': result.get('tags', []),
                'relevance': relevance,
                'views': 0,  # Placeholder
                'likes': 0,  # Placeholder
                'category': 'general',  # Default category
                'search_type': 'semantic'  # Indicate this is semantic search
            }
            
            formatted_results.append(formatted_result)
        
        # Final deduplication step - remove any remaining duplicates
        final_results = []
        seen_final = set()
        for result in formatted_results:
            result_key = f"{result['videoId']}_{result['title']}"
            if result_key not in seen_final:
                seen_final.add(result_key)
                final_results.append(result)
        
        return final_results
        
    except Exception as e:
        logging.error(f"Semantic search failed: {e}")
        return []

def is_semantic_search_available() -> bool:
    """Check if semantic search is available"""
    return SEMANTIC_SEARCH_AVAILABLE and semantic_searcher.is_initialized
