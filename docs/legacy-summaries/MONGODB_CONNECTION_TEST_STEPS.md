# MongoDB Atlas Connection Test - Step by Step

Follow these steps in order to diagnose your MongoDB Atlas connection.

---

## Step 1: Verify Your Connection String

**In Terminal, run:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend
cat .env | grep MONGODB_URI
```

**You should see something like:**
```
MONGODB_URI=mongodb+srv://superadmin:qkzLBfRmYXJ18QWF@clusterdb.4lydu7t.mongodb.net/?appName=ClusterDB
```

**Check:**
- ✅ Do you see a connection string?
- ✅ Does it have your username and password?
- ✅ Does it have a cluster name (e.g., `clusterdb.4lydu7t`)?

---

## Step 2: Check DNS Resolution

**In Terminal, run:**
```bash
ping -c 2 clusterdb.4lydu7t.mongodb.net
```

**Possible outcomes:**

### ✅ SUCCESS (DNS works):
```
PING clusterdb.4lydu7t.mongodb.net (x.x.x.x): 56 data bytes
64 bytes from x.x.x.x: icmp_seq=0 ttl=50 time=10.0 ms
```

### ❌ FAIL (DNS doesn't work):
```
ping: cannot resolve clusterdb.4lydu7t.mongodb.net: Unknown host
```

**If you get DNS failure:**
- Check your cluster name is correct in MongoDB Atlas
- Verify you have internet connectivity
- Try: `ping -c 2 google.com` (to test general internet)

---

## Step 3: Check MongoDB Atlas Configuration

**Go to MongoDB Atlas (https://cloud.mongodb.com/):**

1. **Sign in** with your account
2. **Navigate** to your organization/project
3. **Look for your cluster** in the clusters list
4. **Verify:**
   - ✅ Is the cluster there?
   - ✅ Is it **"ACTIVE"** (not paused)?
   - ✅ What is the exact cluster name?

5. **Click "Connect"** on your cluster
6. **Select "Connect your application"**
7. **Choose "Node.js"** from the driver list
8. **Copy the connection string** shown

---

## Step 4: Verify IP Whitelist

**In MongoDB Atlas:**

1. **Click on your cluster name**
2. **Go to "Network Access"** tab
3. **Look at the IP Whitelist**
4. **Check if:**
   - ✅ Your current IP is listed?
   - ✅ Or is `0.0.0.0/0` listed (allows all)?

**To find your current IP:**
```bash
curl -s https://api.ipify.org
# or
curl -s https://checkip.amazonaws.com
```

**If your IP is NOT whitelisted:**
- Go to Network Access in MongoDB Atlas
- Click "Add IP Address"
- Either:
  - Add your current IP (from commands above)
  - Or add `0.0.0.0/0` (allows anyone, for testing only)

---

## Step 5: Verify Database User Credentials

**In MongoDB Atlas:**

1. **Click on your cluster**
2. **Go to "Database Access"** tab
3. **Look for your database user** (should be "superadmin")
4. **Check:**
   - ✅ User "superadmin" exists?
   - ✅ User has proper permissions?

**If user doesn't exist:**
- Click "Add New Database User"
- Username: `superadmin`
- Password: (same as in your .env file)
- Set role to "Read and write to any database"

---

## Step 6: Test Node.js Connection Directly

**In Terminal, run:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend

node << 'EOF'
import dotenv from 'dotenv';
dotenv.config();

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:');
console.log(uri.substring(0, 80) + '...');
console.log('');

const client = new MongoClient(uri);

try {
  console.log('🔄 Connecting...');
  await client.connect();

  console.log('✅ Connected successfully!');

  const admin = client.db('admin');
  const status = await admin.command({ ping: 1 });
  console.log('✅ Ping successful!');
  console.log('Response:', status);

  await client.close();
  console.log('✅ Connection closed');
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed');
  console.error('Error:', error.message);
  console.error('Code:', error.code);
  process.exit(1);
}
EOF
```

**Expected output on SUCCESS:**
```
Testing connection to:
mongodb+srv://superadmin:...
🔄 Connecting...
✅ Connected successfully!
✅ Ping successful!
Response: { ok: 1 }
✅ Connection closed
```

