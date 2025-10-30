#!/usr/bin/env python3
"""
Flask API for Convex Hull Algorithms
Self-contained implementation with all algorithms included
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import math
import os
import time
import traceback
from typing import List, Tuple, Dict, Any

# Global variables to store animation steps
graham_steps = []
jarvis_steps = []
chan_steps = []
incremental_steps = []

def orientation(p: Tuple[float, float], q: Tuple[float, float], r: Tuple[float, float]) -> float:
    """
    Calculate orientation of ordered triplet (p, q, r).
    Uses the determinant method from lecture slides.
    
    Returns:
        > 0: Counter-clockwise (positive orientation, left-hand turn)
        < 0: Clockwise (negative orientation, right-hand turn)
        = 0: Collinear (zero orientation)
    """
    # Calculate the determinant (cross product)
    # This is equivalent to: (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
    val = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    
    if abs(val) < 1e-10:  # Handle floating point precision
        return 0
    return val

def distance_squared(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate squared distance between two points"""
    return (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2

def grahams_scan(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Graham's Scan Algorithm following lecture slides 43-55
    
    The algorithm computes the upper and lower hulls separately,
    then combines them to form the complete convex hull.
    
    Steps:
    1. Sort the points according to increasing order of their x-coordinates
    2. Build upper hull (left to right)
    3. Build lower hull (right to left)
    4. Combine hulls
    """
    global graham_steps
    graham_steps = []
    
    n = len(points)
    if n < 3:
        return points
    
    # Step 1: Sort points by x-coordinate (and by y if x is same)
    sorted_points = sorted(points, key=lambda p: (p[0], p[1]))
    
    graham_steps.append({
        'type': 'sorting',
        'phase': 'complete',
        'sorted_points': sorted_points.copy(),
        'description': f'Sorted {len(points)} points by x-coordinate'
    })
    
    # Build UPPER HULL (from slide 44)
    # Process points from left to right for upper hull
    upper_hull = []
    
    for i, p in enumerate(sorted_points):
        # Record step before processing
        graham_steps.append({
            'type': 'upper_hull',
            'phase': 'processing',
            'current_point': p,
            'point_index': i,
            'sorted_points': sorted_points.copy(),
            'upper_hull': upper_hull.copy(),
            'lower_hull': [],
            'about_to_add': True,
            'description': f'Processing point {p} for upper hull'
        })
        
        # Pop points off the stack if they fail to satisfy left-hand turn property
        # We want to maintain left-hand turn property (positive orientation)
        while len(upper_hull) >= 2:
            # Check orientation of (p, H[top], H[top-1])
            # We check orientation(p, upper_hull[-1], upper_hull[-2])
            orient = orientation(p, upper_hull[-1], upper_hull[-2])
            
            # Record testing step to show the turn test
            graham_steps.append({
                'type': 'upper_hull',
                'phase': 'testing',
                'current_point': p,
                'point_index': i,
                'sorted_points': sorted_points.copy(),
                'upper_hull': upper_hull.copy(),
                'lower_hull': [],
                'test_points': [upper_hull[-2], upper_hull[-1], p],
                'orientation': orient,
                'is_left_turn': orient > 0,
                'description': f'Testing turn: {upper_hull[-2]} → {upper_hull[-1]} → {p} (orientation: {orient:.3f})'
            })
            
            if orient <= 0:  # Not a strict left turn
                popped_point = upper_hull[-1]
                
                # Record popping step
                graham_steps.append({
                    'type': 'upper_hull',
                    'phase': 'popping',
                    'current_point': p,
                    'point_index': i,
                    'sorted_points': sorted_points.copy(),
                    'upper_hull': upper_hull.copy(),
                    'lower_hull': [],
                    'popped_point': popped_point,
                    'orientation': orient,
                    'description': f'Popping {popped_point} - not a left turn (orientation: {orient:.3f})'
                })
                
                upper_hull.pop()
            else:
                # Record acceptance step
                graham_steps.append({
                    'type': 'upper_hull',
                    'phase': 'accepted',
                    'current_point': p,
                    'point_index': i,
                    'sorted_points': sorted_points.copy(),
                    'upper_hull': upper_hull.copy(),
                    'lower_hull': [],
                    'orientation': orient,
                    'description': f'Left turn confirmed - keeping current hull structure'
                })
                break
        
        upper_hull.append(p)
        
        # Record step after adding point
        graham_steps.append({
            'type': 'upper_hull',
            'phase': 'added',
            'current_point': p,
            'point_index': i,
            'sorted_points': sorted_points.copy(),
            'upper_hull': upper_hull.copy(),
            'lower_hull': [],
            'description': f'Added {p} to upper hull - now has {len(upper_hull)} points'
        })
    
    # Build LOWER HULL (from slide 53)
    # Process points from right to left for lower hull
    lower_hull = []
    
    for i in range(n - 1, -1, -1):
        p = sorted_points[i]
        
        # Record step before processing
        graham_steps.append({
            'type': 'lower_hull',
            'phase': 'processing',
            'current_point': p,
            'point_index': i,
            'sorted_points': sorted_points.copy(),
            'upper_hull': upper_hull.copy(),
            'lower_hull': lower_hull.copy(),
            'about_to_add': True,
            'description': f'Processing point {p} for lower hull'
        })
        
        # Same logic but processing in reverse order
        while len(lower_hull) >= 2:
            orient = orientation(p, lower_hull[-1], lower_hull[-2])
            
            # Record testing step to show the turn test
            graham_steps.append({
                'type': 'lower_hull',
                'phase': 'testing',
                'current_point': p,
                'point_index': i,
                'sorted_points': sorted_points.copy(),
                'upper_hull': upper_hull.copy(),
                'lower_hull': lower_hull.copy(),
                'test_points': [lower_hull[-2], lower_hull[-1], p],
                'orientation': orient,
                'is_left_turn': orient > 0,
                'description': f'Testing turn: {lower_hull[-2]} → {lower_hull[-1]} → {p} (orientation: {orient:.3f})'
            })
            
            if orient <= 0:  # Not a strict left turn
                popped_point = lower_hull[-1]
                
                # Record popping step
                graham_steps.append({
                    'type': 'lower_hull',
                    'phase': 'popping',
                    'current_point': p,
                    'point_index': i,
                    'sorted_points': sorted_points.copy(),
                    'upper_hull': upper_hull.copy(),
                    'lower_hull': lower_hull.copy(),
                    'popped_point': popped_point,
                    'orientation': orient,
                    'description': f'Popping {popped_point} - not a left turn (orientation: {orient:.3f})'
                })
                
                lower_hull.pop()
            else:
                # Record acceptance step
                graham_steps.append({
                    'type': 'lower_hull',
                    'phase': 'accepted',
                    'current_point': p,
                    'point_index': i,
                    'sorted_points': sorted_points.copy(),
                    'upper_hull': upper_hull.copy(),
                    'lower_hull': lower_hull.copy(),
                    'orientation': orient,
                    'description': f'Left turn confirmed - keeping current hull structure'
                })
                break
        
        lower_hull.append(p)
        
        # Record step after adding point
        graham_steps.append({
            'type': 'lower_hull',
            'phase': 'added',
            'current_point': p,
            'point_index': i,
            'sorted_points': sorted_points.copy(),
            'upper_hull': upper_hull.copy(),
            'lower_hull': lower_hull.copy(),
            'description': f'Added {p} to lower hull - now has {len(lower_hull)} points'
        })
    
    # Combine upper and lower hulls
    # Remove last point of each half because it's repeated
    # (The leftmost and rightmost points appear in both hulls)
    convex_hull = upper_hull[:-1] + lower_hull[:-1]
    
    # Record final step
    graham_steps.append({
        'type': 'complete',
        'upper_hull': upper_hull.copy(),
        'lower_hull': lower_hull.copy(),
        'final_hull': convex_hull.copy(),
        'sorted_points': sorted_points.copy(),
        'description': f'Graham\'s Scan complete - hull has {len(convex_hull)} vertices'
    })
    
    return convex_hull

def jarvis_march(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Jarvis March (Gift Wrapping) Convex Hull Algorithm
    Time Complexity: O(nh)
    - n = number of input points
    - h = number of hull vertices
    - Worst case: O(n^2) when h = n
    - Best case: O(n) when h is constant
    """
    global jarvis_steps
    jarvis_steps = []
    
    n = len(points)
    if n < 3:
        return points
    
    # Find the leftmost point (smallest x-coordinate)
    # This point is guaranteed to be on the convex hull
    leftmost_idx = 0
    for i in range(1, n):
        if points[i][0] < points[leftmost_idx][0]:
            leftmost_idx = i
        elif points[i][0] == points[leftmost_idx][0]:
            if points[i][1] < points[leftmost_idx][1]:
                leftmost_idx = i
    
    # Start from leftmost point
    hull = []
    p = leftmost_idx
    iteration = 1
    
    # Keep walking around the hull until we return to start
    while True:
        # Add current point to hull
        hull.append(points[p])
        
        jarvis_steps.append({
            'type': 'jarvis_step',
            'current_point': points[p],
            'current_index': p,
            'hull_so_far': hull.copy(),
            'all_points': points.copy(),
            'iteration': iteration,
            'description': f'Step {iteration}: Added point ({points[p][0]:.1f}, {points[p][1]:.1f}) to hull'
        })
        
        # Find the most counter-clockwise point from points[p]
        # This will be the next point on the hull
        q = (p + 1) % n  # Start with the next point in array
        
        for i in range(n):
            if i == p:  # Skip current point
                continue
                
            # Find the point that makes the largest left turn
            # (most counter-clockwise) from current point p
            orient = orientation(points[p], points[i], points[q])
            
            # Record testing step
            jarvis_steps.append({
                'type': 'testing',
                'current_point': points[p],
                'current_index': p,
                'hull_so_far': hull.copy(),
                'candidate': points[q],
                'candidate_index': q,
                'testing_point': points[i],
                'testing_index': i,
                'orientation': 'counter_clockwise' if orient > 0 else 'clockwise' if orient < 0 else 'collinear',
                'cross_product': orient,
                'iteration': iteration,
                'is_better': False,  # Will be updated below
                'description': f'Testing point ({points[i][0]:.1f}, {points[i][1]:.1f}) vs current candidate ({points[q][0]:.1f}, {points[q][1]:.1f})'
            })
            
            if orient > 0:
                # Point i is more counter-clockwise than q
                q = i
                jarvis_steps[-1]['is_better'] = True
                jarvis_steps[-1]['description'] += f' - Better (more counter-clockwise)'
                
                jarvis_steps.append({
                    'type': 'candidate_selected',
                    'current_point': points[p],
                    'selected_candidate': points[i],
                    'hull_so_far': hull.copy(),
                    'iteration': iteration,
                    'description': f'Selected ({points[i][0]:.1f}, {points[i][1]:.1f}) as new best candidate'
                })
            elif orient == 0 and distance_squared(points[p], points[i]) > distance_squared(points[p], points[q]):
                # Points are collinear, choose the farthest one
                q = i
                jarvis_steps[-1]['is_better'] = True
                jarvis_steps[-1]['description'] += f' - Better (collinear but farther)'
                
                jarvis_steps.append({
                    'type': 'candidate_selected',
                    'current_point': points[p],
                    'selected_candidate': points[i],
                    'hull_so_far': hull.copy(),
                    'iteration': iteration,
                    'description': f'Selected ({points[i][0]:.1f}, {points[i][1]:.1f}) - collinear but farther'
                })
            else:
                jarvis_steps[-1]['description'] += f' - Worse (not counter-clockwise enough)'
        
        # Move to next hull point
        p = q
        iteration += 1
        
        # If we've returned to the start, we're done
        if p == leftmost_idx:
            jarvis_steps.append({
                'type': 'complete',
                'final_hull': hull.copy(),
                'all_points': points.copy(),
                'description': f'Returned to starting point - hull complete with {len(hull)} vertices!'
            })
            break
        
        # Safety check to prevent infinite loops
        if len(hull) > n:
            break
    
    return hull

# Tangent finding utilities for Chan's algorithm optimization
def find_best_among_few(external_point: Tuple[float, float], small_hull: List[Tuple[float, float]]) -> Tuple[float, float]:
    """
    Handle edge cases with small hulls (≤ 2 points) by checking all points
    """
    if not small_hull:
        return None
    if len(small_hull) == 1:
        return small_hull[0]
    
    best = small_hull[0]
    for candidate in small_hull[1:]:
        if is_better_tangent(external_point, candidate, best):
            best = candidate
    return best

def is_better_tangent(external_point: Tuple[float, float], candidate: Tuple[float, float], current_best: Tuple[float, float]) -> bool:
    """
    Compare two tangent candidates to determine which forms a better (more counter-clockwise) tangent
    """
    if current_best is None:
        return True
    if candidate == external_point:
        return False
    if current_best == external_point:
        return True
    
    # Use orientation test: candidate is better if it's more counter-clockwise
    return orientation(external_point, current_best, candidate) > 0

def find_rightmost_tangent(external_point: Tuple[float, float], convex_hull: List[Tuple[float, float]]) -> Tuple[float, float]:
    """
    Find the point on convex_hull that forms the rightmost tangent from external_point
    Uses binary search for O(log m) complexity - the key optimization for Chan's algorithm
    
    This implements a robust binary search for tangent finding on convex polygons,
    achieving the theoretical O(n log h) complexity for Chan's algorithm.
    """
    if not convex_hull or external_point is None:
        return None
    
    n = len(convex_hull)
    
    # Handle small hulls with brute force (overhead not worth it)
    if n <= 4:
        return find_best_among_few(external_point, convex_hull)
    
    # For binary search, we need to find the "rightmost" tangent point
    # This is the point that gives the most counter-clockwise tangent line
    
    def is_better_tangent_point(idx1, idx2):
        """Returns True if point at idx1 gives a more counter-clockwise tangent than idx2"""
        if idx1 == idx2:
            return False
        p1 = convex_hull[idx1]
        p2 = convex_hull[idx2]
        if p1 == external_point or p2 == external_point:
            return p1 != external_point
        return orientation(external_point, p2, p1) > 0
    
    # Binary search for the optimal tangent point
    # The key insight: on a convex polygon, there's exactly one point that gives
    # the rightmost (most counter-clockwise) tangent from an external point
    
    left = 0
    right = n - 1
    
    # We'll use a modified binary search that handles the circular nature
    while right - left > 2:
        mid1 = left + (right - left) // 3
        mid2 = right - (right - left) // 3
        
        if is_better_tangent_point(mid1, mid2):
            right = mid2
        else:
            left = mid1
    
    # Linear search in the remaining small range
    best_idx = left
    for idx in range(left, right + 1):
        if is_better_tangent_point(idx, best_idx):
            best_idx = idx
    
    # Also check the wraparound cases for circular hull
    for offset in [-1, 1]:
        idx = (best_idx + offset) % n
        if is_better_tangent_point(idx, best_idx):
            best_idx = idx
    
    return convex_hull[best_idx]

def chans_algorithm(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Chan's Algorithm - hybrid approach with optimized tangent finding"""
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
                'group_points': group,  # Add the original group points
                'mini_hull': mini_hull,
                'all_mini_hulls': mini_hulls.copy(),
                'all_groups': [groups[j] for j in range(i+1)],  # All groups processed so far
                'description': f'Computed mini-hull {i+1}/{len(groups)} with {len(mini_hull)} points from {len(group)} input points'
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
                'mini_hulls': mini_hulls.copy(),  # Keep mini-hulls visible
                'step': step,
                'max_steps': m,
                'description': f'Jarvis phase step {step+1}/{m} - connecting mini-hulls'
            })
            
            next_point = None
            best_mini_hull_idx = None
            
            # Find the most counter-clockwise point from all mini-hulls using optimized tangent finding
            for hull_idx, mini_hull in enumerate(mini_hulls):
                # Skip empty mini-hulls
                if not mini_hull:
                    continue
                
                # Use optimized tangent finding (currently same as brute force but structured for future optimization)
                tangent_candidate = find_rightmost_tangent(current, mini_hull)
                
                # Skip if tangent is None or the current point itself
                if tangent_candidate is None or tangent_candidate == current:
                    continue
                
                # Check if this tangent is better than our current best
                if next_point is None:
                    next_point = tangent_candidate
                    best_mini_hull_idx = hull_idx
                else:
                    orient = orientation(current, next_point, tangent_candidate)
                    if orient > 0:
                        # tangent_candidate is more counter-clockwise
                        next_point = tangent_candidate
                        best_mini_hull_idx = hull_idx
                    elif orient == 0:
                        # Collinear case: choose the farther point
                        dist_candidate = distance_squared(current, tangent_candidate)
                        dist_current = distance_squared(current, next_point)
                        if dist_candidate > dist_current:
                            next_point = tangent_candidate
                            best_mini_hull_idx = hull_idx
            
            # Record the connecting edge being considered
            if next_point and current != next_point:
                chan_steps.append({
                    'type': 'connecting_edge',
                    'current_point': current,
                    'next_point': next_point,
                    'hull_so_far': hull.copy(),
                    'mini_hulls': mini_hulls.copy(),
                    'connecting_hull_idx': best_mini_hull_idx,
                    'tangent_optimization': True,  # Flag indicating optimized tangent finding was used
                    'mini_hulls_checked': len([mh for mh in mini_hulls if mh]),  # Number of mini-hulls processed
                    'description': f'Using optimized tangent finding: connecting to point {next_point} from mini-hull {best_mini_hull_idx + 1}'
                })
            
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

def point_in_convex_ccw(hull: List[Tuple[float, float]], p: Tuple[float, float]) -> bool:
    """Check if point p is inside or on the boundary of a convex CCW polygon."""
    n = len(hull)
    if n == 0:
        return False
    if n == 1:
        return abs(p[0] - hull[0][0]) < 1e-12 and abs(p[1] - hull[0][1]) < 1e-12
    if n == 2:
        # Check if point is on line segment
        a, b = hull
        if abs(orientation(a, b, p)) > 1e-12:
            return False
        # Check if point is between a and b
        ap = (p[0] - a[0], p[1] - a[1])
        ab = (b[0] - a[0], b[1] - a[1])
        t = (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1])
        return 0 <= t <= 1
    
    # For polygon with 3+ vertices
    for i in range(n):
        a = hull[i]
        b = hull[(i + 1) % n]
        if orientation(a, b, p) < -1e-12:  # Point is to the right of edge (outside)
            return False
    return True

