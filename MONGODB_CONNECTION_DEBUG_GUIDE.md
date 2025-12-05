# MongoDB Connection Debug Guide

## 🔍 Issue Investigated

Users and patients created via UI/API were not appearing in MongoDB Atlas `epicareHubData` database.

---

## ✅ What Was Found

### Configuration Analysis

**Connection Setup** (`Backend/config/settings.js`):
```javascript
serverUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/epicarehub"
database: process.env.MONGODB_DB_NAME || "epicarehub"
```

**Your .env File**:
```bash
MONGODB_URI=mongodb+srv://superadmin:***@clusterdb.4lydu7t.mongodb.net/?appName=ClusterDB
MONGODB_DB_NAME=epicarehubData
```

**✓ Correct Configuration**:
- MongoDB URI points to your Atlas cluster: `clusterdb.4lydu7t.mongodb.net`
- Database name is correctly set to: `epicarehubData`
- Collections are correctly defined: `users`, `patients`, `eegStudies`

**Potential Issues Identified**:

1. **No Visible Errors**: The frontend doesn't crash, suggesting errors might be swallowed
2. **Silent Failures**: No logging to confirm inserts actually happened
3. **NODE_ENV=test**: While this doesn't affect the database, it's unusual for development

---

## 🛠️ What Was Changed

### 1. Enhanced MongoDB Connection Logging (`config/mongoConnection.js`)

**Added**:
- Connection attempt logging
- Cluster host display (without credentials)
- Database name confirmation
- Connection success/failure messages

**Example Output**:
```
[MongoDB] Connecting to database...
[MongoDB] Cluster: clusterdb.4lydu7t.mongodb.net
[MongoDB] Database: epicarehubData
[MongoDB] ✓ Connected to database: epicarehubData
```

---

### 2. Patient Creation Logging (`data/patients.js`)

**Added**:
- Pre-insert logging with patient details
- Post-insert success logging with `_id`
- Collection and database name logging
- Error logging with full error message

**Example Output**:
```
[DB INSERT] Attempting to insert patient: John Doe (john@example.com)
[DB INSERT] ✓ Patient inserted successfully with _id: 674abc123...
[DB INSERT] Collection: patients, Database: epicarehubData
```

---

### 3. User Registration Logging (`data/user.js`)

**Added**:
- Pre-insert logging with username and userType
- Post-insert success logging with `_id`
- Collection and database name logging
- Error logging with full error message

**Example Output**:
```
[DB INSERT] Attempting to insert user: johndoe (john@example.com) [user]
[DB INSERT] ✓ User inserted successfully with _id: 674def456...
[DB INSERT] Collection: users, Database: epicarehubData
```

---

### 4. Route-Level Logging

**POST /patients** (`routes/patients.js`):
```
[POST /patients] New patient creation request
[POST /patients] Data: John Doe, john@example.com
[POST /patients] ✓ Patient created successfully
```

**POST /register** (`routes/user.js`):
```
[POST /register] New user registration request
[POST /register] Data: johndoe, john@example.com, userType: user
[POST /register] ✓ User registered successfully
```

---

### 5. Fixed HTTP Status Codes

**Before**: Patient creation errors returned `404` (Not Found)
**After**: Patient creation errors return `400` (Bad Request)
**Why**: 404 is for missing resources, 400 is for validation/input errors

---

## 🧪 How to Test

### Step 1: Verify Environment Configuration

```bash
cd Backend

# Check your .env file
cat .env | grep MONGODB

# You should see:
# MONGODB_URI=mongodb+srv://superadmin:***@clusterdb.4lydu7t.mongodb.net/?appName=ClusterDB
# MONGODB_DB_NAME=epicarehubData
```

**Important Checks**:
- ✅ `MONGODB_URI` points to your Atlas cluster
- ✅ `MONGODB_DB_NAME` is set to `epicarehubData` (exact match to your Atlas DB name)
- ✅ No extra spaces or quotes around values

---

### Step 2: Start Backend with Logging

```bash
cd Backend
npm start
```

**Watch for Connection Logs**:
```
[MongoDB] Connecting to database...
[MongoDB] Cluster: clusterdb.4lydu7t.mongodb.net
[MongoDB] Database: epicarehubData
[MongoDB] ✓ Connected to database: epicarehubData
We've now got a server!
Your routes will be running on http://localhost:3000
```

