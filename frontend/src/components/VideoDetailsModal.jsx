import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Clock, 
  Calendar, 
  Tag, 
  User,
  Eye,
  Heart,
  Download,
  Share2
} from 'lucide-react';
import Modal from './Modal';

const VideoDetailsModal = ({ isOpen, onClose, videoId, videoData }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(videoData?.likes || 0);
  const [viewCount, setViewCount] = useState(videoData?.views || 0);

  useEffect(() => {
    if (videoData) {
      setLikeCount(videoData.likes || 0);
      setViewCount(videoData.views || 0);
    }
  }, [videoData]);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').userId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const incrementView = () => {
    window.open(`http://127.0.0.1:5000/video/${videoId}`, '_blank');
    // Increment view count in backend and update UI
    const sessionId = (()=>{ try { return localStorage.getItem('sessionId') || (localStorage.setItem('sessionId', crypto.randomUUID()), localStorage.getItem('sessionId')); } catch { return ''; } })();
    fetch(`/api/videos/${videoId}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').userId || '' }, body: JSON.stringify({ sessionId }) })
      .then(r => r.json())
      .then(data => setViewCount(data.views || (viewCount + 1)))
      .catch(() => setViewCount(prev => prev + 1));
  };

  // Only once per modal open
  const [counted, setCounted] = useState(false);
  const handleFirstPlay = () => {
    if (counted) return;
    setCounted(true);
    // Increment without opening new tab
    const sessionId = (()=>{ try { return localStorage.getItem('sessionId') || (localStorage.setItem('sessionId', crypto.randomUUID()), localStorage.getItem('sessionId')); } catch { return ''; } })();
    fetch(`/api/videos/${videoId}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').userId || '' }, body: JSON.stringify({ sessionId }) })
      .then(r => r.json())
      .then(data => setViewCount(data.views || (viewCount + 1)))
      .catch(() => setViewCount(prev => prev + 1));
  };

  const formatDuration = (seconds) => {
    if (typeof seconds === 'string') return seconds;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Video Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Enhanced Video Preview */}
        <motion.div 
          className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="aspect-video bg-black flex items-center justify-center relative group">
            <video
              key={videoId}
              controls
              preload="metadata"
              poster={`/thumbnail/${videoId}`}
              className="w-full h-full rounded-lg"
              onPlay={handleFirstPlay}
            >
              <source src={`/video/${videoId}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Video overlay effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {formatDuration(videoData?.duration)}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Video Info */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <motion.h2 
              className="text-2xl font-bold text-gray-900 mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {videoData?.title || 'Untitled Video'}
            </motion.h2>
            <motion.p 
              className="text-gray-600 leading-relaxed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {videoData?.transcript || 'No transcript available'}
            </motion.p>
          </div>

          {/* Enhanced Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">{formatDuration(videoData?.duration)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="font-semibold text-gray-900">{formatDate(videoData?.uploadedAt)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Creator</p>
                  <p className="font-semibold text-gray-900">{videoData?.user || 'You'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Tags */}
          {videoData?.tags && videoData.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {videoData.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Enhanced Actions */}
          <motion.div 
            className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              onClick={incrementView}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-4 h-4" />
              Watch Video
            </motion.button>
            
            <motion.button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-semibold ${
                isLiked 
                  ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:from-red-200 hover:to-pink-200 border border-red-200' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 border border-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </motion.button>

            <motion.div 
              className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200"
              whileHover={{ scale: 1.02 }}
            >
              <Eye className="w-4 h-4" />
              <span className="font-medium">{viewCount} views</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </Modal>
  );
};

export default VideoDetailsModal;
