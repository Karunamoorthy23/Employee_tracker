# MongoDB Atlas Connection Troubleshooting Guide

## Common Causes of Connection Failures

### 1. 🔴 IP Address Not Whitelisted (MOST COMMON)

**Problem:** MongoDB Atlas blocks all IP addresses by default for security.

**Solution:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click on **"Network Access"** in the left sidebar
3. Click **"Add IP Address"**
4. Choose one:
   - **For Development:** Add `0.0.0.0/0` (allows all IPs - only for development!)
   - **For Production:** Click "Add Current IP Address" or manually add your IP
5. Click **"Confirm"**

**Note:** Changes may take 1-2 minutes to propagate.

---

### 2. 🔴 Special Characters in Password Not URL Encoded

**Problem:** If your MongoDB password contains special characters like `@`, `#`, `%`, `&`, etc., they need to be URL encoded.

**Special Characters Encoding:**
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `/` → `%2F`
- `:` → `%3A`
- `?` → `%3F`
- `=` → `%3D`
- `+` → `%2B`
- ` ` (space) → `%20`

**Example:**
```
Original password: MyP@ss#123
URL encoded: MyP%40ss%23123
```

**Solution Option A: Use MONGODB_URI with encoded password**
```env
MONGODB_URI=mongodb+srv://username:MyP%40ss%23123@cluster.mongodb.net/Proeduvate?retryWrites=true&w=majority
```

**Solution Option B: Change your MongoDB password** (easier!)
1. Go to MongoDB Atlas → Database Access
2. Edit your user
3. Change password to one without special characters
4. Or use the password generator

---

### 3. 🔴 Incorrect Connection String Format

**Problem:** Missing parts or wrong format in connection string.

**Correct Format:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTERNAME.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

**Components:**
- `USERNAME` - Your MongoDB Atlas database user
- `PASSWORD` - Your MongoDB Atlas database user password (URL encoded if special chars)
- `CLUSTERNAME` - Your cluster name (without `.mongodb.net`)
- `DATABASE_NAME` - Your database name (default: `Proeduvate`)

**How to Get Your Connection String:**
1. Go to MongoDB Atlas Dashboard
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. Copy the connection string
6. Replace `<password>` with your actual password (URL encode special chars!)

---

### 4. 🔴 Wrong Username or Password

**Problem:** Typos or using wrong credentials.

**Solution:**
1. Go to MongoDB Atlas → **Database Access**
2. Verify your username is correct
3. Click **"Edit"** on your user
4. Reset password if needed
5. Make sure you're using the **Database User** credentials, not your Atlas account credentials

---

### 5. 🔴 Cluster Not Running or Paused

**Problem:** MongoDB Atlas free tier clusters pause after inactivity.

**Solution:**
1. Go to MongoDB Atlas Dashboard
2. Check if your cluster shows as **"Paused"**
3. Click **"Resume"** if paused
4. Wait 1-2 minutes for cluster to start

---

### 6. 🔴 Firewall or Network Issues

**Problem:** Your network/ISP is blocking MongoDB connections.

**Solution:**
- Try from a different network (mobile hotspot, different WiFi)
- Check if your corporate firewall blocks MongoDB connections
- Try connecting from MongoDB Atlas Compass (to verify it's not your app)

---

### 7. 🔴 Database User Permissions

**Problem:** Database user doesn't have proper permissions.

**Solution:**
1. Go to MongoDB Atlas → **Database Access**
2. Click **"Edit"** on your database user
3. Under **"Database User Privileges"**, ensure:
   - **Built-in Role** is set to **"Atlas admin"** or **"Read and write to any database"**
4. Save changes

---

## Step-by-Step Fix Checklist

### ✅ Step 1: Verify Your MongoDB Atlas Setup

1. **Check Cluster Status:**
   - [ ] Cluster is running (not paused)
   - [ ] Cluster name is correct

2. **Check Database User:**
   - [ ] User exists in Database Access
   - [ ] Username is correct
   - [ ] Password is known (no special chars recommended)
   - [ ] User has proper permissions (Atlas admin)

3. **Check Network Access:**
   - [ ] Your IP is whitelisted (or 0.0.0.0/0 for dev)
   - [ ] IP whitelist changes have propagated (wait 1-2 min)

### ✅ Step 2: Verify Your .env File

**Check your `.env` file has one of these configurations:**

**Option A: Direct URI (Recommended)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Proeduvate?retryWrites=true&w=majority
```

**Option B: Individual Components**
```env
CLUSTERNAME=cluster0.xxxxx
USERNAME=your-username
PASSWORD=your-password
PROVIDER=mongodb.net
```

### ✅ Step 3: Test Connection String

You can test your connection string using MongoDB Compass:
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Paste your connection string
3. Try to connect
4. If it works in Compass but not in your app, the issue is in your app configuration

### ✅ Step 4: Check Error Messages

When you run `node server.js`, look for specific error messages:

**"ServerSelectionError"** → IP not whitelisted or cluster not accessible
**"Authentication failed"** → Wrong username/password
**"MongoParseError"** → Connection string format issue
**"Timeout"** → Network/firewall issue or cluster paused

---

## Quick Fixes

### Fix 1: Reset Everything
```bash
# 1. Get fresh connection string from MongoDB Atlas
# 2. Update .env file with correct MONGODB_URI
# 3. Make sure IP is whitelisted
# 4. Restart your server
```

### Fix 2: Use Local MongoDB for Testing
```env
# In .env file
MONGODB_URI=mongodb://localhost:27017/Proeduvate
```

Then install and run MongoDB locally:
```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download from https://www.mongodb.com/try/download/community
```

---

## Still Not Working?

1. **Check the exact error message** when running `node server.js`
2. **Copy the error** and check MongoDB Atlas logs
3. **Try connecting from MongoDB Compass** with the same connection string
4. **Verify your internet connection** can reach MongoDB Atlas
5. **Check MongoDB Atlas status page** for outages

---

## Example Working .env Configuration

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/Proeduvate?retryWrites=true&w=majority

# Or use individual components (make sure password has no special chars!)
# CLUSTERNAME=cluster0.abc123
# USERNAME=myuser
# PASSWORD=mypassword123

# Other configurations...
LOGIN_USERNAME=Login@proEduvate
LOGIN_PASSWORD=Pass@proEduvate
SESSION_SECRET=your-session-secret-here
ALLOWED_ORIGINS=http://localhost:5000
```

---

## Need More Help?

1. Share the exact error message you're seeing
2. Check MongoDB Atlas → Monitoring → Real-Time Performance
3. Review MongoDB Atlas → Activity Feed for connection attempts
4. Check your server console logs for detailed error information
