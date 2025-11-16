# Convex Hull Algorithm Visualizer

An interactive educational tool for visualizing and understanding convex hull algorithms with real-time step-by-step animations.

## 🌟 Features

- **4 Algorithm Implementations**:
  - Graham's Scan (O(n log n))
  - Jarvis March (O(n×h))
  - Chan's Algorithm (O(n log h)) with binary search optimization
  - Incremental Hull (O(n log h))

- **Interactive Visualizations**:
  - Real-time D3.js animations
  - Step-by-step algorithm execution
  - Color-coded visual feedback
  - Adjustable animation speed

- **Educational Content**:
  - Algorithm information modals
  - Complexity analysis
  - Implementation details
  - Usage recommendations

- **Performance Comparison**:
  - Side-by-side algorithm comparison
  - Execution time measurements
  - Performance insights

## 🚀 Live Demo

- **Frontend**: [Your GitHub Pages URL]
- **API**: https://visualizechan-production.up.railway.app

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- D3.js for visualizations
- Responsive design

### Backend
- Python 3.x
- Flask web framework
- Flask-CORS for cross-origin requests
- Optimized algorithm implementations

## 📦 Local Development

### Prerequisites
- Python 3.8+
- Modern web browser

### Setup

1. **Clone the repository**:
   ```bash
   git clone [your-repo-url]
   cd Visualize_Chan
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the API server**:
   ```bash
   python api/app.py
   ```

4. **Open the frontend**:
   - Open `frontend/index.html` in your browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     ```
   - Navigate to `http://localhost:8000/frontend/`

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Backend (Railway)**: ✅ Already deployed
2. **Frontend (GitHub Pages)**:
   - Push code to GitHub
   - Enable GitHub Pages in repository settings
   - Select `main` branch and `/frontend` folder

## 🎓 Educational Use

This visualizer is designed for:
- Computer Science students learning computational geometry
- Algorithm analysis and comparison
- Understanding time complexity in practice
- Interactive learning and exploration

## 🧮 Algorithm Implementations

### Graham's Scan
- Sorts points and uses stack-based approach
- Builds upper and lower hulls separately
- Uses left turn test for convexity

### Jarvis March
- Output-sensitive algorithm
- "Gift wrapping" approach
- Excellent for small hulls

### Chan's Algorithm
- Hybrid approach combining Graham's and Jarvis
- Iterative doubling for optimal parameter finding
- Binary search optimization for tangent finding
- Handles collinear points correctly

### Incremental Hull
- Processes points one at a time
- Binary search for tangent finding
- Good for streaming data

## 📊 Performance Characteristics

| Algorithm | Best Case | Average Case | Worst Case | Space |
|-----------|-----------|--------------|------------|-------|
| Graham's Scan | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Jarvis March | O(n) | O(n×h) | O(n²) | O(h) |
| Chan's Algorithm | O(n log h) | O(n log h) | O(n log h) | O(n) |
| Incremental Hull | O(n log n) | O(n log h) | O(n log n) | O(h) |

*where n = number of points, h = hull size*

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Improve documentation
- Optimize algorithms

## 📝 License

[Your License Here]

## 👏 Acknowledgments

- Algorithm implementations based on computational geometry principles
- D3.js for powerful visualizations
- Railway for backend hosting
- GitHub Pages for frontend hosting

## 📧 Contact

[Your Contact Information]

---

Built with ❤️ for computer science education
