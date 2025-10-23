#!/usr/bin/env python3
"""
Simple test to verify API is working
"""

import requests
import json

def test_api():
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Convex Hull API")
    print("=" * 30)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print(f"❌ Health check: FAILED ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Health check: FAILED ({e})")
        print("💡 Make sure API server is running: cd api && python3 app.py")
        return False
    
    # Test Graham's Scan
    try:
        test_points = [{"x": 0, "y": 0}, {"x": 1, "y": 1}, {"x": 2, "y": 0}]
        response = requests.post(
            f"{base_url}/graham", 
            json={"points": test_points},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "hull" in data:
                print("✅ Graham's Scan: PASSED")
                print(f"   Hull: {len(data['hull'])} points")
                print(f"   Steps: {len(data['steps'])} animation steps")
                return True
            else:
                print(f"❌ Graham's Scan: Invalid response")
                return False
        else:
            print(f"❌ Graham's Scan: FAILED ({response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Graham's Scan: FAILED ({e})")
        return False

if __name__ == "__main__":
    if test_api():
        print("\n🎉 API is working correctly!")
        print("📱 Now start frontend: cd frontend && python3 -m http.server 8080")
        print("🌐 Then open: http://localhost:8080")
    else:
        print("\n💥 API test failed!")
        print("🔧 Start API server: cd api && python3 app.py")