# Admin Registration Implementation Guide

This document explains the secure admin registration feature implemented in EpiCareHub.

## 🎯 Overview

Admin registration is now secured using a **backend-only secret key**. Only users who know the secret can register as administrators.

### Security Features:
- ✅ Secret stored **only** in backend environment (never in frontend code)
- ✅ Secret validated **server-side** (not client-side)
- ✅ Different error messages for missing vs invalid secrets
- ✅ Normal users can register without any secret
- ✅ Secure by default (fails if secret not configured)

---

## 📝 Implementation Summary

### Files Modified

#### Backend (3 files)

1. **`Backend/.env.example`**
   - Added `ADMIN_REGISTRATION_SECRET` environment variable documentation
   - Default: `your-admin-secret-here` (placeholder, must be changed)

2. **`Backend/server.js`**
   - Added startup warning if `ADMIN_REGISTRATION_SECRET` is not set

3. **`Backend/routes/user.js`** (POST `/register`)
   - Accepts `userType` and `secretKey` from request body
   - Validates admin secret **only** when `userType === "admin"`
   - Returns clear error messages:
     - Missing secret: "Admin secret key is required for administrator registration."
     - Invalid secret: "Invalid admin secret key."
   - Passes `userType` to `userData.addUser()`

4. **`Backend/data/user.js`** (`addUser` function)
   - Now accepts 6th parameter: `userType` (default: "user")
   - Validates userType is either "user" or "admin"
   - Stores `userType` in user document

#### Frontend (1 file)

5. **`Frontend/src/components/RegistrationPage.jsx`**
   - Changed endpoint from `POST /users` to `POST /register` (line 183)
   - Enhanced error handling to display backend messages (lines 206-210)
   - Already had UI for admin secret input (conditional on userType)

---

## 🚀 Setup Instructions

### Step 1: Configure Backend Secret

In `Backend/.env`, set your admin secret:

```bash
# Backend/.env
ADMIN_REGISTRATION_SECRET=epicare-admin-dev-secret
```

**Important**:
- Use a **strong, unique secret** in production
- **Never commit** the real secret to git
- Change the secret regularly
- Different secrets for dev/staging/production

### Step 2: Start Services

```bash
# Terminal 1 - Backend
cd Backend
npm start

# You should see:
# [WARNING] ADMIN_REGISTRATION_SECRET is not set. Admin registration will always fail.
# (if you haven't set it yet)

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

---

## 🧪 Testing Guide

### Test 1: Normal User Registration (No Secret Needed)

**Steps**:
1. Navigate to http://localhost:5173/signup
2. Fill in all fields:
   - First Name: John
   - Last Name: Doe
   - Username: johndoe
   - Email: john@example.com
   - Password: Password123!
   - Confirm Password: Password123!
   - **User Type**: Select **"Regular User"**
3. Notice: Admin Secret Key field is **hidden**
4. Click "Create Account"

**Expected Result**:
- ✅ Registration succeeds
- ✅ Redirect to sign in page
- ✅ User stored in database with `userType: "user"`

---

### Test 2: Admin Registration with Missing Secret

**Steps**:
1. Navigate to http://localhost:5173/signup
2. Fill in all fields
3. **User Type**: Select **"Administrator"**
4. Notice: Admin Secret Key field **appears**
5. Leave the secret field **empty**
6. Click "Create Account"

**Expected Result**:
- ❌ Frontend validation blocks submission
- ❌ Error message: "Secret key is required for admin registration"
- ❌ No request sent to backend

---

### Test 3: Admin Registration with Wrong Secret

**Steps**:
1. Navigate to http://localhost:5173/signup
2. Fill in all fields
3. **User Type**: Select **"Administrator"**
4. **Admin Secret Key**: Enter `wrong-secret`
5. Click "Create Account"

**Expected Result**:
- ❌ Request sent to backend
- ❌ Backend returns 400 with error message
- ❌ Frontend displays: **"Invalid admin secret key."**
- ❌ User NOT created in database

**Backend Response**:
```json
{
  "isSuccess": false,
  "message": "Invalid admin secret key."
}
```

---

### Test 4: Admin Registration with Correct Secret

**Steps**:
1. Ensure `ADMIN_REGISTRATION_SECRET` is set in `Backend/.env`
2. Navigate to http://localhost:5173/signup
3. Fill in all fields:
   - First Name: Admin
   - Last Name: User
   - Username: adminuser
   - Email: admin@example.com
   - Password: AdminPass123!
   - Confirm Password: AdminPass123!
   - **User Type**: Select **"Administrator"**
   - **Admin Secret Key**: Enter the **exact** secret from your `.env` file
     - Example: `epicare-admin-dev-secret`
4. Click "Create Account"

**Expected Result**:
- ✅ Registration succeeds
- ✅ Success message: "Registration successful! Redirecting to sign in..."
- ✅ Redirect to sign in page after 2 seconds
- ✅ User stored in database with `userType: "admin"`

**MongoDB Verification**:
```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "admin@example.com" })