**Expected output on FAILURE:**
```
❌ Connection failed
Error: [various error message]
```

---

## Step 7: Check Backend Server is Using Correct Configuration

**In Terminal, run:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend

node << 'EOF'
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME || 'Not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set');
console.log('PYTHON_API_URL:', process.env.PYTHON_API_URL || 'Not set');
console.log('PORT:', process.env.PORT || '3000 (default)');
EOF
```

**Expected output:**
```
Environment Variables:
MONGODB_URI: ✅ Set
MONGODB_DB_NAME: epicarehubData
SESSION_SECRET: ✅ Set
PYTHON_API_URL: http://localhost:8000
PORT: 3000 (default)
```

---

## Step 8: Test with Backend App

**In Terminal, run:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend

# Start the server
npm run dev

# In a NEW terminal, test an endpoint:
curl http://localhost:3000/patients
```

**Expected output:**
```
GET request to http://localhost:3000/paitents
```

If the server starts successfully, that means:
- ✅ Environment variables are loaded
- ✅ Backend can initialize without MongoDB connection errors
- ⚠️ The database connection happens when you make API calls

---

## Troubleshooting Decision Tree

### Problem: "cannot resolve clusterdb.4lydu7t.mongodb.net"

1. **Check if cluster exists in MongoDB Atlas**
   - Go to https://cloud.mongodb.com
   - Do you see a cluster named "clusterdb"?
   - If not: create a cluster or update the connection string

2. **Check internet connectivity**
   - Run: `ping google.com`
   - If fails: fix your internet connection

3. **Check DNS**
   - Run: `nslookup clusterdb.4lydu7t.mongodb.net`
   - Should return an IP address

### Problem: "authentication failed"

1. **Verify username and password**
   - Check in MongoDB Atlas > Database Access
   - Make sure "superadmin" user exists
   - Try resetting the password

2. **Check for special characters**
   - If password has `@`, `#`, `$`, etc., it may need URL encoding
   - Example: `p@ss` becomes `p%40ss`

### Problem: "connection refused"

1. **Check IP whitelist**
   - Go to MongoDB Atlas > Network Access
   - Is your IP listed?
   - Add your IP or `0.0.0.0/0` for testing

2. **Check cluster is running**
   - Go to MongoDB Atlas clusters page
   - Is your cluster "ACTIVE" or "PAUSED"?
   - If paused: resume it

### Problem: "timeout"

1. **Check firewall**
   - MongoDB uses port 27017
   - Your network may be blocking it

2. **Check cluster region**
   - Your network location and cluster region may be incompatible

---

## Summary Checklist

Before proceeding, verify:

- [ ] Cluster exists in MongoDB Atlas
- [ ] Cluster is ACTIVE (not paused)
- [ ] Database user "superadmin" exists
- [ ] IP is whitelisted in Network Access
- [ ] Connection string is correct in `.env`
- [ ] DNS resolves the hostname
- [ ] Node.js can connect (Step 6 test)
- [ ] Backend server starts (Step 8 test)

---

## Quick Copy-Paste Commands

**All tests in one go:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend

echo "=== 1. Checking environment ==="
cat .env | grep MONGODB

echo ""
echo "=== 2. Testing Node connection ==="
node << 'EOF'
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  console.log('✅ Connected to MongoDB!');
  await client.close();
} catch (e) {
  console.error('❌ Failed:', e.message);
}
process.exit(0);
EOF
```

---

## Next Steps

Once connection is verified:

1. **Start Backend**: `npm run dev`
2. **Start Frontend**: `cd ../Frontend && npm run dev`
3. **Start Python ML**: `cd ../Localization-Algorithm && conda activate brain && uvicorn brain_api:app --reload`
4. **Access app**: http://localhost:5173

---

## Still Having Issues?

Check these files:
- `QUICK_FIX_MONGODB.md` - Quick reference
- `MONGODB_CONNECTION_CHECK.md` - Detailed diagnostics
- `MONGODB_CONNECTION_REPORT.md` - Technical analysis

