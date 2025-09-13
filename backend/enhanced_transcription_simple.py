import os
import tempfile
import subprocess
import json
import re
import wave
import logging
from vosk import Model, KaldiRecognizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedTranscriptionSimple:
    def __init__(self):
        self.vosk_model = None
        self.model_loaded = False
        self.model_loading = False
        # Don't load models during initialization - load them lazily
    
    def _load_models(self):
        """Load Vosk model lazily"""
        if self.model_loaded or self.model_loading:
            return
        
        self.model_loading = True
        try:
            # Load Vosk model - ENHANCED PATH RESOLUTION
            model_paths = [
                "vosk-model-small-en-us-0.15",
                os.path.join(os.getcwd(), "vosk-model-small-en-us-0.15"),
                os.path.join(os.path.dirname(__file__), "vosk-model-small-en-us-0.15")
            ]
            
            model_path = None
            for path in model_paths:
                if os.path.exists(path):
                    model_path = path
                    break
            
            if model_path:
                logger.info(f"Loading Vosk model from {model_path}...")
                self.vosk_model = Model(model_path)
                logger.info("✅ Vosk model loaded successfully - REAL AI SPEECH RECOGNITION ENABLED")
                self.model_loaded = True
            else:
                logger.warning("Vosk model not found, speech recognition disabled")
                logger.warning("Available paths checked: " + ", ".join(model_paths))
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
        finally:
            self.model_loading = False
    
    def transcribe_speech(self, video_path):
        """Transcribe speech using Vosk"""
        try:
            # Load models lazily if not already loaded
            self._load_models()
            
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
    
    def extract_subtitles_ffmpeg(self, video_path):
        """Extract subtitles using ffmpeg (if available)"""
        try:
            # Check if video has embedded subtitles
            cmd = [
                'ffprobe', '-v', 'quiet', '-select_streams', 's', 
                '-show_entries', 'stream=index:stream_tags=language', 
                '-of', 'csv=p=0', video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                logger.info("Embedded subtitles found, extracting...")
                
                # Extract subtitle stream
                temp_srt = tempfile.NamedTemporaryFile(suffix='.srt', delete=False)
                temp_srt.close()
                
                extract_cmd = [
                    'ffmpeg', '-i', video_path, 
                    '-map', '0:s:0', '-c:s', 'srt', 
                    '-y', temp_srt.name
                ]
                
                subprocess.run(extract_cmd, capture_output=True, check=True)
                
                # Read subtitle file
                if os.path.exists(temp_srt.name):
                    with open(temp_srt.name, 'r', encoding='utf-8', errors='ignore') as f:
                        subtitle_text = f.read()
                    
                    os.unlink(temp_srt.name)
                    
                    # Parse SRT format and extract text
                    subtitle_lines = []
                    lines = subtitle_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not line.isdigit() and not '-->' in line:
                            subtitle_lines.append(line)
                    
                    return subtitle_lines
                
            return []
            
        except Exception as e:
            logger.debug(f"Subtitle extraction failed: {e}")
            return []
    
    def clean_text(self, text):
        """Clean and format transcript text"""
        try:
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text.strip())
            
            # Fix common transcription errors
            text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # Remove repeated words
            
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
    
    def merge_transcripts(self, speech_text, subtitle_texts):
        """Merge speech and subtitle transcripts"""
        try:
            # Clean speech transcript
            if speech_text:
                speech_text = self.clean_text(speech_text)
            
            # Clean subtitle texts
            if subtitle_texts:
                subtitle_text = " ".join([self.clean_text(sub) for sub in subtitle_texts if sub])
            else:
                subtitle_text = ""
            
            # Merge transcripts
            if speech_text and subtitle_text:
                # Combine both sources
                merged_text = f"{speech_text} [Subtitles: {subtitle_text}]"
            elif speech_text:
                merged_text = speech_text
            elif subtitle_text:
                merged_text = subtitle_text
            else:
                merged_text = "No speech or text detected"
            
            return merged_text
            
        except Exception as e:
            logger.error(f"Error merging transcripts: {e}")
            return speech_text or "Transcription failed"
    
    def transcribe_video(self, video_path):
        """Main function: transcribe video using available methods"""
        try:
            # Load models lazily if not already loaded
            self._load_models()
            logger.info(f"Starting enhanced transcription for: {video_path}")
            
            # Step 1: Speech transcription
            speech_text, speech_segments = self.transcribe_speech(video_path)
            logger.info(f"Speech transcription: {len(speech_segments)} segments")
            
            # Step 2: Subtitle extraction (using ffmpeg)
            subtitle_texts = self.extract_subtitles_ffmpeg(video_path)
            logger.info(f"Subtitle extraction: {len(subtitle_texts)} subtitle lines found")
            
            # Step 3: Merge and clean transcripts
            final_text = self.merge_transcripts(speech_text, subtitle_texts)
            
            logger.info(f"Final transcript: {len(final_text)} characters")
            
            return final_text, speech_segments
            
        except Exception as e:
            logger.error(f"Enhanced transcription failed: {e}")
            return "Transcription failed", []

# Global instance
enhanced_transcriber_simple = EnhancedTranscriptionSimple()