// Should show:
{
  "_id": ObjectId("..."),
  "firstName": "Admin",
  "lastName": "User",
  "username": "adminuser",
  "email": "admin@example.com",
  "password": "$2b$14$...", // hashed
  "userType": "admin"  // <-- Important!
}
```

---

## 🔍 Verification Checklist

### Backend Verification

1. **Environment Variable**:
   ```bash
   # Check Backend/.env
   grep ADMIN_REGISTRATION_SECRET Backend/.env
   ```

2. **Server Logs**:
   ```bash
   # Start backend, check for warning
   cd Backend && npm start

   # Should NOT see warning if secret is set
   # Should see warning if secret is missing
   ```

3. **Database Check**:
   ```javascript
   // Regular user
   db.users.findOne({ userType: "user" })

   // Admin user
   db.users.findOne({ userType: "admin" })
   ```

### Frontend Verification

1. **UI Conditional Rendering**:
   - Regular User: Secret field **hidden**
   - Administrator: Secret field **visible**

2. **Form Validation**:
   - Try submitting admin form with empty secret → blocked
   - Try submitting admin form with wrong secret → backend error shown

3. **Error Messages**:
   - Missing secret: Client-side validation message
   - Wrong secret: "Invalid admin secret key." (from backend)

---

## 🔒 Security Best Practices

### For Development

```bash
# Backend/.env (dev)
ADMIN_REGISTRATION_SECRET=epicare-admin-dev-secret
```

### For Production

1. **Use Strong Secrets**:
   ```bash
   # Generate with:
   openssl rand -base64 32

   # Example:
   ADMIN_REGISTRATION_SECRET=X7k9m2L5pQ8wR3nY6vB1zA4sE0dF9cH2
   ```

2. **Environment-Specific Secrets**:
   - Development: `epicare-dev-secret-2024`
   - Staging: `epicare-staging-secret-xyz`
   - Production: `epicare-prod-secret-abc123`

3. **Secret Rotation**:
   - Change secrets every 90 days
   - Update `.env` file
   - Restart backend server
   - Inform authorized admins of new secret

4. **Access Control**:
   - Only share secret with authorized personnel
   - Use secure channels (never email/Slack)
   - Store in password manager (1Password, LastPass, etc.)

---

## 🐛 Troubleshooting

### Issue: "Admin registration will always fail" warning

**Cause**: `ADMIN_REGISTRATION_SECRET` not set in `Backend/.env`

**Fix**:
```bash
# Add to Backend/.env
ADMIN_REGISTRATION_SECRET=your-secret-here

# Restart backend
cd Backend && npm start
```

---

### Issue: "Invalid admin secret key" error (but secret is correct)

**Possible Causes**:

1. **Extra spaces in .env file**:
   ```bash
   # Wrong (has trailing space)
   ADMIN_REGISTRATION_SECRET=my-secret

   # Correct (no trailing space)
   ADMIN_REGISTRATION_SECRET=my-secret
   ```

2. **Backend not restarted**:
   - Environment variables are loaded at startup
   - Must restart backend after changing `.env`

3. **Copy-paste error**:
   - Ensure secret matches exactly (case-sensitive)
   - No extra quotes needed in `.env`

**Fix**:
```bash
# 1. Check .env file for trailing spaces
cat Backend/.env | grep ADMIN_REGISTRATION_SECRET

# 2. Restart backend
cd Backend
npm start

