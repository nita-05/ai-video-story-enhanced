import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Video, 
  Clock, 
  User, 
  Tag, 
  Play,
  Eye,
  Heart,
  Globe,
  Sparkles,
  Filter,
  TrendingUp,
  AlertCircle,
  Zap,
  Star,
  Users,
  Calendar,
  Loader,
  ArrowRight,
  Bookmark,
  Share2,
  Download
} from 'lucide-react';
import Modal from './Modal';
import VideoDetailsModal from './VideoDetailsModal';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoDetails, setShowVideoDetails] = useState(false);
  const [videoStats, setVideoStats] = useState({});
  const [filters, setFilters] = useState({
    duration: 'all',
    dateRange: 'all',
    tags: [],
    userType: 'all',
    category: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches] = useState([
    { term: 'family moments', icon: '👨‍👩‍👧‍👦', count: '2.4k' },
    { term: 'travel adventures', icon: '✈️', count: '1.8k' },
    { term: 'creative projects', icon: '🎨', count: '1.2k' },
    { term: 'learning experiences', icon: '📚', count: '956' },
    { term: 'community events', icon: '🤝', count: '743' },
    { term: 'nature beauty', icon: '🌿', count: '1.5k' },
    { term: 'artistic expression', icon: '🎭', count: '892' },
    { term: 'sports highlights', icon: '⚽', count: '1.1k' }
  ]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading recent searches:', e);
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent search:', e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    saveRecentSearch(searchQuery.trim());
    
    try {
      const uid = (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })();
      const response = await fetch('/global-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': uid
        },
        body: JSON.stringify({
          query: searchQuery,
          filters: filters,
          userId: uid
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        setSearchResults(results);

        try {
          const statsEntries = await Promise.all(
            results.map(async (r) => {
              try {
                const res = await fetch(`/api/videos/${r.videoId}/stats`);
                if (!res.ok) return [r.videoId, { views: r.views || 0, likes: r.likes || 0 }];
                const s = await res.json();
                return [r.videoId, { views: s.views || 0, likes: s.likes || 0 }];
              } catch {
                return [r.videoId, { views: r.views || 0, likes: r.likes || 0 }];
              }
            })
          );
          const seeded = Object.fromEntries(statsEntries);
          setVideoStats(seeded);
        } catch (e) {
          console.warn('Failed to load stats:', e);
        }
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      setSearchError('Search failed. Using demo results.');
      
      setSearchResults([
        {
          id: '1',
          title: 'Family Beach Day - Summer 2024',
          user: 'Sarah M.',
          duration: '2:34',
          tags: ['family', 'beach', 'summer', 'vacation'],
          thumbnail: '🏖️',
          relevance: 0.95,
          transcript: 'Beautiful day at the beach with family, building sandcastles and enjoying the ocean waves...',
          views: 1247,
          likes: 89,
          uploadDate: '2024-08-15',
          category: 'family'
        },
        {
          id: '2',
          title: 'Mountain Hiking Adventure - Peak Experience',
          user: 'Alex K.',
          duration: '5:12',
          tags: ['nature', 'hiking', 'adventure', 'mountains'],
          thumbnail: '🏔️',
          relevance: 0.88,
          transcript: 'Amazing views from the mountain top, challenging hike but worth every step...',
          views: 892,
          likes: 156,
          uploadDate: '2024-08-10',
          category: 'adventure'
        },
        {
          id: '3',
          title: 'Creative Art Project - Watercolor Masterpiece',
          user: 'Maria L.',
          duration: '3:45',
          tags: ['art', 'creativity', 'painting', 'watercolor'],
          thumbnail: '🎨',
          relevance: 0.82,
          transcript: 'Working on a new painting technique, exploring watercolor textures and color blending...',
          views: 567,
          likes: 234,
          uploadDate: '2024-08-12',
          category: 'creative'
        },
        {
          id: '4',
          title: 'Community Garden Project - Growing Together',
          user: 'David R.',
          duration: '4:18',
          tags: ['community', 'garden', 'sustainability', 'collaboration'],
          thumbnail: '🌱',
          relevance: 0.78,
          transcript: 'Our neighborhood coming together to create a beautiful community garden...',
          views: 445,
          likes: 67,
          uploadDate: '2024-08-08',
          category: 'community'
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrendingClick = (trend) => {
    setSearchQuery(trend.term);
    setTimeout(() => handleSearch(), 100);
  };

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    setTimeout(() => handleSearch(), 100);
  };

  const formatDuration = (seconds) => {
    if (typeof seconds === 'string') return seconds;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, 0)}`;
  };

  const getRelevanceColor = (score) => {
    if (score >= 0.9) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    if (score >= 0.7) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 0.5) return 'text-amber-600 bg-amber-100 border-amber-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      family: '👨‍👩‍👧‍👦',
      adventure: '🏔️',
      creative: '🎨',
      community: '🤝',
      nature: '🌿',
      sports: '⚽',
      learning: '📚',
      travel: '✈️'
    };
    return icons[category] || '🎬';
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    const sorted = [...searchResults].sort((a, b) => {
      switch (newSortBy) {
        case 'relevance':
          return (b.relevance || 0) - (a.relevance || 0);
        case 'date':
          return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        default:
          return 0;
      }
    });
    setSearchResults(sorted);
  };

  const handleWatchNow = (videoId) => {
    window.open(`http://127.0.0.1:5000/video/${videoId}`, '_blank');
    const sessionId = (()=>{ try { return localStorage.getItem('sessionId') || (localStorage.setItem('sessionId', crypto.randomUUID()), localStorage.getItem('sessionId')); } catch { return ''; } })();
    fetch(`/api/videos/${videoId}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })() }, body: JSON.stringify({ sessionId }) })
      .then(r => r.json())
      .then(data => {
        setVideoStats(prev => ({ ...prev, [videoId]: { ...(prev[videoId] || {}), views: data.views || ((prev[videoId]?.views||0)+1) } }));
      })
      .catch(() => {
        setVideoStats(prev => ({ ...prev, [videoId]: { ...(prev[videoId] || {}), views: (prev[videoId]?.views||0)+1 } }));
      });
  };

  const handleViewDetails = async (videoId, videoData) => {
    try {
      setSelectedVideo({ ...videoData, videoId });
      setShowVideoDetails(true);
      
      try {
        const response = await fetch(`/api/videos/${videoId}/stats`);
        if (response.ok) {
          const stats = await response.json();
          setVideoStats(prev => ({ ...prev, [videoId]: stats }));
        } else {
          console.warn('Failed to load video stats');
        }
      } catch (error) {
        console.error('Error loading video stats:', error);
      }
    } catch (error) {
      console.error('Error opening video details:', error);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const uid = (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })();
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': uid
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(prev => prev.map(result => 
          result.videoId === videoId 
            ? { ...result, likes: data.likeCount }
            : result
        ));
        setVideoStats(prev => ({ 
          ...prev, 
          [videoId]: { ...prev[videoId], likes: data.likeCount }
        }));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Video Search"
      size="full"
    >
      <div className="space-y-10">
        {/* Premium Search Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-28 h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Globe className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div 
              className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
          <motion.h2 
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Search Humanity's Collective Memory
          </motion.h2>
          <motion.p 
            className="text-gray-600 max-w-4xl mx-auto text-xl leading-relaxed font-light"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Discover stories, moments, and experiences from people around the world. 
            Every video uploaded becomes part of our shared human story - a "light mirror" 
            showcasing the best of humanity.
          </motion.p>
        </motion.div>

        {/* Premium Search Bar */}
        <motion.div 
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center p-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Search className="ml-5 w-7 h-7 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                </motion.div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for any moment, story, or experience across all uploaded footage..."
                  className="flex-1 px-6 py-5 text-xl border-none outline-none bg-transparent placeholder-gray-400 focus:placeholder-gray-300 transition-colors duration-300 font-light"
                />
                <div className="flex gap-4 mr-3">
                  <motion.button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                      showFilters 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg border border-blue-500' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md border border-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </motion.button>
                  <motion.button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center gap-3 relative overflow-hidden border border-blue-500"
                    whileHover={!isSearching ? { scale: 1.05 } : {}}
                    whileTap={!isSearching ? { scale: 0.95 } : {}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex items-center gap-3">
                      {isSearching ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Search
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <motion.div 
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Searches
            </h3>
            <div className="flex flex-wrap gap-3">
              {recentSearches.map((search, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
                  className="px-4 py-2 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-sm font-medium transition-all duration-300 border border-gray-200 hover:border-blue-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  {search}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Premium Trending Searches */}
        <motion.div 
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Trending Searches
            </h3>
            <p className="text-gray-600 text-lg">Discover what others are searching for</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingSearches.map((trend, index) => (
              <motion.button
                key={index}
                onClick={() => handleTrendingClick(trend)}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-gradient-to-br from-white via-blue-50 to-indigo-50 hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 p-6 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-500 hover:shadow-xl relative overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <motion.div 
                    className="text-3xl mb-3"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                  >
                    {trend.icon}
                  </motion.div>
                  <div className="font-semibold text-gray-800 group-hover:text-blue-800 transition-colors mb-2">
                    {trend.term}
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors font-medium">
                    {trend.count} searches
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Premium Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-6xl mx-auto bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 shadow-xl backdrop-blur-sm"
            >
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                <Filter className="w-5 h-5 text-blue-600" />
                Advanced Search Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Duration</label>
                  <div className="relative group">
                    <select
                      value={filters.duration}
                      onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/80 hover:border-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="all">Any Duration</option>
                      <option value="short">Short (< 1 min)</option>
                      <option value="medium">Medium (1-5 min)</option>
                      <option value="long">Long (> 5 min)</option>
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Date Range</label>
                  <div className="relative group">
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/80 hover:border-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="all">Any Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                  <div className="relative group">
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/80 hover:border-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="family">Family & Friends</option>
                      <option value="adventure">Adventure & Travel</option>
                      <option value="creative">Creative & Art</option>
                      <option value="community">Community & Events</option>
                      <option value="nature">Nature & Outdoors</option>
                      <option value="sports">Sports & Fitness</option>
                      <option value="learning">Learning & Education</option>
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">User Type</label>
                  <div className="relative group">
                    <select
                      value={filters.userType}
                      onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/80 hover:border-blue-400 appearance-none cursor-pointer"
                    >
                      <option value="all">All Users</option>
                      <option value="verified">Verified Creators</option>
                      <option value="community">Community Members</option>
                      <option value="featured">Featured Contributors</option>
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Tags</label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="e.g., family, nature, art"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 bg-white/80 hover:border-blue-400"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Search Results */}
        {searchResults.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="flex items-center justify-between mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Search Results ({searchResults.length})
                </h3>
                <p className="text-gray-600 text-lg">Discovering stories from around the world</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500">Sort by:</span>
                <div className="relative group">
                  <select 
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white hover:border-blue-400 transition-all duration-300 appearance-none cursor-pointer font-medium"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="duration">Duration</option>
                    <option value="views">Views</option>
                    <option value="likes">Likes</option>
                  </select>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group hover:-translate-y-2 hover:border-blue-300"
                >
                  {/* Premium Video Thumbnail */}
                  <div className="relative h-56 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    {result.thumbnail ? (
                      <img 
                        src={`/thumbnail/${result.id}`} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${result.thumbnail ? 'hidden' : 'flex'}`}>
                      {result.thumbnail || '🎬'}
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-2 bg-black/80 backdrop-blur-sm text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg">
                        {getCategoryIcon(result.category)} {result.category || 'general'}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-2 rounded-xl text-sm font-semibold border shadow-lg backdrop-blur-sm ${getRelevanceColor(result.relevance || 0)}`}>
                        {((result.relevance || 0) * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <span className="px-3 py-2 bg-black/80 backdrop-blur-sm text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg">
                        <Clock className="w-3 h-3" />
                        {formatDuration(result.duration)}
                      </span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Premium Video Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="font-bold text-gray-900 text-xl line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                        {result.title || 'Untitled Video'}
                      </h4>
                      <p className="text-gray-700 line-clamp-3 leading-relaxed">
                        {result.transcript || 'No transcript available'}
                      </p>
                    </div>
                    
                    {/* Enhanced User & Stats */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {(result.user || 'Y').charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">{result.user || 'You'}</span>
                          <div className="text-xs text-gray-500">{result.uploadDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                          <Eye className="w-4 h-4" />
                          {videoStats[result.videoId]?.views || result.views || 0}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                          <Heart className="w-4 h-4" />
                          {videoStats[result.videoId]?.likes || result.likes || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Premium Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(result.tags || []).slice(0, 4).map((tag, tagIndex) => (
                        <motion.span
                          key={tagIndex}
                          className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                      {(result.tags || []).length > 4 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                          +{(result.tags || []).length - 4} more
                        </span>
                      )}
                    </div>
                    
                    {/* Premium Action Buttons */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleWatchNow(result.videoId)}
                        className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group-hover:scale-105"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Watch Now
                      </button>
                      <motion.button 
                        onClick={() => handleViewDetails(result.videoId, result)}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye className="w-5 h-5" />
                      </motion.button>
                      <motion.button 
                        onClick={() => handleLike(result.videoId)}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-300 hover:scale-105 shadow-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Heart className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced No Results */}
        {searchQuery && searchResults.length === 0 && !isSearching && !searchError && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No results found</h3>
            <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              Clear Search
            </button>
          </motion.div>
        )}

        {/* Enhanced Error State */}
        {searchError && (
          <motion.div 
            className="max-w-4xl mx-auto bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium">{searchError}</p>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isSearching && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching the collective memory...</h3>
            <p className="text-gray-600">Analyzing millions of videos to find your perfect match</p>
          </motion.div>
        )}

        {/* Enhanced Vision Statement */}
        <motion.div 
          className="max-w-5xl mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-3xl border border-blue-200 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-4 mb-4">
             <Sparkles className="w-6 h-6 text-blue-600" />
            <h4 className="font-bold text-blue-900 text-xl">The Power of Collective Memory</h4>
           </div>
          <p className="text-blue-800 leading-relaxed text-lg">
            Every search you make helps build a more connected world. By searching through humanity's collective footage, 
            you're discovering stories that might otherwise remain hidden, connecting with experiences from around the globe, 
            and contributing to a repository of human excellence that future generations can explore and learn from.
          </p>
        </motion.div>
      </div>
      
      <VideoDetailsModal
        isOpen={showVideoDetails}
        onClose={() => setShowVideoDetails(false)}
        videoId={selectedVideo?.videoId}
        videoData={selectedVideo}
      />
    </Modal>
  );
};

export default GlobalSearch;
