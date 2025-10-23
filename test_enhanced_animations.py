#!/usr/bin/env python3
"""
Test script to verify enhanced animations with intermediate dotted lines
"""

import sys
sys.path.append('api')

from app import jarvis_march, incremental_convex_hull

# Test points - a simple configuration that will show intermediate steps clearly
test_points = [(0, 0), (3, 1), (4, 4), (1, 3), (2, 2)]

print("=== Testing Enhanced Jarvis March Animation ===")
hull = jarvis_march(test_points)
print(f"Hull: {hull}")

# Import the global steps
from app import jarvis_steps
print(f"\nGenerated {len(jarvis_steps)} steps:")

testing_steps = 0
selection_steps = 0

for i, step in enumerate(jarvis_steps):
    print(f"Step {i+1}: {step['type']} - {step.get('description', 'No description')}")
    
    if step['type'] == 'testing':
        testing_steps += 1
        print(f"  - Testing: {step.get('candidate', 'N/A')} vs {step.get('next_point', 'N/A')}")
        print(f"  - Orientation: {step.get('orientation', 'N/A')}")
        print(f"  - Is better: {step.get('is_better', 'N/A')}")
    elif step['type'] == 'candidate_selected':
        selection_steps += 1
        print(f"  - Selected: {step.get('selected_candidate', 'N/A')}")

print(f"\nAnimation features:")
print(f"  - Testing steps with dotted lines: {testing_steps}")
print(f"  - Selection steps with solid lines: {selection_steps}")

print("\n=== Testing Enhanced Incremental Hull Animation ===")
hull2 = incremental_convex_hull(test_points)
print(f"Hull: {hull2}")

# Import the global steps
from app import incremental_steps
print(f"\nGenerated {len(incremental_steps)} steps:")

tangent_steps = 0
splice_steps = 0

for i, step in enumerate(incremental_steps):
    print(f"Step {i+1}: {step['type']} - {step.get('description', 'No description')}")
    
    if step['type'] == 'tangents':
        tangent_steps += 1
        print(f"  - Right tangent: {step.get('right_tangent_vertex', 'N/A')}")
        print(f"  - Left tangent: {step.get('left_tangent_vertex', 'N/A')}")
    elif step['type'] == 'splice_done':
        splice_steps += 1
        print(f"  - Hull before: {len(step.get('hull_before', []))} points")
        print(f"  - Hull after: {len(step.get('hull_after', []))} points")

print(f"\nAnimation features:")
print(f"  - Tangent steps with dotted lines: {tangent_steps}")
print(f"  - Splice steps with solid lines: {splice_steps}")

print("\n✓ Enhanced animations ready!")
print("Features added:")
print("  - Jarvis March: Dotted lines during testing, solid when selected")
print("  - Incremental Hull: Dotted tangent lines, solid new hull edges")
print("  - Visual feedback for intermediate decisions")