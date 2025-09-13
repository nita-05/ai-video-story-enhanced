import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { VITE_BACKEND_URL } from '../googleConfig';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    const err = params.get('error');
    if (err) {
      setError(err);
      return;
    }
    if (!idToken) {
      setError('Missing id_token in callback');
      return;
    }
    (async () => {
      try {
        console.log('Processing Google callback with token:', idToken.substring(0, 20) + '...');
        const googleResponse = await axios.post(`${VITE_BACKEND_URL}/auth/google`, { credential: idToken }, { withCredentials: true });
        console.log('Google auth response:', googleResponse.data);
        
        const me = await axios.get(`${VITE_BACKEND_URL}/auth/me`, { withCredentials: true });
        console.log('Auth me response:', me.data);
        
        if (me.data?.authenticated && me.data.user) {
          console.log('Google login successful, user data:', me.data.user);
          try { localStorage.setItem('user', JSON.stringify(me.data.user)); } catch {}
          navigate('/');
        } else {
          console.log('Session not established, response:', me.data);
          setError('Session not established');
        }
      } catch (e) {
        console.log('Google login error:', e);
        setError('Google login failed');
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded-xl border border-gray-200">
        <p className="text-lg font-semibold">Signing you in…</p>
        {error ? <p className="text-red-600 mt-2">{error}</p> : null}
      </div>
    </div>
  );
};

export default GoogleCallback;


