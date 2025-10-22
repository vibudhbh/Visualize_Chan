# 🔺 Convex Hull Algorithm Visualizer

An interactive web application for visualizing and understanding convex hull algorithms with step-by-step animations and educational content.

## 🎯 Overview

This project provides an interactive educational tool for learning convex hull algorithms. Users can generate point sets, select algorithms, and watch step-by-step visualizations that explain how each algorithm works.

### ✨ Features

- **🎮 Interactive Visualization**: Click to add points, generate random/circle patterns
- **📚 Educational Content**: Step-by-step explanations of algorithm logic
- **⚡ Real-time Animation**: Play, pause, step through algorithm execution
- **📊 Performance Comparison**: Compare all algorithms on the same dataset
- **🎨 Modern UI**: Clean, responsive design with intuitive workflow
- **🔧 Configurable**: Adjustable animation speed, point counts, API endpoints

## 🧮 Implemented Algorithms

All algorithms are implemented in Python within the Flask API (`api/app.py`) and provide step-by-step animation data for the frontend visualization.

| Algorithm | Time Complexity | Best For | Description |
|-----------|----------------|----------|-------------|
| **Graham's Scan** | O(n log n) | General purpose | Sorts points and builds upper/lower hulls |
| **Jarvis March** | O(nh) | Small hulls | "Gift wrapping" - finds next hull point iteratively |
| **Chan's Algorithm** | O(n log h) | Unknown hull size | Hybrid approach combining Graham's + Jarvis |
| **Incremental Hull** | O(n log h) | Online insertion | Builds hull by adding one point at a time |

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/convex-hull-visualizer.git
   cd convex-hull-visualizer
   ```

2. **Start the backend API**
   ```bash
   cd api
   pip install -r requirements.txt
   python app.py
   ```
   The API will run on `http://localhost:5001`

3. **Open the frontend**
   ```bash
   cd frontend
   # Open index.html in your browser or use a local server:
   python -m http.server 8000
   ```
   Navigate to `http://localhost:8000`

### Option 2: Quick Local Run

Use the provided script:
```bash
chmod +x run-local.sh
./run-local.sh
```

## 📁 Project Structure

```
convex-hull-visualizer/
├── 📁 frontend/                 # Web application
│   ├── index.html              # Main HTML file
│   ├── 📁 css/
│   │   └── modern-style.css    # Styling
│   └── 📁 js/
│       ├── modern-app.js       # Main application logic
│       ├── d3-visualizer.js    # D3.js visualization
│       ├── api-client.js       # API communication
│       ├── animation-controller.js # Animation controls
│       └── point-generator.js  # Point generation utilities
│
├── 📁 api/                     # Python Flask backend
│   ├── app.py                  # Main API server with all algorithms
│   ├── requirements.txt        # Python dependencies
│   └── README.md              # API documentation
│
├── 📄 README.md               # This file
├── 📄 DEPLOYMENT.md           # Deployment instructions
├── 📄 requirements.txt        # Root Python dependencies
└── 🔧 run-local.sh           # Quick start script
```

## 🎮 How to Use

### 1. Generate Points
- **Random Points**: Click "Generate Random" for scattered points
- **Circle Points**: Click "Generate Circle" for points on a circle
- **Manual Points**: Click directly on the visualization canvas
- **Point Count**: Select from 5 to 500 points using the dropdown

### 2. Choose Algorithm
- Select one of the four convex hull algorithms
- Each shows its time complexity and characteristics
- Graham's Scan is selected by default

### 3. Run Visualization
- Click "Run Algorithm" to start the step-by-step animation
- Use playback controls to pause, step forward/backward
- Adjust animation speed with the slider
- Click "Compare All" to benchmark all algorithms

### 4. Learn and Explore
- Read the step-by-step explanations in the right panel
- Observe how different algorithms approach the same problem
- Try different point distributions to see algorithm behavior

## 🛠️ Development

### Frontend Technologies
- **Vanilla JavaScript**: No frameworks, pure JS for performance
- **D3.js**: Data visualization and SVG manipulation
- **Modern CSS**: CSS Grid, Flexbox, custom properties
- **Responsive Design**: Works on desktop and mobile

### Backend Technologies
- **Python 3.8+**: Core language
- **Flask**: Lightweight web framework
- **NumPy**: Numerical computations
- **CORS**: Cross-origin resource sharing

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/graham` | POST | Run Graham's Scan algorithm |
| `/jarvis` | POST | Run Jarvis March algorithm |
| `/chan` | POST | Run Chan's Algorithm |
| `/incremental` | POST | Run Incremental Hull algorithm |
| `/compare` | POST | Compare all algorithms |
| `/health` | GET | API health check |

### Request Format
```json
{
  "points": [
    {"x": 10, "y": 4},
    {"x": 7, "y": 2},
    {"x": 8, "y": 1}
  ]
}
```

### Response Format
```json
{
  "algorithm": "graham",
  "hull": [{"x": 6, "y": -1}, {"x": 15, "y": 1}],
  "steps": [...],
  "stats": {
    "execution_time_ms": 1.23,
    "hull_size": 6,
    "step_count": 15
  }
}
```

## 🎓 Educational Content

### Algorithm Explanations
Each algorithm includes detailed explanations:
- **Why it works**: Mathematical foundation
- **How it works**: Step-by-step process
- **When to use it**: Best use cases and trade-offs

### Complexity Analysis
- Visual comparison of time complexities
- Real-world performance measurements
- Input size vs. execution time graphs

### Interactive Learning
- Hover over points to see coordinates
- Click through algorithm steps manually
- Compare different approaches on same data

## 🚀 Deployment

### Local Development
```bash
# Backend
cd api && python app.py

# Frontend (choose one)
cd frontend && python -m http.server 8000
# OR open index.html directly in browser
```

### Production Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on:
- Heroku deployment
- Docker containerization
- Static site hosting (Netlify, Vercel)
- Custom server setup

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Areas for Contribution
- 🎨 **UI/UX Improvements**: Better animations, mobile responsiveness
- 🧮 **New Algorithms**: QuickHull, Divide & Conquer, 3D hulls
- 📚 **Educational Content**: More detailed explanations, exercises
- 🔧 **Performance**: Algorithm optimizations, better visualizations
- 🐛 **Bug Fixes**: Report and fix issues

## 📚 Learning Resources

### Computational Geometry
- [Computational Geometry: Algorithms and Applications](https://www.cs.uu.nl/geobook/)
- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms-third-edition)

### Algorithm Visualizations
- [VisuAlgo - Convex Hull](https://visualgo.net/en/convexhull)
- [Algorithm Visualizer](https://algorithm-visualizer.org/)

### Research Papers
- Graham, R.L. (1972). "An Efficient Algorithm for Determining the Convex Hull"
- Jarvis, R.A. (1973). "On the Identification of the Convex Hull"
- Chan, T.M. (1996). "Optimal Output-Sensitive Convex Hull Algorithms"

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **D3.js Community**: For the amazing visualization library
- **Computational Geometry Textbooks**: For algorithm implementations
- **Educational Visualization Tools**: For inspiration on interactive learning
- **Open Source Community**: For tools and libraries that made this possible

## 📞 Support

- 🐛 **Bug Reports**: [Open an issue](https://github.com/yourusername/convex-hull-visualizer/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/yourusername/convex-hull-visualizer/discussions)
- 📧 **Contact**: [your.email@example.com](mailto:your.email@example.com)

---

**Made with ❤️ for computational geometry education**

⭐ **Star this repo if you found it helpful!**