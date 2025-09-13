# Google OAuth Setup for Footage Flow

## Your Project Details
- **Project ID**: `footage-flow-468712`
- **Service Account**: `footage-flow-service@footage-flow-468712.iam.gserviceaccount.com`

## Step 1: Create OAuth 2.0 Web Client Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **footage-flow-468712**
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
5. Choose **"Web application"**
6. Configure the OAuth consent screen if prompted

## Step 2: Configure Authorized Origins

In the OAuth client configuration, add these **Authorized JavaScript origins**:
```
http://localhost:5173
http://127.0.0.1:5173
```

## Step 3: Get Your Client ID

After creating the OAuth client, you'll get a Client ID that looks like:
```
123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## Step 4: Configure Your App

1. Create a `.env` file in the `frontend` directory:
```bash
cd frontend
touch .env
```

2. Add your OAuth Client ID to the `.env` file:
```
VITE_GOOGLE_CLIENT_ID=your-oauth-client-id-here.apps.googleusercontent.com
```

## Step 5: Test

1. Restart your development server:
```bash
npm run dev
```

2. Click "Continue with Google" - you should see the real Google account picker

## Important Notes

- **Service Account vs OAuth Client**: Your current `google-credentials.json` is a service account (for backend/server use). We need OAuth 2.0 Web Client credentials for frontend Google Sign-In.
- **Authorized Origins**: Make sure `localhost:5173` is added to authorized origins
- **OAuth Consent Screen**: You may need to configure the OAuth consent screen in Google Cloud Console

## Troubleshooting

If you get CORS errors:
1. Double-check that `http://localhost:5173` is in authorized origins
2. Make sure you're using the OAuth Client ID, not the service account client ID
3. Verify the `.env` file is in the `frontend` directory
4. Restart your development server after adding the `.env` file
