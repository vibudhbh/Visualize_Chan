#!/usr/bin/env python3
"""
Flask API for Convex Hull Algorithms
Self-contained implementation with all algorithms included
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import math
import time
import traceback
from typing import List, Tuple, Dict, Any

# Global variables to store animation steps
graham_steps = []
jarvis_steps = []
chan_steps = []
incremental_steps = []

def cross_product(o: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Calculate cross product of vectors OA and OB"""
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def distance_squared(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate squared distance between two points"""
    return (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2

def grahams_scan(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Graham's Scan algorithm for convex hull"""
    global graham_steps
    graham_steps = []
    
    if len(points) < 3:
        return points
    
    # Sort points by x-coordinate (and by y-coordinate in case of tie)
    sorted_points = sorted(points, key=lambda p: (p[0], p[1]))
    
    # Build lower hull
    lower = []
    for p in sorted_points:
        while len(lower) >= 2 and cross_product(lower[-2], lower[-1], p) <= 0:
            popped = lower.pop()
            graham_steps.append({
                'type': 'lower_hull',
                'phase': 'popping',
                'current_point': p,
                'popped_point': popped,
                'current_hull': lower.copy(),
                'description': f'Removing point {popped} - creates inward turn'
            })
        lower.append(p)
        graham_steps.append({
            'type': 'lower_hull', 
            'phase': 'added',
            'current_point': p,
            'current_hull': lower.copy(),
            'description': f'Added point {p} to lower hull'
        })
    
    # Build upper hull
    upper = []
    for p in reversed(sorted_points):
        while len(upper) >= 2 and cross_product(upper[-2], upper[-1], p) <= 0:
            popped = upper.pop()
            graham_steps.append({
                'type': 'upper_hull',
                'phase': 'popping', 
                'current_point': p,
                'popped_point': popped,
                'current_hull': upper.copy(),
                'description': f'Removing point {popped} - creates inward turn'
            })
        upper.append(p)
        graham_steps.append({
            'type': 'upper_hull',
            'phase': 'added',
            'current_point': p, 
            'current_hull': upper.copy(),
            'description': f'Added point {p} to upper hull'
        })
    
    # Remove last point of each half because it's repeated
    hull = lower[:-1] + upper[:-1]
    
    graham_steps.append({
        'type': 'complete',
        'final_hull': hull,
        'description': f'Graham\'s Scan complete - hull has {len(hull)} vertices'
    })
    
    return hull

def jarvis_march(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Jarvis March (Gift Wrapping) algorithm"""
    global jarvis_steps
    jarvis_steps = []
    
    if len(points) < 3:
        return points
    
    # Find the leftmost point
    leftmost = min(points, key=lambda p: (p[0], p[1]))
    hull = []
    current = leftmost
    
    while True:
        hull.append(current)
        jarvis_steps.append({
            'type': 'jarvis_step',
            'current_point': current,
            'hull_so_far': hull.copy(),
            'description': f'Starting from point {current}'
        })
        
        next_point = points[0]
        for candidate in points:
            if candidate == current:
                continue
                
            jarvis_steps.append({
                'type': 'testing',
                'current_point': current,
                'candidate': candidate,
                'next_point': next_point,
                'hull_so_far': hull.copy(),
                'description': f'Testing candidate {candidate}'
            })
            
            cross = cross_product(current, next_point, candidate)
            if next_point == current or cross > 0 or (cross == 0 and distance_squared(current, candidate) > distance_squared(current, next_point)):
                next_point = candidate
        
        current = next_point
        if current == leftmost:  # Completed the hull
            break
    
    jarvis_steps.append({
        'type': 'complete',
        'final_hull': hull,
        'description': f'Jarvis March complete - hull has {len(hull)} vertices'
    })
    
    return hull

def chans_algorithm(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Chan's Algorithm - hybrid approach"""
    global chan_steps
    chan_steps = []
    
    if len(points) < 3:
        return points
    
    n = len(points)
    
    # Try different values of m = 2^(2^t)
    for t in range(1, int(math.log2(math.log2(n))) + 2):
        m = 2 ** (2 ** t)
        if m >= n:
            m = n
        
        chan_steps.append({
            'type': 'trying_m',
            'm': m,
            'description': f'Trying m = {m}'
        })
        
        # Divide points into groups of size m
        groups = [points[i:i+m] for i in range(0, n, m)]
        mini_hulls = []
        
        # Compute convex hull of each group using Graham's scan
        for i, group in enumerate(groups):
            if len(group) >= 3:
                mini_hull = grahams_scan(group)
            else:
                mini_hull = group
            mini_hulls.append(mini_hull)
            
            chan_steps.append({
                'type': 'mini_hull',
                'group_idx': i,
                'num_groups': len(groups),
                'mini_hull': mini_hull,
                'all_mini_hulls': mini_hulls.copy(),
                'description': f'Computed mini-hull {i+1}/{len(groups)} with {len(mini_hull)} points'
            })
        
        # Use Jarvis march to find the overall hull
        leftmost = min(points, key=lambda p: (p[0], p[1]))
        hull = []
        current = leftmost
        
        for step in range(m):  # At most m steps
            hull.append(current)
            
            chan_steps.append({
                'type': 'jarvis_phase',
                'current_point': current,
                'hull_so_far': hull.copy(),
                'step': step,
                'max_steps': m,
                'description': f'Jarvis phase step {step+1}/{m}'
            })
            
            next_point = None
            
            # Find the most counter-clockwise point from all mini-hulls
            for mini_hull in mini_hulls:
                for candidate in mini_hull:
                    if candidate == current:
                        continue
                    if next_point is None or cross_product(current, next_point, candidate) > 0:
                        next_point = candidate
            
            if next_point == leftmost:  # Completed the hull
                chan_steps.append({
                    'type': 'complete',
                    'final_hull': hull,
                    'description': f'Chan\'s Algorithm complete with m={m} - hull has {len(hull)} vertices'
                })
                return hull
            
            current = next_point
        
        # If we used all m steps without completing, try larger m
        chan_steps.append({
            'type': 'failed_m',
            'm': m,
            'description': f'Failed with m={m}, trying larger value'
        })
    
    # Fallback to Graham's scan if Chan's fails
    return grahams_scan(points)

def incremental_convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Incremental convex hull algorithm - simplified to use Graham's scan approach"""
    global incremental_steps
    incremental_steps = []
    
    if len(points) < 3:
        return points
    
    # For simplicity and correctness, we'll build the hull incrementally
    # by maintaining a sorted order and using a similar approach to Graham's scan
    
    # Sort points by x-coordinate
    sorted_points = sorted(points, key=lambda p: (p[0], p[1]))
    
    # Start with first point
    hull = [sorted_points[0]]
    
    incremental_steps.append({
        'type': 'seed',
        'initial_hull': hull.copy(),
        'description': f'Starting with leftmost point: {hull[0]}'
    })
    
    # Add points one by one
    for i, point in enumerate(sorted_points[1:], 1):
        # Check if we need to add this point
        if len(hull) < 2:
            hull.append(point)
            incremental_steps.append({
                'type': 'added',
                'point': point,
                'hull_after': hull.copy(),
                'description': f'Added point {point} - hull now has {len(hull)} points'
            })
            continue
        
        # For incremental construction, we'll use a simplified approach
        # Add the point and then clean up the hull
        hull.append(point)
        
        # Remove points that create inward turns (similar to Graham's scan)
        while len(hull) >= 3:
            # Check the last three points
            if cross_product(hull[-3], hull[-2], hull[-1]) <= 0:
                # Remove the middle point as it creates an inward turn
                removed = hull.pop(-2)
                incremental_steps.append({
                    'type': 'removed',
                    'point': point,
                    'removed_point': removed,
                    'hull_after': hull.copy(),
                    'description': f'Removed {removed} - created inward turn'
                })
            else:
                break
        
        incremental_steps.append({
            'type': 'added',
            'point': point,
            'hull_after': hull.copy(),
            'description': f'Added point {point} - hull now has {len(hull)} points'
        })
    
    # Now we have the lower hull, we need to build the upper hull
    # Start from the rightmost point and go back
    upper_hull = []
    for point in reversed(sorted_points):
        while len(upper_hull) >= 2 and cross_product(upper_hull[-2], upper_hull[-1], point) <= 0:
            upper_hull.pop()
        upper_hull.append(point)
    
    # Combine lower and upper hulls, removing duplicate endpoints
    if len(hull) > 1 and len(upper_hull) > 1:
        # Remove the last point of lower hull and first point of upper hull (they're the same)
        full_hull = hull[:-1] + upper_hull[:-1]
    else:
        full_hull = hull + upper_hull
    
    # Remove duplicates while preserving order
    final_hull = []
    for point in full_hull:
        if point not in final_hull:
            final_hull.append(point)
    
    incremental_steps.append({
        'type': 'complete',
        'final_hull': final_hull,
        'description': f'Incremental hull complete - {len(final_hull)} vertices'
    })
    
    return final_hull

app = Flask(__name__)
CORS(app)  # Enable CORS for GitHub Pages

# Global variables to store animation steps
current_steps = []

def reset_animation_steps():
    """Reset all global animation step variables"""
    global graham_steps, jarvis_steps, chan_steps, incremental_steps
    graham_steps = []
    jarvis_steps = []
    chan_steps = []
    incremental_steps = []

def points_from_request(data: Dict) -> List[Tuple[float, float]]:
    """Convert request data to points format expected by algorithms"""
    points = data.get('points', [])
    if not points:
        raise ValueError("No points provided")
    
    # Convert from [{x: 1, y: 2}, ...] to [(1, 2), ...]
    converted_points = []
    for point in points:
        if isinstance(point, dict):
            x = float(point.get('x', 0))
            y = float(point.get('y', 0))
            converted_points.append((x, y))
        elif isinstance(point, (list, tuple)) and len(point) >= 2:
            converted_points.append((float(point[0]), float(point[1])))
        else:
            raise ValueError(f"Invalid point format: {point}")
    
    return converted_points

def format_response(hull: List[Tuple[float, float]], steps: List[Dict], 
                   algorithm: str, execution_time: float) -> Dict:
    """Format the response for the frontend"""
    return {
        'success': True,
        'algorithm': algorithm,
        'hull': [{'x': p[0], 'y': p[1]} for p in hull],
        'steps': steps,
        'stats': {
            'hull_size': len(hull),
            'step_count': len(steps),
            'execution_time_ms': execution_time * 1000,
            'algorithm': algorithm
        }
    }

@app.route('/', methods=['GET'])
def home():
    """API information endpoint"""
    return jsonify({
        'name': 'Convex Hull Algorithms API',
        'version': '1.0.0',
        'algorithms': ['graham', 'jarvis', 'incremental', 'chan'],
        'endpoints': {
            '/graham': 'POST - Graham\'s Scan algorithm',
            '/jarvis': 'POST - Jarvis March algorithm', 
            '/incremental': 'POST - Incremental Hull algorithm',
            '/chan': 'POST - Chan\'s algorithm',
            '/compare': 'POST - Compare multiple algorithms'
        }
    })

@app.route('/graham', methods=['POST'])
def graham_scan_endpoint():
    """Graham's Scan algorithm endpoint"""
    try:
        reset_animation_steps()
        data = request.get_json()
        points = points_from_request(data)
        
        if len(points) < 3:
            return jsonify({'success': False, 'error': 'Need at least 3 points'})
        
        import time
        start_time = time.time()
        
        hull = grahams_scan(points)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Convert animation steps to frontend format
        steps = []
        for step in graham_steps:
            formatted_step = {}
            for key, value in step.items():
                if isinstance(value, tuple):
                    formatted_step[key] = {'x': value[0], 'y': value[1]}
                elif isinstance(value, list) and value and isinstance(value[0], tuple):
                    formatted_step[key] = [{'x': p[0], 'y': p[1]} for p in value]
                else:
                    formatted_step[key] = value
            steps.append(formatted_step)
        
        return jsonify(format_response(hull, steps, 'graham', execution_time))
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/jarvis', methods=['POST'])
def jarvis_march_endpoint():
    """Jarvis March algorithm endpoint"""
    try:
        reset_animation_steps()
        data = request.get_json()
        points = points_from_request(data)
        
        if len(points) < 3:
            return jsonify({'success': False, 'error': 'Need at least 3 points'})
        
        import time
        start_time = time.time()
        
        hull = jarvis_march(points)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Convert animation steps to frontend format
        steps = []
        for step in jarvis_steps:
            formatted_step = {}
            for key, value in step.items():
                if isinstance(value, tuple):
                    formatted_step[key] = {'x': value[0], 'y': value[1]}
                elif isinstance(value, list) and value and isinstance(value[0], tuple):
                    formatted_step[key] = [{'x': p[0], 'y': p[1]} for p in value]
                else:
                    formatted_step[key] = value
            steps.append(formatted_step)
        
        return jsonify(format_response(hull, steps, 'jarvis', execution_time))
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/chan', methods=['POST'])
def chan_algorithm_endpoint():
    """Chan's algorithm endpoint"""
    try:
        reset_animation_steps()
        data = request.get_json()
        points = points_from_request(data)
        
        if len(points) < 3:
            return jsonify({'success': False, 'error': 'Need at least 3 points'})
        
        import time
        start_time = time.time()
        
        hull = chans_algorithm(points)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Convert animation steps to frontend format
        steps = []
        for step in chan_steps:
            formatted_step = {}
            for key, value in step.items():
                if isinstance(value, tuple):
                    formatted_step[key] = {'x': value[0], 'y': value[1]}
                elif isinstance(value, list) and value:
                    if isinstance(value[0], tuple):
                        # List of tuples (points)
                        formatted_step[key] = [{'x': p[0], 'y': p[1]} for p in value]
                    elif isinstance(value[0], list):
                        # List of lists (like all_mini_hulls)
                        formatted_step[key] = []
                        for sublist in value:
                            if sublist and isinstance(sublist[0], tuple):
                                formatted_step[key].append([{'x': p[0], 'y': p[1]} for p in sublist])
                            else:
                                formatted_step[key].append(sublist)
                    else:
                        formatted_step[key] = value
                else:
                    formatted_step[key] = value
            steps.append(formatted_step)
        
        return jsonify(format_response(hull, steps, 'chan', execution_time))
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/incremental', methods=['POST'])
def incremental_hull_endpoint():
    """Incremental Hull algorithm endpoint"""
    try:
        reset_animation_steps()
        data = request.get_json()
        points = points_from_request(data)
        
        if len(points) < 3:
            return jsonify({'success': False, 'error': 'Need at least 3 points'})
        
        import time
        start_time = time.time()
        
        # Run incremental hull
        hull = incremental_convex_hull(points)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Convert animation steps to frontend format
        steps = []
        for step in incremental_steps:
            formatted_step = {}
            for key, value in step.items():
                if isinstance(value, tuple):
                    formatted_step[key] = {'x': value[0], 'y': value[1]}
                elif isinstance(value, list) and value and isinstance(value[0], tuple):
                    formatted_step[key] = [{'x': p[0], 'y': p[1]} for p in value]
                else:
                    formatted_step[key] = value
            steps.append(formatted_step)
        
        return jsonify(format_response(hull, steps, 'incremental', execution_time))
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/compare', methods=['POST'])
def compare_algorithms():
    """Compare multiple algorithms on the same dataset"""
    try:
        data = request.get_json()
        points = points_from_request(data)
        algorithms = data.get('algorithms', ['graham', 'jarvis', 'chan', 'incremental'])
        
        if len(points) < 3:
            return jsonify({'success': False, 'error': 'Need at least 3 points'})
        
        results = {}
        
        for algorithm in algorithms:
            if algorithm == 'graham':
                reset_animation_steps()
                import time
                start_time = time.time()
                hull = grahams_scan(points)
                end_time = time.time()
                
                results[algorithm] = {
                    'hull': [{'x': p[0], 'y': p[1]} for p in hull],
                    'execution_time_ms': (end_time - start_time) * 1000,
                    'step_count': len(graham_steps),
                    'hull_size': len(hull)
                }
                
            elif algorithm == 'jarvis':
                reset_animation_steps()
                import time
                start_time = time.time()
                hull = jarvis_march(points)
                end_time = time.time()
                
                results[algorithm] = {
                    'hull': [{'x': p[0], 'y': p[1]} for p in hull],
                    'execution_time_ms': (end_time - start_time) * 1000,
                    'step_count': len(jarvis_steps),
                    'hull_size': len(hull)
                }
                
            elif algorithm == 'chan':
                reset_animation_steps()
                import time
                start_time = time.time()
                hull = chans_algorithm(points)
                end_time = time.time()
                
                results[algorithm] = {
                    'hull': [{'x': p[0], 'y': p[1]} for p in hull],
                    'execution_time_ms': (end_time - start_time) * 1000,
                    'step_count': len(chan_steps),
                    'hull_size': len(hull)
                }
                
            elif algorithm == 'incremental':
                reset_animation_steps()
                import time
                start_time = time.time()
                hull = incremental_convex_hull(points)
                end_time = time.time()
                
                results[algorithm] = {
                    'hull': [{'x': p[0], 'y': p[1]} for p in hull],
                    'execution_time_ms': (end_time - start_time) * 1000,
                    'step_count': len(incremental_steps),
                    'hull_size': len(hull)
                }
        
        return jsonify({
            'success': True,
            'results': results,
            'input_size': len(points)
        })
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))  # Changed default from 5000 to 5001
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Convex Hull API on port {port}")
    print(f"Debug mode: {debug}")
    print("\nAvailable endpoints:")
    print("  GET  /          - API information")
    print("  POST /graham    - Graham's Scan")
    print("  POST /jarvis    - Jarvis March") 
    print("  POST /chan      - Chan's Algorithm")
    print("  POST /compare   - Compare algorithms")
    print("  GET  /health    - Health check")
    
    app.run(host='0.0.0.0', port=port, debug=debug)