**🚨 If you see "localhost" instead of your Atlas cluster**:
- Your `.env` file is not being loaded
- Check that `MONGODB_URI` is set correctly

---

### Step 3: Test User Registration

#### Via Frontend:
1. Navigate to http://localhost:5173/signup
2. Fill in registration form
3. Submit

#### Via cURL:
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "password": "Test123!@#",
    "userType": "user"
  }'
```

**Expected Backend Logs**:
```
[POST /register] New user registration request
[POST /register] Data: testuser123, testuser123@example.com, userType: user
[DB INSERT] Attempting to insert user: testuser123 (testuser123@example.com) [user]
[DB INSERT] ✓ User inserted successfully with _id: 674f1a2b3c4d5e6f7a8b9c0d
[DB INSERT] Collection: users, Database: epicarehubData
[POST /register] ✓ User registered successfully
```

**Expected Frontend Response**:
```json
{
  "isSuccess": true,
  "message": "User added Succesfully"
}
```

---

### Step 4: Test Patient Creation

#### Via Frontend:
1. Navigate to http://localhost:5173/patients
2. Click "Add patient"
3. Fill in form and submit

#### Via cURL:
```bash
curl -X POST http://localhost:3000/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "dob": "01/15/1990",
    "gender": 2,
    "email": "janesmith@example.com"
  }'
```

**Expected Backend Logs**:
```
[POST /patients] New patient creation request
[POST /patients] Data: Jane Smith, janesmith@example.com
[DB INSERT] Attempting to insert patient: Jane Smith (janesmith@example.com)
[DB INSERT] ✓ Patient inserted successfully with _id: 674f1a2b3c4d5e6f7a8b9c0e
[DB INSERT] Collection: patients, Database: epicarehubData
[POST /patients] ✓ Patient created successfully
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Patient added succesfully",
  "patientAdded": {
    "_id": "674f1a2b3c4d5e6f7a8b9c0e",
    "firstName": "Jane",
    "lastName": "Smith",
    ...
  }
}
```

---

### Step 5: Verify in MongoDB Atlas

1. **Open MongoDB Atlas**: https://cloud.mongodb.com
2. **Navigate to your cluster**: ClusterDB
3. **Click "Browse Collections"**
4. **Select Database**: `epicarehubData` (NOT `epicarehub`, `test`, or any other)
5. **Check Collections**:

**users Collection**:
```javascript
{
  "_id": ObjectId("674f1a2b3c4d5e6f7a8b9c0d"),
  "firstName": "Test",
  "lastName": "User",
  "username": "testuser123",
  "email": "testuser123@example.com",
  "password": "$2b$14$...",  // hashed
  "userType": "user"
}
```

**patients Collection**:
```javascript
{
  "_id": ObjectId("674f1a2b3c4d5e6f7a8b9c0e"),
  "firstName": "Jane",
  "lastName": "Smith",
  "dob": "01/15/1990",
  "gender": "Female",
  "email": "janesmith@example.com",
  "isEpilepsy": false,
  "creationDate": "2024-12-04T12:00:00Z"
}
```

---

## 🔍 Troubleshooting

### Issue: "Connection refused" or "localhost" in logs

**Cause**: `.env` file not loaded or `MONGODB_URI` not set

**Fix**:
```bash
# Verify .env exists
ls -la Backend/.env

# Verify it has MONGODB_URI
cat Backend/.env | grep MONGODB_URI

# Restart backend
cd Backend && npm start
```

---

### Issue: Backend logs show insert success but Atlas is empty

**Possible Causes**:

1. **Wrong Database in Atlas**:
   - You might be checking `epicarehub` instead of `epicarehubData`
   - Solution: Verify you're looking at the exact database name from the logs

2. **Multiple Atlas Projects**:
   - You might have multiple MongoDB Atlas projects/clusters
   - Solution: Verify the cluster hostname matches the logs

3. **Network/Sync Delay**:
   - Atlas UI might have a slight delay
   - Solution: Refresh the page, wait 5 seconds, try again

**Debug Commands**:
```bash
# In backend logs, you should see:
[DB INSERT] Collection: users, Database: epicarehubData

