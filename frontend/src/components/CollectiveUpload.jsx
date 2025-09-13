import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Video, 
  Folder, 
  X, 
  Check, 
  AlertCircle, 
  Play,
  Clock,
  FileText,
  Tag,
  Users,
  Globe
} from 'lucide-react';
import Modal from './Modal';
import { VITE_BACKEND_URL } from '../googleConfig.js';

const CollectiveUpload = ({ isOpen, onClose, onUploadComplete }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'bulk'
  const [dragActive, setDragActive] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [loadingMyVideos, setLoadingMyVideos] = useState(false);
  const [myVideosError, setMyVideosError] = useState('');
  // Analysis list removed from this modal per request

  const API_BASE = VITE_BACKEND_URL || '';

  const loadMyVideos = async () => {
    try {
      setLoadingMyVideos(true); setMyVideosError('');
      const uid = (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })();
      if (!uid) { setMyVideosError('Sign in to see your uploads'); setMyVideos([]); return; }
      const res = await fetch(`${API_BASE}/my/videos?userId=${encodeURIComponent(uid)}`, { 
        credentials: 'include',
        headers: { 'X-User-Id': uid } 
      });
      const data = await res.json().catch(()=>({ ok:false, videos:[] }));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load');
      setMyVideos(Array.isArray(data.videos)? data.videos: []);
    } catch (e) {
      setMyVideosError(e.message || 'Failed to load uploads');
    } finally {
      setLoadingMyVideos(false);
    }
  };

  useEffect(()=>{ if (isOpen) { loadMyVideos(); } }, [isOpen]);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (files) => {
    const videoFiles = Array.from(files).filter(file => 
      file.type.startsWith('video/') || 
      file.name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i)
    );

    if (videoFiles.length === 0) {
      setUploadErrors(['No valid video files found. Please select video files only.']);
      return;
    }

    const newFiles = videoFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      error: null
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setUploadErrors([]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (fileData, onProgress) => {
    console.log('Real upload: Starting upload for:', fileData.name);
    
    const formData = new FormData();
    formData.append('video', fileData.file);
    formData.append('userId', 'collective_user');
    formData.append('userEmail', 'collective@footageflow.com');
    formData.append('collectionName', collectionName || 'My Collection');
    formData.append('collectionDescription', collectionDescription || '');

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${VITE_BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'X-User-Id': (JSON.parse(localStorage.getItem('user')||'{}').userId)||''
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        if (onProgress) onProgress(100);
        return { success: true, data: result };
      } else {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        console.error('Upload failed:', error);
        return { success: false, error: error.error || 'Upload failed' };
      }
    } catch (error) {
      console.error('Network error:', error);
      if (error.name === 'AbortError') {
        return { success: false, error: 'Upload timeout - file too large or server not responding' };
      }
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const handleUploadAll = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});
    setUploadErrors([]);
    setUploadSuccess([]);

    const results = [];
    
    for (const fileData of uploadedFiles) {
      // Update status to uploading
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading' } : f)
      );

      // Set initial progress
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 10 }));

      // Show uploading progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileData.id] || 10;
          const next = Math.min(current + 5, 90); // Don't go to 100 until upload completes
          return { ...prev, [fileData.id]: next };
        });
      }, 500);

      // Perform actual upload with progress callback
      const result = await uploadFile(fileData, (progress) => {
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileData.id]: progress }));
      });

      clearInterval(progressInterval);
      
      // Add result to results array
      results.push(result);
      
      if (result.success) {
        setUploadSuccess(prev => [...prev, fileData.name]);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'completed' } : f)
        );
      } else {
        setUploadErrors(prev => [...prev, `${fileData.name}: ${result.error}`]);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: result.error } : f)
        );
      }
    }

    setIsUploading(false);
    
    console.log('handleUploadAll completed, results array:', results);
    
    // Process results and extract video IDs
    handleUploadComplete(results);
  };

  const handleUploadComplete = (results) => {
    console.log('Upload completed:', results);
    // Extract videoIds from results and pass them to parent
    let videoIds = results
      .filter(result => result.success)
      .map(result => result.data.videoId);
    
    // Fallback: if no video IDs (backend not running), create demo IDs
    if (videoIds.length === 0 && results.length > 0) {
      console.log('No video IDs from backend, using demo IDs');
      videoIds = results.map((_, index) => `demo_${Date.now()}_${index}`);
    }
    
    // Ensure we always have video IDs for the processing flow
    if (videoIds.length === 0) {
      console.log('No results at all, creating fallback demo IDs');
      videoIds = [`demo_${Date.now()}_fallback`];
    }
    
    console.log('Calling onUploadComplete with videoIds:', videoIds);
    if (onUploadComplete) {
      onUploadComplete({ videoIds });
    }
    // Refresh user's uploads list after successful upload
    loadMyVideos();
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setUploadProgress({});
    setUploadErrors([]);
    setUploadSuccess([]);
    setCollectionName('');
    setCollectionDescription('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collective Footage Upload"
      size="xl"
    >
      <div className="space-y-6">
        {/* Collection Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Collection Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., My Travel Adventures, Family Memories"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Description
              </label>
              <input
                type="text"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                placeholder="Brief description of your collection"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Upload Mode Selection */}
        <div className="flex gap-4">
          <button
            onClick={() => setUploadMode('single')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  uploadMode === 'single'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Single Video
          </button>
          <button
            onClick={() => setUploadMode('bulk')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  uploadMode === 'bulk'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Bulk Upload
          </button>
        </div>

        {/* Upload Area */}
        <div
          ref={dropRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
                              ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {uploadMode === 'bulk' ? 'Drop your video collection here' : 'Drop your video here'}
          </h3>
          <p className="text-gray-600 mb-4">
            {uploadMode === 'bulk' 
              ? 'Upload multiple videos to build your collection. All formats supported.'
              : 'Upload a single video to get started.'
            }
          </p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors font-medium shadow-md"
          >
            {uploadMode === 'bulk' ? 'Select Multiple Videos' : 'Select Video'}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple={uploadMode === 'bulk'}
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Videos ({uploadedFiles.length})
              </h3>
              <button
                onClick={resetUpload}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadedFiles.map((fileData) => (
                <motion.div
                  key={fileData.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Video className="w-8 h-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{fileData.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(fileData.size)}</span>
                        <span>{fileData.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Progress Bar */}
                    {fileData.status === 'uploading' && (
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${uploadProgress[fileData.id] || 0}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Status Icons */}
                    {fileData.status === 'completed' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                    {fileData.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* My Uploaded Videos (persistent list) */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">My Uploaded Videos</h3>
          {myVideosError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{myVideosError}</div>
          )}
          {loadingMyVideos ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {myVideos.length === 0 ? (
                <div className="text-gray-600 text-sm">No uploads yet.</div>
              ) : myVideos.map(v => (
                <div key={v.videoId} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{v.originalName || v.filename}</div>
                    <div className="text-xs text-gray-500">ID: {v.videoId}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a className="text-sm text-blue-600 hover:text-blue-800 underline" href={`${API_BASE}/video/${v.videoId}`} target="_blank" rel="noreferrer">Open</a>
                    <button onClick={async()=>{
                      const uid = (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })();
                      if (!confirm('Delete this video and its analysis?')) return;
                      try {
                        await fetch(`${API_BASE}/my/videos/${v.videoId}?userId=${encodeURIComponent(uid)}`, { 
                          method: 'DELETE', 
                          credentials: 'include',
                          headers: { 'X-User-Id': uid } 
                        });
                        loadMyVideos();
                      } catch(_) {}
                    }} className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis results list intentionally removed from Upload modal */}

        {/* Error Messages */}
        {uploadErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Upload Errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {uploadErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Messages */}
        {uploadSuccess.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">Successfully Uploaded:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {uploadSuccess.map((filename, index) => (
                <li key={index}>• {filename}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadAll}
            disabled={uploadedFiles.length === 0 || isUploading}
                          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 shadow-md"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {uploadedFiles.length} Video{uploadedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Vision Statement */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Building Humanity's Collective Memory</h4>
          </div>
          <p className="text-blue-800 text-sm">
            Every video you upload becomes part of a global repository of human experiences. 
            Together, we're creating the world's largest searchable video library - 
            a "light mirror" that showcases the best of humanity and connects us through shared stories.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CollectiveUpload;
