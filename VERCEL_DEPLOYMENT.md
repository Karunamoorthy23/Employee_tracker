# Vercel Deployment Guide for Proeduvate Employee Portal

## Overview
This guide will help you deploy your full-stack Node.js application to Vercel, ensuring both frontend and backend work properly.

## Files Created/Modified
- ✅ `vercel.json` - Vercel configuration file
- ✅ `env.example` - Environment variables template
- ✅ `server.js` - Modified for Vercel compatibility

## Step-by-Step Deployment

### 1. Prepare Your Repository
Make sure all files are committed to your Git repository:
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your project:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? `Y`
   - Which scope? (Choose your account)
   - Link to existing project? `N`
   - Project name: `proeduvate-employee-portal` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings? `N`

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect it's a Node.js project

### 3. Configure Environment Variables

In your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add the following variables:

#### Required Variables:
```
NODE_ENV = production
PORT = 3000
BASE_URL = https://your-app-name.vercel.app
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/Proeduvate?retryWrites=true&w=majority
LOGIN_USERNAME = Login@proEduvate
LOGIN_PASSWORD = Pass@proEduvate
SESSION_SECRET = your-super-secret-session-key-here
ALLOWED_ORIGINS = https://your-app-name.vercel.app
```

#### Optional Variables:
```
MAX_FILE_SIZE = 5242880
MAX_FILES = 10
```

### 4. MongoDB Atlas Setup (if not already done)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster if you don't have one
3. Create a database user
4. Whitelist Vercel's IP ranges or use `0.0.0.0/0` for all IPs
5. Get your connection string and use it as `MONGODB_URI`

### 5. Redeploy After Environment Variables
After setting environment variables, redeploy:
```bash
vercel --prod
```

## Important Notes

### File Uploads
- Vercel has limitations on file uploads in serverless functions
- Files uploaded to `/uploads` directory are temporary and will be lost
- Consider using cloud storage (AWS S3, Cloudinary) for production file storage

### Session Storage
- Current setup uses memory-based sessions
- For production, consider using Redis or database-based sessions

### Database Connection
- MongoDB connection is configured for both local and cloud deployment
- Make sure your MongoDB Atlas cluster allows connections from Vercel

## Troubleshooting

### Common Issues:

1. **"Function Timeout" Error**
   - Vercel has a 10-second timeout for hobby plans
   - Consider upgrading to Pro plan for longer timeouts

2. **MongoDB Connection Issues**
   - Check your MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has proper permissions

3. **CORS Errors**
   - Update `ALLOWED_ORIGINS` with your actual Vercel domain
   - Check that your frontend is making requests to the correct backend URL

4. **Environment Variables Not Working**
   - Make sure variables are set in Vercel dashboard
   - Redeploy after adding new variables
   - Check variable names match exactly (case-sensitive)

### Testing Your Deployment:

1. **Test Backend API:**
   ```bash
   curl https://your-app-name.vercel.app/api/config
   ```

2. **Test Frontend:**
   - Visit `https://your-app-name.vercel.app`
   - Try submitting the employee form
   - Test admin login at `https://your-app-name.vercel.app/admin-login`

3. **Check Logs:**
   - Go to Vercel dashboard → Functions tab
   - Check function logs for any errors

## Production Recommendations

1. **Use a Custom Domain:**
   - Add your custom domain in Vercel dashboard
   - Update `BASE_URL` and `ALLOWED_ORIGINS` accordingly

2. **Enable HTTPS:**
   - Vercel automatically provides HTTPS
   - Update session cookie settings for production

3. **Monitor Performance:**
   - Use Vercel Analytics
   - Monitor function execution times
   - Set up error tracking

4. **File Storage:**
   - Implement cloud storage for file uploads
   - Consider using Vercel Blob or external services

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test MongoDB connection
4. Check CORS settings
5. Review this guide for common solutions

Your application should now be fully deployed with both frontend and backend working on Vercel!
