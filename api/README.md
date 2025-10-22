# Convex Hull Algorithms API

Flask API backend for the Convex Hull Algorithm Visualizer. This API provides REST endpoints for executing convex hull algorithms using the existing Python implementations.

## 🚀 Features

- **REST API** for convex hull algorithms
- **CORS enabled** for frontend integration
- **Step-by-step data** for visualization
- **Performance metrics** and timing
- **Algorithm comparison** endpoint
- **Health check** endpoint

## 📁 Structure

```
api/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── Procfile           # Heroku deployment config
└── README.md          # This file
```

## 🛠️ Setup

### Local Development

1. **Install dependencies**:
   ```bash
   cd api
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```bash
   python app.py
   ```

3. **API will be available** at http://localhost:5000

### Production Deployment

#### Heroku

1. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```

2. **Deploy**:
   ```bash
   git subtree push --prefix api heroku main
   ```

#### Railway

1. **Connect repository** to Railway
2. **Set root directory** to `api`
3. **Deploy** automatically

#### Other Platforms

The API is compatible with any platform that supports Python/Flask:
- **Render**
- **PythonAnywhere** 
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns API health status.

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

### API Information
```
GET /
```
Returns API information and available endpoints.

### Graham's Scan
```
POST /graham
```
Execute Graham's Scan algorithm.

**Request:**
```json
{
  "points": [
    {"x": 10, "y": 20},
    {"x": 30, "y": 40},
    {"x": 50, "y": 10}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "algorithm": "graham",
  "hull": [
    {"x": 10, "y": 20},
    {"x": 50, "y": 10},
    {"x": 30, "y": 40}
  ],
  "steps": [
    {
      "type": "upper_hull",
      "phase": "processing",
      "currentPoint": {"x": 10, "y": 20},
      "pointIndex": 0,
      "upperHull": [],
      "lowerHull": []
    }
  ],
  "stats": {
    "hull_size": 3,
    "step_count": 15,
    "execution_time_ms": 2.5,
    "algorithm": "graham"
  }
}
```

### Jarvis March
```
POST /jarvis
```
Execute Jarvis March (Gift Wrapping) algorithm.

### Chan's Algorithm
```
POST /chan
```
Execute Chan's Algorithm.

### Compare Algorithms
```
POST /compare
```
Compare multiple algorithms on the same dataset.

**Request:**
```json
{
  "points": [...],
  "algorithms": ["graham", "jarvis", "chan"]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "graham": {
      "hull": [...],
      "execution_time_ms": 2.5,
      "step_count": 15,
      "hull_size": 4
    },
    "jarvis": {
      "hull": [...],
      "execution_time_ms": 5.2,
      "step_count": 28,
      "hull_size": 4
    }
  },
  "input_size": 20
}
```

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 5000)
- `DEBUG` - Debug mode (default: False)

### CORS Configuration

CORS is enabled for all origins to support frontend deployment on GitHub Pages. In production, you may want to restrict this to specific domains.

## 🐛 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "traceback": "Detailed traceback (in debug mode)"
}
```

Common error codes:
- **400** - Bad Request (invalid input)
- **500** - Internal Server Error
- **501** - Not Implemented (for incremental algorithm)

## 📊 Performance

The API includes timing information for all algorithm executions:

- **Execution time** in milliseconds
- **Step count** for visualization
- **Hull size** for analysis

## 🔒 Security

### Production Considerations

1. **Disable debug mode** in production
2. **Configure CORS** for specific domains
3. **Add rate limiting** if needed
4. **Use HTTPS** for secure communication
5. **Validate input data** thoroughly

### Input Validation

The API validates:
- **Point format** (x, y coordinates)
- **Minimum points** (3 required for hull)
- **Data types** (numeric coordinates)

## 🧪 Testing

### Manual Testing

Test the API using curl:

```bash
# Health check
curl http://localhost:5000/health

# Run Graham's Scan
curl -X POST http://localhost:5000/graham \
  -H "Content-Type: application/json" \
  -d '{"points": [{"x": 0, "y": 0}, {"x": 1, "y": 1}, {"x": 2, "y": 0}]}'
```

### Frontend Integration

The API is designed to work with the frontend application. Make sure:

1. **CORS is enabled** for your frontend domain
2. **API URL is configured** in the frontend
3. **All endpoints respond** with expected format

## 🚀 Deployment

### Heroku Deployment

1. **Create Procfile** (already included):
   ```
   web: gunicorn app:app
   ```

2. **Deploy**:
   ```bash
   git subtree push --prefix api heroku main
   ```

### Railway Deployment

1. **Connect repository**
2. **Set root directory** to `api`
3. **Deploy automatically**

### Environment Setup

Make sure your deployment platform has:
- **Python 3.7+**
- **pip** for package installation
- **Access to requirements.txt**

## 🤝 Contributing

1. **Test locally** before submitting changes
2. **Follow Python PEP 8** style guidelines
3. **Add error handling** for new endpoints
4. **Update documentation** for API changes

## 📄 Dependencies

- **Flask 2.3.3** - Web framework
- **Flask-CORS 4.0.0** - CORS support
- **gunicorn 21.2.0** - WSGI server for production

## 🔗 Integration

This API is designed to work with:
- **Frontend application** (GitHub Pages)
- **Existing Python algorithms** (graham_scan.py, jarvis_march.py, chan.py)
- **Any HTTP client** that can make POST requests

The API serves as a bridge between your tested Python implementations and a modern web frontend.