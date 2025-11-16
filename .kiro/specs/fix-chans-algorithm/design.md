# Design Document

## Overview

This design fixes the critical performance bottleneck in the existing Chan's algorithm implementation. The current implementation has the correct structure (iterative doubling, partitioning, mini-hulls, success conditions) but is missing the key optimization: **efficient tangent finding using binary search**. The current O(n) per-step complexity will be reduced to O(n/m × log m) by replacing brute-force point checking with proper tangent computation on convex mini-hulls. This will achieve the theoretical O(n log h) time complexity while maintaining full compatibility with the existing visualization system.

## Architecture

### Core Algorithm Structure

The corrected Chan's algorithm follows this three-phase approach for each iteration:

1. **Iterative Doubling Phase**: Try m = 2^(2^t) for t = 1, 2, 3, ...
2. **Mini-Hull Computation Phase**: Partition points into groups of size m and compute convex hulls
3. **Jarvis March Phase**: Run Jarvis march on mini-hulls with at most m steps

### Algorithm Flow

```
for t = 1, 2, 3, ... (until success or reasonable limit):
    m = 2^(2^t)  // m = 4, 16, 256, 65536, ...
    
    // Phase 1: Partition points
    groups = partition_points(points, m)
    
    // Phase 2: Compute mini-hulls
    mini_hulls = []
    for each group:
        mini_hulls.append(grahams_scan(group))
    
    // Phase 3: Jarvis march on mini-hulls (max m steps)
    hull = jarvis_march_on_mini_hulls(mini_hulls, m)
    
    // Success condition
    if hull_complete and len(hull) <= m:
        return hull
    
    // Otherwise try next t value
```

## Components and Interfaces

### 1. Main Chan's Algorithm Function

```python
def chans_algorithm(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """
    Correct implementation of Chan's algorithm with iterative doubling
    Returns: List of hull points in counterclockwise order
    """
```

**Input**: List of 2D points as (x, y) tuples
**Output**: List of convex hull points in counterclockwise order
**Side Effects**: Updates global chan_steps for visualization

### 2. Point Partitioning Component

```python
def partition_points_for_chans(points: List[Tuple], m: int) -> List[List[Tuple]]:
    """
    Partition points into groups of size at most m for mini-hull computation
    """
```

**Responsibility**: Divide input points into manageable groups
**Strategy**: Simple sequential partitioning (points[0:m], points[m:2m], ...)

### 3. Mini-Hull Computation Component

```python
def compute_mini_hulls(groups: List[List[Tuple]]) -> List[List[Tuple]]:
    """
    Compute convex hull for each group using Graham's scan
    """
```

**Responsibility**: Generate mini-hulls for each partition
**Implementation**: Reuse existing grahams_scan function
**Edge Cases**: Handle groups with < 3 points

### 4. Jarvis March on Mini-Hulls Component (MAIN FIX)

```python
def jarvis_march_on_mini_hulls(mini_hulls: List[List[Tuple]], m: int) -> Tuple[List[Tuple], bool]:
    """
    Run Jarvis march on mini-hulls with step limit m using efficient tangent finding
    Returns: (hull_points, success_flag)
    """
```

**Responsibility**: Find convex hull by marching through mini-hulls **efficiently**
**Key Logic**: 
- For each hull point, find the **tangent** to each mini-hull using binary search
- **Replace current O(n) brute-force** with O(log m) tangent finding per mini-hull
- Stop after m steps OR when hull closes
- Return success flag indicating if hull completed within m steps

**Critical Change**: Instead of checking all points in all mini-hulls, find the tangent point on each mini-hull using binary search.

### 5. Tangent Finding Component (NEW - KEY OPTIMIZATION)

```python
def find_tangent_to_convex_hull(external_point: Tuple, convex_hull: List[Tuple]) -> Tuple:
    """
    Find the point on convex_hull that forms the rightmost tangent from external_point
    This is the MISSING PIECE that makes Chan's algorithm O(n log h)
    """
```

**Responsibility**: **THE KEY MISSING OPTIMIZATION** - efficiently find tangent points on mini-hulls
**Algorithm**: Binary search on the convex mini-hull to find tangent in O(log m) time
**Complexity**: O(log m) per mini-hull instead of current O(m)
**Impact**: Reduces Jarvis march from O(n) per step to O(n/m × log m) per step

**Current Problem**: Your implementation checks every point in every mini-hull
**Solution**: Use binary search to find the tangent point on each convex mini-hull

## Data Models

### Step Tracking Model

```python
@dataclass
class ChanStep:
    iteration: int          # Which t value (1, 2, 3, ...)
    m_value: int           # Current m = 2^(2^t)
    phase: str             # "partition", "mini_hulls", "jarvis_march"
    groups_count: int      # Number of point groups
    mini_hulls_sizes: List[int]  # Size of each mini-hull
    jarvis_steps: int      # Steps taken in Jarvis march
    current_hull: List[Tuple]    # Current hull state
    success: bool          # Whether this iteration succeeded
```

### Algorithm Statistics Model

```python
@dataclass
class ChanStats:
    algorithm: str = "chan"
    points_processed: int
    hull_size: int
    iterations_attempted: int
    successful_m_value: int
    total_steps: int
    execution_time_ms: float
    complexity_achieved: str  # "O(n log h)" if successful
```