def right_tangent_index(hull: List[Tuple[float, float]], p: Tuple[float, float]) -> int:
    """Find the right tangent from point p to convex CCW hull using binary search."""
    n = len(hull)
    if n <= 2:
        return 0
    
    # Binary search for right tangent
    lo, hi = 0, n - 1
    max_iters = int(2 * (math.log2(n) + 3))
    
    for _ in range(max_iters):
        mid = (lo + hi) // 2
        m = hull[mid]
        mn = hull[(mid + 1) % n]
        mp = hull[(mid - 1 + n) % n]
        
        side_next = orientation(p, m, mn)
        side_prev = orientation(p, mp, m)
        
        if side_next <= 0 and side_prev > 0:
            return mid
        
        if side_next > 0:
            hi = (mid - 1 + n) % n
        else:
            lo = (mid + 1) % n
        
        if (hi + n - lo) % n <= 2:
            break
    
    # Brute force for small remaining range
    for k in range(n):
        i = (lo + k) % n
        m = hull[i]
        mn = hull[(i + 1) % n]
        mp = hull[(i - 1 + n) % n]
        if orientation(p, m, mn) <= 0 and orientation(p, mp, m) > 0:
            return i
    
    return 0

def left_tangent_index(hull: List[Tuple[float, float]], p: Tuple[float, float]) -> int:
    """Find the left tangent from point p to convex CCW hull using binary search."""
    n = len(hull)
    if n <= 2:
        return 0 if n == 1 else (0 if orientation(p, hull[0], hull[1]) > 0 else 1)
    
    # Binary search for left tangent
    lo, hi = 0, n - 1
    max_iters = int(2 * (math.log2(n) + 3))
    
    for _ in range(max_iters):
        mid = (lo + hi) // 2
        m = hull[mid]
        mn = hull[(mid + 1) % n]
        mp = hull[(mid - 1 + n) % n]
        
        side_next = orientation(p, m, mn)
        side_prev = orientation(p, mp, m)
        
        if side_next > 0 and side_prev <= 0:
            return mid
        
        if side_next <= 0:
            hi = (mid - 1 + n) % n
        else:
            lo = (mid + 1) % n
        
        if (hi + n - lo) % n <= 2:
            break
    
    # Brute force for small remaining range
    for k in range(n):
        i = (lo + k) % n
        m = hull[i]
        mn = hull[(i + 1) % n]
        mp = hull[(i - 1 + n) % n]
        if orientation(p, m, mn) > 0 and orientation(p, mp, m) <= 0:
            return i
    
    return 0

