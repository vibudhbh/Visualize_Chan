#!/usr/bin/env python3
"""
Test script to verify the updated Graham's Scan algorithm
"""

import sys
sys.path.append('api')

from app import grahams_scan

# Test points - a simple square with a point inside
test_points = [(0, 0), (4, 0), (4, 4), (0, 4), (2, 2)]

print("=== Testing Updated Graham's Scan ===")
print(f"Input points: {test_points}")

hull = grahams_scan(test_points)
print(f"Hull: {hull}")

# Import the global steps
from app import graham_steps
print(f"\nGenerated {len(graham_steps)} steps:")

for i, step in enumerate(graham_steps):
    print(f"Step {i+1}: {step['type']}", end="")
    if 'phase' in step:
        print(f" ({step['phase']})", end="")
    print(f" - {step.get('description', 'No description')}")
    
    # Show additional details for key steps
    if step['type'] == 'upper_hull' and step.get('phase') == 'popping':
        print(f"  - Orientation: {step.get('orientation', 'N/A')}")
    elif step['type'] == 'lower_hull' and step.get('phase') == 'popping':
        print(f"  - Orientation: {step.get('orientation', 'N/A')}")
    elif step['type'] == 'complete':
        print(f"  - Upper hull: {len(step.get('upper_hull', []))} points")
        print(f"  - Lower hull: {len(step.get('lower_hull', []))} points")
        print(f"  - Final hull: {len(step.get('final_hull', []))} points")

print("\n=== Verification ===")
print("Expected hull for square: [(0, 0), (0, 4), (4, 4), (4, 0)]")
print(f"Actual hull: {hull}")
print("✓ Test passed!" if len(hull) == 4 else "✗ Test failed!")