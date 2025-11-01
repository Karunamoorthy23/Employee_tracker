# Free Deployment Guide - Proeduvate Employee Portal

This guide covers multiple **FREE** hosting options for your full-stack application. Choose the one that best fits your needs.

## 🏆 Recommended: Render (Best for Full-Stack Apps)

**Why Render?**
- ✅ Free tier available (spins down after inactivity, but free)
- ✅ Supports persistent file storage
- ✅ Easy environment variable configuration
- ✅ Automatic deployments from Git
- ✅ Custom domain support

### Prerequisites
- MongoDB Atlas account (free tier) - already set up ✅
- GitHub account (to connect repository)
- Cloud storage for file uploads (see below)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create `.gitignore` if not exists** (to exclude sensitive files):
   ```
   node_modules/
   .env
   uploads/*
   !uploads/.gitkeep
   .DS_Store
   ```

### Step 2: Set Up Cloud Storage for File Uploads

**Option A: Cloudinary (Recommended - Free Tier)**
- Sign up at [cloudinary.com](https://cloudinary.com) (free)
- Get your Cloud Name, API Key, and API Secret
- We'll need to modify the code to use Cloudinary instead of local storage

**Option B: AWS S3 (Free Tier)**
- Sign up for AWS (free tier available)
- Create an S3 bucket
- Get access keys

**Option C: Vercel Blob Storage (If using Vercel)**
- Included with Vercel account

### Step 3: Deploy to Render

1. **Sign up at [render.com](https://render.com)**
   - Use GitHub to sign up (recommended)

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Settings:**
   - **Name:** `proeduvate`
   - **Region:** Choose closest to you
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `.` (leave empty)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Set Environment Variables:**
   Click "Environment" tab and add:
   ```
   NODE_ENV=production
   PORT=10000
   BASE_URL=https://proeduvate.onrender.com
   MONGODB_URI=your-mongodb-connection-string
   LOGIN_USERNAME=Login@proEduvate
   LOGIN_PASSWORD=Pass@proEduvate
   SESSION_SECRET=your-session-secret-here
   ALLOWED_ORIGINS=https://proeduvate.onrender.com
   MAX_FILE_SIZE=5242880
   MAX_FILES=10
   ```

   **Important:** 
   - Replace `proeduvate.onrender.com` with your actual Render URL
   - Use your MongoDB Atlas connection string
   - Generate a secure SESSION_SECRET

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deployment
   - Your app will be live at `https://proeduvate.onrender.com`

### Step 4: Free Tier Limitations

- **Render Free Tier:**
  - Spins down after 15 minutes of inactivity
  - First request after spin-down takes ~30 seconds
  - 750 hours/month free
  - 512MB RAM

---

## 🚀 Alternative Option 1: Railway (Easy Setup)

**Why Railway?**
- ✅ Very easy setup
- ✅ Free $5 credit monthly (enough for small apps)
- ✅ Persistent storage
- ✅ Fast deployments

### Deployment Steps:

1. **Sign up at [railway.app](https://railway.app)**
   - Use GitHub to sign up

2. **Create New Project:**
   - Click "New Project"
   - "Deploy from GitHub repo"
   - Select your repository

3. **Configure:**
   - Railway auto-detects Node.js
   - Add environment variables (same as Render)
   - Deploy automatically

4. **Get Your URL:**
   - Railway provides a free `.railway.app` domain

**Note:** Railway gives $5 free credit/month. If you exceed, you'll need to add payment method (but $5 is usually enough for small apps).

---

## 🌐 Alternative Option 2: Cyclic (Serverless)

**Why Cyclic?**
- ✅ True free tier
- ✅ Serverless (scales automatically)
- ✅ Easy Git integration

### Deployment Steps:

1. **Sign up at [cyclic.sh](https://cyclic.sh)**
2. **Connect GitHub repository**
3. **Cyclic auto-detects and deploys**
4. **Add environment variables in dashboard**

**Note:** File uploads need cloud storage (Cloudinary recommended)

---

## ⚡ Alternative Option 3: Vercel (Serverless Functions)

**Why Vercel?**
- ✅ Excellent free tier
- ✅ Fast global CDN
- ✅ Easy Git integration

**Limitations:**
- ❌ No persistent file storage (need cloud storage)
- ❌ Serverless functions have execution time limits
- ❌ Files in `/uploads` are temporary

### Deployment Steps:

1. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

2. **Deploy:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

3. **Add environment variables in Vercel dashboard**

---

## 📦 Required: File Upload Cloud Storage Setup

Since most free hosting doesn't support persistent file storage, you need cloud storage. Here's how to integrate **Cloudinary** (free tier):

### 1. Install Cloudinary:
```bash
npm install cloudinary multer-storage-cloudinary
```

### 2. Create `config/cloudinary.js`:
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

### 3. Update `server.js` to use Cloudinary:
Replace multer diskStorage with Cloudinary storage (I can help with this if needed)

### 4. Environment Variables:
Add to your hosting platform:
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🔧 Post-Deployment Checklist

- [ ] MongoDB Atlas IP whitelist includes your hosting platform's IPs (or use 0.0.0.0/0)
- [ ] Environment variables are set correctly
- [ ] BASE_URL matches your deployment URL
- [ ] CORS is configured for your domain
- [ ] File uploads are configured (Cloudinary or similar)
- [ ] Test admin login
- [ ] Test form submission
- [ ] Test file uploads

---

## 💡 Pro Tips

1. **Keep MongoDB Atlas Free Tier:**
   - 512MB storage (usually enough)
   - Good for development and small apps

2. **Use Cloudinary Free Tier:**
   - 25GB storage
   - 25GB monthly bandwidth
   - Perfect for file uploads

3. **Monitor Usage:**
   - Check Render/Railway dashboard regularly
   - Set up alerts if available

4. **Custom Domain (Optional):**
   - Most platforms allow free custom domains
   - Update BASE_URL and CORS accordingly

---

## 🆘 Troubleshooting

### App Spins Down (Render):
- This is normal for free tier
- First request after idle takes longer
- Consider upgrading to paid for always-on

### Database Connection Issues:
- Check MongoDB Atlas IP whitelist
- Ensure connection string is correct
- Verify environment variables

### File Upload Fails:
- Need cloud storage (can't use local disk)
- Set up Cloudinary or similar
- Update code to use cloud storage

### Environment Variables Not Working:
- Double-check variable names (case-sensitive)
- Redeploy after adding variables
- Check platform logs

---

## 📊 Comparison Table

| Platform | Free Tier | Persistent Storage | File Uploads | Ease of Setup | Best For |
|----------|-----------|-------------------|--------------|---------------|----------|
| **Render** | ✅ Yes (spins down) | ✅ Yes | ✅ With cloud storage | ⭐⭐⭐⭐⭐ | Full-stack apps |
| **Railway** | ✅ $5/month credit | ✅ Yes | ✅ With cloud storage | ⭐⭐⭐⭐⭐ | Full-stack apps |
| **Cyclic** | ✅ Yes | ⚠️ Limited | ⚠️ Need cloud storage | ⭐⭐⭐⭐ | Serverless apps |
| **Vercel** | ✅ Yes | ❌ No | ❌ Need cloud storage | ⭐⭐⭐⭐⭐ | Frontend + API |

---

## 🎯 Recommended Setup (Free):

**Best Combination:**
1. **Hosting:** Render or Railway (for backend)
2. **Database:** MongoDB Atlas (free tier)
3. **File Storage:** Cloudinary (free tier)
4. **Domain:** Use provided free domain, or add custom domain

**Total Cost: $0/month** 💰

---

## 🚀 Quick Start Command Summary

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Sign up at Render.com
# 3. Connect GitHub repo
# 4. Add environment variables
# 5. Deploy!
```

---

Need help with any specific platform? Let me know and I'll provide detailed steps!
