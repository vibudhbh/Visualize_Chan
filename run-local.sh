#!/bin/bash

echo "🔺 Convex Hull Visualizer - Local Testing"
echo "========================================"

# Check if required files exist
echo "🔍 Checking required files..."

required_files=("api/app.py" "api/requirements.txt" "frontend/index.html" "frontend/js/modern-app.js" "frontend/css/modern-style.css")
missing_files=()

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file"
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Missing ${#missing_files[@]} required files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please ensure all files are in place before running."
    exit 1
fi

echo ""
echo "✅ All required files found!"
echo ""
echo "🚀 To test locally, run these commands in separate terminals:"
echo ""
echo "Terminal 1 (API Server):"
echo "   cd api"
echo "   pip install -r requirements.txt"
echo "   python app.py"
echo ""
echo "Terminal 2 (Frontend Server):"
echo "   cd frontend"
echo "   python -m http.server 8080"
echo ""
echo "Then open: http://localhost:8080"
echo ""
echo "🎯 Quick Test Checklist:"
echo "   1. ✅ API shows 'Running on http://127.0.0.1:5001'"
echo "   2. ✅ Frontend shows 'Serving HTTP on 0.0.0.0 port 8080'"
echo "   3. ✅ Browser opens to convex hull visualizer"
echo "   4. ✅ Click 'Test Connection' → shows 'Connected'"
echo "   5. ✅ Generate points and run algorithms"
echo ""