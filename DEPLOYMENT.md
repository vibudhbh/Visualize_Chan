# Deployment Guide

## 🚀 Deployed Application

- **Frontend (GitHub Pages)**: Will be at `https://[your-username].github.io/[repo-name]/`
- **Backend API (Railway)**: `https://visualizechan-production.up.railway.app`

## 📋 GitHub Pages Deployment Steps

### Deploy from `docs` folder

✅ **Frontend files are already copied to the `docs` folder!**

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure for Railway API and GitHub Pages deployment"
   git push origin main
   ```

2. **Configure GitHub Pages**:
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under **Source**, select **"Deploy from a branch"**
   - Under **Branch**, select **`main`** and **`/docs`** folder
   - Click **Save**

3. **Wait for deployment** (usually 1-2 minutes)
   - GitHub will build and deploy your site
   - Your site will be available at: `https://[your-username].github.io/[repo-name]/`
   - Check the **Actions** tab to see deployment progress

## 🔧 Configuration Details

### API Configuration
The frontend is now configured to use your Railway API:
- **API URL**: `https://visualizechan-production.up.railway.app`
- **CORS**: Already enabled in Flask backend
- **Endpoints**: All algorithm endpoints are accessible

### Files Updated
- ✅ `frontend/js/api-client.js` - Updated to use Railway API URL
- ✅ `api/app.py` - CORS already configured
- ✅ All frontend files ready for static hosting

## 🧪 Testing Your Deployment

After deployment, test your site:

1. **Visit your GitHub Pages URL**
2. **Check API connection** - Should show "Connected" in the UI
3. **Test an algorithm**:
   - Generate some points
   - Select an algorithm (e.g., Graham's Scan)
   - Click "Run Visualization"
   - Verify the visualization works

## 🐛 Troubleshooting

### API Connection Issues
If you see "API Disconnected":
- Check that your Railway service is running
- Verify the API URL in `frontend/js/api-client.js`
- Check browser console for CORS errors

### GitHub Pages Not Loading
- Wait 2-3 minutes after enabling GitHub Pages
- Check the Actions tab for build status
- Ensure the correct branch and folder are selected

### CORS Errors
If you see CORS errors in the browser console:
- Verify `flask_cors` is installed on Railway
- Check that `CORS(app)` is in your `api/app.py`
- Redeploy your Railway service if needed

## 📝 Custom Domain (Optional)

To use a custom domain:

1. **For GitHub Pages**:
   - Add a `CNAME` file in your frontend folder
   - Configure DNS settings with your domain provider

2. **For Railway API**:
   - Go to Railway dashboard → Settings → Domains
   - Add your custom domain
   - Update the API URL in `frontend/js/api-client.js`

## 🔄 Updating Your Deployment

### Update Frontend:
```bash
git add frontend/
git commit -m "Update frontend"
git push origin main
```
GitHub Pages will automatically redeploy.

### Update Backend:
```bash
git add api/
git commit -m "Update API"
git push origin main
```
Railway will automatically redeploy if connected to your repo.

## ✅ Deployment Checklist

- [x] Railway API deployed and accessible
- [x] Frontend configured with Railway API URL
- [x] CORS enabled on backend
- [ ] Code pushed to GitHub
- [ ] GitHub Pages configured
- [ ] Site tested and working
- [ ] All algorithms tested
- [ ] Educational modals working

## 🎉 Success!

Once deployed, your Convex Hull Visualizer will be:
- **Publicly accessible** via GitHub Pages
- **Fully functional** with Railway backend
- **Educational** with algorithm information modals
- **Interactive** with real-time visualizations

Share your deployed site with students and developers! 🚀