# 3. Try registration again with exact secret
```

---

### Issue: Frontend displays "Registration failed. Please try again."

**Cause**: Generic error fallback when backend error is unclear

**Debug Steps**:

1. **Check Browser Console**:
   ```javascript
   // Look for:
   Registration error: { response: { data: { message: "..." } } }
   ```

2. **Check Backend Logs**:
   ```bash
   # Backend terminal should show errors
   ```

3. **Test Backend Directly**:
   ```bash
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "username": "testuser",
       "email": "test@example.com",
       "password": "Test123!",
       "userType": "admin",
       "secretKey": "epicare-admin-dev-secret"
     }'
   ```

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Selects "Administrator" in Registration Form          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin Secret Key Field Appears (Frontend Validation)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        Secret Empty?                 Secret Entered
                │                           │
                ▼                           ▼
    ❌ Block Submit              POST /register
    Show Client Error                      │
                                          ▼
                        ┌─────────────────────────────┐
                        │ Backend: user.js (Route)    │
                        │ - Extract userType          │
                        │ - Extract secretKey         │
                        │ - Check if admin            │
                        └──────────┬──────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            userType = "admin"           userType = "user"
                    │                           │
                    ▼                           ▼
        ┌───────────────────────┐      Skip secret check
        │ Validate secretKey    │              │
        └───────┬───────────────┘              │
                │                              │
    ┌───────────┴────────────┐                │
    │                        │                │
    ▼                        ▼                │
Missing?                 Wrong?              │
    │                        │                │
    ▼                        ▼                │
❌ 400                   ❌ 400              │
"Required"              "Invalid"            │
    │                        │                │
    └────────────┬───────────┘                │
                 │                            │
                 ▼                            │
        Frontend displays error               │
                                              │
            Correct secret! ──────────────────┤
                                              │
                                              ▼
                        ┌─────────────────────────────┐
                        │ Backend: user.js (Data)     │
                        │ - Hash password             │
                        │ - Store user with userType  │
                        │ - Insert into MongoDB       │
                        └──────────┬──────────────────┘
                                  │
                                  ▼
                        ✅ 201 Success
                        "User added Successfully"
                                  │
                                  ▼
                        Frontend: Redirect to Sign In
```

---

## 🔄 Changing the Admin Secret

### When to Change:
- Every 90 days (routine rotation)
- After admin user leaves organization
- If secret is suspected to be compromised

### How to Change:

1. **Update Backend .env**:
   ```bash
   # Backend/.env
   ADMIN_REGISTRATION_SECRET=new-secret-2024-Q2
   ```

2. **Restart Backend**:
   ```bash
   cd Backend
   npm start
   ```

3. **Notify Authorized Personnel**:
   - Send new secret via secure channel
   - Update password manager entries

4. **Test Registration**:
   - Try registering with old secret → should fail
   - Try registering with new secret → should succeed

---

## 📚 API Reference

### POST /register

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!",
  "userType": "admin",        // "user" or "admin"
  "secretKey": "your-secret"  // Required only for admin
}
```

**Success Response (201)**:
```json
{
  "isSuccess": true,
  "message": "User added Succesfully"
}
```

**Error Responses (400)**:

Missing Secret:
```json
{
  "isSuccess": false,
  "message": "Admin secret key is required for administrator registration."
}
```

Invalid Secret:
```json
{
  "isSuccess": false,
  "message": "Invalid admin secret key."
}
```

Validation Error:
```json
{
  "isSuccess": false,
  "message": "Password must be at least 8 characters"
}
```

---

## ✅ Summary

**Implementation Complete!**

- ✅ Backend secret storage in environment variable
- ✅ Server-side secret validation
- ✅ Frontend conditional UI
- ✅ Clear error messages
- ✅ Secure by default
- ✅ No secrets exposed in frontend
- ✅ User type stored in database

**Next Steps**:
1. Set `ADMIN_REGISTRATION_SECRET` in your `.env` file
2. Test all 4 registration scenarios
3. Verify database entries
4. Configure role-based access control (if needed)
5. Implement admin-only UI features

---

**Questions or Issues?**

Check the Troubleshooting section or review the implementation in:
- `Backend/routes/user.js` (secret validation)
- `Backend/data/user.js` (user creation)
- `Frontend/src/components/RegistrationPage.jsx` (UI)
