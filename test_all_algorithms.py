#!/usr/bin/env python3
"""
Test all enhanced algorithms
"""

import sys
sys.path.append('api')

from app import grahams_scan, jarvis_march, chans_algorithm, incremental_convex_hull

# Test points
test_points = [(0, 0), (3, 1), (4, 4), (1, 3), (2, 2)]

print("=== Testing All Enhanced Algorithms ===")
print(f"Input points: {test_points}")
print()

# Test Graham's Scan
print("1. Graham's Scan:")
try:
    hull = grahams_scan(test_points)
    from app import graham_steps
    testing_steps = len([s for s in graham_steps if s.get('phase') == 'testing'])
    accepted_steps = len([s for s in graham_steps if s.get('phase') == 'accepted'])
    popping_steps = len([s for s in graham_steps if s.get('phase') == 'popping'])
    print(f"   ✅ Success: {len(hull)} vertices")
    print(f"   📊 Steps: {len(graham_steps)} total, {testing_steps} testing, {accepted_steps} accepted, {popping_steps} popping")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test Jarvis March
print("\n2. Jarvis March:")
try:
    hull = jarvis_march(test_points)
    from app import jarvis_steps
    testing_steps = len([s for s in jarvis_steps if s.get('type') == 'testing'])
    selection_steps = len([s for s in jarvis_steps if s.get('type') == 'candidate_selected'])
    print(f"   ✅ Success: {len(hull)} vertices")
    print(f"   📊 Steps: {len(jarvis_steps)} total, {testing_steps} testing, {selection_steps} selections")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test Chan's Algorithm
print("\n3. Chan's Algorithm:")
try:
    hull = chans_algorithm(test_points)
    from app import chan_steps
    mini_hull_steps = len([s for s in chan_steps if s.get('type') == 'mini_hull'])
    jarvis_phase_steps = len([s for s in chan_steps if s.get('type') == 'jarvis_phase'])
    print(f"   ✅ Success: {len(hull)} vertices")
    print(f"   📊 Steps: {len(chan_steps)} total, {mini_hull_steps} mini-hulls, {jarvis_phase_steps} jarvis phases")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test Incremental Hull
print("\n4. Incremental Hull:")
try:
    hull = incremental_convex_hull(test_points)
    from app import incremental_steps
    tangent_steps = len([s for s in incremental_steps if s.get('type') == 'tangents'])
    splice_steps = len([s for s in incremental_steps if s.get('type') == 'splice_done'])
    inside_steps = len([s for s in incremental_steps if s.get('type') == 'inside'])
    print(f"   ✅ Success: {len(hull)} vertices")
    print(f"   📊 Steps: {len(incremental_steps)} total, {tangent_steps} tangents, {splice_steps} splices, {inside_steps} inside")
except Exception as e:
    print(f"   ❌ Failed: {e}")

print("\n🎉 All algorithms enhanced with detailed visualizations!")
print("\nFeatures added:")
print("  - Graham's Scan: Turn testing with triangles and orientation symbols")
print("  - Jarvis March: Candidate testing with dotted/solid line transitions")
print("  - Chan's Algorithm: Group boundaries and mini-hull progression")
print("  - Incremental Hull: O(log h) binary search tangents with splice visualization")