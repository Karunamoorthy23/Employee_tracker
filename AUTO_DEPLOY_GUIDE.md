# 🤖 Automated Deployment Guide

This guide helps you automate as much of the deployment process as possible.

## ⚡ Quick Start - One Command

### Windows (PowerShell):
```powershell
node auto-deploy.js
```

### Alternative - Using npm script:
```bash
npm run deploy:prepare
```

This will:
- ✅ Check all prerequisites
- ✅ Install dependencies
- ✅ Initialize Git if needed
- ✅ Generate session secret
- ✅ Prepare .gitignore
- ✅ Stage files for commit
- ✅ Show you exactly what to do next

---

## 🚀 Full Automation Workflow

### Step 1: Run Auto-Deploy Script

```bash
node auto-deploy.js
```

This prepares everything automatically!

### Step 2: Push to GitHub

After the script completes, it will show you the exact commands:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Note:** If you haven't set up GitHub yet:
1. Create a new repository on GitHub
2. Run:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### Step 3: Deploy to Render (One-Time Setup)

Since I can't automate account creation and authentication, you need to:

1. **Sign up at [render.com](https://render.com)** (one time)
2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect everything

3. **Add Environment Variables:**
   The auto-deploy script generated a `SESSION_SECRET` - use that plus:
   ```
   NODE_ENV=production
   PORT=10000
   BASE_URL=https://proeduvate.onrender.com
   MONGODB_URI=your-mongodb-connection-string
   LOGIN_USERNAME=Login@proEduvate
   LOGIN_PASSWORD=Pass@proEduvate
   SESSION_SECRET=<generated-by-script>
   ALLOWED_ORIGINS=https://proeduvate.onrender.com
   ```

### Step 4: Automatic Deployments!

Once connected, **every push to main branch automatically deploys!** 🎉

---

## 📋 What Gets Automated

### ✅ Fully Automated:
- [x] Dependency installation
- [x] Git repository setup
- [x] Session secret generation
- [x] .gitignore configuration
- [x] File staging
- [x] Pre-deployment checks
- [x] GitHub Actions workflow
- [x] Continuous deployment (after initial setup)

### ⚠️ Requires Manual Step (One-Time):
- [ ] GitHub account setup (if not done)
- [ ] Render account creation (one-time)
- [ ] Connecting Render to GitHub (one-time)
- [ ] Adding environment variables in Render (one-time)

After the one-time setup, everything else is automatic! 🚀

---

## 🔄 Continuous Deployment

After initial setup:

1. **Make changes to your code**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Render automatically deploys!** (usually 5-10 minutes)

---

## 🛠️ Available Scripts

### `npm run deploy:prepare`
Runs the deployment preparation checks

### `npm run deploy:check`
Same as above - verifies everything is ready

### `node auto-deploy.js`
Full automation script - does everything

### `node deploy-prepare.js`
Manual preparation script with detailed checks

---

## 📁 Automation Files Created

- ✅ `auto-deploy.js` - Main automation script
- ✅ `deploy-prepare.js` - Deployment checks
- ✅ `.github/workflows/deploy-render.yml` - GitHub Actions workflow
- ✅ `scripts/deploy-setup.sh` - Linux/Mac setup script
- ✅ `scripts/deploy-setup.ps1` - Windows PowerShell setup script

---

## 🎯 Typical Workflow

```bash
# 1. Run automation
node auto-deploy.js

# 2. Push to GitHub (shown by script)
git commit -m "Ready for deployment"
git push origin main

# 3. Go to Render.com and:
#    - Create Web Service
#    - Connect GitHub repo
#    - Add environment variables
#    - Deploy!

# 4. Future changes:
#    - Make changes
#    - git push origin main
#    - Auto-deploys! 🎉
```

---

## 🆘 Troubleshooting

### Script Fails:
- Make sure Node.js is installed
- Make sure Git is installed
- Run: `npm install` manually

### Git Issues:
- If not initialized: `git init`
- If no remote: `git remote add origin <url>`

### Render Issues:
- Check environment variables are set
- Check MongoDB Atlas IP whitelist
- Check Render logs for errors

---

## 💡 Pro Tips

1. **Save Session Secret:** Copy it from the script output and save it securely
2. **Test Locally First:** Make sure app works locally before deploying
3. **Monitor First Deploy:** Watch Render logs during first deployment
4. **Use GitHub Secrets:** For sensitive data (optional, advanced)

---

## ✅ After First Deployment

Your app will be live at: `https://proeduvate.onrender.com`

Future updates are automatic:
1. Make changes
2. `git push origin main`
3. Render deploys automatically!

**That's it!** 🎉

---

## 📚 Related Guides

- **Detailed Steps:** See `RENDER_DEPLOYMENT.md`
- **All Options:** See `FREE_DEPLOYMENT_GUIDE.md`
- **Quick Reference:** See `DEPLOYMENT_QUICK_START.md`

---

**Ready to deploy? Run `node auto-deploy.js` now!** 🚀