## Error Handling

### Input Validation
- **Empty/Single Point**: Return input as-is
- **Two Points**: Return both points
- **Collinear Points**: Handle gracefully via Graham's scan in mini-hulls

### Algorithm Failure Cases
- **Excessive Iterations**: Fallback to Graham's scan after reasonable t limit
- **Numerical Precision**: Use robust geometric predicates
- **Memory Constraints**: Monitor group sizes and mini-hull counts

### Integration Errors
- **API Compatibility**: Maintain exact same response format as existing /chan endpoint
- **Visualization Data**: Ensure step data is compatible with D3 visualizer
- **Performance Monitoring**: Track and report when algorithm exceeds expected complexity

## Testing Strategy

### Unit Testing Focus
1. **Iterative Doubling Logic**: Verify m values follow 2^(2^t) sequence
2. **Success Condition**: Test termination when h ≤ m
3. **Mini-Hull Integration**: Verify Graham's scan integration
4. **Tangent Finding**: Test binary search on convex polygons
5. **Edge Cases**: Single point, collinear points, duplicate points

### Integration Testing
1. **API Endpoint**: Verify /chan endpoint returns correct format
2. **Visualization Compatibility**: Test step data with D3 visualizer
3. **Performance Comparison**: Compare with existing algorithms on same datasets
4. **Correctness Verification**: Test against known convex hull datasets

### Performance Testing
1. **Complexity Verification**: Measure actual vs theoretical O(n log h)
2. **Memory Usage**: Monitor memory consumption during execution
3. **Large Dataset Testing**: Test with datasets of varying sizes and hull complexities

## Tangent Finding Algorithm (Core Fix)

### The Problem with Current Implementation

```python
# CURRENT (INEFFICIENT) - O(m) per mini-hull
for hull_idx, mini_hull in enumerate(mini_hulls):
    for candidate in mini_hull:  # ❌ Checks ALL points
        if candidate == current:
            continue
        if next_point is None or orientation(current, next_point, candidate) > 0:
            next_point = candidate
```

### The Solution: Binary Search for Tangents

```python
# NEW (EFFICIENT) - O(log m) per mini-hull
def find_rightmost_tangent(external_point, convex_hull):
    """
    Binary search to find the rightmost tangent from external_point to convex_hull
    """
    n = len(convex_hull)
    if n <= 2:
        return find_best_among_few(external_point, convex_hull)
    
    # Binary search for the tangent point
    left, right = 0, n - 1
    
    while right - left > 2:
        mid = (left + right) // 2
        
        # Check if mid is the tangent point
        prev_point = convex_hull[(mid - 1) % n]
        curr_point = convex_hull[mid]
        next_point = convex_hull[(mid + 1) % n]
        
        # Use orientation tests to determine search direction
        orient_prev = orientation(external_point, curr_point, prev_point)
        orient_next = orientation(external_point, curr_point, next_point)
        
        if orient_prev >= 0 and orient_next >= 0:
            return curr_point  # Found tangent
        elif orient_prev < 0:
            right = mid
        else:
            left = mid
    
    # Check remaining candidates
    best = convex_hull[left]
    for i in range(left, right + 1):
        if is_better_tangent(external_point, convex_hull[i], best):
            best = convex_hull[i]
    
    return best
```

### Complexity Impact

| Phase | Current | Optimized | Improvement |
|-------|---------|-----------|-------------|
| **Per mini-hull** | O(m) | O(log m) | Exponential speedup |
| **Per Jarvis step** | O(n) | O(n/m × log m) | Significant for large m |
| **Overall algorithm** | O(n × min(h,m)) | O(n log h) | Achieves theoretical optimum |

## Implementation Notes

### Key Differences from Current Implementation

| Aspect | Current (Inefficient) | New (Optimized) |
|--------|---------------------|-----------------|
| **Parameter m** | ✅ Correct: Iterative m = 4, 16, 256, ... | ✅ Keep: Same iterative doubling |
| **Partitioning** | ✅ Correct: Points divided into groups | ✅ Keep: Same partitioning logic |
| **Mini-Hulls** | ✅ Correct: Graham's scan on groups | ✅ Keep: Same mini-hull computation |
| **Termination** | ✅ Correct: When hull closes | ✅ Keep: Same success condition |
| **Jarvis Phase** | ❌ O(n) per step: Check all points | ✅ O(n/m × log m): Binary search tangents |
| **Complexity** | O(n × min(h, m)) per iteration | O(n log h) overall |

### Compatibility Considerations
- **Existing API**: Maintain /chan endpoint signature
- **Step Tracking**: Enhance chan_steps format to show iterations
- **Visualization**: Extend D3 visualizer to show iterative process
- **Performance Stats**: Add iteration count and successful m value to response

### Optimization Opportunities
- **Early Termination**: Stop if h is obviously small (h ≤ 4)
- **Smart Partitioning**: Consider spatial partitioning instead of sequential
- **Tangent Caching**: Cache tangent computations between iterations
- **Parallel Mini-Hulls**: Compute mini-hulls in parallel if beneficial