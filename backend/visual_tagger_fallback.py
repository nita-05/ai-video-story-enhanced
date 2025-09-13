#!/usr/bin/env python3
"""
Fallback Visual Tagger
This provides basic visual analysis when the full AI models can't be loaded.
"""

import os
import logging
from PIL import Image
import subprocess

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FallbackVisualTagger:
    def __init__(self):
        self.available = True
        logger.info("Fallback visual tagger initialized")
    
    def extract_frames_fallback(self, video_path, num_frames=3):
        """Extract frames using ffmpeg instead of OpenCV"""
        try:
            frames = []
            temp_dir = "tmp_frames"
            os.makedirs(temp_dir, exist_ok=True)
            
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
            
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            return []
    
    def _get_video_duration(self, video_path):
        """Get video duration using ffprobe"""
        try:
            cmd = ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', video_path]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return float(result.stdout.strip())
        except Exception:
            return 60  # Default duration
    
    def analyze_frame_basic(self, frame_path):
        """Basic frame analysis using PIL"""
        try:
            with Image.open(frame_path) as img:
                # Get basic image properties
                width, height = img.size
                mode = img.mode
                
                # Analyze brightness (convert to grayscale and get average)
                if mode != 'L':
                    gray_img = img.convert('L')
                else:
                    gray_img = img
                
                # Calculate average brightness
                pixels = list(gray_img.getdata())
                avg_brightness = sum(pixels) / len(pixels)
                
                # Determine if image is bright, dark, or medium
                if avg_brightness > 180:
                    brightness = "bright"
                elif avg_brightness < 80:
                    brightness = "dark"
                else:
                    brightness = "medium"
                
                # Analyze aspect ratio
                aspect_ratio = width / height
                if aspect_ratio > 1.5:
                    orientation = "landscape"
                elif aspect_ratio < 0.7:
                    orientation = "portrait"
                else:
                    orientation = "square"
                
                return {
                    'brightness': brightness,
                    'orientation': orientation,
                    'resolution': f"{width}x{height}",
                    'size': os.path.getsize(frame_path)
                }
                
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return {}
    
    def tag_video(self, video_path):
        """Generate basic visual tags using fallback methods"""
        try:
            logger.info(f"Starting fallback visual tagging for: {video_path}")
            
            # Extract frames
            frame_paths = self.extract_frames_fallback(video_path, num_frames=3)
            if not frame_paths:
                logger.warning("No frames extracted from video")
                return ["video-content", "frame-extraction-failed"]
            
            all_analyses = []
            
            # Analyze each frame
            for i, frame_path in enumerate(frame_paths):
                logger.info(f"Analyzing frame {i+1}/{len(frame_paths)}")
                analysis = self.analyze_frame_basic(frame_path)
                if analysis:
                    all_analyses.append(analysis)
                
                # Clean up temporary frame
                try:
                    os.unlink(frame_path)
                except:
                    pass
            
            # Generate tags based on analysis
            tags = ["video-content", "visual-media"]
            
            if all_analyses:
                # Add brightness tags
                brightness_counts = {}
                for analysis in all_analyses:
                    brightness = analysis.get('brightness', 'unknown')
                    brightness_counts[brightness] = brightness_counts.get(brightness, 0) + 1
                
                # Add dominant brightness
                if brightness_counts:
                    dominant_brightness = max(brightness_counts.items(), key=lambda x: x[1])[0]
                    tags.append(f"{dominant_brightness}-lighting")
                
                # Add orientation tags
                orientation_counts = {}
                for analysis in all_analyses:
                    orientation = analysis.get('orientation', 'unknown')
                    orientation_counts[orientation] = orientation_counts.get(orientation, 0) + 1
                
                if orientation_counts:
                    dominant_orientation = max(orientation_counts.items(), key=lambda x: x[1])[0]
                    tags.append(f"{dominant_orientation}-format")
                
                # Add quality tags based on resolution
                resolutions = [a.get('resolution', '0x0') for a in all_analyses if a.get('resolution')]
                if resolutions:
                    try:
                        max_res = max(resolutions, key=lambda x: int(x.split('x')[0]) * int(x.split('x')[1]))
                        width, height = map(int, max_res.split('x'))
                        if width * height > 1920 * 1080:
                            tags.append("high-resolution")
                        elif width * height > 1280 * 720:
                            tags.append("medium-resolution")
                        else:
                            tags.append("standard-resolution")
                    except:
                        pass
            
            # Clean up temp directory
            try:
                import shutil
                if os.path.exists("tmp_frames"):
                    shutil.rmtree("tmp_frames")
            except:
                pass
            
            logger.info(f"Fallback visual tagging completed. Tags: {tags}")
            return tags
            
        except Exception as e:
            logger.error(f"Error in fallback visual tagging: {e}")
            return ["video-content", "visual-analysis-failed"]
    
    def is_available(self):
        """Check if fallback tagger is available"""
        return self.available

# Global instance
fallback_visual_tagger = FallbackVisualTagger()
