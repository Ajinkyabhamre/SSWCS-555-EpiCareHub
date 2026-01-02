# MongoDB Atlas-Only Configuration Guide

## Overview

**IMPORTANT**: EpiCareHub connects **ONLY** to MongoDB Atlas. There are **NO** localhost fallbacks.

If environment variables are missing or invalid, the application will **fail fast** with clear error messages at startup.

---

## Configuration

### Required Environment Variables

In `Backend/.env`, you **must** set:

```bash
# MongoDB Atlas Connection URI (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=ClusterDB

# MongoDB Database Name (REQUIRED)
MONGODB_DB_NAME=epicarehubData
```

### What Happens If Missing?

**If `MONGODB_URI` is not set:**
```
❌ [MongoDB Config] CRITICAL ERROR: MONGODB_URI is not set!
   Please set MONGODB_URI in your Backend/.env file
   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

   This app ONLY connects to MongoDB Atlas.
   There is NO localhost fallback.

Process exited with code 1
```

**If `MONGODB_DB_NAME` is not set:**
```
❌ [MongoDB Config] CRITICAL ERROR: MONGODB_DB_NAME is not set!
   Please set MONGODB_DB_NAME in your Backend/.env file
   Example: MONGODB_DB_NAME=epicarehubData

Process exited with code 1
```

---

## Startup Logs (Expected Behavior)

When you start the backend with valid Atlas credentials, you should see:

```bash
$ cd Backend && npm start

[MongoDB] Connecting to MongoDB Atlas...
[MongoDB] Host: clusterdb.4lydu7t.mongodb.net
[MongoDB] Database: epicarehubData
[MongoDB] ✓ Connected successfully to Atlas
[MongoDB] ✓ Database: epicarehubData

[DEBUG] Enabling /debug/* endpoints
We've now got a server!
Your routes will be running on http://localhost:3000
```

### Key Indicators of Success

1. **Host shows Atlas cluster**: `Host: clusterdb.4lydu7t.mongodb.net` (NOT `localhost`)
2. **Database name confirmed**: `Database: epicarehubData`
3. **Connection success message**: `✓ Connected successfully to Atlas`
4. **Debug endpoint enabled** (if NODE_ENV !== production)

---

## Verifying Database Connection at Runtime

### Using the Debug Endpoint

The backend provides a `/debug/db-info` endpoint (enabled in development/test environments) to verify the database connection at runtime.

**Request:**
```bash
curl http://localhost:3000/debug/db-info
```

**Expected Response:**
```json
{
  "database": "epicarehubData",
  "clusterHost": "clusterdb.4lydu7t.mongodb.net",
  "collections": ["users", "patients", "eegStudies"],
  "collectionStats": {
    "users": 5,
    "patients": 12,
    "eegStudies": 8
  },
  "timestamp": "2024-12-04T15:30:00.000Z"
}
```

### What This Tells You

- **`database`**: The exact database name your app is using
- **`clusterHost`**: The MongoDB Atlas cluster hostname (should NOT be `localhost`)
- **`collections`**: All collections in the database
- **`collectionStats`**: Document count for each collection
- **`timestamp`**: When this information was retrieved

**🚨 If you see `"clusterHost": "localhost"`** → Your `.env` file is not being loaded correctly!

---

## Testing the Atlas-Only Enforcement

### Test 1: Verify Fail-Fast Behavior

**Rename your `.env` file temporarily:**
```bash
cd Backend
mv .env .env.backup
npm start
```

**Expected Output:**
```
❌ [MongoDB Config] CRITICAL ERROR: MONGODB_URI is not set!
   Please set MONGODB_URI in your Backend/.env file
   ...
```

**Restore your `.env`:**
```bash
mv .env.backup .env
```

---

### Test 2: Verify Atlas Connection

**Start the backend:**
```bash
cd Backend
npm start
```

**Watch for Atlas cluster hostname in logs:**
```
[MongoDB] Host: clusterdb.4lydu7t.mongodb.net  ← MUST NOT be localhost!
```

---

### Test 3: Create a Test User

**Via cURL:**
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Atlas",
    "lastName": "Test",
    "username": "atlastest",
    "email": "atlastest@example.com",
    "password": "Test123!@#",
    "userType": "user"
  }'
