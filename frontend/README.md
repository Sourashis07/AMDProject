# Agentic AI Frontend

React-based frontend for the Enterprise Agentic AI System.

## Quick Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Firebase

Edit `src/firebase.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Get these from Firebase Console → Project Settings → General → Your apps

### 3. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

### 🔐 Authentication
- Sign up with email/password
- Login with existing account
- Firebase authentication integration
- Automatic token management

### 📄 Document Management
- Upload documents (txt, pdf, etc.)
- View all uploaded documents
- See processing status
- Track chunk count

### 💬 Query Interface
- Ask questions about your documents
- Get AI-generated responses
- View decision analysis
- See confidence scores
- Track context documents used

### 📜 Query History
- View past queries and responses
- Timestamp tracking
- Quick reference

### 📊 Agent Logs
- Real-time agent execution logs
- Performance metrics (execution time)
- Status tracking (success/error)
- Agent type filtering

## Usage

### First Time Setup

1. **Sign Up**
   - Click "Sign Up" on login page
   - Enter email, password, and organization ID
   - Default org ID: `org_demo`

2. **Upload Documents**
   - Go to "Documents" tab
   - Click "Choose File" and select a text file
   - Wait for processing to complete

3. **Ask Questions**
   - Go to "Query" tab
   - Type your question
   - Click "Submit Query"
   - View AI response and decision analysis

4. **Check Logs**
   - Go to "Logs" tab
   - See what agents did behind the scenes
   - Monitor performance

## API Configuration

The frontend connects to the backend at `http://localhost:8000` by default.

To change this, edit `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://YOUR_IP:8000';
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Deployment

### Serve Locally

```bash
npm install -g serve
serve -s build -p 3000
```

### Access from Other Devices

1. Find your local IP:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. Update API base URL in `src/services/api.js` to use your IP

3. Access from other devices:
   ```
   http://YOUR_IP:3000
   ```

## Troubleshooting

### CORS Errors
- Ensure backend CORS is configured to allow `http://localhost:3000`
- Backend should have `allow_origins=["*"]` in development

### Firebase Authentication Errors
- Check Firebase configuration in `src/firebase.js`
- Ensure Email/Password auth is enabled in Firebase Console
- Verify API keys are correct

### API Connection Errors
- Ensure backend is running on `http://localhost:8000`
- Check network connectivity
- Verify token is being sent in requests

### Document Upload Fails
- Check file size (backend may have limits)
- Ensure file is readable text format
- Check backend logs for errors

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── Login.js        # Login/Signup component
│   │   └── Dashboard.js    # Main dashboard
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── App.js              # Main app component
│   ├── index.js            # Entry point
│   ├── index.css           # Global styles
│   └── firebase.js         # Firebase config
├── package.json            # Dependencies
└── README.md              # This file
```

## Technologies Used

- **React 18** - UI framework
- **Firebase Auth** - Authentication
- **Axios** - HTTP client
- **React Scripts** - Build tooling

## Development Tips

### Hot Reload
Changes to source files automatically reload the browser.

### Console Logging
Open browser DevTools (F12) to see console logs and network requests.

### Testing API Calls
Use browser Network tab to inspect API requests and responses.

## Future Enhancements

- [ ] Real-time streaming responses
- [ ] File preview before upload
- [ ] Advanced search and filtering
- [ ] User profile management
- [ ] Dark mode
- [ ] Mobile responsive improvements
- [ ] PDF viewer integration
- [ ] Export query history
- [ ] Analytics dashboard

## Support

For issues, check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for API errors
4. Firebase Console for auth issues
