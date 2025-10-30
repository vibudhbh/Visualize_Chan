#!/usr/bin/env python3
"""
Unit tests for Chan's algorithm optimization - tangent finding functions
"""

import sys
sys.path.append('api')

from app import find_rightmost_tangent, is_better_tangent, find_best_among_few, chans_algorithm, grahams_scan
import unittest

class TestTangentFinding(unittest.TestCase):
    
    def test_find_best_among_few_empty(self):
        """Test edge case with empty hull"""
        result = find_best_among_few((0, 0), [])
        self.assertIsNone(result)
    
    def test_find_best_among_few_single_point(self):
        """Test edge case with single point hull"""
        result = find_best_among_few((0, 0), [(1, 1)])
        self.assertEqual(result, (1, 1))
    
    def test_find_best_among_few_two_points(self):
        """Test edge case with two point hull"""
        external = (0, 0)
        hull = [(1, 0), (0, 1)]
        result = find_best_among_few(external, hull)
        # Should return the more counter-clockwise point
        self.assertEqual(result, (0, 1))
    
    def test_is_better_tangent_basic(self):
        """Test basic tangent comparison"""
        external = (0, 0)
        # Point (0, 1) is more counter-clockwise than (1, 0) from (0, 0)
        self.assertTrue(is_better_tangent(external, (0, 1), (1, 0)))
        self.assertFalse(is_better_tangent(external, (1, 0), (0, 1)))
    
    def test_is_better_tangent_none_current(self):
        """Test tangent comparison with None current best"""
        external = (0, 0)
        self.assertTrue(is_better_tangent(external, (1, 1), None))
    
    def test_is_better_tangent_same_as_external(self):
        """Test tangent comparison when candidate is same as external point"""
        external = (0, 0)
        self.assertFalse(is_better_tangent(external, (0, 0), (1, 1)))
    
    def test_find_rightmost_tangent_empty(self):
        """Test tangent finding with empty hull"""
        result = find_rightmost_tangent((0, 0), [])
        self.assertIsNone(result)
    
    def test_find_rightmost_tangent_none_external(self):
        """Test tangent finding with None external point"""
        result = find_rightmost_tangent(None, [(1, 1)])
        self.assertIsNone(result)
    
    def test_find_rightmost_tangent_square(self):
        """Test tangent finding on a square hull"""
        external = (-1, 1)  # Point to the left of square
        square_hull = [(0, 0), (0, 2), (2, 2), (2, 0)]  # Counter-clockwise square
        result = find_rightmost_tangent(external, square_hull)
        # Should find one of the visible points from external point
        self.assertIn(result, square_hull)
    
    def test_find_rightmost_tangent_triangle(self):
        """Test tangent finding on a triangle hull"""
        external = (0, -1)  # Point below triangle
        triangle_hull = [(0, 0), (2, 0), (1, 2)]  # Counter-clockwise triangle
        result = find_rightmost_tangent(external, triangle_hull)
        self.assertIn(result, triangle_hull)

class TestChanAlgorithmCorrectness(unittest.TestCase):
    
    def test_chan_vs_graham_square(self):
        """Test Chan's algorithm vs Graham's scan on square points"""
        points = [(0, 0), (2, 0), (2, 2), (0, 2), (1, 1)]
        chan_hull = chans_algorithm(points)
        graham_hull = grahams_scan(points)
        
        # Results should be the same (ignoring order)
        self.assertEqual(set(chan_hull), set(graham_hull))
    
    def test_chan_vs_graham_random_points(self):
        """Test Chan's algorithm vs Graham's scan on various point sets"""
        test_cases = [
            [(0, 0), (1, 0), (2, 1), (1, 2), (0, 2), (-1, 1)],
            [(0, 0), (4, 0), (4, 3), (0, 3), (2, 1), (1, 2), (3, 2)],
            [(-2, -1), (3, -1), (3, 4), (-2, 4), (0, 0), (1, 1), (2, 2)],
        ]
        
        for points in test_cases:
            with self.subTest(points=points):
                chan_hull = chans_algorithm(points)
                graham_hull = grahams_scan(points)
                self.assertEqual(set(chan_hull), set(graham_hull))
    
    def test_chan_edge_cases(self):
        """Test Chan's algorithm edge cases"""
        # Single point
        self.assertEqual(chans_algorithm([(0, 0)]), [(0, 0)])
        
        # Two points
        self.assertEqual(chans_algorithm([(0, 0), (1, 1)]), [(0, 0), (1, 1)])
        
        # Three collinear points
        result = chans_algorithm([(0, 0), (1, 0), (2, 0)])
        self.assertEqual(len(result), 2)  # Should return endpoints
    
    def test_chan_performance_improvement(self):
        """Test that the optimized version works correctly"""
        import time
        
        # Large-ish dataset including collinear points (now that collinear handling is fixed)
        points = [(i, i*i % 17) for i in range(50)]
        
        start_time = time.time()
        chan_hull = chans_algorithm(points)
        chan_time = time.time() - start_time
        
        start_time = time.time()
        graham_hull = grahams_scan(points)
        graham_time = time.time() - start_time
        
        # Results should match now that collinear point handling is corrected
        self.assertEqual(set(chan_hull), set(graham_hull))
        
        # Performance should be reasonable (not testing specific timing due to variability)
        self.assertLess(chan_time, 1.0)  # Should complete within 1 second
        print(f"Chan's time: {chan_time*1000:.2f}ms, Graham's time: {graham_time*1000:.2f}ms")

if __name__ == '__main__':
    unittest.main()