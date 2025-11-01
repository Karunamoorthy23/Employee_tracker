# 🔧 Fix Render Build Error

## Problem
Render is trying to run: `npm install -r requirements.txt`
This is incorrect - `requirements.txt` is for Python, not Node.js!

## ✅ Solution

### Option 1: Fix in Render Dashboard (Recommended)

1. **Go to your Render service dashboard**
2. **Click "Settings" tab**
3. **Scroll to "Build Command"**
4. **Change it to:** `npm install`
   - Remove `-r requirements.txt`
   - Should be just: `npm install`
5. **Make sure "Start Command" is:** `npm start`
6. **Click "Save Changes"**
7. **Manual Deploy** (click "Manual Deploy" button)

### Option 2: Delete and Recreate Service

If Option 1 doesn't work:

1. **Delete the current service** (Settings → Delete)
2. **Create a new Web Service**
3. **When configuring, make sure:**
   - Build Command: `npm install` (NOT `npm install -r requirements.txt`)
   - Start Command: `npm start`
   - Branch: `portal/karuna_1st_update` or `main`

## ✅ Correct Configuration

```
Build Command: npm install
Start Command: npm start
Branch: portal/karuna_1st_update (or main)
Root Directory: . (empty)
```

## 📝 Notes

- `requirements.txt` is a Python file format
- Node.js uses `package.json` for dependencies
- Render auto-detects Node.js, but sometimes gets the build command wrong
- Always verify the build command in Settings

## 🔄 After Fixing

1. Save changes
2. Click "Manual Deploy" 
3. Wait 5-10 minutes
4. Check logs if it fails again

Your app should deploy successfully! 🚀

