# Render Deployment - Step by Step Guide

## 🚀 Quick Deployment to Render (FREE)

### Step 1: Prepare Your Code

1. **Ensure you have a GitHub repository:**
   ```bash
   # If not already initialized:
   git init
   git add .
   git commit -m "Initial commit"
   
   # Push to GitHub (create repo on GitHub first)
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### Step 2: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email

### Step 3: Create Web Service

1. **Click "New +" → "Web Service"**
2. **Connect your GitHub repository:**
   - Select "Connect a repository"
   - Choose your repository
   - Click "Connect"

3. **Configure your service:**
   ```
   Name: proeduvate
   Region: Choose closest to you
   Branch: main
   Root Directory: . (leave empty)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

### Step 4: Set Environment Variables

Click on "Environment" tab and add these:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
BASE_URL=https://proeduvate.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Proeduvate?retryWrites=true&w=majority
LOGIN_USERNAME=Login@proEduvate
LOGIN_PASSWORD=Pass@proEduvate
SESSION_SECRET=your-generated-secret-here
ALLOWED_ORIGINS=https://proeduvate.onrender.com
```

**Optional Variables:**
```
MAX_FILE_SIZE=5242880
MAX_FILES=10
```

**Important:** 
- Service name should be `proeduvate` to match the URL
- Use your real MongoDB connection string
- Generate a secure SESSION_SECRET (see below)

### Step 5: Generate Session Secret

Run this to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `SESSION_SECRET`

### Step 6: Update MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Network Access"
3. Add IP Address: `0.0.0.0/0` (allows all IPs) OR add Render's IP ranges
4. Save

### Step 7: Deploy!

1. Scroll down and click **"Create Web Service"**
2. Wait 5-10 minutes for first build
3. Your app will be live at `https://proeduvate.onrender.com`

### Step 8: Test Your Deployment

1. **Visit your URL:** `https://proeduvate.onrender.com`
2. **Test form submission:** Go to homepage and submit a form
3. **Test admin login:** Go to `/admin-login` and login
4. **Test admin dashboard:** View submissions

---

## 📝 Important Notes

### Free Tier Limitations:
- ⏱️ **Spins down after 15 minutes of inactivity**
- 🐌 **First request after spin-down takes ~30 seconds**
- 💾 **512MB RAM limit**
- ⏰ **750 hours/month free**

### Tips:
- Keep service active by pinging it periodically (if needed)
- Consider upgrading if you need always-on service
- Monitor usage in Render dashboard

---

## 🔧 Troubleshooting

### Build Fails:
- Check logs in Render dashboard
- Ensure `package.json` has correct `start` script
- Verify all dependencies are in `package.json`

### App Not Starting:
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check PORT is set to `10000` (Render requirement)

### Database Connection Errors:
- Ensure MongoDB Atlas IP whitelist includes Render
- Check connection string is correct
- Verify database user permissions

### File Uploads Not Working:
- Local file storage won't work on Render
- Need to set up cloud storage (Cloudinary recommended)
- See `FREE_DEPLOYMENT_GUIDE.md` for cloud storage setup

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live application URL
- ✅ Automatic deployments on Git push
- ✅ Environment variable management
- ✅ Logs and monitoring

**Your app is now live for FREE!** 🚀
