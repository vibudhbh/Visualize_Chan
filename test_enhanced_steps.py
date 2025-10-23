#!/usr/bin/env python3
"""
Test script to verify enhanced step generation for algorithms
"""

import sys
sys.path.append('api')

from app import jarvis_march, incremental_convex_hull

# Test points
test_points = [(0, 0), (4, 0), (4, 4), (0, 4), (2, 2)]

print("=== Testing Enhanced Jarvis March ===")
hull = jarvis_march(test_points)
print(f"Hull: {hull}")

# Import the global steps
from app import jarvis_steps
print(f"Generated {len(jarvis_steps)} steps:")
for i, step in enumerate(jarvis_steps):
    print(f"Step {i+1}: {step['type']} - {step.get('description', 'No description')}")
    if step['type'] == 'testing':
        print(f"  - Orientation: {step.get('orientation', 'N/A')}")
        print(f"  - Is better: {step.get('is_better', 'N/A')}")

print("\n=== Testing Enhanced Incremental Hull ===")
hull2 = incremental_convex_hull(test_points)
print(f"Hull: {hull2}")

# Import the global steps
from app import incremental_steps
print(f"Generated {len(incremental_steps)} steps:")
for i, step in enumerate(incremental_steps):
    print(f"Step {i+1}: {step['type']} - {step.get('description', 'No description')}")
    if step['type'] == 'tangents':
        print(f"  - Right tangent: {step.get('right_tangent_vertex', 'N/A')}")
        print(f"  - Left tangent: {step.get('left_tangent_vertex', 'N/A')}")