```

**Expected Backend Logs:**
```
[POST /register] New user registration request
[POST /register] Data: atlastest, atlastest@example.com, userType: user
[DB INSERT] Attempting to insert user: atlastest (atlastest@example.com) [user]
[DB INSERT] ✓ User inserted successfully with _id: 674f1a2b3c4d5e6f7a8b9c0d
[DB INSERT] Collection: users, Database: epicarehubData
[POST /register] ✓ User registered successfully
```

**Verify in MongoDB Atlas:**
1. Go to https://cloud.mongodb.com
2. Navigate to your cluster (ClusterDB)
3. Click "Browse Collections"
4. Select database: `epicarehubData` (exact match from logs!)
5. Open `users` collection
6. Find document with matching `_id` from logs

---

### Test 4: Use Debug Endpoint

**Request:**
```bash
curl http://localhost:3000/debug/db-info | jq
```

**Verify Response:**
- `database` matches `MONGODB_DB_NAME` from `.env`
- `clusterHost` is NOT `localhost`
- `collections` includes `users`, `patients`, `eegStudies`

---

## Troubleshooting

### Issue: "Connection failed: MongoServerSelectionError"

**Possible Causes:**
1. **Invalid credentials**: Check username/password in `MONGODB_URI`
2. **Network access**: Verify IP whitelist in MongoDB Atlas
3. **Cluster not reachable**: Check cluster status in Atlas dashboard

**How to Fix:**
1. Go to MongoDB Atlas → Network Access
2. Add your current IP address (or use `0.0.0.0/0` for testing)
3. Go to Database Access → Verify user exists and has correct permissions
4. Restart backend: `npm start`

---

### Issue: "Host shows localhost in logs"

**Cause**: `.env` file is not being loaded

**Fix:**
```bash
# Verify .env exists
ls -la Backend/.env

# Verify it contains MONGODB_URI
cat Backend/.env | grep MONGODB_URI

# Ensure you're in Backend directory when running npm start
cd Backend
npm start
```

---

### Issue: "Data not appearing in MongoDB Atlas"

**Cause**: Looking at wrong database or collection

**Fix:**
1. Check backend logs for the exact database name:
   ```
   [DB INSERT] Collection: users, Database: epicarehubData
   ```
2. In MongoDB Atlas, verify you're looking at **exactly** that database name
3. Database names are **case-sensitive**: `epicarehubData` ≠ `epicarehub`

---

## Files Changed (Atlas-Only Enforcement)

| File | Change Summary |
|------|----------------|
| `Backend/config/settings.js` | Removed ALL localhost fallbacks, added fail-fast validation |
| `Backend/config/mongoConnection.js` | Enhanced logging, added ping verification, better error messages |
| `Backend/routes/debug.js` | NEW - Debug endpoint for runtime database verification |
| `Backend/routes/index.js` | Registered debug routes (non-production only) |
| `Backend/.env.example` | Removed localhost references, emphasized Atlas-only |

---

## Security Notes

### Debug Endpoint Security

The `/debug/db-info` endpoint is **only enabled when `NODE_ENV !== "production"`**.

In production:
- Set `NODE_ENV=production` in your `.env`
- The debug routes will NOT be registered
- Requests to `/debug/*` will return `404 Not Found`

### Credential Safety

The debug endpoint **never** returns:
- Database passwords
- Connection string credentials
- API keys

It only returns:
- Cluster hostname (e.g., `clusterdb.4lydu7t.mongodb.net`)
- Database name (e.g., `epicarehubData`)
- Collection names and counts

---

## Migration Scripts

All migration scripts (e.g., `scripts/migrateEegVisualsToStudies.js`) use the central `dbConnection` from `config/mongoConnection.js`.

**This means:**
- Migration scripts will ALSO fail fast if env vars are missing
- Migration scripts will ONLY connect to Atlas (no localhost fallback)
- All data migrations will go to the correct Atlas database

**To run migrations:**
```bash
cd Backend
npm run migrate:eegStudies
```

**Expected Output:**
```
[MongoDB] Connecting to MongoDB Atlas...
[MongoDB] Host: clusterdb.4lydu7t.mongodb.net
[MongoDB] Database: epicarehubData
[MongoDB] ✓ Connected successfully to Atlas

[Migration] Starting migration...
[Migration] Migrated X documents
[Migration] Complete
```

---

## Summary

### ✅ What You Get

1. **Atlas-only connection** - No accidental localhost usage
2. **Fail-fast validation** - Clear errors if configuration is wrong
3. **Runtime verification** - Debug endpoint to confirm database at runtime
4. **Clear logging** - Always know which database you're connected to
5. **Consistent behavior** - All scripts and routes use the same connection

### ❌ What's Removed

1. **NO localhost fallback** - If env vars missing, app exits immediately
2. **NO silent failures** - Every connection attempt is logged
3. **NO ambiguity** - Always know where your data is going

### 🎯 Guarantee

With this configuration, **every new user, patient, and EEG study** will be created in your MongoDB Atlas `epicarehubData` database. There is **no way** for data to accidentally go to localhost.

---

## Quick Reference

| What | Command |
|------|---------|
| Start backend | `cd Backend && npm start` |
| Check database at runtime | `curl http://localhost:3000/debug/db-info` |
| Verify .env loaded | Look for Atlas cluster in startup logs (NOT localhost) |
| Test user creation | `curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{...}'` |
| View MongoDB Atlas | https://cloud.mongodb.com → ClusterDB → Browse Collections → epicarehubData |

---

**For previous debugging documentation, see:**
- `MONGODB_DEBUG_SUMMARY.md` - Overview of logging enhancements
- `MONGODB_CONNECTION_DEBUG_GUIDE.md` - Detailed debugging guide
