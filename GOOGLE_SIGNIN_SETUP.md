# Google Sign-In Setup Guide

## To get proper Google Sign-In working:

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add these to "Authorized JavaScript origins":
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```
5. Copy your Client ID

### 3. Configure Your App
1. Create a `.env` file in the frontend directory
2. Add your Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

### 4. Update the Code
Replace the hardcoded client ID in `src/pages/Home.jsx` with:
```javascript
const workingClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id-here.apps.googleusercontent.com';
```

### 5. Test
1. Restart your development server
2. Click "Continue with Google"
3. You should see the real Google account selection

## Current Status
The app is using a demo client ID that may not work for all users. Follow the steps above to set up your own Google OAuth credentials for proper functionality.
