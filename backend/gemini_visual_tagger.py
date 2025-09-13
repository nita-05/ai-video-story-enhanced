#!/usr/bin/env python3
"""
Gemini AI Visual Tagger
This uses Google's Gemini AI to analyze video frames and generate intelligent tags.
"""

import os
import base64
import logging
import subprocess
import tempfile
from PIL import Image
import io

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Try to import Gemini AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiVisualTagger:
    def __init__(self):
        self.model = None
        self.available = False
        
        if GEMINI_AVAILABLE:
            try:
                self._setup_gemini()
            except Exception as e:
                logger.error(f"Failed to setup Gemini AI: {e}")
        else:
            logger.warning("Gemini AI not available - install with: pip install google-generativeai")
    
    def _setup_gemini(self):
        """Setup Gemini AI with API key"""
        try:
            # Get API key from environment
            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                logger.error("GEMINI_API_KEY not found in environment variables")
                return
            
            # Configure Gemini AI
            genai.configure(api_key=api_key)
            
            # Use Gemini 1.5 Flash model (updated model name)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.available = True
            
            logger.info("✅ Gemini AI Visual Tagger initialized successfully")
            
        except Exception as e:
            logger.error(f"Error setting up Gemini AI: {e}")
            self.available = False
    
    def extract_frames_gemini(self, video_path, num_frames=3):
        """Extract frames using ffmpeg for Gemini AI analysis"""
        try:
            frames = []
            temp_dir = tempfile.mkdtemp(prefix="gemini_frames_")
            
            # Use ffmpeg to extract frames
            cmd = [
                'ffmpeg', '-i', video_path,
                '-vf', f'fps=1/{max(1, self._get_video_duration(video_path) // num_frames)}',
                '-frames:v', str(num_frames),
                f'{temp_dir}/frame_%03d.jpg',
                '-y'
            ]
            
            subprocess.run(cmd, capture_output=True, check=True)
            
            # Check extracted frames
            for i in range(num_frames):
                frame_path = f"{temp_dir}/frame_{i:03d}.jpg"
                if os.path.exists(frame_path):
                    frames.append(frame_path)
            
            return frames, temp_dir
            
        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            return [], None
    
    def _get_video_duration(self, video_path):
        """Get video duration using ffprobe"""
        try:
            cmd = ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', video_path]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return float(result.stdout.strip())
        except Exception:
            return 60  # Default duration
    
    def analyze_frame_with_gemini(self, frame_path):
        """Analyze a single frame using Gemini AI"""
        try:
            if not self.available or not self.model:
                return None
            
            # Load and prepare image
            with Image.open(frame_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if too large (Gemini has limits)
                max_size = 1024
                if max(img.size) > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Prepare prompt for Gemini AI
                prompt = """
                Analyze this video frame and provide:
                1. Main objects/subjects visible
                2. Scene description (indoor/outdoor, setting, mood)
                3. Colors and lighting
                4. Action or activity happening
                5. Quality and composition
                
                Return ONLY a JSON object with these fields:
                {
                    "objects": ["list", "of", "main", "objects"],
                    "scene": "brief scene description",
                    "lighting": "lighting description",
                    "colors": ["dominant", "colors"],
                    "action": "what's happening",
                    "quality": "video quality assessment",
                    "tags": ["relevant", "tags", "for", "search"]
                }
                
                Be specific and use descriptive language. Focus on content that would be useful for video search and categorization.
                """
                
                # Generate response from Gemini AI
                response = self.model.generate_content([prompt, img])
                
                # Parse response
                try:
                    import json
                    # Extract JSON from response
                    response_text = response.text
                    
                    # Find JSON in response (sometimes Gemini adds extra text)
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}') + 1
                    
                    if start_idx != -1 and end_idx != -1:
                        json_str = response_text[start_idx:end_idx]
                        analysis = json.loads(json_str)
                        return analysis
                    else:
                        logger.warning("No JSON found in Gemini response")
                        return None
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Gemini response as JSON: {e}")
                    logger.debug(f"Raw response: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error analyzing frame with Gemini AI: {e}")
            return None
    
    def tag_video(self, video_path):
        """Generate AI-powered visual tags using Gemini AI"""
        try:
            if not self.available:
                logger.warning("Gemini AI not available")
                return ["gemini-ai-unavailable", "video-content"]
            
            logger.info(f"Starting Gemini AI visual tagging for: {video_path}")
            
            # Extract frames
            frame_paths, temp_dir = self.extract_frames_gemini(video_path, num_frames=3)
            if not frame_paths:
                logger.warning("No frames extracted from video")
                return ["video-content", "frame-extraction-failed"]
            
            all_analyses = []
            
            # Analyze each frame with Gemini AI
            for i, frame_path in enumerate(frame_paths):
                logger.info(f"Analyzing frame {i+1}/{len(frame_paths)} with Gemini AI...")
                analysis = self.analyze_frame_with_gemini(frame_path)
                if analysis:
                    all_analyses.append(analysis)
                    logger.info(f"Frame {i+1} analysis: {analysis.get('tags', [])}")
                else:
                    logger.warning(f"Frame {i+1} analysis failed")
            
            # Generate comprehensive tags from all analyses
            tags = ["video-content", "ai-analyzed"]
            
            if all_analyses:
                # Collect all unique tags
                all_tags = set()
                all_objects = set()
                all_scenes = set()
                all_colors = set()
                
                for analysis in all_analyses:
                    # Add specific tags
                    if 'tags' in analysis:
                        all_tags.update(analysis['tags'])
                    
                    # Add objects
                    if 'objects' in analysis:
                        all_objects.update(analysis['objects'])
                    
                    # Add scenes
                    if 'scene' in analysis:
                        all_scenes.add(analysis['scene'])
                    
                    # Add colors
                    if 'colors' in analysis:
                        all_colors.update(analysis['colors'])
                
                # Add most relevant tags
                tags.extend(list(all_tags)[:10])  # Limit to top 10
                
                # Add dominant objects (if not too many)
                if len(all_objects) <= 5:
                    tags.extend(list(all_objects))
                else:
                    # Add most common objects
                    tags.extend(list(all_objects)[:5])
                
                # Add scene information
                if all_scenes:
                    tags.extend(list(all_scenes)[:3])
                
                # Add dominant colors
                if all_colors:
                    tags.extend(list(all_colors)[:3])
                
                # Add quality indicators
                quality_tags = []
                for analysis in all_analyses:
                    if 'quality' in analysis:
                        quality = analysis['quality'].lower()
                        if 'high' in quality or 'good' in quality:
                            quality_tags.append("high-quality")
                        elif 'low' in quality or 'poor' in quality:
                            quality_tags.append("low-quality")
                        else:
                            quality_tags.append("standard-quality")
                        break
                
                tags.extend(quality_tags)
            
            # Clean up temporary files
            if temp_dir and os.path.exists(temp_dir):
                try:
                    import shutil
                    shutil.rmtree(temp_dir)
                except Exception as e:
                    logger.warning(f"Failed to clean up temp directory: {e}")
            
            # Ensure we have reasonable number of tags
            if len(tags) > 20:
                tags = tags[:20]
            
            logger.info(f"Gemini AI visual tagging completed. Generated {len(tags)} tags: {tags}")
            return tags
            
        except Exception as e:
            logger.error(f"Error in Gemini AI visual tagging: {e}")
            return ["video-content", "gemini-ai-failed", "visual-analysis-error"]
    
    def is_available(self):
        """Check if Gemini AI visual tagging is available"""
        return self.available

# Global instance
gemini_visual_tagger = GeminiVisualTagger()
