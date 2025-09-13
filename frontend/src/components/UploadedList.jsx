import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import ResultsViewer from './ResultsViewer';

const { VITE_BACKEND_URL } = import.meta.env;
const API_BASE = (typeof VITE_BACKEND_URL === 'string' && VITE_BACKEND_URL.trim()) ? VITE_BACKEND_URL.trim() : '';

const UploadedList = ({ isOpen, onClose }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [viewVideoId, setViewVideoId] = useState('');
  const [analysisVideoId, setAnalysisVideoId] = useState('');

  const fetchVideos = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/my/videos`, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || (res.status === 401 ? 'Unauthorized' : 'Failed to load uploads'));
      }
      const data = await res.json();
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (e) {
      setError(e.message || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) fetchVideos(); }, [isOpen]);

  const handleDelete = async (videoId) => {
    if (!confirm('Delete this video and its analysis?')) return;
    setDeletingId(videoId);
    try {
      const res = await fetch(`${API_BASE}/my/videos/${videoId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Delete failed');
      setVideos(videos.filter(v => v.videoId !== videoId));
    } catch (e) {
      alert(e.message || 'Delete failed');
    } finally {
      setDeletingId('');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Footage" size="lg">
      <div className="p-4">
        {error && <div className="mb-3 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {videos.length === 0 ? (
              <div className="text-center text-gray-600">No uploads yet.</div>
            ) : videos.map(v => (
              <div key={v.videoId} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                    <img alt="thumb" src={v?.thumbnails?.default ? `${API_BASE}/${v.thumbnails.default}` : ''} onError={(e)=>{e.currentTarget.style.display='none';}} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{v.originalName || v.filename}</div>
                    <div className="text-xs text-gray-500">ID: {v.videoId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`${API_BASE}/video/${v.videoId}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 underline">Open video</a>
                  <button onClick={()=>setAnalysisVideoId(v.videoId)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">View analysis</button>
                  <button onClick={() => handleDelete(v.videoId)} disabled={deletingId===v.videoId} className={`text-sm px-3 py-1 rounded ${deletingId===v.videoId?'bg-gray-400':'bg-red-600 hover:bg-red-700'} text-white`}>
                    {deletingId===v.videoId? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* No inline player; videos open in a new tab. */}
      {/* Analysis modal */}
      {analysisVideoId && (
        <ResultsViewer isOpen={true} onClose={()=>setAnalysisVideoId('')} videoId={analysisVideoId} />
      )}
    </Modal>
  );
};

export default UploadedList;


