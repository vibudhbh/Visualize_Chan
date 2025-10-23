#!/usr/bin/env python3
"""
Test Chan's algorithm fix
"""

import sys
sys.path.append('api')

from app import chans_algorithm

# Test points
test_points = [(0, 0), (3, 1), (4, 4), (1, 3), (2, 2)]

print("=== Testing Chan's Algorithm Fix ===")
try:
    hull = chans_algorithm(test_points)
    print(f"✅ Chan's Algorithm succeeded!")
    print(f"Hull: {hull}")
    
    # Import the global steps
    from app import chan_steps
    print(f"Generated {len(chan_steps)} steps")
    
    # Check for any steps that might have issues
    for i, step in enumerate(chan_steps):
        if 'error' in step.get('description', '').lower():
            print(f"⚠️  Step {i+1}: {step}")
        
except Exception as e:
    print(f"❌ Chan's Algorithm failed: {e}")
    import traceback
    traceback.print_exc()