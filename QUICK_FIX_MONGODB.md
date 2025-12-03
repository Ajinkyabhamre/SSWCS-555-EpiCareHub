# Quick Fix: MongoDB Atlas Connection

## ⚡ TL;DR

Your Backend is running ✅ but MongoDB Atlas connection fails ❌ because:
- **Cluster hostname `clusterdb.4lydu7t.mongodb.net` doesn't exist**

## 🔧 Fix in 3 Steps

### Step 1: Get New Connection String
- Go to https://cloud.mongodb.com
- Click your cluster's "Connect" button
- Copy the connection string

### Step 2: Update `Backend/.env`
```bash
# Replace with YOUR string from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@YOUR_CLUSTER.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=epicarehubData
```

### Step 3: Whitelist Your IP
- In MongoDB Atlas, go to **Network Access**
- Click **Add IP Address**
- Add your IP (or `0.0.0.0/0` for testing)

## ✅ Verify It Works
```bash
cd Backend
node -e "
import dotenv from 'dotenv';
dotenv.config();
import { dbConnection } from './config/mongoConnection.js';

const db = await dbConnection();
console.log('✅ Connected to:', db.s.namespace.db);
process.exit(0);
"
```

## Alternative: Use Local MongoDB
```bash
brew install mongodb-community
brew services start mongodb-community

# Update Backend/.env
MONGODB_URI=mongodb://localhost:27017/epicarehub
MONGODB_DB_NAME=epicarehub
```

## 📋 Checklist
- [ ] Have valid MongoDB Atlas cluster
- [ ] Copied connection string
- [ ] Updated `Backend/.env`
- [ ] Whitelisted IP in MongoDB Atlas
- [ ] Ran verification command
- [ ] Got "✅ Connected" message

## ⚠️ If Still Failing
1. **Verify cluster exists**: https://cloud.mongodb.com
2. **Check cluster is running** (not paused)
3. **Verify credentials** in connection string
4. **Check IP whitelist** in Network Access
5. **Test network**: `nslookup YOUR_CLUSTER.mongodb.net`

## 🎯 Expected Result
```
✅ Connected to: epicarehubData
```

That's it! Then your full stack will work:
- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173`
- Python ML on `http://localhost:8000`

---

Need more help? See `MONGODB_CONNECTION_CHECK.md` for detailed diagnostics.
