import os
import cv2
import numpy as np
from PIL import Image
import torch
from ultralytics import YOLO
from transformers import CLIPProcessor, CLIPModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VisualTagger:
    def __init__(self):
        self.yolo_model = None
        self.clip_model = None
        self.clip_processor = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        try:
            self._load_models()
        except Exception as e:
            logger.error(f"Failed to load visual models: {e}")
    
    def _load_models(self):
        """Load YOLO and CLIP models"""
        try:
            # Load YOLOv8n model (lightweight object detection)
            logger.info("Loading YOLOv8n model...")
            self.yolo_model = YOLO('yolov8n.pt')
            
            # Load CLIP model for scene understanding
            logger.info("Loading CLIP model...")
            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            
            # Move to device
            self.clip_model = self.clip_model.to(self.device)
            
            logger.info(f"Visual models loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Error loading visual models: {e}")
            raise
    
    def extract_frames(self, video_path, num_frames=5):
        """Extract frames from video for analysis"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError("Could not open video file")
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_indices = np.linspace(0, total_frames-1, num_frames, dtype=int)
            
            frames = []
            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame_rgb)
            
            cap.release()
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            return []
    
    def detect_objects(self, frame):
        """Detect objects in a frame using YOLOv8n"""
        try:
            if self.yolo_model is None:
                return []
            
            results = self.yolo_model(frame, verbose=False)
            objects = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get class name and confidence
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        class_name = result.names[cls]
                        
                        if conf > 0.3:  # Only high confidence detections
                            objects.append({
                                'class': class_name,
                                'confidence': conf
                            })
            
            return objects
            
        except Exception as e:
            logger.error(f"Error in object detection: {e}")
            return []
    
    def analyze_scene(self, frame):
        """Analyze scene using CLIP"""
        try:
            if self.clip_model is None or self.clip_processor is None:
                return []
            
            # Convert numpy array to PIL Image
            pil_image = Image.fromarray(frame)
            
            # Define scene categories
            scene_categories = [
                "indoor", "outdoor", "day", "night", "urban", "rural", "nature",
                "beach", "mountain", "forest", "city", "road", "building", "room",
                "kitchen", "bedroom", "office", "restaurant", "park", "garden"
            ]
            
            # Process image and text
            inputs = self.clip_processor(
                text=scene_categories,
                images=pil_image,
                return_tensors="pt",
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=-1)
            
            # Get top 5 scene predictions
            top_probs, top_indices = torch.topk(probs[0], 5)
            
            scenes = []
            for prob, idx in zip(top_probs, top_indices):
                if prob > 0.1:  # Only high confidence scenes
                    scenes.append({
                        'scene': scene_categories[idx],
                        'confidence': float(prob)
                    })
            
            return scenes
            
        except Exception as e:
            logger.error(f"Error in scene analysis: {e}")
            return []
    
    def tag_video(self, video_path):
        """Main function to tag a video with visual content"""
        try:
            logger.info(f"Starting visual tagging for: {video_path}")
            
            # Extract frames
            frames = self.extract_frames(video_path, num_frames=5)
            if not frames:
                logger.warning("No frames extracted from video")
                return ["video-frame"]
            
            all_objects = []
            all_scenes = []
            
            # Analyze each frame
            for i, frame in enumerate(frames):
                logger.info(f"Analyzing frame {i+1}/{len(frames)}")
                
                # Detect objects
                objects = self.detect_objects(frame)
                all_objects.extend(objects)
                
                # Analyze scene
                scenes = self.analyze_scene(frame)
                all_scenes.extend(scenes)
            
            # Aggregate results
            tags = []
            
            # Add most common objects
            if all_objects:
                object_counts = {}
                for obj in all_objects:
                    obj_class = obj['class']
                    object_counts[obj_class] = object_counts.get(obj_class, 0) + 1
                
                # Add top objects
                top_objects = sorted(object_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                for obj_class, count in top_objects:
                    if count >= 2:  # Only objects that appear in multiple frames
                        tags.append(obj_class)
            
            # Add most confident scenes
            if all_scenes:
                scene_confidences = {}
                for scene in all_scenes:
                    scene_name = scene['scene']
                    if scene_name not in scene_confidences:
                        scene_confidences[scene_name] = []
                    scene_confidences[scene_name].append(scene['confidence'])
                
                # Average confidence per scene
                avg_scenes = []
                for scene_name, confs in scene_confidences.items():
                    avg_conf = sum(confs) / len(confs)
                    avg_scenes.append((scene_name, avg_conf))
                
                # Add top scenes
                top_scenes = sorted(avg_scenes, key=lambda x: x[1], reverse=True)[:3]
                for scene_name, avg_conf in top_scenes:
                    if avg_conf > 0.2:  # Only high confidence scenes
                        tags.append(scene_name)
            
            # Fallback tags if nothing detected
            if not tags:
                tags = ["video-content", "visual-media"]
            
            logger.info(f"Visual tagging completed. Tags: {tags}")
            return tags
            
        except Exception as e:
            logger.error(f"Error in visual tagging: {e}")
            return ["video-frame", "content-detected"]
    
    def is_available(self):
        """Check if visual tagging is available"""
        return (self.yolo_model is not None and 
                self.clip_model is not None and 
                self.clip_processor is not None)

# Global instance
visual_tagger = VisualTagger()
