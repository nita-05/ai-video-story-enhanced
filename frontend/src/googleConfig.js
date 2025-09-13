// Google Configuration (strictly use .env to avoid mismatches)
let localOverrideBackend = null
try {
  localOverrideBackend = localStorage.getItem('BACKEND_URL') || localStorage.getItem('VITE_BACKEND_URL') || null
} catch {}

// Use a working Google Client ID that supports localhost
// This is a demo client ID that should work with localhost development
export const VITE_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Check if we're in development and provide helpful instructions
if (typeof window !== 'undefined') {
  console.log('🔧 Development Mode: Google Sign-In Configuration');
  console.log('Current Origin:', window.location.origin);
  console.log('Current Client ID (.env):', VITE_GOOGLE_CLIENT_ID || '(empty)');
  // Expose for debugging in DevTools: window.__GOOGLE_CLIENT_ID and window.GOOGLE_CLIENT_ID
  try {
    window.__GOOGLE_CLIENT_ID = VITE_GOOGLE_CLIENT_ID;
    window.GOOGLE_CLIENT_ID = VITE_GOOGLE_CLIENT_ID;
  } catch {}
  console.log('If Google Sign-In fails, you need to:');
  console.log('1. Go to Google Cloud Console → APIs & Services → Credentials');
  console.log('2. Edit your OAuth 2.0 Client ID');
  console.log('3. Add these to "Authorized JavaScript origins":');
  console.log('   - http://localhost:5173');
  console.log('   - http://127.0.0.1:5173');
  console.log('4. Ensure VITE_GOOGLE_CLIENT_ID is set in frontend/.env, then restart dev server');
}

export const VITE_BACKEND_URL =
  localOverrideBackend || import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

// Validate required environment variables
if (!VITE_GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set. Create frontend/.env with your OAuth Web Client ID.');
}

if (!VITE_BACKEND_URL) {
  console.error('VITE_BACKEND_URL is not set');
}

export default {
  VITE_GOOGLE_CLIENT_ID,
  VITE_BACKEND_URL
};
