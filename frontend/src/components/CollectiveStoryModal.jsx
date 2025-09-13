import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  Users, 
  Heart, 
  Globe, 
  Zap,
  Play,
  Download,
  AlertCircle
} from 'lucide-react';

const CollectiveStoryModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('positive');
  const [limit, setLimit] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const uid = (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })();
      const response = await fetch('/collective-generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          query: query.trim() || undefined,
          prompt: prompt.trim() || undefined,
          mode,
          limit: parseInt(limit)
        })
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      if (!response.ok) {
        if (isJson) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to generate collective story');
        } else {
          const text = await response.text().catch(() => '');
          throw new Error(text || 'Failed to generate collective story');
        }
      }

      const data = isJson ? await response.json().catch(() => ({})) : {};
      if (!data?.success) {
        throw new Error(data?.error || 'Story generation failed');
      }

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const playNarration = (text) => {
    if (!text) return;
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsPlaying(true);
        
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
        
        chunks.forEach((c, idx) => {
          const u = new SpeechSynthesisUtterance(c);
          u.rate = 1.0; u.pitch = 1.0;
          if (idx === chunks.length - 1) {
            u.onend = () => setIsPlaying(false);
          }
          window.speechSynthesis.speak(u);
        });
      }
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const stopNarration = () => {
    try { 
      if (window.speechSynthesis) window.speechSynthesis.cancel(); 
    } catch (_) {}
    setIsPlaying(false);
  };

  const handleRender = async () => {
    if (!result) return;
    setIsRendering(true);
    setRenderUrl('');
    try {
      const uid = (()=>{ try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||'';} catch {return '';} })();
      const resp = await fetch('/render-collective-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': uid },
        body: JSON.stringify({
          storyId: result.storyId,
          sourceVideoIds: result.sourceVideoIds,
          scenes: result.scenes,
          fullNarration: result.fullNarration
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Render failed');
      setRenderUrl(data.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        className="text-center mb-8"
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
            className="w-20 h-20 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Users className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div 
            className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>
        <motion.h3 
          className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Create Stories from Humanity's Collective Memory
        </motion.h3>
        <motion.p 
          className="text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Search across all uploaded videos and generate a unified story that captures the essence of shared human experiences.
        </motion.p>
      </motion.div>

      {/* Enhanced Input Form */}
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" />
            Search Query (optional)
          </label>
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., family moments, travel adventures, creative projects"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300 hover:border-purple-400 bg-gray-50 focus:bg-white"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Story Prompt
          </label>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the story you want to create (e.g., 'A journey of human connection and growth', 'Celebrating moments of joy and triumph')"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300 resize-none hover:border-purple-400 bg-gray-50 focus:bg-white"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-purple-600" />
              Story Mode
            </label>
            <div className="relative group">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300 hover:border-purple-400 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="positive">Positive & Inspirational</option>
                <option value="neutral">Neutral & Documentary</option>
                <option value="contrast">Contrasting Perspectives</option>
              </select>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Max Videos to Include
            </label>
            <div className="relative group">
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300 hover:border-purple-400 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
              >
                <option value={3}>3 videos</option>
                <option value={5}>5 videos</option>
                <option value={10}>10 videos</option>
                <option value={20}>20 videos</option>
              </select>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </motion.div>
        </motion.div>

        {error && (
          <motion.div 
            className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden ${
            isGenerating
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-700 text-white hover:from-purple-700 hover:to-pink-800 shadow-lg hover:shadow-xl'
          }`}
          whileHover={!isGenerating ? { scale: 1.02 } : {}}
          whileTap={!isGenerating ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center gap-3">
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Collective Story...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate Collective Story
                <Zap className="w-5 h-5" />
              </>
            )}
          </div>
        </motion.button>
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Collective Story Generated
            </h4>
            <p className="text-purple-800 text-sm mb-4">
              Based on {result.sourceVideoIds?.length || 0} videos from humanity's collective memory
            </p>
            
            {result.summary && (
              <div className="mb-4">
                <h5 className="font-semibold text-purple-900 mb-2">Story Summary:</h5>
                <p className="text-purple-800 bg-white/50 p-3 rounded-lg">
                  {result.summary}
                </p>
              </div>
            )}

            {result.fullNarration && (
              <div className="mb-4">
                <h5 className="font-semibold text-purple-900 mb-2">Full Narration:</h5>
                <div className="bg-white/50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-purple-800 leading-relaxed">
                    {result.fullNarration}
                  </p>
                </div>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => playNarration(result.fullNarration)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isPlaying ? 'Playing...' : 'Play Narration'}
                  </button>
                  <button
                    onClick={stopNarration}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>
            )}

            {result.scenes && result.scenes.length > 0 && (
              <div>
                <h5 className="font-semibold text-purple-900 mb-2">Story Scenes:</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.scenes.map((scene, index) => (
                    <div key={index} className="bg-white/50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-purple-900">{scene.title}</span>
                        <span className="text-xs text-purple-600 font-mono">
                          {scene.start}s - {scene.end}s
                        </span>
                      </div>
                      <p className="text-sm text-purple-800">{scene.narration}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleRender}
                    disabled={isRendering}
                    className={`px-4 py-2 rounded-lg text-white ${isRendering ? 'bg-gray-400' : 'bg-pink-600 hover:bg-pink-700'}`}
                  >
                    {isRendering ? 'Rendering…' : 'Render Story'}
                  </button>
                  {renderUrl && (
                    <a href={renderUrl} target="_blank" rel="noreferrer" className="text-pink-700 underline">
                      Open Rendered Video
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Vision Statement */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="w-6 h-6 text-purple-600" />
          <h4 className="font-semibold text-purple-900">The Power of Collective Storytelling</h4>
        </div>
        <p className="text-purple-800 text-sm leading-relaxed">
          By generating stories from multiple videos across our platform, you're creating narratives that transcend 
          individual experiences. These collective stories showcase the shared human journey, connecting moments of 
          joy, growth, and connection from people around the world. Each story becomes a testament to our common 
          humanity and the beautiful diversity of human experience.
        </p>
      </div>
    </div>
  );
};

export default CollectiveStoryModal;
