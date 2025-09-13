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
  Globe,
  CloudUpload,
  FileVideo,
  Loader,
  CheckCircle,
  XCircle
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
    const formData = new FormData();
    formData.append('video', fileData.file);
    formData.append('userId', 'collective_user');
    formData.append('userEmail', 'collective@footageflow.com');
    formData.append('collectionName', collectionName || 'My Collection');
    formData.append('collectionDescription', collectionDescription || '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

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
        if (onProgress) onProgress(100);
        return { success: true, data: result };
      } else {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        return { success: false, error: error.error || 'Upload failed' };
      }
    } catch (error) {
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
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading' } : f)
      );

      setUploadProgress(prev => ({ ...prev, [fileData.id]: 10 }));

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileData.id] || 10;
          const next = Math.min(current + 5, 90);
          return { ...prev, [fileData.id]: next };
        });
      }, 500);

      const result = await uploadFile(fileData, (progress) => {
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileData.id]: progress }));
      });

      clearInterval(progressInterval);
      
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
    
    handleUploadComplete(results);
  };

  const handleUploadComplete = (results) => {
    let videoIds = results
      .filter(result => result.success)
      .map(result => result.data.videoId);
    
    if (videoIds.length === 0 && results.length > 0) {
      videoIds = results.map((_, index) => `demo_${Date.now()}_${index}`);
    }
    
    if (videoIds.length === 0) {
      videoIds = [`demo_${Date.now()}_fallback`];
    }
    
    if (onUploadComplete) {
      onUploadComplete({ videoIds });
    }
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
      <div className="space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-20 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <CloudUpload className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
            Upload to Humanity's Collective Memory
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Share your videos with the world and help build the largest repository of human experiences
          </p>
        </motion.div>

        {/* Enhanced Collection Info */}
        <motion.div 
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-8 rounded-2xl border border-blue-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-blue-900 mb-6 flex items-center gap-3">
            <Folder className="w-5 h-5" />
            Collection Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-3">
                Collection Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., My Travel Adventures, Family Memories"
                  className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-white/80 focus:bg-white"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-3">
                Description
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  placeholder="Brief description of your collection"
                  className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-white/80 focus:bg-white"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Upload Mode Selection */}
        <motion.div 
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={() => setUploadMode('single')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              uploadMode === 'single'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg border border-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileVideo className="w-4 h-4" />
            Single Video
          </motion.button>
          <motion.button
            onClick={() => setUploadMode('bulk')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              uploadMode === 'bulk'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg border border-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Users className="w-4 h-4" />
            Bulk Upload
          </motion.button>
        </motion.div>

        {/* Enhanced Upload Area */}
        <motion.div
          ref={dropRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 relative overflow-hidden ${
            dragActive
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-xl scale-105'
              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 hover:border-blue-400 hover:from-blue-50 hover:to-indigo-100 hover:shadow-lg'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          <motion.div
            animate={dragActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <CloudUpload className={`w-16 h-16 mx-auto mb-6 transition-colors duration-300 ${
              dragActive ? 'text-blue-600' : 'text-gray-400'
            }`} />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {uploadMode === 'bulk' ? 'Drop your video collection here' : 'Drop your video here'}
          </h3>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-md mx-auto">
            {uploadMode === 'bulk' 
              ? 'Upload multiple videos to build your collection. All formats supported.'
              : 'Upload a single video to get started.'
            }
          </p>
          
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-5 h-5" />
            {uploadMode === 'bulk' ? 'Select Multiple Videos' : 'Select Video'}
          </motion.button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple={uploadMode === 'bulk'}
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>

        {/* Enhanced File List */}
        {uploadedFiles.length > 0 && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-blue-600" />
                Selected Videos ({uploadedFiles.length})
              </h3>
              <button
                onClick={resetUpload}
                className="text-sm text-red-600 hover:text-red-800 font-semibold hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {uploadedFiles.map((fileData) => (
                <motion.div
                  key={fileData.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:border-blue-300 group"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Video className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">{fileData.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(fileData.size)}</span>
                        <span>{fileData.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Enhanced Progress Bar */}
                    {fileData.status === 'uploading' && (
                      <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 rounded-full"
                          style={{ width: `${uploadProgress[fileData.id] || 0}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Enhanced Status Icons */}
                    {fileData.status === 'completed' && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {fileData.status === 'error' && (
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                    {fileData.status === 'uploading' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                    )}
                    
                    {/* Enhanced Remove Button */}
                    <motion.button
                      onClick={() => removeFile(fileData.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enhanced My Uploaded Videos */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            My Uploaded Videos
          </h3>
          {myVideosError && (
            <motion.div 
              className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="w-4 h-4" />
              {myVideosError}
            </motion.div>
          )}
          {loadingMyVideos ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600 font-medium">Loading your videos...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {myVideos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No uploads yet</p>
                  <p className="text-gray-500 text-sm mt-1">Upload your first video to get started</p>
                </div>
              ) : myVideos.map(v => (
                <motion.div 
                  key={v.videoId} 
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 hover:border-blue-300 group"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Video className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 truncate">{v.originalName || v.filename}</div>
                      <div className="text-xs text-gray-500 font-mono">ID: {v.videoId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors" 
                      href={`${API_BASE}/video/${v.videoId}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      Open
                    </a>
                    <button 
                      onClick={async()=>{
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
                    }} 
                      className="text-sm px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors hover:shadow-md"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Enhanced Error Messages */}
        {uploadErrors.length > 0 && (
          <motion.div 
            className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Upload Errors:
            </h4>
            <ul className="text-red-700 space-y-2">
              {uploadErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Enhanced Success Messages */}
        {uploadSuccess.length > 0 && (
          <motion.div 
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Successfully Uploaded:
            </h4>
            <ul className="text-green-700 space-y-2">
              {uploadSuccess.map((filename, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{filename}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <motion.button
            onClick={onClose}
            className="px-8 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold border border-gray-300 hover:shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleUploadAll}
            disabled={uploadedFiles.length === 0 || isUploading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl border border-blue-500"
            whileHover={!isUploading && uploadedFiles.length > 0 ? { scale: 1.05 } : {}}
            whileTap={!isUploading && uploadedFiles.length > 0 ? { scale: 0.95 } : {}}
          >
            {isUploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                Upload {uploadedFiles.length} Video{uploadedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </motion.button>
        </div>

        {/* Enhanced Vision Statement */}
        <motion.div 
          className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl border border-blue-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-blue-600" />
            <h4 className="font-bold text-blue-900 text-lg">Building Humanity's Collective Memory</h4>
          </div>
          <p className="text-blue-800 leading-relaxed">
            Every video you upload becomes part of a global repository of human experiences. 
            Together, we're creating the world's largest searchable video library - 
            a "light mirror" that showcases the best of humanity and connects us through shared stories.
          </p>
        </motion.div>
      </div>
    </Modal>
  );
};

export default CollectiveUpload;