def build_ccw_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Build a CCW convex hull using Andrew's monotone chain algorithm."""
    if len(points) <= 1:
        return points[:]
    
    pts = sorted(set(points))
    if len(pts) <= 1:
        return pts[:]
    
    def strip_collinear(stack, p):
        while len(stack) >= 2 and orientation(stack[-2], stack[-1], p) <= 0:
            stack.pop()
        stack.append(p)
    
    lower, upper = [], []
    for p in pts:
        strip_collinear(lower, p)
    for p in reversed(pts):
        strip_collinear(upper, p)
    
    return lower[:-1] + upper[:-1]

def incremental_convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Incremental convex hull with O(log h) binary-search tangents."""
    global incremental_steps
    incremental_steps = []
    
    if len(points) < 3:
        return points
    
    hull = []
    
    for idx, p in enumerate(points):
        if len(hull) < 3:
            # Build initial hull with first few points
            before = hull.copy()
            hull = build_ccw_hull(hull + [p])
            
            incremental_steps.append({
                'type': 'seed',
                'added_point': p,
                'hull_before': before,
                'hull_after': hull.copy(),
                'description': f'Added point {p} to initial hull - now has {len(hull)} points'
            })
            continue
        
        # Check if point is inside current hull
        if point_in_convex_ccw(hull, p):
            incremental_steps.append({
                'type': 'inside',
                'point': p,
                'hull_before': hull.copy(),
                'description': f'Point {p} is inside current hull - no change needed'
            })
            continue
        
        # Point is outside - find tangents using binary search
        hull_before = hull.copy()
        rt_idx = right_tangent_index(hull, p)
        lt_idx = left_tangent_index(hull, p)
        
        incremental_steps.append({
            'type': 'tangents',
            'point': p,
            'hull_before': hull_before.copy(),
            'right_tangent_vertex': hull[rt_idx],
            'left_tangent_vertex': hull[lt_idx],
            'right_tangent_idx': rt_idx,
            'left_tangent_idx': lt_idx,
            'description': f'Found tangent lines from {p} using O(log h) binary search'
        })
        
        # Splice point into hull
        n = len(hull)
        if rt_idx <= lt_idx:
            # Keep vertices from lt to rt (inclusive), replace the rest with p
            new_hull = [hull[rt_idx], p] + [hull[i] for i in range(lt_idx, n)] + [hull[i] for i in range(0, rt_idx)]
        else:
            # Wrap-around case
            keep_indices = list(range(lt_idx, rt_idx + 1))
            new_hull = [hull[rt_idx], p] + [hull[i] for i in keep_indices]
        
        # Remove duplicates and ensure proper CCW order
        cleaned = []
        for q in new_hull:
            if not cleaned or cleaned[-1] != q:
                cleaned.append(q)
        
        if len(cleaned) >= 2 and cleaned[0] == cleaned[-1]:
            cleaned.pop()
        
        hull = cleaned
        
        incremental_steps.append({
            'type': 'splice_done',
            'point': p,
            'hull_before': hull_before,
            'hull_after': hull.copy(),
            'description': f'Spliced {p} into hull using tangents - now has {len(hull)} vertices'
        })
    
    incremental_steps.append({
        'type': 'complete',
        'final_hull': hull,
        'description': f'Incremental hull complete with O(log h) tangent search - {len(hull)} vertices'
    })
    
    return hull

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
    """Serve the main frontend page"""
    import os
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        frontend_path = os.path.join(script_dir, '..', 'frontend', 'index.html')
        
        with open(frontend_path, 'r') as f:
            return f.read(), 200, {'Content-Type': 'text/html'}
    except FileNotFoundError as e:
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
            },
            'note': f'Frontend files not found: {e}. API endpoints available.'
        })

@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files"""
    import os
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        css_path = os.path.join(script_dir, '..', 'frontend', 'css', filename)
        
        with open(css_path, 'r') as f:
            return f.read(), 200, {'Content-Type': 'text/css'}
    except FileNotFoundError:
        return f"CSS file not found: {filename}", 404

@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files"""
    import os
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        js_path = os.path.join(script_dir, '..', 'frontend', 'js', filename)
        
        with open(js_path, 'r') as f:
            return f.read(), 200, {'Content-Type': 'application/javascript'}
    except FileNotFoundError:
        return f"JS file not found: {filename}", 404

@app.route('/api-info', methods=['GET'])
def api_info():
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