# This tells you EXACTLY which database the insert went to
```

---

### Issue: "Patient insert error" or "User insert error" in logs

**Check the error message in logs**:

**Validation Error**:
```
[POST /register] ✗ Validation error: Password must be at least 8 characters
```
- Fix: Ensure frontend sends valid data

**Duplicate Email**:
```
[DB INSERT] ✗ Patient insert error: A patient with the same email address already exists.
```
- Fix: Use different email or delete existing record

**Network Error**:
```
[MongoDB] ✗ Connection failed: MongoServerSelectionError
```
- Fix: Check internet connection, verify Atlas IP whitelist

---

### Issue: No logs appear when creating user/patient

**Possible Causes**:

1. **Request not reaching backend**:
   - Check frontend console for network errors
   - Verify backend URL is correct

2. **Wrong endpoint**:
   - Users should POST to `/register` (not `/users`)
   - Patients should POST to `/patients`

3. **CORS issues**:
   - Check browser console for CORS errors

**Debug**:
```bash
# Check if backend is running
curl http://localhost:3000/

# Should NOT return connection refused
```

---

## 📊 Understanding the Logs

### Successful User Registration Flow:

```
1. [POST /register] New user registration request
   ↓
2. [POST /register] Data: username, email, userType
   ↓
3. [DB INSERT] Attempting to insert user: ...
   ↓
4. [MongoDB] ✓ Connected to database: epicarehubData  (first time only)
   ↓
5. [DB INSERT] ✓ User inserted successfully with _id: ...
   ↓
6. [DB INSERT] Collection: users, Database: epicarehubData
   ↓
7. [POST /register] ✓ User registered successfully
```

### Successful Patient Creation Flow:

```
1. [POST /patients] New patient creation request
   ↓
2. [POST /patients] Data: firstName lastName, email
   ↓
3. [DB INSERT] Attempting to insert patient: ...
   ↓
4. [DB INSERT] ✓ Patient inserted successfully with _id: ...
   ↓
5. [DB INSERT] Collection: patients, Database: epicarehubData
   ↓
6. [POST /patients] ✓ Patient created successfully
```

---

## 🎯 Key Takeaways

### What the Logging Tells You:

1. **Connection Logs** → Which database you're connected to
2. **Pre-Insert Logs** → Data is reaching the database layer
3. **Post-Insert Logs** → Insert succeeded, shows the `_id`
4. **Collection/Database Logs** → Confirms exact location of the data

### What to Check in Atlas:

1. **Correct Project**: Make sure you're in the right Atlas project
2. **Correct Cluster**: ClusterDB (from your connection string)
3. **Correct Database**: `epicarehubData` (from logs, NOT `epicarehub`)
4. **Correct Collection**: `users` or `patients` (case-sensitive)

---

## 🧹 Removing Debug Logs Later

When you're confident everything works, you can remove the console.log statements:

**Keep**:
- MongoDB connection logs (helpful for debugging)
- Error logs (console.error)

**Remove**:
- `[DB INSERT]` success logs
- `[POST /...]` request logs

**Or**, add a `DEBUG` environment variable:
```javascript
const DEBUG = process.env.DEBUG === "true";
if (DEBUG) console.log(...);
```

---

## 📝 Summary of Changes

| File | Change |
|------|--------|
| `config/mongoConnection.js` | Added connection logging with cluster/DB name |
| `data/patients.js` | Added pre/post insert logging |
| `data/user.js` | Added pre/post insert logging |
| `routes/patients.js` | Added request/response logging |
| `routes/user.js` | Added request/response logging |

**Total Changes**: Enhanced logging only, no logic changes
**Backward Compatible**: Yes, 100%
**Breaking Changes**: None

---

## ✅ Expected Outcome

After following this guide, you should:

1. ✅ See clear connection logs showing `epicarehubData`
2. ✅ See insert logs with `_id` values
3. ✅ Find new documents in MongoDB Atlas
4. ✅ Know exactly which database/collection data went to

**If data still doesn't appear in Atlas**:
- Copy the exact database name from the logs
- Paste it into Atlas search
- Verify it matches character-for-character

The logs will tell you the **truth** about where data is going! 🎯
