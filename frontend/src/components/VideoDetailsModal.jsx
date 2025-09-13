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
  Share2,
  Bookmark,
  MoreHorizontal,
  Volume2,
  Maximize,
  Settings,
  Star,
  MessageCircle
} from 'lucide-react';
import Modal from './Modal';

const VideoDetailsModal = ({ isOpen, onClose, videoId, videoData }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(videoData?.likes || 0);
  const [viewCount, setViewCount] = useState(videoData?.views || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark API call
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const incrementView = () => {
    window.open(`http://127.0.0.1:5000/video/${videoId}`, '_blank');
    const sessionId = (()=>{ try { return localStorage.getItem('sessionId') || (localStorage.setItem('sessionId', crypto.randomUUID()), localStorage.getItem('sessionId')); } catch { return ''; } })();
    fetch(`/api/videos/${videoId}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': JSON.parse(localStorage.getItem('user') || '{}').userId || '' }, body: JSON.stringify({ sessionId }) })
      .then(r => r.json())
      .then(data => setViewCount(data.views || (viewCount + 1)))
      .catch(() => setViewCount(prev => prev + 1));
  };

  const [counted, setCounted] = useState(false);
  const handleFirstPlay = () => {
    if (counted) return;
    setCounted(true);
    setIsPlaying(true);
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
      title=""
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-8">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Video Details
          </motion.h2>
          <motion.button
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Premium Video Preview */}
        <motion.div 
          className="relative bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 rounded-2xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="aspect-video bg-black rounded-2xl flex items-center justify-center relative group overflow-hidden">
            <video
              key={videoId}
              controls
              preload="metadata"
              poster={`/thumbnail/${videoId}`}
              className="w-full h-full rounded-2xl"
              onPlay={handleFirstPlay}
              onPause={() => setIsPlaying(false)}
            >
              <source src={`/video/${videoId}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Premium video overlay effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg">
              {formatDuration(videoData?.duration)}
            </div>
            {/* Video controls overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="flex items-center gap-3">
                <motion.button
                  className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? <Volume2 className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                </motion.button>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
                <motion.button
                  className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Maximize className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Video Info */}
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-4 leading-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {videoData?.title || 'Untitled Video'}
            </motion.h2>
            <motion.p 
              className="text-gray-700 leading-relaxed text-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {videoData?.transcript || 'No transcript available'}
            </motion.p>
          </div>

          {/* Premium Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                  <p className="font-bold text-gray-900 text-lg">{formatDuration(videoData?.duration)}</p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-green-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Uploaded</p>
                  <p className="font-bold text-gray-900 text-lg">{formatDate(videoData?.uploadedAt)}</p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-purple-300"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Creator</p>
                  <p className="font-bold text-gray-900 text-lg">{videoData?.user || 'You'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Premium Tags */}
          {videoData?.tags && videoData.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Tag className="w-4 h-4 text-blue-600" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-3">
                {videoData.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full font-semibold border border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
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

          {/* Premium Actions */}
          <motion.div 
            className="flex flex-wrap items-center gap-4 pt-8 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {/* Primary Action */}
            <motion.button
              onClick={incrementView}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-xl hover:shadow-2xl font-bold text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="w-5 h-5 fill-current" />
              Watch Video
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            
            {/* Secondary Actions */}
            <motion.button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl ${
                isLiked 
                  ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:from-red-200 hover:to-pink-200 border border-red-300' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-red-50 hover:to-pink-50 hover:text-red-600 border border-gray-300 hover:border-red-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </motion.button>

            <motion.button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl ${
                isBookmarked 
                  ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-600 border border-yellow-300' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-yellow-50 hover:to-orange-50 hover:text-yellow-600 border border-gray-300 hover:border-yellow-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
              Save
            </motion.button>

            <div className="relative">
              <motion.button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl border border-gray-300 hover:border-blue-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-5 h-5" />
                Share
              </motion.button>
              
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 min-w-48 z-10"
                  >
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Copy Link
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Share on Social
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      Embed Video
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div 
              className="flex items-center gap-3 text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 rounded-xl border border-gray-200 shadow-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Views</p>
                <p className="font-bold text-gray-900 text-lg">{viewCount.toLocaleString()}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Additional Actions */}
          <motion.div 
            className="flex items-center justify-between pt-6 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-4">
              <motion.button
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                Download
              </motion.button>
              <motion.button
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-4 h-4" />
                Comment
              </motion.button>
            </div>
            <motion.button
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreHorizontal className="w-4 h-4" />
              More
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </Modal>
  );
};

export default VideoDetailsModal;
