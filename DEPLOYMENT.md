# 🚀 Deployment Guide

This guide explains how to deploy the Convex Hull Visualizer using Flask API + GitHub Pages architecture.

## 📋 Architecture Overview

```
┌─────────────────┐    HTTP/CORS    ┌─────────────────┐
│   GitHub Pages  │ ◄──────────────► │   Flask API     │
│   (Frontend)    │                  │   (Backend)     │
│                 │                  │                 │
│ • HTML/CSS/JS   │                  │ • Python Code  │
│ • Static Files  │                  │ • Algorithms   │
│ • Free Hosting  │                  │ • REST API     │
└─────────────────┘                  └─────────────────┘
```

## 🎯 Benefits

- ✅ **Free frontend hosting** (GitHub Pages)
- ✅ **Use existing Python code** (no rewriting)
- ✅ **Scalable backend** (deploy to Heroku, Railway, etc.)
- ✅ **Easy maintenance** (separate concerns)
- ✅ **CORS enabled** (cross-origin requests)

## 📦 Step 1: Deploy the API Backend

### Option A: Heroku (Recommended)

1. **Create Heroku account** at https://heroku.com

2. **Install Heroku CLI**:
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

3. **Login to Heroku**:
   ```bash
   heroku login
   ```

4. **Create Heroku app**:
   ```bash
   heroku create your-convex-hull-api
   ```

5. **Deploy API**:
   ```bash
   # From your project root
   git subtree push --prefix api heroku main
   ```

6. **Your API will be available** at:
   ```
   https://your-convex-hull-api.herokuapp.com
   ```

### Option B: Railway

1. **Go to** https://railway.app
2. **Connect your GitHub repository**
3. **Set root directory** to `api`
4. **Deploy automatically**

### Option C: Render

1. **Go to** https://render.com
2. **Create new Web Service**
3. **Connect repository**
4. **Set:**
   - **Root Directory**: `api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

## 🌐 Step 2: Deploy the Frontend

### GitHub Pages (Recommended)

1. **Push your code** to GitHub repository

2. **Go to repository Settings** → Pages

3. **Configure source**:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (or your default branch)
   - **Folder**: `/frontend`

4. **Save** - GitHub will build and deploy your site

5. **Your frontend will be available** at:
   ```
   https://yourusername.github.io/your-repo-name
   ```

### Alternative: Netlify

1. **Go to** https://netlify.com
2. **Connect GitHub repository**
3. **Set build settings**:
   - **Base directory**: `frontend`
   - **Publish directory**: `frontend`
4. **Deploy**

### Alternative: Vercel

1. **Go to** https://vercel.com
2. **Import project** from GitHub
3. **Set root directory** to `frontend`
4. **Deploy**

## 🔧 Step 3: Configure API Connection

1. **Open your deployed frontend**

2. **Update API URL** in the configuration panel:
   ```
   https://your-convex-hull-api.herokuapp.com
   ```

3. **Test connection** using the "Test Connection" button

4. **Verify** all algorithms work correctly

## ✅ Step 4: Verification

### Test the Complete System

1. **Open frontend URL**
2. **Generate some points** (click "Generate Random")
3. **Select an algorithm** (Graham's Scan)
4. **Click "Run Algorithm"**
5. **Verify** the convex hull is computed and displayed
6. **Test animation controls** (play, step through)
7. **Try "Compare All"** to test multiple algorithms

### Expected Results

- ✅ Points appear on canvas
- ✅ Algorithm executes successfully
- ✅ Convex hull is drawn
- ✅ Animation controls work
- ✅ Step-by-step visualization works
- ✅ Performance metrics are shown

## 🛠️ Troubleshooting

### CORS Issues

If you see CORS errors in browser console:

1. **Check API CORS configuration** in `api/app.py`
2. **Verify** Flask-CORS is installed
3. **Ensure** API allows your frontend domain

### API Connection Failed

1. **Check API URL** is correct
2. **Verify API is deployed** and running
3. **Test API directly**:
   ```bash
   curl https://your-api-url.herokuapp.com/health
   ```

### Frontend Not Loading

1. **Check GitHub Pages settings**
2. **Verify** `/frontend` folder is set as source
3. **Check** for JavaScript errors in browser console

### Algorithm Errors

1. **Check API logs** on your hosting platform
2. **Verify** Python algorithm files are included
3. **Test** with simple point sets first

## 🔄 Updates and Maintenance

### Updating the API

```bash
# Make changes to api/ folder
git add api/
git commit -m "Update API"
git push origin main

# Deploy to Heroku
git subtree push --prefix api heroku main
```

### Updating the Frontend

```bash
# Make changes to frontend/ folder
git add frontend/
git commit -m "Update frontend"
git push origin main

# GitHub Pages will auto-deploy
```

## 📊 Monitoring

### API Monitoring

- **Heroku**: Check logs with `heroku logs --tail`
- **Railway**: View logs in dashboard
- **Render**: Check logs in service dashboard

### Frontend Monitoring

- **GitHub Pages**: Check Actions tab for deployment status
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Verify API requests are successful

## 🔒 Security Considerations

### Production Checklist

- [ ] **Disable debug mode** in API (`DEBUG=False`)
- [ ] **Configure CORS** for specific domains only
- [ ] **Use HTTPS** for both frontend and API
- [ ] **Add rate limiting** to API if needed
- [ ] **Validate all inputs** thoroughly
- [ ] **Monitor API usage** and logs

### Environment Variables

Set these in your API hosting platform:

```bash
DEBUG=False
PORT=5000
```

## 💰 Cost Considerations

### Free Tier Limits

- **GitHub Pages**: Free for public repositories
- **Heroku**: 550-1000 free hours/month
- **Railway**: $5/month after free trial
- **Render**: 750 hours/month free

### Scaling

If you need more resources:
- **Heroku**: Upgrade to paid dynos
- **Railway**: Pay-as-you-go pricing
- **Render**: Paid plans available

## 🎉 Success!

Once deployed, you'll have:

- ✅ **Professional web application** accessible worldwide
- ✅ **Educational tool** for convex hull algorithms
- ✅ **Interactive visualizations** with step-by-step animations
- ✅ **Algorithm comparisons** and performance metrics
- ✅ **Mobile-friendly** responsive design

Your Convex Hull Visualizer is now live and ready to help people learn about computational geometry! 🎊

## 🔗 Example URLs

After deployment, your URLs might look like:

- **Frontend**: https://yourusername.github.io/convex-hull-visualizer
- **API**: https://convex-hull-api.herokuapp.com
- **Health Check**: https://convex-hull-api.herokuapp.com/health

Share these URLs to let others explore convex hull algorithms interactively!