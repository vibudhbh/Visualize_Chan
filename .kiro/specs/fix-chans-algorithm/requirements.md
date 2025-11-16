# Requirements Document

## Introduction

This feature addresses the critical issues identified in the current Chan's algorithm implementation. The existing implementation is fundamentally incorrect as it lacks the core iterative doubling mechanism that defines Chan's algorithm and instead functions as a modified Jarvis march with a fixed step limit. This feature will implement a correct Chan's algorithm that achieves the theoretical O(n log h) time complexity through proper iterative doubling and success condition checking.

## Glossary

- **Chan's Algorithm**: A hybrid convex hull algorithm that combines Graham's scan and Jarvis march with iterative doubling to achieve O(n log h) complexity
- **Iterative Doubling**: The core mechanism where parameter m is doubled as m = 4, 16, 256, 65536, ... until success
- **Mini-Hull**: Convex hull of a small group of points computed using Graham's scan
- **Success Condition**: When the hull is found within m steps, indicating h ≤ m
- **Convex Hull System**: The existing web application that visualizes convex hull algorithms
- **Hull Size (h)**: The number of points on the convex hull boundary

## Requirements

### Requirement 1

**User Story:** As a computer science student studying convex hull algorithms, I want to see a correct implementation of Chan's algorithm, so that I can understand how it achieves O(n log h) complexity through iterative doubling.

#### Acceptance Criteria

1. WHEN the Chan's algorithm is executed, THE Convex Hull System SHALL implement iterative doubling with m = 2^(2^t) for t = 1, 2, 3, ...
2. WHILE iterating through t values, THE Convex Hull System SHALL partition points into groups of size m and compute mini-hulls using Graham's scan
3. IF the hull is found within m steps of Jarvis march, THEN THE Convex Hull System SHALL return the hull as the final result
4. WHERE the hull size exceeds m steps, THE Convex Hull System SHALL increment t and try with larger m value
5. THE Convex Hull System SHALL achieve O(n log h) time complexity through proper iterative doubling mechanism

### Requirement 2

**User Story:** As a developer comparing algorithm performance, I want the Chan's algorithm to properly terminate when the success condition is met, so that I can observe its adaptive behavior for different hull sizes.

#### Acceptance Criteria

1. WHEN running Jarvis march on mini-hulls, THE Convex Hull System SHALL stop after at most m steps
2. IF the hull closes within m steps, THEN THE Convex Hull System SHALL return the complete hull immediately
3. IF m steps are reached without hull closure, THEN THE Convex Hull System SHALL try the next larger m value
4. THE Convex Hull System SHALL not exceed the theoretical maximum iterations for reasonable input sizes
5. WHILE executing the algorithm, THE Convex Hull System SHALL track and report the actual m value used for successful completion

### Requirement 3

**User Story:** As a user of the visualization system, I want to see the step-by-step execution of the correct Chan's algorithm, so that I can understand how it adaptively finds the optimal parameter m.

#### Acceptance Criteria

1. WHEN Chan's algorithm executes, THE Convex Hull System SHALL record each iteration attempt with its m value
2. THE Convex Hull System SHALL capture the partitioning of points into groups for mini-hull computation
3. THE Convex Hull System SHALL track the Jarvis march steps on mini-hulls for each iteration
4. WHEN the success condition is met, THE Convex Hull System SHALL record which m value led to successful completion
5. THE Convex Hull System SHALL provide visualization data showing the adaptive nature of the algorithm

### Requirement 4

**User Story:** As a performance analyst, I want the corrected Chan's algorithm to maintain compatibility with the existing API and frontend, so that I can compare it directly with other algorithms without changing the interface.

#### Acceptance Criteria

1. THE Convex Hull System SHALL maintain the existing /chan endpoint interface
2. THE Convex Hull System SHALL return hull points in the same format as other algorithms
3. THE Convex Hull System SHALL provide step-by-step execution data compatible with the visualization system
4. THE Convex Hull System SHALL include performance statistics showing the actual complexity achieved
5. WHEN integrated with the frontend, THE Convex Hull System SHALL display Chan's algorithm results using the existing D3 visualization components