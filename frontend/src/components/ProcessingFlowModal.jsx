import React, { useState, useEffect } from 'react';
const { VITE_BACKEND_URL } = import.meta.env;
const API_BASE = (typeof VITE_BACKEND_URL === 'string' && VITE_BACKEND_URL.trim()) ? VITE_BACKEND_URL.trim() : '';
import Modal from './Modal';
import { useNavigate } from 'react-router-dom';

const ProcessingFlowModal = ({ isOpen, videoIds, onFinished, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [processingStatus, setProcessingStatus] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [resultsList, setResultsList] = useState([]);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [currentStepDetails, setCurrentStepDetails] = useState('');
  const [isNarrating, setIsNarrating] = useState(false);
  const videoRef = React.useRef(null);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [storyMode, setStoryMode] = useState('positive');
  const [storyLength, setStoryLength] = useState('long');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyError, setStoryError] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [renderUrl, setRenderUrl] = useState('');
  const navigate = useNavigate();
  const [existingLoaded, setExistingLoaded] = useState(false);

  const steps = [
    'Uploading',
    'Transcription',
    'Visual Tagging',
    'Emotion Analysis',
    'Indexing',
    'Story Draft',
    'Final Render'
  ];

  // Helper: safely parse JSON or throw with text preview
  const parseJsonSafe = async (response) => {
    try {
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        return await response.json();
      }
      const txt = await response.text();
      throw new Error(`Expected JSON, got: ${txt.slice(0, 120)}...`);
    } catch (e) {
      throw e;
    }
  };

  useEffect(() => {
    if (isOpen && videoIds && videoIds.length > 0) {
      startProcessing();
    }
  }, [isOpen, videoIds]);

  // Preload previously saved analysis results so the Results modal shows history
  useEffect(() => {
    const preloadExisting = async () => {
      if (!isOpen || existingLoaded) return;
      try {
        const uid = (() => { try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||''; } catch { return ''; } })();
        if (!uid) return;
        const res = await fetch(`${API_BASE}/my/analyses?userId=${encodeURIComponent(uid)}`, { 
          credentials: 'include',
          headers: { 'X-User-Id': uid } 
        });
        const data = await res.json().catch(()=>({ ok:false, analyses:[] }));
        if (!res.ok || !data.ok) return;
        const existing = Array.isArray(data.analyses) ? data.analyses : [];
        // Exclude current session videoIds to avoid duplicates while processing
        const exclude = new Set(videoIds || []);
        const list = [];
        for (const a of existing) {
          if (exclude.has(a.videoId)) continue;
          try {
            const r = await fetch(`${API_BASE}/results/${a.videoId}`, { 
              credentials: 'include',
              headers: { 'X-User-Id': uid } 
            });
            if (!r.ok) continue;
            const jr = await r.json().catch(()=>null);
            if (!jr) continue;
            list.push({
              videoId: a.videoId,
              transcript: jr.transcript || '',
              tags: Array.isArray(jr.tags) ? jr.tags : [],
              segments: Array.isArray(jr.segments) ? jr.segments : [],
              storySummary: '',
              storyNarration: '',
              storyScenes: []
            });
          } catch (_) { /* ignore */ }
        }
        if (list.length > 0) {
          setResultsList(list);
          setCurrentResults(list[0]);
          setActiveResultIndex(0);
          setShowResults(true);
        }
      } finally {
        setExistingLoaded(true);
      }
    };
    preloadExisting();
  }, [isOpen, existingLoaded, videoIds]);

  const startProcessing = async () => {
    setCurrentStep(0);
    setCurrentVideoIndex(0);
    setProcessingStatus({});
    // Do NOT clear resultsList; preserve previously loaded history
    setShowResults(true);
    
    // Process each video sequentially
    for (let i = 0; i < videoIds.length; i++) {
      setCurrentVideoIndex(i);
      console.log(`Processing video ${i + 1}/${videoIds.length}: ${videoIds[i]}`);
      
      try {
        // Reset steps for each video
        setCurrentStep(0);
        setCurrentStepDetails('Starting new video...');
        await simulateStep(500);
        
        // Step 1: Start processing
        setCurrentStep(1);
        setCurrentStepDetails('Starting transcription...');
        await simulateStep(1000);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        const processResponse = await fetch(`${API_BASE}/process/${videoIds[i]}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': (JSON.parse(localStorage.getItem('user')||'{}').userId)||'' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!processResponse.ok) {
          const errorData = await processResponse.json().catch(() => ({}));
          throw new Error(`Failed to process video: ${errorData.error || processResponse.statusText}`);
        }
        
        // Check if processing completed successfully
        const processData = await parseJsonSafe(processResponse);
        if (!processData.ok) {
          throw new Error(`Processing failed: ${processData.error || 'Unknown error'}`);
        }
        
        // Step 2: Wait for processing to complete and get results
        setCurrentStep(2);
        setCurrentStepDetails('Analyzing visual content...');
        await simulateStep(1500);
        
        // Poll for results and reflect backend-reported step
        let attempts = 0;
        let results = null;
        while (attempts < 30) { // Max 30 attempts (15 seconds)
          const resultsResponse = await fetch(`${API_BASE}/results/${videoIds[i]}`,
            { 
              credentials: 'include',
              headers: { 'X-User-Id': (JSON.parse(localStorage.getItem('user')||'{}').userId)||'' } 
            }
          );
          if (resultsResponse.ok) {
            results = await parseJsonSafe(resultsResponse).catch(() => null);
            // Map backend step to UI step index
            const stepMap = {
              'starting': 0,
              'transcription': 1,
              'visual_tagging': 2,
              'emotion_analysis': 3,
              'emotion_analysis_done': 3,
              'indexing': 4,
              'story_draft': 5,
              'final_render': 6
            };
            const backendStep = results?.currentStep;
            if (backendStep && stepMap[backendStep] !== undefined) {
              setCurrentStep(stepMap[backendStep]);
            }
            if (results && results.status === 'completed') break;
          }
          await simulateStep(500);
          attempts++;
        }
        
        if (results && results.status === 'completed') {
          const prepared = {
            videoId: videoIds[i],
            transcript: results.transcript,
            tags: results.tags,
            segments: results.segments,
            storySummary: '',
            storyNarration: '',
            storyScenes: []
          };

          // Store in list and show modal with tabs
          setResultsList(prev => {
            const list = [...prev, prepared];
            setActiveResultIndex(list.length - 1);
            setCurrentResults(list[list.length - 1]);
          setShowResults(true);
            return list;
          });

          // Update status map
          setProcessingStatus(prev => ({
            ...prev,
            [videoIds[i]]: prepared
          }));

          // Visual tagging step message
          setCurrentStep(2);
          setCurrentStepDetails(`Visual tags: ${results.tags.join(', ')}`);
          await simulateStep(1000);
        }
        
        // Emotion analysis via backend
        setCurrentStep(3);
        setCurrentStepDetails('Detecting emotions and sentiment...');
        try {
          const emoRes = await fetch(`${API_BASE}/analyze-emotions`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': (JSON.parse(localStorage.getItem('user')||'{}').userId)||'' },
            body: JSON.stringify({ videoId: videoIds[i], transcript: results?.transcript || '' })
          });
          if (emoRes.ok) {
            const emoJson = await parseJsonSafe(emoRes).catch(() => ({}));
            const pts = Array.isArray(emoJson.emotions) ? emoJson.emotions : [];
            setCurrentStepDetails(`Emotions detected: ${pts.slice(0, 3).map(p => p.label).join(', ')}...`);
          } else {
            setCurrentStepDetails('Emotion analysis failed, continuing...');
          }
        } catch (e) {
          setCurrentStepDetails('Emotion analysis error, continuing...');
        }
        await simulateStep(800);
        
        setCurrentStep(4);
        setCurrentStepDetails('Indexing for search...');
        await simulateStep(600);
        
        setCurrentStep(5);
        setCurrentStepDetails('Ready for story draft (open the results tab to generate)...');
        await simulateStep(600);
        
        setCurrentStep(6);
        setCurrentStepDetails('Rendering ready...');
        await simulateStep(600);
        
      } catch (error) {
        console.error(`Error processing video ${videoIds[i]}:`, error);
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
          errorMessage = 'Processing timeout - video may be too large or server is slow';
        }
        setProcessingStatus(prev => ({
          ...prev,
          [videoIds[i]]: { error: errorMessage }
        }));
        setCurrentStepDetails(`Error: ${errorMessage}`);
      }
    }
    
    // All videos processed (no auto-redirect)
    setCurrentStep(6);
    setCurrentStepDetails('All videos processed. Open each tab to view results.');
  };

  const simulateStep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const closeResults = () => {
    setShowResults(false);
    setCurrentResults(null);
  };

  const playNarration = (text) => {
    try {
      if (!text) return;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        // Do not auto-play the video; play narration only
        // Chunk large text into smaller utterances for stability
        const chunks = [];
        let remaining = text.trim();
        const maxLen = 220;
        while (remaining.length > 0) {
          let slice = remaining.slice(0, maxLen);
          const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
          if (lastStop > 60) slice = slice.slice(0, lastStop + 1);
          chunks.push(slice.trim());
          remaining = remaining.slice(slice.length).trim();
        }
        setIsNarrating(true);
        chunks.forEach((c, idx) => {
          const u = new SpeechSynthesisUtterance(c);
          u.rate = 1.0; u.pitch = 1.0;
          if (idx === chunks.length - 1) {
            u.onend = () => setIsNarrating(false);
          }
          window.speechSynthesis.speak(u);
        });
      }
    } catch (e) {
      setIsNarrating(false);
    }
  };

  const stopNarration = () => {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (_) {}
    setIsNarrating(false);
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepIndex) => {
    const status = getStepStatus(stepIndex);
    if (status === 'completed') return '✅';
    if (status === 'active') return '🔄';
    return '⏳';
  };

  useEffect(() => {
    if (resultsList.length > 0) {
      const idx = Math.min(activeResultIndex, resultsList.length - 1);
      setCurrentResults(resultsList[idx]);
    }
  }, [activeResultIndex, resultsList]);

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => { try { onClose && onClose(); } catch(_) {} navigate('/'); }}>
        <div className="p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            AI Processing Pipeline
          </h2>
          
          <div className="mb-6">
            <div className="text-center text-gray-600 mb-4">
              Processing video {currentVideoIndex + 1} of {videoIds?.length || 0}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${
                    getStepStatus(index) === 'completed' ? 'bg-green-500 text-white' :
                    getStepStatus(index) === 'active' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {getStepIcon(index)}
                  </div>
                  <div className="text-xs mt-1 text-gray-600">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center text-gray-700">
              <div className="text-lg font-semibold mb-2">
                {steps[currentStep]}
              </div>
              <div className="text-sm text-gray-600">
                {currentStepDetails}
              </div>
            </div>
          </div>

          {/* Minimal navigation */}
          <div className="text-center mt-2">
            <button
              onClick={() => { try { onClose && onClose(); } catch(_) {} navigate('/'); }}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
            >
              Go Home
            </button>
          </div>
        </div>
      </Modal>

      {/* Results Modal with tabs for all videos */}
      {showResults && resultsList.length > 0 && (
        <Modal isOpen={showResults} onClose={closeResults}>
          <div className="p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Video Analysis Results</h3>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {resultsList.map((r, idx) => (
                <button
                  key={`${r.videoId}-${idx}`}
                  onClick={() => setActiveResultIndex(idx)}
                  className={`px-3 py-1 rounded text-sm border ${idx === activeResultIndex ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-800 border-gray-300'}`}
                >
                  Video {idx + 1}
                </button>
              ))}
            </div>

            {currentResults && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Transcript:</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-gray-800">
                  {currentResults.transcript}
                </div>
                  {currentResults.segments && currentResults.segments.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-semibold text-gray-700 mb-2">Timeline:</h5>
                      <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {currentResults.segments.map((segment, index) => (
                          <div key={index} className="text-sm text-gray-600 mb-1">
                            <span className="font-mono text-gray-500">[{segment.start_time.toFixed(2)}s - {segment.end_time.toFixed(2)}s]</span>
                            <span className="ml-2">{segment.word}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Visual Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentResults.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Generate Story</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input className="col-span-2 border rounded px-3 py-2 text-sm" value={storyPrompt} onChange={e => setStoryPrompt(e.target.value)} placeholder="Enter a prompt (e.g., birthday highlight, travel vlog)" />
                  <select className="border rounded px-2 py-2 text-sm" value={storyMode} onChange={e => setStoryMode(e.target.value)}>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="contrast">Contrast</option>
                  </select>
                </div>
                {storyError && (
                  <div className="mb-2 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{storyError}</div>
                )}
                <button disabled={!storyPrompt || isGeneratingStory} onClick={async () => {
                  if (!currentResults?.videoId || !storyPrompt) return;
                  setIsGeneratingStory(true);
                  setStoryError('');
                  try {
                      const res = await fetch(`${API_BASE}/generate-story`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json', 'X-User-Id': (JSON.parse(localStorage.getItem('user')||'{}').userId)||'' },
                      body: JSON.stringify({ videoId: currentResults.videoId, prompt: storyPrompt, mode: storyMode, length: 'long' })
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      setStoryError(err?.error || 'Failed to generate story. Check backend and GEMINI_API_KEY.');
                      return;
                    }
                      const data = await parseJsonSafe(res);
                    if (!data?.success) {
                      setStoryError(data?.error || 'Story generation failed.');
                      return;
                    }
                      const updated = { ...currentResults, storySummary: data?.summary || '', storyNarration: data?.fullNarration || '', storyScenes: data?.scenes || [] };
                      setCurrentResults(updated);
                      setResultsList(prev => prev.map((r, idx) => idx === activeResultIndex ? updated : r));
                  } catch (e) {
                    setStoryError('Network error while generating story.');
                  } finally {
                    setIsGeneratingStory(false);
                  }
                }} className={`px-4 py-2 rounded text-white text-sm ${(!storyPrompt || isGeneratingStory) ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isGeneratingStory ? 'Generating...' : 'Generate Story'}</button>
              </div>

              {(currentResults.storyNarration || currentResults.storySummary) && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Story Narration:</h4>
                  {currentResults.storySummary && (
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-800 mb-2">
                      <span className="font-semibold">Summary: </span>{currentResults.storySummary}
                    </div>
                  )}
                  {currentResults.storyNarration && (
                    <div className="bg-gray-50 p-3 rounded-lg text-gray-800 max-h-48 overflow-y-auto">
                      {currentResults.storyNarration}
                    </div>
                  )}
                  {currentResults.storyNarration && (
                    <div className="mt-2 flex gap-2">
                        <button onClick={() => playNarration(currentResults.storyNarration)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm">{isNarrating ? 'Playing...' : 'Play Narration'}</button>
                      <button onClick={stopNarration} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm">Stop</button>
                    </div>
                  )}
                  
                  {/* Render Story Button */}
                  {currentResults.storyScenes && currentResults.storyScenes.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-gray-700 mb-2">Render Final Video:</h5>
                      {renderError && (
                        <div className="mb-2 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{renderError}</div>
                      )}
                      <button 
                        disabled={isRendering}
                        onClick={async () => {
                          if (!currentResults?.videoId || !currentResults.storyScenes) return;
                          setIsRendering(true);
                          setRenderError('');
                          try {
                              const res = await fetch(`${API_BASE}/render-story`, {
                              method: 'POST',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json', 'X-User-Id': (JSON.parse(localStorage.getItem('user')||'{}').userId)||'' },
                              body: JSON.stringify({ 
                                videoId: currentResults.videoId, 
                                scenes: currentResults.storyScenes,
                                transition: 'cut'
                              })
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              setRenderError(err?.error || 'Render failed');
                              return;
                            }
                              const data = await parseJsonSafe(res);
                            if (data?.ok && data?.url) {
                              setRenderUrl(data.url);
                            } else {
                              setRenderError('Render failed - no URL returned');
                            }
                          } catch (e) {
                            setRenderError('Network error while rendering');
                          } finally {
                            setIsRendering(false);
                          }
                        }}
                        className={`px-4 py-2 rounded text-white text-sm ${isRendering ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                      >
                        {isRendering ? 'Rendering...' : 'Render Final Video'}
                      </button>
                      
                      {renderUrl && (
                        <div className="mt-4">
                          <h6 className="font-semibold text-gray-700 mb-2">Rendered Video:</h6>
                          <video 
                            controls 
                            className="w-full rounded-lg" 
                            src={renderUrl}
                            style={{ maxHeight: '400px' }}
                          />
                          <div className="mt-2">
                            <a 
                              href={renderUrl} 
                              download 
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              Download Rendered Video
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
                {(currentResults.storyNarration) && (
                  <div className="mt-4">
                    <video ref={videoRef} controls className="w-full rounded-lg" src={`${API_BASE}/video/${currentResults.videoId}`}></video>
                </div>
              )}
                </div>
              )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProcessingFlowModal;