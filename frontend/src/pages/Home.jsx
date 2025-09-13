import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { VITE_BACKEND_URL, VITE_GOOGLE_CLIENT_ID } from '../googleConfig.js';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Search, 
  Sparkles, 
  Upload, 
  Users, 
  Heart, 
  ArrowRight,
  Video,
  Globe,
  Star,
  Zap,
  Shield,
  Info,
  ChevronDown,
  Menu,
  X,
  Brain,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import Modal from '../components/Modal';
import CollectiveUpload from '../components/CollectiveUpload';
import GlobalSearch from '../components/GlobalSearch';
import ProcessingFlowModal from '../components/ProcessingFlowModal';
import CollectiveStoryModal from '../components/CollectiveStoryModal';
import LoginModal from '../components/LoginModal';
import UploadedList from '../components/UploadedList';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCollectiveUpload, setShowCollectiveUpload] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showProcessingFlow, setShowProcessingFlow] = useState(false);
  const [showUploads, setShowUploads] = useState(false);
  const [processedVideoIds, setProcessedVideoIds] = useState([]);
  const [showCollectiveStory, setShowCollectiveStory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll for navbar effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getAvatarUrl = (u) => {
    try {
      if (u && u.picture) {
        if (u.picture.includes('googleusercontent.com')) {
          const encodedUrl = btoa(u.picture);
          const proxyUrl = `${VITE_BACKEND_URL}/proxy-avatar/${encodedUrl}`;
          return proxyUrl;
        } else {
          return u.picture;
        }
      }
      if (u && u.email) {
        const seed = encodeURIComponent(u.email);
        return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
      }
      if (u && u.name) {
        const seed = encodeURIComponent(u.name);
        return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
      }
      return 'https://api.dicebear.com/7.x/initials/svg?seed=User';
    } catch {
      return 'https://api.dicebear.com/7.x/initials/svg?seed=User';
    }
  };

  useEffect(() => {
    if (location && location.state && location.state.openUpload) {
      setShowCollectiveUpload(true);
    }

    (async () => {
      try {
        const me = await axios.get(`${VITE_BACKEND_URL}/auth/me`, { withCredentials: true });
        if (me.data?.authenticated && me.data.user) {
          localStorage.setItem('user', JSON.stringify(me.data.user));
          setUser(me.data.user);
        } else {
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        try { 
          const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
          setUser(cachedUser); 
        } catch { 
          setUser(null); 
        }
      }
    })();
  }, []);

  const handleCustomLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${VITE_BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    localStorage.removeItem('user');
    setUser(null);
    setShowAccountMenu(false);
  };

  const handleLogin = () => {
    try {
      const base = 'https://accounts.google.com/o/oauth2/v2/auth';
      const params = new URLSearchParams({
        client_id: VITE_GOOGLE_CLIENT_ID,
        redirect_uri: `${window.location.origin}/google-callback`,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: Math.random().toString(36).slice(2),
        prompt: 'select_account',
      });
      window.location.assign(`${base}?${params.toString()}`);
    } catch (e) {
      setShowLoginModal(true);
    }
  };

  const handleCollectiveUpload = () => {
    if (!user) { setShowLoginModal(true); return; }
    setShowCollectiveUpload(true);
  };

  const handleGlobalSearch = () => {
    if (!user) { setShowLoginModal(true); return; }
    setShowGlobalSearch(true);
  };

  const handleCollectiveStory = () => {
    if (!user) { setShowLoginModal(true); return; }
    setShowCollectiveStory(true);
  };

  const handleShowUploads = () => {
    if (!user) { setShowLoginModal(true); return; }
    setShowUploads(true);
  };

  const handleUploadComplete = (payload) => {
    const videoIds = Array.isArray(payload?.videoIds) ? payload.videoIds : [];
    setShowCollectiveUpload(false);
    if (videoIds.length > 0) {
      setProcessedVideoIds(videoIds);
      setShowProcessingFlow(true);
    }
  };

  const handleProcessingComplete = ({ videoIds, results }) => {
    setShowProcessingFlow(false);
    setShowGlobalSearch(true); 
  };

  const features = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Collective Footage Repository",
      description: "Upload your entire video collection - from phone footage to professional content. Build humanity's largest video library together.",
      color: "from-blue-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100",
      iconBg: "from-blue-500 to-cyan-600"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "AI-Powered Search Engine",
      description: "Find any moment across all uploaded footage using natural language. Search through millions of human experiences instantly.",
      color: "from-blue-500 to-indigo-600",
      gradient: "bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100",
      iconBg: "from-indigo-500 to-blue-600"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI Story Generation",
      description: "Transform raw footage into compelling narratives. Create stories that inspire, educate, and connect humanity.",
      color: "from-orange-500 to-red-500",
      gradient: "bg-gradient-to-br from-orange-50 via-red-50 to-orange-100",
      iconBg: "from-orange-500 to-red-600"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Best of Us",
      description: "Curate and share the most uplifting, inspiring content. Build a library of human excellence and positive stories.",
      color: "from-green-500 to-emerald-500",
      gradient: "bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100",
      iconBg: "from-emerald-500 to-green-600"
    }
  ];

  const stats = [
    { number: "∞", label: "Stories to Discover", icon: <Globe className="w-6 h-6" /> },
    { number: "100%", label: "AI Powered", icon: <Brain className="w-6 h-6" /> },
    { number: "24/7", label: "Global Access", icon: <Zap className="w-6 h-6" /> },
    { number: "0", label: "Cost to Share", icon: <Heart className="w-6 h-6" /> }
  ];

  const aiFeatures = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Advanced AI Processing",
      description: "Gemini AI, Vosk speech recognition, and computer vision",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Semantic Search",
      description: "Find content by meaning, not just keywords",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "Real-time Analysis",
      description: "Instant transcription and visual tagging",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Multi-modal Understanding",
      description: "Audio, visual, and text analysis combined",
      color: "from-orange-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary orbs */}
        <motion.div 
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/15 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-40"></div>
      </div>

      {/* Premium Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-xl' 
          : 'bg-white/5 backdrop-blur-md border-b border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                whileHover={{ rotate: 5, scale: 1.1 }}
              >
                <Video className="w-6 h-6 text-white" />
              </motion.div>
              <span className={`text-2xl font-bold transition-all duration-300 ${
                scrollY > 50 
                  ? 'bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent'
              }`}>
                Footage Flow
              </span>
            </motion.div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <button 
                onClick={handleShowUploads}
                className={`transition-all duration-300 flex items-center gap-2 hover:scale-105 font-medium ${
                  scrollY > 50 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                My Uploads
              </button>
              <button 
                onClick={handleGlobalSearch}
                className={`transition-all duration-300 flex items-center gap-2 hover:scale-105 font-medium ${
                  scrollY > 50 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Search className="w-5 h-5" />
                Global Search
              </button>
              <button 
                onClick={handleCollectiveUpload}
                className={`transition-all duration-300 flex items-center gap-2 hover:scale-105 font-medium ${
                  scrollY > 50 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Upload className="w-5 h-5" />
                Upload
              </button>
              
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 hover:bg-white/20"
                    aria-haspopup="menu"
                    aria-expanded={showAccountMenu ? 'true' : 'false'}
                  >
                    <img 
                      src={getAvatarUrl(user)} 
                      onError={(e)=>{
                        e.currentTarget.onerror=null; 
                        const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || user?.email || 'User')}`;
                        e.currentTarget.src = fallbackUrl;
                      }} 
                      alt={`${user?.name || 'User'} avatar`} 
                      className="w-8 h-8 rounded-full border-2 border-white/40 bg-white/10" 
                    />
                    <span className={`font-medium leading-tight ${
                      scrollY > 50 ? 'text-gray-700' : 'text-white/90'
                    }`}>
                      {user?.name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      showAccountMenu ? 'rotate-180' : ''
                    } ${scrollY > 50 ? 'text-gray-700' : 'text-white/70'}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showAccountMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-3 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-200/50">
                          <div className="flex items-center gap-3">
                            <img 
                              src={getAvatarUrl(user)} 
                              alt="Avatar"
                              className="w-10 h-10 rounded-full border-2 border-blue-200"
                            />
                            <div>
                              <div className="font-semibold text-gray-900">{user?.name || 'User'}</div>
                              <div className="text-sm text-gray-600 truncate" title={user?.email || ''}>
                                {user?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => { setShowAccountMenu(false); handleShowUploads(); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            My Videos
                          </button>
                          <button
                            onClick={() => { setShowAccountMenu(false); handleLogout(); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button 
                  onClick={handleLogin}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 rounded-lg transition-colors ${
                  scrollY > 50 ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                }`}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 rounded-b-2xl mt-2 overflow-hidden"
              >
                <div className="px-4 py-6 space-y-4">
                  <button 
                    onClick={() => { setShowMobileMenu(false); handleShowUploads(); }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Video className="w-5 h-5" />
                    My Uploads
                  </button>
                  <button 
                    onClick={() => { setShowMobileMenu(false); handleGlobalSearch(); }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Search className="w-5 h-5" />
                    Global Search
                  </button>
                  <button 
                    onClick={() => { setShowMobileMenu(false); handleCollectiveUpload(); }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Upload className="w-5 h-5" />
                    Upload
                  </button>
                  {user ? (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-3 px-4 py-2 mb-2">
                        <img 
                          src={getAvatarUrl(user)} 
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border-2 border-blue-200"
                        />
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{user?.name || 'User'}</div>
                          <div className="text-xs text-gray-600">{user?.email || ''}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <X className="w-5 h-5" />
                        Logout
                  ) : (
                    <button 
                      onClick={() => { setShowMobileMenu(false); handleLogin(); }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <motion.span 
                className="bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Humanity's
              </motion.span>
              <br />
              <motion.span 
                className="text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Video Search Engine
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 max-w-5xl mx-auto leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Upload your footage. Discover stories. Connect with humanity's collective memory. 
              Together, we're building the world's largest repository of human experiences.
            </motion.p>
          </motion.div>

          {/* Premium CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
          >
            <motion.button 
              onClick={handleCollectiveUpload}
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 transition-all duration-500 font-semibold text-lg shadow-2xl hover:shadow-blue-500/30 hover:scale-105 flex items-center gap-4 relative overflow-hidden border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Upload className="w-7 h-7 group-hover:scale-110 transition-transform relative z-10" />
              </motion.div>
              <span className="relative z-10">Upload Your Footage</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
            </motion.button>
            <motion.button 
              onClick={handleGlobalSearch}
              className="group px-10 py-5 bg-white/10 backdrop-blur-xl text-white border border-white/30 rounded-2xl hover:bg-white/20 transition-all duration-500 font-semibold text-lg shadow-xl hover:shadow-white/20 hover:scale-105 flex items-center gap-4 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Search className="w-7 h-7 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10">Explore Stories</span>
              <Globe className="w-6 h-6 group-hover:rotate-12 transition-transform relative z-10" />
            </motion.button>
            <motion.button 
              onClick={handleCollectiveStory}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 transition-all duration-500 font-semibold text-lg shadow-2xl hover:shadow-purple-500/30 hover:scale-105 flex items-center gap-4 relative overflow-hidden border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-7 h-7 group-hover:scale-110 transition-transform relative z-10" />
              </motion.div>
              <span className="relative z-10">Collective Story</span>
              <Heart className="w-6 h-6 group-hover:scale-110 transition-transform relative z-10" />
            </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>

          {/* Enhanced Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:shadow-xl">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </div>
                  <div className="text-blue-200 text-sm md:text-base font-medium">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-5 h-5 text-blue-300" />
              <span className="text-blue-200 font-medium">Powered by Advanced AI</span>
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              The Future of <br />
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Video Storytelling
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto font-light leading-relaxed">
              Experience the power of AI-driven video discovery and story creation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative md:col-span-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className={`relative ${feature.gradient} backdrop-blur-sm border border-white/30 rounded-3xl p-8 h-full hover:border-white/50 transition-all duration-500 hover:scale-[1.02] overflow-hidden shadow-xl hover:shadow-2xl`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className={`w-18 h-18 bg-gradient-to-r ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl relative z-10`}>
                    <div className="text-white group-hover:rotate-12 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed relative z-10 group-hover:text-gray-600 transition-colors text-lg">
                    {feature.description}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* AI Technology Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-12"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Powered by <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Advanced AI</span>
              </h3>
              <p className="text-blue-100 text-lg max-w-3xl mx-auto">
                Our platform leverages cutting-edge artificial intelligence to understand, analyze, and connect video content
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-blue-200 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Vision Statement Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="relative mb-12">
              <motion.div 
                className="w-28 h-28 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(251, 191, 36, 0.4)',
                    '0 0 0 20px rgba(251, 191, 36, 0)',
                    '0 0 0 0 rgba(251, 191, 36, 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Heart className="w-4 h-4 text-white" />
              </motion.div>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              The <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">Light Mirror</span> Vision
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-5xl mx-auto leading-relaxed mb-12 font-light">
              Instead of dystopian media that feeds our fears, we're creating a "light mirror" - 
              a platform that showcases the best of humanity, inspires positive change, and connects 
              us through shared experiences and stories.
            </p>
            <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-10 max-w-6xl mx-auto shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-8">Why This Matters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="text-center">
                  <motion.div 
                    className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Users className="w-8 h-8 text-white" />
                  </motion.div>
                  <h4 className="text-xl font-semibold text-white mb-3">Collective Memory</h4>
                  <p className="text-blue-100 leading-relaxed">Preserve humanity's stories for future generations</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className="w-8 h-8 text-white" />
                  </motion.div>
                  <h4 className="text-xl font-semibold text-white mb-3">Positive Impact</h4>
                  <p className="text-blue-100 leading-relaxed">Inspire change through uplifting content</p>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Globe className="w-8 h-8 text-white" />
                  </motion.div>
                  <h4 className="text-xl font-semibold text-white mb-3">Global Connection</h4>
                  <p className="text-blue-100 leading-relaxed">Connect people across cultures and borders</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-12 shadow-2xl"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"
            >
              <Star className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Join the <br />
              <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Revolution</span>?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto font-light leading-relaxed">
              Start building humanity's collective memory today. Your stories matter.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={handleCollectiveUpload}
                className="group px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 transition-all duration-500 font-semibold text-lg shadow-2xl hover:shadow-blue-500/30 hover:scale-105 flex items-center gap-4 border border-white/20"
              >
                <Upload className="w-7 h-7 group-hover:scale-110 transition-transform" />
                Start Uploading
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={handleGlobalSearch}
                className="group px-10 py-5 bg-white/10 backdrop-blur-xl text-white border border-white/30 rounded-2xl hover:bg-white/20 transition-all duration-500 font-semibold text-lg shadow-xl hover:shadow-white/20 hover:scale-105 flex items-center gap-4"
              >
                <Search className="w-7 h-7 group-hover:scale-110 transition-transform" />
                Explore Stories
                <Globe className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-white">Footage Flow</span>
              </div>
              <p className="text-blue-100 max-w-md leading-relaxed text-lg mb-6">
                Building humanity's collective video memory, one story at a time. 
                Join us in creating a world where every experience matters.
              </p>
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Secure & Private</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">AI Powered</span>
                </motion.div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Platform</h3>
              <ul className="space-y-3 text-blue-100">
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Collective Upload
                </li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <Search className="w-4 h-4" />
                  AI Search Engine
                </li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <Sparkles className="w-4 h-4" />
                  Story Generation
                </li>
                <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                  <Globe className="w-4 h-4" />
                  Global Discovery
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Community</h3>
              <ul className="space-y-3 text-blue-100">
                <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-12 pt-8 text-center">
            <p className="text-blue-200 text-lg">
              © 2024 Footage Flow. Building the future of video storytelling.
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Demo Modal */}
      <Modal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="Welcome to the Future"
        size="lg"
      >
        <div className="space-y-8">
          <div className="text-center mb-8">
            <motion.div 
              className="w-24 h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Video className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Welcome to the Future</h3>
            <p className="text-gray-600 text-lg">See how we're building humanity's collective video memory</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Collective Upload
              </h4>
              <p className="text-blue-800 leading-relaxed">
                Upload your entire video collection - from phone footage to professional content. 
                Every video becomes part of humanity's shared story.
              </p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5" />
                AI Search Engine
              </h4>
              <p className="text-green-800 leading-relaxed">
                Search through millions of human experiences using natural language. 
                Find any moment, any story, across all uploaded footage.
              </p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-200 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Story Generation
              </h4>
              <p className="text-orange-800 leading-relaxed">
                Transform raw footage into compelling narratives. 
                AI helps create stories that inspire, educate, and connect humanity.
              </p>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Best of Us
              </h4>
              <p className="text-purple-800 text-sm">
                Curate and share the most uplifting, inspiring content. 
                Build a library of human excellence and positive stories.
              </p>
            </motion.div>
          </div>

          <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 p-8 rounded-2xl border border-blue-300 shadow-lg">
            <h4 className="font-bold text-blue-900 mb-4 text-center text-xl">The Light Mirror Vision</h4>
            <p className="text-blue-800 text-center leading-relaxed text-lg">
              Instead of dystopian media that feeds our fears, we're creating a "light mirror" - 
              a platform that showcases the best of humanity, inspires positive change, and connects 
              us through shared experiences and stories.
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={handleCollectiveUpload}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Uploading Now
            </button>
            <button
              onClick={() => setShowDemoModal(false)}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <CollectiveUpload
        isOpen={showCollectiveUpload}
        onClose={() => setShowCollectiveUpload(false)}
        onUploadComplete={handleUploadComplete}
      />

      <ProcessingFlowModal
        isOpen={showProcessingFlow}
        videoIds={processedVideoIds}
        onFinished={handleProcessingComplete}
        onClose={() => setShowProcessingFlow(false)}
      />

      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      <Modal
        isOpen={showCollectiveStory}
        onClose={() => setShowCollectiveStory(false)}
        title="Collective Story Generation"
        size="lg"
      >
        <CollectiveStoryModal onClose={() => setShowCollectiveStory(false)} />
      </Modal>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleCustomLogin}
        onGoogleLogin={undefined}
        isGoogleLoading={false}
      />

      <UploadedList isOpen={showUploads} onClose={() => setShowUploads(false)} />
    </div>
  );
};

export default Home;
