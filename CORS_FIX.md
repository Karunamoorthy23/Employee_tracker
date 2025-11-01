# 🔧 CORS Error Fix for Render Deployment

## Problem
You're getting this error:
```
Access to fetch at 'https://proeduvate.onrender.com/api/employee-progress' 
from origin 'https://employee-tracker-2-xofs.onrender.com' 
has been blocked by CORS policy
```

## Root Cause
You have two different Render services:
- **Main app:** `proeduvate.onrender.com`
- **Admin access from:** `employee-tracker-2-xofs.onrender.com`

The CORS policy is blocking cross-origin requests.

## ✅ Solution Options

### Option 1: Update Environment Variable (Recommended)

1. **Go to Render dashboard** → Your service (`proeduvate`)
2. **Settings** → **Environment** tab
3. **Find `ALLOWED_ORIGINS`** and update it to:
   ```
   https://proeduvate.onrender.com,https://employee-tracker-2-xofs.onrender.com
   ```
4. **Save Changes**
5. **Manual Deploy** (or wait for auto-deploy)

### Option 2: Access Admin from Same Domain

Instead of accessing from `employee-tracker-2-xofs.onrender.com`, access the admin directly:
- **Admin Login:** `https://proeduvate.onrender.com/admin-login`
- **Admin Dashboard:** `https://proeduvate.onrender.com/admin`

This avoids CORS issues entirely since it's same-origin.

### Option 3: Use One Service Only

If you have two services, you might want to:
1. Use only `proeduvate.onrender.com` for everything
2. Delete `employee-tracker-2-xofs.onrender.com` if not needed

## 🔧 Code Fix Applied

I've updated `server.js` to:
- ✅ Allow all Render subdomains in production
- ✅ Better handle same-origin requests
- ✅ More flexible CORS checking

**After updating code, you need to:**
1. Commit and push:
   ```bash
   git add .
   git commit -m "Fix CORS for Render deployment"
   git push origin main
   ```
2. Wait for Render to auto-deploy (5-10 minutes)

## 📝 Quick Fix (Right Now)

**In Render Dashboard:**
1. Settings → Environment
2. Set `ALLOWED_ORIGINS` to:
   ```
   https://proeduvate.onrender.com,https://employee-tracker-2-xofs.onrender.com
   ```
3. Save and redeploy

This should fix it immediately!

## ✅ Verify Fix

After updating, test:
1. Go to `https://employee-tracker-2-xofs.onrender.com/admin`
2. Try loading submissions
3. Should work without CORS errors

---

**Note:** The code fix I made will allow all Render domains in production, but it's still best practice to explicitly list allowed origins in `ALLOWED_ORIGINS`.

