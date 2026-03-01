# Complete Testing Guide - Local Machine

## Prerequisites

1. ✅ Backend running on `http://localhost:8000`
2. ✅ MySQL database running
3. ✅ Ollama running with llama3.1:8b model
4. ✅ Firebase project created

## Step-by-Step Testing

### Part 1: Backend Setup (5 minutes)

```bash
# Terminal 1 - Start Backend
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Start backend
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Part 2: Frontend Setup (3 minutes)

```bash
# Terminal 2 - Start Frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm start
```

Browser will automatically open at `http://localhost:3000`

### Part 3: Firebase Configuration (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable Authentication → Email/Password
4. Go to Project Settings → General
5. Scroll to "Your apps" → Web app
6. Copy the config object
7. Paste into `frontend/src/firebase.js`

### Part 4: Testing Flow (10 minutes)

#### Test 1: User Registration

1. Open `http://localhost:3000`
2. Click "Sign Up"
3. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Organization ID: `org_demo`
4. Click "Sign Up"
5. ✅ Should redirect to dashboard

#### Test 2: Document Upload

1. Create a test document `test_doc.txt`:
```
Company Policy Document

Remote Work Policy:
Employees can work remotely up to 3 days per week.
All remote workers must be available during core hours (10 AM - 3 PM).

Leave Policy:
Annual leave: 20 days per year
Sick leave: 10 days per year
Employees must submit leave requests 2 weeks in advance.

Equipment Policy:
Company provides laptop and monitor.
Personal devices are not allowed for work.
```

2. Go to "Documents" tab
3. Click "Choose File" → Select `test_doc.txt`
4. Wait for upload (should see success message)
5. ✅ Document appears in list with status "processing" → "completed"

#### Test 3: Query Processing

1. Go to "Query" tab
2. Enter query: `What is the remote work policy?`
3. Click "Submit Query"
4. Wait for response (5-10 seconds)
5. ✅ Should see:
   - AI-generated response
   - Decision analysis
   - Confidence score
   - Context documents used

Example queries to try:
- `How many days of annual leave do employees get?`
- `What equipment does the company provide?`
- `What are the core working hours?`

#### Test 4: View History

1. Go to "History" tab
2. ✅ Should see all previous queries and responses
3. Check timestamps

#### Test 5: Check Logs

1. Go to "Logs" tab
2. ✅ Should see agent execution logs:
   - parsing agent
   - embedding agent
   - reasoning agent
   - action agent
3. Check execution times
4. Click "🔄 Refresh" to update

### Part 5: Verify Backend Directly (Optional)

Test backend API directly with curl:

```bash
# Health check
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

## Common Issues & Solutions

### Issue 1: Backend Not Starting

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue 2: Database Connection Error

**Error:** `Can't connect to MySQL server`

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p -e "SHOW DATABASES;"

# Create database if needed
mysql -u root -p -e "CREATE DATABASE agentic_ai;"
```

### Issue 3: Ollama Not Responding

**Error:** `Connection refused to localhost:11434`

**Solution:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
# Windows: Start from system tray
# Linux: systemctl start ollama

# Pull model if needed
ollama pull llama3.1:8b
```

### Issue 4: Frontend CORS Error

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
Backend should already have CORS enabled. Check `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should be present
    ...
)
```

### Issue 5: Firebase Authentication Error

**Error:** `Firebase: Error (auth/invalid-api-key)`

**Solution:**
1. Check `frontend/src/firebase.js` has correct config
2. Verify Firebase project exists
3. Ensure Email/Password auth is enabled in Firebase Console

### Issue 6: Document Upload Fails

**Error:** `401 Unauthorized`

**Solution:**
1. Logout and login again (token may be expired)
2. Check Firebase token is being sent
3. Check backend logs for detailed error

### Issue 7: Query Takes Too Long

**Possible causes:**
- Ollama model not loaded (first query loads model)
- CPU is busy
- Large document chunks

**Solution:**
- Wait for first query (30-60 seconds)
- Subsequent queries should be faster (5-10 seconds)
- Check backend logs for performance metrics

## Performance Expectations

| Operation | Expected Time |
|-----------|--------------|
| Document Upload | 1-2 seconds |
| Document Processing | 5-15 seconds |
| First Query | 30-60 seconds (model loading) |
| Subsequent Queries | 5-10 seconds |
| Agent Logs Load | < 1 second |

## Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend opens in browser
- [ ] Can sign up new user
- [ ] Can login existing user
- [ ] Can upload document
- [ ] Document status changes to "completed"
- [ ] Can submit query
- [ ] Query returns response
- [ ] Response includes decision analysis
- [ ] Query appears in history
- [ ] Agent logs show execution
- [ ] Can logout and login again

## Testing Multiple Users

1. Open browser in incognito/private mode
2. Sign up with different email: `user2@example.com`
3. Use different organization: `org_test`
4. Upload different documents
5. Verify data isolation (users can't see each other's docs)

## Testing on Same Machine, Different Browser

1. Keep backend running
2. Open different browser (Chrome, Firefox, Edge)
3. Go to `http://localhost:3000`
4. Login with same or different account
5. ✅ Should work independently

## Monitoring During Testing

### Terminal 1 (Backend)
Watch for:
- API requests being logged
- Agent execution logs
- Any error messages

### Terminal 2 (Frontend)
Watch for:
- Compilation messages
- Hot reload notifications

### Browser Console (F12)
Watch for:
- Network requests (should be 200 OK)
- Console errors (should be none)
- API responses

## Sample Test Data

### test_policy.txt
```
Employee Handbook 2024

Work Schedule:
- Standard hours: 9 AM to 5 PM
- Lunch break: 1 hour
- Flexible hours available with approval

Benefits:
- Health insurance: Full coverage
- Dental insurance: 80% coverage
- Vision insurance: Available
- 401k matching: Up to 5%

Performance Reviews:
- Conducted quarterly
- Based on KPIs and peer feedback
- Salary adjustments considered annually
```

### test_queries.txt
```
1. What are the standard working hours?
2. What health benefits are provided?
3. How often are performance reviews conducted?
4. What is the 401k matching percentage?
5. Is flexible work schedule available?
```

## Success Criteria

✅ **System is working correctly if:**
1. All components start without errors
2. User can sign up and login
3. Documents can be uploaded and processed
4. Queries return relevant responses
5. Agent logs show execution details
6. No CORS or authentication errors
7. Response times are reasonable

## Next Steps After Testing

1. **Test with real documents** - Upload actual company documents
2. **Test complex queries** - Ask multi-part questions
3. **Test edge cases** - Empty queries, large files, etc.
4. **Monitor performance** - Check execution times in logs
5. **Test on LAN** - Access from another device on same network

## Getting Help

If you encounter issues:

1. **Check logs:**
   - Backend: `backend/logs/app.log`
   - Frontend: Browser console (F12)

2. **Check documentation:**
   - `backend/README.md`
   - `frontend/README.md`
   - `backend/TROUBLESHOOTING.md`

3. **Verify prerequisites:**
   - Python 3.11+
   - Node.js 16+
   - MySQL 8.0+
   - Ollama with llama3.1:8b

4. **Restart everything:**
   ```bash
   # Stop all services
   # Restart MySQL
   # Restart Ollama
   # Restart backend
   # Restart frontend
   ```

## Demo Script for Presentation

1. **Show login** (30 seconds)
2. **Upload document** (1 minute)
3. **Ask 2-3 questions** (2 minutes)
4. **Show agent logs** (30 seconds)
5. **Show query history** (30 seconds)

Total: ~5 minutes

Good luck with testing! 🚀
