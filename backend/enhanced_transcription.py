import os
import cv2
import numpy as np
import tempfile
import subprocess
import json
import re
from PIL import Image
import pytesseract
from vosk import Model, KaldiRecognizer
import wave
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedTranscription:
    def __init__(self):
        self.vosk_model = None
        self.tesseract_config = '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-'
        
        try:
            self._load_models()
        except Exception as e:
            logger.error(f"Failed to load transcription models: {e}")
    
    def _load_models(self):
        """Load Vosk and Tesseract models"""
        try:
            # Load Vosk model
            model_path = "vosk-model-small-en-us-0.15"
            if os.path.exists(model_path):
                logger.info("Loading Vosk model...")
                self.vosk_model = Model(model_path)
                logger.info("✅ Vosk model loaded successfully")
            else:
                logger.warning("Vosk model not found, speech recognition disabled")
            
            # Check Tesseract availability - ENHANCED CONFIGURATION
            try:
                # Set Tesseract path directly since we know it's installed
                tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                if os.path.exists(tesseract_path):
                    pytesseract.pytesseract.tesseract_cmd = tesseract_path
                    logger.info(f"✅ Tesseract OCR available at {tesseract_path}")
                else:
                    # Try to configure Tesseract path for Windows
                    if os.name == 'nt':  # Windows
                        tesseract_paths = [
                            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                            r'C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME', '')),
                            'tesseract'  # Try PATH
                        ]
                        
                        for path in tesseract_paths:
                            try:
                                if path == 'tesseract':
                                    pytesseract.get_tesseract_version()
                                else:
                                    if os.path.exists(path):
                                        pytesseract.pytesseract.tesseract_cmd = path
                                        pytesseract.get_tesseract_version()
                                logger.info(f"✅ Tesseract OCR available at {path}")
                                break
                            except:
                                continue
                        else:
                            logger.warning("Tesseract not found in common Windows locations")
                            logger.warning("OCR will be disabled - install Tesseract for full functionality")
                    else:
                        # Linux/Mac
                        pytesseract.get_tesseract_version()
                        logger.info("✅ Tesseract OCR available")
            except Exception as e:
                logger.warning(f"Tesseract not available: {e}")
                logger.warning("OCR will be disabled - install Tesseract for full functionality")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def extract_frames_for_ocr(self, video_path, num_frames=10):
        """Extract frames for subtitle/caption detection"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return []
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_indices = np.linspace(0, total_frames-1, num_frames, dtype=int)
            
            frames = []
            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append({
                        'frame': frame_rgb,
                        'timestamp': idx / cap.get(cv2.CAP_PROP_FPS)
                    })
            
            cap.release()
            return frames
            
        except Exception as e:
            logger.error(f"Error extracting frames for OCR: {e}")
            return []
    
    def detect_text_regions(self, frame):
        """Detect potential subtitle/caption regions in a frame"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            
            # Apply threshold to find text regions
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            text_regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                
                # Filter for potential subtitle regions (bottom area, reasonable size)
                frame_height = frame.shape[0]
                if (y > frame_height * 0.6 and  # Bottom area
                    w > 50 and h > 20 and       # Reasonable size
                    w < frame.shape[1] * 0.8):   # Not too wide
                    
                    text_regions.append({
                        'x': x, 'y': y, 'w': w, 'h': h,
                        'region': frame[y:y+h, x:x+w]
                    })
            
            return text_regions
            
        except Exception as e:
            logger.error(f"Error detecting text regions: {e}")
            return []
    
    def extract_text_from_regions(self, text_regions):
        """Extract text from detected regions using OCR"""
        try:
            extracted_texts = []
            
            for region_info in text_regions:
                region = region_info['region']
                
                # Preprocess image for better OCR
                # Convert to grayscale
                gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY)
                
                # Apply noise reduction
                denoised = cv2.fastNlMeansDenoising(gray)
                
                # Apply threshold
                _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                
                # Extract text using Tesseract
                try:
                    text = pytesseract.image_to_string(binary, config=self.tesseract_config)
                    text = text.strip()
                    
                    if text and len(text) > 2:  # Filter out very short texts
                        extracted_texts.append({
                            'text': text,
                            'confidence': 0.8,  # OCR confidence
                            'region': region_info
                        })
                        
                except Exception as e:
                    logger.debug(f"OCR failed for region: {e}")
                    continue
            
            return extracted_texts
            
        except Exception as e:
            logger.error(f"Error extracting text from regions: {e}")
            return []
    
    def transcribe_speech(self, video_path):
        """Transcribe speech using Vosk"""
        try:
            if not self.vosk_model:
                return "", []
            
            # Extract audio from video
            temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            temp_audio.close()
            
            # Convert video to WAV audio
            cmd = [
                'ffmpeg', '-i', video_path, 
                '-vn', '-acodec', 'pcm_s16le', 
                '-ar', '16000', '-ac', '1', 
                '-y', temp_audio.name
            ]
            
            subprocess.run(cmd, capture_output=True, check=True)
            
            # Transcribe with Vosk
            wf = wave.open(temp_audio.name, "rb")
            rec = KaldiRecognizer(self.vosk_model, wf.getframerate())
            rec.SetWords(True)
            
            transcript_text = ""
            segments = []
            
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    result = json.loads(rec.Result())
                    if result.get('text'):
                        transcript_text += " " + result['text']
                    
                    # Extract word-level timing
                    if result.get('result'):
                        for word_info in result['result']:
                            segments.append({
                                "start_time": word_info['start'],
                                "end_time": word_info['end'],
                                "word": word_info['word'],
                                "confidence": word_info.get('conf', 0.0),
                                "source": "speech"
                            })
            
            # Get final result
            final_result = json.loads(rec.FinalResult())
            if final_result.get('text'):
                transcript_text += " " + final_result['text']
            
            wf.close()
            os.unlink(temp_audio.name)
            
            return transcript_text.strip(), segments
            
        except Exception as e:
            logger.error(f"Speech transcription failed: {e}")
            return "", []
    
    def clean_and_merge_transcripts(self, speech_text, subtitle_texts, speech_segments):
        """Clean and merge speech and subtitle transcripts"""
        try:
            # Clean speech transcript
            if speech_text:
                speech_text = self.clean_text(speech_text)
            
            # Clean subtitle texts
            subtitle_text = ""
            subtitle_segments = []
            
            for sub in subtitle_texts:
                clean_text = self.clean_text(sub['text'])
                if clean_text and clean_text not in subtitle_text:
                    subtitle_text += " " + clean_text
                    
                    # Create subtitle segments
                    subtitle_segments.append({
                        "start_time": sub['region']['timestamp'],
                        "end_time": sub['region']['timestamp'] + 2.0,  # Assume 2 second duration
                        "word": clean_text,
                        "confidence": sub['confidence'],
                        "source": "subtitle"
                    })
            
            # Merge transcripts
            if speech_text and subtitle_text:
                # Combine both sources
                merged_text = f"{speech_text} [Subtitles: {subtitle_text}]"
                all_segments = speech_segments + subtitle_segments
                
                # Sort segments by time
                all_segments.sort(key=lambda x: x['start_time'])
                
            elif speech_text:
                merged_text = speech_text
                all_segments = speech_segments
                
            elif subtitle_text:
                merged_text = subtitle_text
                all_segments = subtitle_segments
                
            else:
                merged_text = "No speech or text detected"
                all_segments = []
            
            return merged_text, all_segments
            
        except Exception as e:
            logger.error(f"Error merging transcripts: {e}")
            return speech_text or "Transcription failed", speech_segments
    
    def clean_text(self, text):
        """Clean and format transcript text"""
        try:
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text.strip())
            
            # Fix common OCR errors
            text = re.sub(r'[|]', 'I', text)  # Common OCR error
            text = re.sub(r'[0]', 'O', text)  # Common OCR error
            text = re.sub(r'[1]', 'l', text)  # Common OCR error
            
            # Add proper punctuation if missing
            if text and not text.endswith(('.', '!', '?', ':', ';')):
                text += '.'
            
            # Capitalize first letter
            if text:
                text = text[0].upper() + text[1:]
            
            return text
            
        except Exception as e:
            logger.error(f"Error cleaning text: {e}")
            return text
    
    def transcribe_video(self, video_path):
        """Main function: transcribe video using all available methods"""
        try:
            logger.info(f"Starting enhanced transcription for: {video_path}")
            
            # Step 1: Speech transcription
            speech_text, speech_segments = self.transcribe_speech(video_path)
            logger.info(f"Speech transcription: {len(speech_segments)} segments")
            
            # Step 2: Subtitle/caption extraction
            subtitle_texts = []
            try:
                frames = self.extract_frames_for_ocr(video_path)
                for frame_info in frames:
                    text_regions = self.detect_text_regions(frame_info['frame'])
                    if text_regions:
                        texts = self.extract_text_from_regions(text_regions)
                        subtitle_texts.extend(texts)
                
                logger.info(f"Subtitle extraction: {len(subtitle_texts)} text regions found")
                
            except Exception as e:
                logger.error(f"Subtitle extraction failed: {e}")
            
            # Step 3: Merge and clean transcripts
            final_text, final_segments = self.clean_and_merge_transcripts(
                speech_text, subtitle_texts, speech_segments
            )
            
            logger.info(f"Final transcript: {len(final_text)} characters, {len(final_segments)} segments")
            
            return final_text, final_segments
            
        except Exception as e:
            logger.error(f"Enhanced transcription failed: {e}")
            return "Transcription failed", []

# Global instance
enhanced_transcriber = EnhancedTranscription()
