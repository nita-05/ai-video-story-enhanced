import React, { useEffect, useState } from 'react';
import Modal from './Modal';

const { VITE_BACKEND_URL } = import.meta.env;
const API_BASE = (typeof VITE_BACKEND_URL === 'string' && VITE_BACKEND_URL.trim()) ? VITE_BACKEND_URL.trim() : '';

const ResultsViewer = ({ isOpen, onClose, videoId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!isOpen || !videoId) return;
      setLoading(true); setError(''); setData(null);
      try {
        const uid = (() => { try { return (JSON.parse(localStorage.getItem('user')||'{}').userId)||''; } catch { return ''; } })();
        if (!uid) { setError('Not signed in'); setLoading(false); return; }
        const res = await fetch(`${API_BASE}/results/${videoId}`, {
          credentials: 'include',
          headers: { 'X-User-Id': uid }
        });
        if (!res.ok) {
          const err = await res.json().catch(()=>({}));
          throw new Error(err?.error || 'Failed to load results');
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={videoId ? `Results (${videoId})` : 'Results'} size="lg">
      <div className="p-4 space-y-4">
        {error && <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}
        {loading && <div className="text-gray-600">Loading...</div>}
        {(!loading && data) && (
          <>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Transcript</h4>
              <div className="bg-gray-50 p-3 rounded text-gray-800 max-h-60 overflow-y-auto">{data.transcript || 'No transcript'}</div>
            </div>
            {Array.isArray(data.segments) && data.segments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Timeline</h4>
                <div className="bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                  {data.segments.map((s, i) => (
                    <div key={i} className="text-sm text-gray-600 mb-1">
                      <span className="font-mono text-gray-500">[{Number(s.start_time).toFixed(2)}s - {Number(s.end_time).toFixed(2)}s]</span>
                      <span className="ml-2">{s.word}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Visual Tags</h4>
              <div className="flex flex-wrap gap-2">
                {(data.tags || []).map((t, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{t}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ResultsViewer;


