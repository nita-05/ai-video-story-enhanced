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
  Info
} from 'lucide-react';
import Modal from '../components/Modal';
import CollectiveUpload from '../components/CollectiveUpload';
import GlobalSearch from '../components/GlobalSearch';
import ProcessingFlowModal from '../components/ProcessingFlowModal';
import CollectiveStoryModal from '../components/CollectiveStoryModal';
import LoginModal from '../components/LoginModal';
import UploadedList from '../components/UploadedList';
// GIS is not used; Firebase Google Auth is handled inside LoginModal

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
  // Firebase handles Google login in the modal
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const getAvatarUrl = (u) => {
    try {
      if (u && u.picture) {
        // Check if it's a Google profile picture and use proxy
        if (u.picture.includes('googleusercontent.com')) {
          const encodedUrl = btoa(u.picture);
          const proxyUrl = `${VITE_BACKEND_URL}/proxy-avatar/${encodedUrl}`;
          console.log('Using Google profile picture via proxy:', proxyUrl);
          return proxyUrl;
        } else {
          console.log('Using direct profile picture URL:', u.picture);
          return u.picture;
        }
      }
      if (u && u.email) {
        const seed = encodeURIComponent(u.email);
        console.log('No picture, using email as seed:', u.email);
        return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
      }
      if (u && u.name) {
        const seed = encodeURIComponent(u.name);
        console.log('No picture or email, using name as seed:', u.name);
        return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
      }
      console.log('No user data, using fallback');
      return 'https://api.dicebear.com/7.x/initials/svg?seed=User';
    } catch {
      console.log('Error in getAvatarUrl, using fallback');
      return 'https://api.dicebear.com/7.x/initials/svg?seed=User';
    }
  };

  // Initialize user state from secure session
  useEffect(() => {
    // Open upload modal if requested via navigation state
    if (location && location.state && location.state.openUpload) {
      setShowCollectiveUpload(true);
    }

    // Fetch current session user
    (async () => {
      try {
        const me = await axios.get(`${VITE_BACKEND_URL}/auth/me`, { withCredentials: true });
        console.log('Auth check response:', me.data);
        if (me.data?.authenticated && me.data.user) {
          console.log('User authenticated:', me.data.user);
          console.log('User details:', {
            name: me.data.user.name,
            email: me.data.user.email,
            picture: me.data.user.picture,
            userId: me.data.user.userId
          });
          localStorage.setItem('user', JSON.stringify(me.data.user));
          setUser(me.data.user);
        } else {
          console.log('User not authenticated, clearing local storage');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        // Fall back to any cached user
        try { 
          const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
          console.log('Using cached user:', cachedUser);
          setUser(cachedUser); 
        } catch { 
          console.log('No cached user available');
          setUser(null); 
        }
      }
    })();
  }, []);

  const handleCustomLogin = (userData) => {
    console.log('Custom login successful', userData);
    console.log('User data details:', {
      name: userData?.name,
      email: userData?.email,
      picture: userData?.picture,
      userId: userData?.userId
    });
    setUser(userData);
    console.log('User logged in successfully');
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${VITE_BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    localStorage.removeItem('user');
    setUser(null);
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
    console.log('Home: handleUploadComplete called with payload:', payload);
    // payload expected: { videoIds: string[] }
    const videoIds = Array.isArray(payload?.videoIds) ? payload.videoIds : [];
    console.log('Home: extracted videoIds:', videoIds);
    setShowCollectiveUpload(false);
    if (videoIds.length > 0) {
      console.log('Home: setting processedVideoIds and opening processing flow');
      setProcessedVideoIds(videoIds);
      setShowProcessingFlow(true);
    }
  };

  const handleProcessingComplete = ({ videoIds, results }) => {
    console.log('Processing flow completed for videoIds:', videoIds, 'with results:', results);
    setShowProcessingFlow(false);
    // Optionally, open Global Search after completion
    setShowGlobalSearch(true); 
  };

  const features = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Collective Footage Repository",
      description: "Upload your entire video collection - from phone footage to professional content. Build humanity's largest video library together.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "AI-Powered Search Engine",
      description: "Find any moment across all uploaded footage using natural language. Search through millions of human experiences instantly.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI Story Generation",
      description: "Transform raw footage into compelling narratives. Create stories that inspire, educate, and connect humanity.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Best of Us",
      description: "Curate and share the most uplifting, inspiring content. Build a library of human excellence and positive stories.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    { number: "∞", label: "Stories to Discover" },
    { number: "100%", label: "AI Powered" },
    { number: "24/7", label: "Global Access" },
    { number: "0", label: "Cost to Share" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        {/* Additional floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-400/10 rounded-full blur-2xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse opacity-30"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent hover:from-blue-200 hover:to-white transition-all duration-300">
                Footage Flow
              </span>
            </motion.div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleShowUploads}
                className="text-white/80 hover:text-white transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                My Uploads
              </button>
              <button 
                onClick={handleGlobalSearch}
                className="text-white/80 hover:text-white transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Global Search</span>
              </button>
              <button 
                onClick={handleCollectiveUpload}
                className="text-white/80 hover:text-white transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 hover:opacity-90 transition"
                    aria-haspopup="menu"
                    aria-expanded={showAccountMenu ? 'true' : 'false'}
                  >
                    <img 
                      src={getAvatarUrl(user)} 
                      onError={(e)=>{
                        console.log('Avatar image failed to load, using fallback');
                        console.log('Failed URL was:', e.currentTarget.src);
                        e.currentTarget.onerror=null; 
                        const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || user?.email || 'User')}`;
                        console.log('Fallback avatar URL:', fallbackUrl);
                        e.currentTarget.src = fallbackUrl;
                      }} 
                      onLoad={() => {
                        console.log('Avatar image loaded successfully from:', this.src);
                      }}
                      alt={`${user?.name || 'User'} avatar`} 
                      className="w-9 h-9 rounded-full border border-white/40 bg-white/10" 
                    />
                    <span className="text-white/90 font-medium hidden sm:inline leading-tight">Account</span>
                  </button>
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-black/5 p-2 z-50">
                      <div className="px-3 py-2 text-sm text-gray-700 truncate" title={user.email || ''}>
                        {user.email || 'Signed in'}
                      </div>
                      <button
                        onClick={() => { setShowAccountMenu(false); handleLogout(); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
              <button 
                onClick={handleLogin}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105"
              >
                  Login
              </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Enhanced Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <motion.span 
                className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ 
                  duration: 3, 
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
              className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Upload your footage. Discover stories. Connect with humanity's collective memory. 
              Together, we're building the world's largest repository of human experiences.
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <motion.button 
              onClick={handleCollectiveUpload}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 hover:scale-105 flex items-center gap-3 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Upload className="w-6 h-6 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10">Upload Your Footage</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
            </motion.button>
            <motion.button 
              onClick={handleGlobalSearch}
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-white/10 hover:scale-105 flex items-center gap-3 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Search className="w-6 h-6 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10">Explore Stories</span>
              <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform relative z-10" />
            </motion.button>
            <motion.button 
              onClick={handleCollectiveStory}
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-2xl hover:from-purple-700 hover:to-pink-800 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 hover:scale-105 flex items-center gap-3 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10">Collective Story</span>
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform relative z-10" />
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-blue-200 text-sm md:text-base font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Future of <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Video Storytelling</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Experience the power of AI-driven video discovery and story creation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 h-full hover:bg-white/20 transition-all duration-500 hover:scale-105 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}>
                    <div className="text-white group-hover:rotate-12 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed relative z-10 group-hover:text-blue-50 transition-colors">
                    {feature.description}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Statement Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Light Mirror</span> Vision
            </h2>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed mb-8">
              Instead of dystopian media that feeds our fears, we're creating a "light mirror" - 
              a platform that showcases the best of humanity, inspires positive change, and connects 
              us through shared experiences and stories.
            </p>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Why This Matters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Collective Memory</h4>
                  <p className="text-blue-100 text-sm">Preserve humanity's stories for future generations</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Positive Impact</h4>
                  <p className="text-blue-100 text-sm">Inspire change through uplifting content</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Global Connection</h4>
                  <p className="text-blue-100 text-sm">Connect people across cultures and borders</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Join the <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Revolution</span>?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start building humanity's collective memory today. Your stories matter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={handleCollectiveUpload}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 hover:scale-105 flex items-center gap-3"
              >
                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Start Uploading
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={handleGlobalSearch}
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-white/10 hover:scale-105 flex items-center gap-3"
              >
                <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Explore Stories
                <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Footage Flow</span>
              </div>
              <p className="text-blue-100 max-w-md leading-relaxed">
                Building humanity's collective video memory, one story at a time. 
                Join us in creating a world where every experience matters.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-blue-100">
                <li>Collective Upload</li>
                <li>AI Search Engine</li>
                <li>Story Generation</li>
                <li>Global Discovery</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
              <ul className="space-y-2 text-blue-100">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-blue-200">
              © 2024 Footage Flow. Building the future of video storytelling.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="Welcome to the Future"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Future</h3>
            <p className="text-gray-600">See how we're building humanity's collective video memory</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Collective Upload
              </h4>
              <p className="text-blue-800 text-sm">
                Upload your entire video collection - from phone footage to professional content. 
                Every video becomes part of humanity's shared story.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5" />
                AI Search Engine
              </h4>
              <p className="text-green-800 text-sm">
                Search through millions of human experiences using natural language. 
                Find any moment, any story, across all uploaded footage.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Story Generation
              </h4>
              <p className="text-orange-800 text-sm">
                Transform raw footage into compelling narratives. 
                AI helps create stories that inspire, educate, and connect humanity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Best of Us
              </h4>
              <p className="text-purple-800 text-sm">
                Curate and share the most uplifting, inspiring content. 
                Build a library of human excellence and positive stories.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-xl border border-blue-300">
            <h4 className="font-semibold text-blue-900 mb-3 text-center">The Light Mirror Vision</h4>
            <p className="text-blue-800 text-center">
              Instead of dystopian media that feeds our fears, we're creating a "light mirror" - 
              a platform that showcases the best of humanity, inspires positive change, and connects 
              us through shared experiences and stories.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCollectiveUpload}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold shadow-md"
            >
              Start Uploading Now
            </button>
            <button
              onClick={() => setShowDemoModal(false)}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Collective Upload Modal */}
      <CollectiveUpload
        isOpen={showCollectiveUpload}
        onClose={() => setShowCollectiveUpload(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Processing Flow Modal */}
      <ProcessingFlowModal
        isOpen={showProcessingFlow}
        videoIds={processedVideoIds}
        onFinished={handleProcessingComplete}
        onClose={() => setShowProcessingFlow(false)}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      {/* Collective Story Modal */}
      <Modal
        isOpen={showCollectiveStory}
        onClose={() => setShowCollectiveStory(false)}
        title="Collective Story Generation"
        size="lg"
      >
        <CollectiveStoryModal onClose={() => setShowCollectiveStory(false)} />
      </Modal>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleCustomLogin}
        onGoogleLogin={undefined}
        isGoogleLoading={false}
      />

      {/* Uploaded list */}
      <UploadedList isOpen={showUploads} onClose={() => setShowUploads(false)} />

    </div>
  );
};

export default Home;
