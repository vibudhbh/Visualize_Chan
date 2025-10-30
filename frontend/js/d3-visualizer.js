/**
 * D3.js Convex Hull Visualizer
 * Production-quality visualization using D3.js
 */

class D3ConvexHullVisualizer {
    constructor(containerId) {
        this.container = d3.select(`#${containerId}`);
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        
        // Scales
        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        
        // Data
        this.points = [];
        this.currentStep = null;
        this.baseAnimationDuration = 300;
        
        // Groups for different elements
        this.groups = {};
        
        this.init();
    }

    init() {
        this.setupSVG();
        this.setupGroups();
        this.setupZoom();
        this.setupResize();
        
        // Initial render
        this.render();
    }

    setupSVG() {
        // Remove existing SVG
        this.container.select('svg').remove();
        
        // Get container dimensions
        const containerNode = this.container.node();
        this.width = Math.max(containerNode.clientWidth || 800, 400);
        this.height = Math.max(containerNode.clientHeight || 500, 300);
        
        // Ensure reasonable bounds
        this.width = Math.min(this.width, 1200);
        this.height = Math.min(this.height, 800);
        
        // Create SVG with fixed dimensions
        this.svg = this.container
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .style('background-color', '#ffffff')
            .style('max-width', '100%')
            .style('max-height', '100%');
        
        // Update scales
        this.updateScales();
    }

    setupGroups() {
        // Create groups for different elements (in drawing order)
        this.groups.grid = this.svg.append('g').attr('class', 'grid-group');
        this.groups.hull = this.svg.append('g').attr('class', 'hull-group');
        this.groups.tangents = this.svg.append('g').attr('class', 'tangents-group');
        this.groups.points = this.svg.append('g').attr('class', 'points-group');
        this.groups.labels = this.svg.append('g').attr('class', 'labels-group');
        this.groups.annotations = this.svg.append('g').attr('class', 'annotations-group');
    }

    setupZoom() {
        // Disable zoom and pan - keep canvas fixed
        const zoom = d3.zoom()
            .scaleExtent([1, 1])  // No zoom allowed
            .translateExtent([[0, 0], [this.width, this.height]])  // No panning
            .on('zoom', null);  // No zoom behavior

        this.svg.call(zoom);
        this.zoomBehavior = zoom;
    }

    setupResize() {
        // Disable resize observer to prevent infinite resize loops
        // The canvas will use fixed dimensions based on container
    }

    handleResize() {
        // Disabled to prevent resize loops
    }

    updateScales() {
        if (this.points.length === 0) {
            // Default scales - larger view
            this.xScale
                .domain([-300, 300])
                .range([this.margin.left, this.width - this.margin.right]);
            
            this.yScale
                .domain([-200, 200])
                .range([this.height - this.margin.bottom, this.margin.top]);
        } else {
            // Fit to data with generous padding
            const xExtent = d3.extent(this.points, d => d.x);
            const yExtent = d3.extent(this.points, d => d.y);
            
            // Add generous padding (30% of range)
            const xRange = xExtent[1] - xExtent[0];
            const yRange = yExtent[1] - yExtent[0];
            const xPadding = Math.max(xRange * 0.3, 50);
            const yPadding = Math.max(yRange * 0.3, 50);
            
            this.xScale
                .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
                .range([this.margin.left, this.width - this.margin.right]);
            
            this.yScale
                .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
                .range([this.height - this.margin.bottom, this.margin.top]);
        }
    }

    setPoints(points) {
        this.points = points.map((p, i) => ({
            ...p,
            id: i,
            originalIndex: i
        }));
        this.updateScales();
        this.optimizeForDatasetSize();
        this.render();
    }

    optimizeForDatasetSize() {
        const pointCount = this.points.length;
        
        // Adjust rendering optimizations based on dataset size
        if (pointCount > 200) {
            // Very large datasets - minimal visual effects
            this.svg.style('shape-rendering', 'optimizeSpeed');
        } else {
            // Normal datasets - full quality rendering
            this.svg.style('shape-rendering', 'auto');
        }
        
        // Log performance info for debugging
        if (pointCount > 100) {
            console.log(`📊 Large dataset detected: ${pointCount} points. Optimizations applied.`);
        }
    }

    setStep(step) {
        this.currentStep = step;
        this.render();
    }

    render() {
        // Debug logging
        if (this.currentStep) {
            console.log('🎨 Rendering step:', this.currentStep.type, this.currentStep.phase || '');
        }
        
        this.renderGrid();
        this.renderPoints();  // Render points first so they appear behind hulls
        this.renderHull();
        this.renderTangents();
        this.renderLabels();
        this.renderAnnotations();
    }

    renderGrid() {
        // Simple grid
        const gridGroup = this.groups.grid;
        gridGroup.selectAll('*').remove();
        
        const xTicks = this.xScale.ticks(10);
        const yTicks = this.yScale.ticks(8);
        
        // Vertical lines
        gridGroup.selectAll('.grid-line-x')
            .data(xTicks)
            .enter()
            .append('line')
            .attr('class', 'grid-line-x')
            .attr('x1', d => this.xScale(d))
            .attr('x2', d => this.xScale(d))
            .attr('y1', this.margin.top)
            .attr('y2', this.height - this.margin.bottom)
            .attr('stroke', '#e5e7eb')
            .attr('stroke-width', 0.5);
        
        // Horizontal lines
        gridGroup.selectAll('.grid-line-y')
            .data(yTicks)
            .enter()
            .append('line')
            .attr('class', 'grid-line-y')
            .attr('x1', this.margin.left)
            .attr('x2', this.width - this.margin.right)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .attr('stroke', '#e5e7eb')
            .attr('stroke-width', 0.5);
    }

    renderHull() {
        const hullGroup = this.groups.hull;
        hullGroup.selectAll('*').remove();
        
        if (!this.currentStep) return;
        
        // Render based on step type
        if (this.currentStep.type === 'complete') {
            // For complete steps, render the final hull based on what data is available
            if (this.currentStep.final_hull || this.currentStep.hull_so_far) {
                this.renderJarvisHull(); // Jarvis March completion
            } else if (this.currentStep.upper_hull || this.currentStep.lower_hull) {
                this.renderGrahamHull(); // Graham's Scan completion
            } else if (this.currentStep.mini_hulls) {
                this.renderChanHull(); // Chan's Algorithm completion
            } else {
                this.renderFinalHull(); // Generic final hull rendering
            }
        } else if (this.currentStep.type === 'upper_hull' || this.currentStep.type === 'lower_hull') {
            this.renderGrahamHull();
        } else if (this.currentStep.type === 'jarvis_step' || this.currentStep.type === 'testing') {
            this.renderJarvisHull();
        } else if (this.currentStep.type === 'mini_hull' || this.currentStep.type === 'jarvis_phase' || this.currentStep.type === 'connecting_edge') {
            this.renderChanHull();
        } else if (['seed', 'inside', 'tangents', 'splice_done'].includes(this.currentStep.type)) {
            this.renderIncrementalHull();
        }
    }

    renderFinalHull() {
        const hullGroup = this.groups.hull;
        
        // Find the final hull from various possible properties
        let finalHull = null;
        if (this.currentStep.final_hull) {
            finalHull = this.currentStep.final_hull;
        } else if (this.currentStep.hull_so_far) {
            finalHull = this.currentStep.hull_so_far;
        } else if (this.currentStep.hull) {
            finalHull = this.currentStep.hull;
        }
        
        if (finalHull && finalHull.length > 2) {
            // Create path for hull
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y))
                .curve(d3.curveLinearClosed);
            
            // Fill
            hullGroup.append('path')
                .datum(finalHull)
                .attr('d', line)
                .style('fill', 'rgba(59, 130, 246, 0.2)')
                .style('stroke', 'none');
            
            // Outline
            hullGroup.append('path')
                .datum(finalHull)
                .attr('d', line)
                .style('fill', 'none')
                .style('stroke', '#3b82f6')
                .style('stroke-width', 4)
                .style('stroke-linejoin', 'round');
            
            // Hull vertices
            finalHull.forEach(point => {
                hullGroup.append('circle')
                    .attr('cx', this.xScale(point.x))
                    .attr('cy', this.yScale(point.y))
                    .attr('r', 8)
                    .style('fill', '#3b82f6')
                    .style('stroke', 'white')
                    .style('stroke-width', 2);
            });
        }
    }

    renderGrahamHull() {
        const hullGroup = this.groups.hull;
        
        // For complete Graham's scan, show the final hull
        if (this.currentStep.type === 'complete' && this.currentStep.final_hull) {
            const finalHull = this.currentStep.final_hull;
            
            if (finalHull.length > 2) {
                const closedLine = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y))
                    .curve(d3.curveLinearClosed);
                
                // Fill first
                hullGroup.append('path')
                    .datum(finalHull)
                    .attr('d', closedLine)
                    .style('fill', 'rgba(59, 130, 246, 0.2)')
                    .style('stroke', 'none');
                
                // Then closed outline
                hullGroup.append('path')
                    .datum(finalHull)
                    .attr('d', closedLine)
                    .style('fill', 'none')
                    .style('stroke', '#3b82f6')
                    .style('stroke-width', 4)
                    .style('stroke-linejoin', 'round');
                
                // Hull vertices
                finalHull.forEach(point => {
                    hullGroup.append('circle')
                        .attr('cx', this.xScale(point.x))
                        .attr('cy', this.yScale(point.y))
                        .attr('r', 8)
                        .style('fill', '#3b82f6')
                        .style('stroke', 'white')
                        .style('stroke-width', 2);
                });
            }
            return;
        }
        
        // Show sorted points with indices during sorting
        if (this.currentStep.type === 'sorting') {
            // Add visual indicators for sorted points
            if (this.currentStep.sorted_points) {
                this.currentStep.sorted_points.forEach((point, index) => {
                    // Draw point index labels
                    hullGroup.append('text')
                        .attr('x', this.xScale(point.x) + 10)
                        .attr('y', this.yScale(point.y) - 10)
                        .text(`${index + 1}`)
                        .style('fill', '#3b82f6')
                        .style('font-size', '12px')
                        .style('font-weight', 'bold')
                        .style('text-anchor', 'middle')
                        .style('background', 'white')
                        .style('padding', '2px');
                });
                
                // Draw sorting arrow
                hullGroup.append('text')
                    .attr('x', this.width / 2)
                    .attr('y', 30)
                    .text('Points sorted by x-coordinate →')
                    .style('fill', '#3b82f6')
                    .style('font-size', '14px')
                    .style('font-weight', 'bold')
                    .style('text-anchor', 'middle');
            }
            return;
        }
        
        // Draw upper hull (blue) - always show if it exists
        if (this.currentStep.upper_hull && this.currentStep.upper_hull.length > 1) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y));
            
            const isActive = this.currentStep.type === 'upper_hull';
            
            hullGroup.append('path')
                .datum(this.currentStep.upper_hull)
                .attr('d', line)
                .attr('class', 'hull-line upper')
                .style('fill', 'none')
                .style('stroke', '#3b82f6')
                .style('stroke-width', isActive ? 4 : 2)
                .style('stroke-dasharray', isActive ? 'none' : '5,5')
                .style('opacity', isActive ? 1.0 : 0.6);
            
            // Draw upper hull vertices
            this.currentStep.upper_hull.forEach(point => {
                hullGroup.append('circle')
                    .attr('cx', this.xScale(point.x))
                    .attr('cy', this.yScale(point.y))
                    .attr('r', isActive ? 7 : 5)
                    .style('fill', '#3b82f6')
                    .style('stroke', 'white')
                    .style('stroke-width', 2)
                    .style('opacity', isActive ? 1.0 : 0.6);
            });
        }
        
        // Draw lower hull (green) - always show if it exists
        if (this.currentStep.lower_hull && this.currentStep.lower_hull.length > 1) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y));
            
            const isActive = this.currentStep.type === 'lower_hull';
            
            hullGroup.append('path')
                .datum(this.currentStep.lower_hull)
                .attr('d', line)
                .attr('class', 'hull-line lower')
                .style('fill', 'none')
                .style('stroke', '#10b981')
                .style('stroke-width', isActive ? 4 : 2)
                .style('stroke-dasharray', isActive ? 'none' : '5,5')
                .style('opacity', isActive ? 1.0 : 0.6);
            
            // Draw lower hull vertices
            this.currentStep.lower_hull.forEach(point => {
                hullGroup.append('circle')
                    .attr('cx', this.xScale(point.x))
                    .attr('cy', this.yScale(point.y))
                    .attr('r', isActive ? 7 : 5)
                    .style('fill', '#10b981')
                    .style('stroke', 'white')
                    .style('stroke-width', 2)
                    .style('opacity', isActive ? 1.0 : 0.6);
            });
        }
        
        // Highlight the point being processed
        if (this.currentStep.current_point && (this.currentStep.phase === 'processing' || this.currentStep.phase === 'added')) {
            const point = this.currentStep.current_point;
            const color = this.currentStep.type === 'upper_hull' ? '#3b82f6' : '#10b981';
            
            // Draw a larger circle around the current point
            hullGroup.append('circle')
                .attr('cx', this.xScale(point.x))
                .attr('cy', this.yScale(point.y))
                .attr('r', 12)
                .style('fill', 'none')
                .style('stroke', color)
                .style('stroke-width', 3)
                .style('opacity', 0.8);
        }
        
        // Show turn testing visualization with enhanced graphics
        if (this.currentStep.phase === 'testing' && this.currentStep.test_points && this.currentStep.test_points.length === 3) {
            const [p1, p2, p3] = this.currentStep.test_points;
            const isLeftTurn = this.currentStep.is_left_turn;
            const testColor = isLeftTurn ? '#10b981' : '#ef4444';
            
            // Draw the triangle formed by the three test points with animation
            const trianglePath = `M ${this.xScale(p1.x)} ${this.yScale(p1.y)} L ${this.xScale(p2.x)} ${this.yScale(p2.y)} L ${this.xScale(p3.x)} ${this.yScale(p3.y)} Z`;
            
            hullGroup.append('path')
                .attr('d', trianglePath)
                .style('fill', testColor)
                .style('fill-opacity', 0.3)
                .style('stroke', testColor)
                .style('stroke-width', 3)
                .style('stroke-dasharray', '6,3')
                .style('opacity', 0)
                .transition()
                .duration(300)
                .style('opacity', 1);
            
            // Draw arrows showing the direction of the turn test
            this.drawTurnArrows(hullGroup, p1, p2, p3, testColor);
            
            // Add turn direction indicator with better styling
            const centerX = (this.xScale(p1.x) + this.xScale(p2.x) + this.xScale(p3.x)) / 3;
            const centerY = (this.yScale(p1.y) + this.yScale(p2.y) + this.yScale(p3.y)) / 3;
            
            const turnSymbol = isLeftTurn ? '↺' : '↻';
            const turnText = isLeftTurn ? 'Left Turn ✓' : 'Right Turn ✗';
            
            // Background circle for better visibility
            hullGroup.append('circle')
                .attr('cx', centerX)
                .attr('cy', centerY)
                .attr('r', 25)
                .style('fill', 'white')
                .style('stroke', testColor)
                .style('stroke-width', 2)
                .style('opacity', 0.9);
            
            hullGroup.append('text')
                .attr('x', centerX)
                .attr('y', centerY - 5)
                .text(turnSymbol)
                .style('fill', testColor)
                .style('font-size', '20px')
                .style('font-weight', 'bold')
                .style('text-anchor', 'middle');
            
            hullGroup.append('text')
                .attr('x', centerX)
                .attr('y', centerY + 15)
                .text(turnText)
                .style('fill', testColor)
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('text-anchor', 'middle');
        }
        
        // Show acceptance with green checkmark
        if (this.currentStep.phase === 'accepted') {
            const point = this.currentStep.current_point;
            
            hullGroup.append('text')
                .attr('x', this.xScale(point.x))
                .attr('y', this.yScale(point.y) - 15)
                .text('✓')
                .style('fill', '#10b981')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .style('text-anchor', 'middle');
        }
        
        // Show the point being popped with a red X
        if (this.currentStep.phase === 'popping' && this.currentStep.popped_point) {
            const point = this.currentStep.popped_point;
            
            // Draw red X over the popped point
            const size = 8;
            hullGroup.append('g')
                .attr('transform', `translate(${this.xScale(point.x)}, ${this.yScale(point.y)})`)
                .selectAll('line')
                .data([
                    {x1: -size, y1: -size, x2: size, y2: size},
                    {x1: -size, y1: size, x2: size, y2: -size}
                ])
                .enter()
                .append('line')
                .attr('x1', d => d.x1)
                .attr('y1', d => d.y1)
                .attr('x2', d => d.x2)
                .attr('y2', d => d.y2)
                .style('stroke', '#ef4444')
                .style('stroke-width', 3)
                .style('stroke-linecap', 'round');
        }
    }

    renderJarvisHull() {
        const hullGroup = this.groups.hull;
        
        // Draw hull built so far (blue line with circles) - handle both hull_so_far and final_hull
        const currentHull = this.currentStep.hull_so_far || this.currentStep.final_hull;
        if (currentHull && currentHull.length > 1) {
            // For complete hulls with 3+ points, draw as closed polygon
            if (currentHull.length > 2 && this.currentStep.type === 'complete') {
                const closedLine = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y))
                    .curve(d3.curveLinearClosed);
                
                // Fill first
                hullGroup.append('path')
                    .datum(currentHull)
                    .attr('d', closedLine)
                    .style('fill', 'rgba(59, 130, 246, 0.2)')
                    .style('stroke', 'none');
                
                // Then closed outline
                hullGroup.append('path')
                    .datum(currentHull)
                    .attr('d', closedLine)
                    .style('fill', 'none')
                    .style('stroke', '#3b82f6')
                    .style('stroke-width', 4)
                    .style('stroke-linejoin', 'round');
            } else {
                // For incomplete hulls, draw as open line
                const line = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y));
                
                hullGroup.append('path')
                    .datum(currentHull)
                    .attr('d', line)
                    .attr('class', 'hull-line')
                    .style('fill', 'none')
                    .style('stroke', '#3b82f6')
                    .style('stroke-width', 4)
                    .style('stroke-linejoin', 'round');
            }
            
            // Hull vertices as circles
            hullGroup.selectAll('.hull-vertex')
                .data(currentHull)
                .enter()
                .append('circle')
                .attr('class', 'hull-vertex')
                .attr('cx', d => this.xScale(d.x))
                .attr('cy', d => this.yScale(d.y))
                .attr('r', 8)
                .style('fill', '#3b82f6')
                .style('stroke', 'white')
                .style('stroke-width', 2);
        }
        
        // Show intermediate edges during Jarvis March
        if (this.currentStep.type === 'jarvis_step') {
            // Draw dotted line from current point to all other points to show "wrapping" concept
            const current = this.currentStep.current_point;
            if (current && this.points) {
                // Draw faint dotted lines to all remaining points
                this.points.forEach(point => {
                    if (point.x !== current.x || point.y !== current.y) {
                        // Skip points already in hull
                        const inHull = currentHull && currentHull.some(hp => hp.x === point.x && hp.y === point.y);
                        if (!inHull) {
                            hullGroup.append('line')
                                .attr('x1', this.xScale(current.x))
                                .attr('y1', this.yScale(current.y))
                                .attr('x2', this.xScale(point.x))
                                .attr('y2', this.yScale(point.y))
                                .style('stroke', '#d1d5db')
                                .style('stroke-width', 1)
                                .style('stroke-dasharray', '2,4')
                                .style('opacity', 0.3);
                        }
                    }
                });
            }
        }
        
        // Enhanced visualization for testing steps
        if (this.currentStep.type === 'testing') {
            const current = this.currentStep.current_point;
            const candidate = this.currentStep.candidate;  // Current best candidate
            const testingPoint = this.currentStep.testing_point;  // Point being tested
            
            // Draw line from current to candidate (current best) - green dotted
            if (current && candidate) {
                hullGroup.append('line')
                    .attr('x1', this.xScale(current.x))
                    .attr('y1', this.yScale(current.y))
                    .attr('x2', this.xScale(candidate.x))
                    .attr('y2', this.yScale(candidate.y))
                    .style('stroke', '#10b981')
                    .style('stroke-width', 3)
                    .style('stroke-dasharray', '8,4')
                    .style('opacity', 0.7);
                
                // Label for current best
                hullGroup.append('text')
                    .attr('x', (this.xScale(current.x) + this.xScale(candidate.x)) / 2)
                    .attr('y', (this.yScale(current.y) + this.yScale(candidate.y)) / 2 - 10)
                    .text('Current Best')
                    .style('fill', '#10b981')
                    .style('font-size', '11px')
                    .style('font-weight', 'bold')
                    .style('text-anchor', 'middle');
            }
            
            // Draw line from current to testing point - dotted orange/red based on result
            if (current && testingPoint) {
                const isGoodCandidate = this.currentStep.is_better;
                const testColor = isGoodCandidate ? '#f59e0b' : '#ef4444';
                
                hullGroup.append('line')
                    .attr('x1', this.xScale(current.x))
                    .attr('y1', this.yScale(current.y))
                    .attr('x2', this.xScale(testingPoint.x))
                    .attr('y2', this.yScale(testingPoint.y))
                    .style('stroke', testColor)
                    .style('stroke-width', 4)
                    .style('stroke-dasharray', '6,3')
                    .style('opacity', 0.9);
                
                // Add orientation indicator
                const midX = (this.xScale(current.x) + this.xScale(testingPoint.x)) / 2;
                const midY = (this.yScale(current.y) + this.yScale(testingPoint.y)) / 2;
                
                // Orientation arrow or symbol
                const orientationText = this.currentStep.orientation === 'counter_clockwise' ? '↺' : 
                                      this.currentStep.orientation === 'clockwise' ? '↻' : '→';
                
                hullGroup.append('text')
                    .attr('x', midX)
                    .attr('y', midY - 15)
                    .text(orientationText)
                    .style('fill', testColor)
                    .style('font-size', '18px')
                    .style('font-weight', 'bold')
                    .style('text-anchor', 'middle');
                
                // Result label
                hullGroup.append('text')
                    .attr('x', midX)
                    .attr('y', midY + 20)
                    .text(isGoodCandidate ? 'Better!' : 'Worse')
                    .style('fill', testColor)
                    .style('font-size', '11px')
                    .style('font-weight', 'bold')
                    .style('text-anchor', 'middle');
            }
        }
        
        // Show candidate selection with solid line
        if (this.currentStep.type === 'candidate_selected') {
            const current = this.currentStep.current_point;
            const selected = this.currentStep.selected_candidate;
            
            if (current && selected) {
                // Highlight the selected candidate with a thick solid green line
                hullGroup.append('line')
                    .attr('x1', this.xScale(current.x))
                    .attr('y1', this.yScale(current.y))
                    .attr('x2', this.xScale(selected.x))
                    .attr('y2', this.yScale(selected.y))
                    .style('stroke', '#10b981')
                    .style('stroke-width', 6)
                    .style('opacity', 1.0);
                
                // Add "SELECTED" label
                const midX = (this.xScale(current.x) + this.xScale(selected.x)) / 2;
                const midY = (this.yScale(current.y) + this.yScale(selected.y)) / 2;
                
                hullGroup.append('text')
                    .attr('x', midX)
                    .attr('y', midY - 10)
                    .text('SELECTED')
                    .style('fill', '#10b981')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .style('text-anchor', 'middle');
            }
        }
    }

    renderChanHull() {
        const hullGroup = this.groups.hull;
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4'];
        
        if (this.currentStep.type === 'mini_hull') {
            // Phase 1: Computing mini-hulls - show group boundaries and computed hulls
            
            // First, show all group boundaries (light colored rectangles)
            if (this.currentStep.all_groups) {
                this.currentStep.all_groups.forEach((group, i) => {
                    if (group && group.length > 0) {
                        const color = colors[i % colors.length];
                        
                        // Draw bounding box for each group
                        const xExtent = d3.extent(group, d => d.x);
                        const yExtent = d3.extent(group, d => d.y);
                        const padding = 10;
                        
                        hullGroup.append('rect')
                            .attr('x', this.xScale(xExtent[0]) - padding)
                            .attr('y', this.yScale(yExtent[1]) - padding)
                            .attr('width', this.xScale(xExtent[1]) - this.xScale(xExtent[0]) + 2 * padding)
                            .attr('height', this.yScale(yExtent[0]) - this.yScale(yExtent[1]) + 2 * padding)
                            .style('fill', color)
                            .style('fill-opacity', 0.1)
                            .style('stroke', color)
                            .style('stroke-width', 2)
                            .style('stroke-dasharray', '5,5')
                            .style('opacity', 0.6);
                        
                        // Add group label
                        hullGroup.append('text')
                            .attr('x', this.xScale(xExtent[0]) - padding + 5)
                            .attr('y', this.yScale(yExtent[1]) - padding + 15)
                            .text(`Group ${i + 1}`)
                            .style('fill', color)
                            .style('font-size', '12px')
                            .style('font-weight', 'bold');
                    }
                });
            }
            
            // Draw all computed mini-hulls so far
            if (this.currentStep.all_mini_hulls) {
                this.currentStep.all_mini_hulls.forEach((hull, i) => {
                    if (hull && hull.length >= 2) {
                        const color = colors[i % colors.length];
                        
                        if (hull.length === 2) {
                            // Draw line for 2-point hull
                            hullGroup.append('line')
                                .attr('x1', this.xScale(hull[0].x))
                                .attr('y1', this.yScale(hull[0].y))
                                .attr('x2', this.xScale(hull[1].x))
                                .attr('y2', this.yScale(hull[1].y))
                                .style('stroke', color)
                                .style('stroke-width', 4);
                        } else {
                            // Draw polygon for 3+ point hull
                            const line = d3.line()
                                .x(d => this.xScale(d.x))
                                .y(d => this.yScale(d.y))
                                .curve(d3.curveLinearClosed);
                            
                            // Fill first
                            hullGroup.append('path')
                                .datum(hull)
                                .attr('d', line)
                                .style('fill', color)
                                .style('fill-opacity', 0.3)
                                .style('stroke', 'none');
                            
                            // Then outline
                            hullGroup.append('path')
                                .datum(hull)
                                .attr('d', line)
                                .style('fill', 'none')
                                .style('stroke', color)
                                .style('stroke-width', 4);
                        }
                        
                        // Draw hull vertices as circles
                        hull.forEach(point => {
                            hullGroup.append('circle')
                                .attr('cx', this.xScale(point.x))
                                .attr('cy', this.yScale(point.y))
                                .attr('r', 7)
                                .style('fill', color)
                                .style('stroke', 'white')
                                .style('stroke-width', 2);
                        });
                    }
                });
            }
            
            // Highlight current mini-hull being computed with pulsing animation
            if (this.currentStep.mini_hull && this.currentStep.group_idx !== undefined) {
                const currentColor = colors[this.currentStep.group_idx % colors.length];
                const hull = this.currentStep.mini_hull;
                if (hull.length >= 2) {
                    if (hull.length === 2) {
                        // Highlight line with thicker stroke and glow effect
                        hullGroup.append('line')
                            .attr('x1', this.xScale(hull[0].x))
                            .attr('y1', this.yScale(hull[0].y))
                            .attr('x2', this.xScale(hull[1].x))
                            .attr('y2', this.yScale(hull[1].y))
                            .style('stroke', currentColor)
                            .style('stroke-width', 6)
                            .style('opacity', 0.9)
                            .style('filter', 'drop-shadow(0 0 6px ' + currentColor + ')');
                    } else {
                        // Highlight polygon with thicker outline and glow
                        const line = d3.line()
                            .x(d => this.xScale(d.x))
                            .y(d => this.yScale(d.y))
                            .curve(d3.curveLinearClosed);
                        hullGroup.append('path')
                            .datum(hull)
                            .attr('d', line)
                            .style('fill', 'none')
                            .style('stroke', currentColor)
                            .style('stroke-width', 6)
                            .style('opacity', 0.9)
                            .style('filter', 'drop-shadow(0 0 6px ' + currentColor + ')');
                    }
                }
            }
            
        } else if (this.currentStep.type === 'jarvis_phase' || this.currentStep.type === 'connecting_edge') {
            // Phase 2: Jarvis March merging - show visible mini-hulls and growing final hull
            
            // Draw mini-hulls with dotted lines and faint colors (MORE VISIBLE)
            if (this.currentStep.mini_hulls) {
                this.currentStep.mini_hulls.forEach((hull, i) => {
                    if (hull && hull.length >= 2) {
                        const color = colors[i % colors.length];
                        const isConnectingHull = this.currentStep.connecting_hull_idx === i;
                        
                        if (hull.length === 2) {
                            // Dotted line - more visible
                            hullGroup.append('line')
                                .attr('x1', this.xScale(hull[0].x))
                                .attr('y1', this.yScale(hull[0].y))
                                .attr('x2', this.xScale(hull[1].x))
                                .attr('y2', this.yScale(hull[1].y))
                                .style('stroke', color)
                                .style('stroke-width', isConnectingHull ? 4 : 3)
                                .style('stroke-dasharray', '8,4')
                                .style('opacity', isConnectingHull ? 0.8 : 0.6);
                        } else {
                            // Dotted polygon - more visible
                            const line = d3.line()
                                .x(d => this.xScale(d.x))
                                .y(d => this.yScale(d.y))
                                .curve(d3.curveLinearClosed);
                            
                            // Faint fill
                            hullGroup.append('path')
                                .datum(hull)
                                .attr('d', line)
                                .style('fill', color)
                                .style('fill-opacity', isConnectingHull ? 0.2 : 0.1)
                                .style('stroke', 'none');
                            
                            // Dotted outline
                            hullGroup.append('path')
                                .datum(hull)
                                .attr('d', line)
                                .style('fill', 'none')
                                .style('stroke', color)
                                .style('stroke-width', isConnectingHull ? 3 : 2)
                                .style('stroke-dasharray', '6,3')
                                .style('opacity', isConnectingHull ? 0.8 : 0.6);
                        }
                        
                        // Draw mini-hull vertices as smaller circles
                        hull.forEach(point => {
                            hullGroup.append('circle')
                                .attr('cx', this.xScale(point.x))
                                .attr('cy', this.yScale(point.y))
                                .attr('r', isConnectingHull ? 6 : 4)
                                .style('fill', color)
                                .style('stroke', 'white')
                                .style('stroke-width', 1)
                                .style('opacity', isConnectingHull ? 0.8 : 0.6);
                        });
                    }
                });
            }
            
            // Draw connecting edge being considered (dotted line)
            if (this.currentStep.type === 'connecting_edge' && this.currentStep.current_point && this.currentStep.next_point) {
                const current = this.currentStep.current_point;
                const next = this.currentStep.next_point;
                
                hullGroup.append('line')
                    .attr('x1', this.xScale(current.x))
                    .attr('y1', this.yScale(current.y))
                    .attr('x2', this.xScale(next.x))
                    .attr('y2', this.yScale(next.y))
                    .style('stroke', '#ff6b35')
                    .style('stroke-width', 4)
                    .style('stroke-dasharray', '10,5')
                    .style('opacity', 0.9);
                
                // Add connecting label
                const midX = (this.xScale(current.x) + this.xScale(next.x)) / 2;
                const midY = (this.yScale(current.y) + this.yScale(next.y)) / 2;
                
                hullGroup.append('text')
                    .attr('x', midX)
                    .attr('y', midY - 10)
                    .text('Connecting')
                    .style('fill', '#ff6b35')
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .style('text-anchor', 'middle');
            }
            
            // Draw final hull being built (thick black line)
            if (this.currentStep.hull_so_far && this.currentStep.hull_so_far.length > 1) {
                const line = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y));
                
                // Hull line (black, thick)
                hullGroup.append('path')
                    .datum(this.currentStep.hull_so_far)
                    .attr('d', line)
                    .style('fill', 'none')
                    .style('stroke', '#000000')
                    .style('stroke-width', 5);
                
                // Hull vertices as black circles
                this.currentStep.hull_so_far.forEach(point => {
                    hullGroup.append('circle')
                        .attr('cx', this.xScale(point.x))
                        .attr('cy', this.yScale(point.y))
                        .attr('r', 8)
                        .style('fill', '#000000')
                        .style('stroke', 'white')
                        .style('stroke-width', 2);
                });
            }
        }
    }

    renderIncrementalHull() {
        const hullGroup = this.groups.hull;
        
        // Always try to draw the current hull from multiple possible properties
        let currentHull = null;
        
        if (this.currentStep.hull_before && this.currentStep.hull_before.length > 2) {
            currentHull = this.currentStep.hull_before;
        } else if (this.currentStep.hull && this.currentStep.hull.length > 2) {
            currentHull = this.currentStep.hull;
        } else if (this.currentStep.hull_after && this.currentStep.hull_after.length > 2) {
            currentHull = this.currentStep.hull_after;
        }
        
        // Draw current hull (before modification)
        if (currentHull && this.currentStep.type !== 'splice_done') {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y))
                .curve(d3.curveLinearClosed);
            
            // Add fill for complete steps
            if (this.currentStep.type === 'complete') {
                hullGroup.append('path')
                    .datum(currentHull)
                    .attr('d', line)
                    .style('fill', 'rgba(59, 130, 246, 0.2)')
                    .style('stroke', 'none');
            }
            
            // Hull outline - solid for stable hull, dashed when being modified
            const isDuringModification = this.currentStep.type === 'tangents';
            hullGroup.append('path')
                .datum(currentHull)
                .attr('d', line)
                .style('fill', 'none')
                .style('stroke', '#3b82f6')
                .style('stroke-width', this.currentStep.type === 'complete' ? 4 : 3)
                .style('stroke-dasharray', isDuringModification ? '5,3' : 'none')
                .style('opacity', isDuringModification ? 0.7 : 1.0);
            
            // Draw hull vertices
            currentHull.forEach(point => {
                hullGroup.append('circle')
                    .attr('cx', this.xScale(point.x))
                    .attr('cy', this.yScale(point.y))
                    .attr('r', 7)
                    .style('fill', '#3b82f6')
                    .style('stroke', 'white')
                    .style('stroke-width', 2)
                    .style('opacity', isDuringModification ? 0.7 : 1.0);
            });
        }
        
        // Show intermediate dotted lines from new point to all hull vertices during tangent finding
        if (this.currentStep.type === 'tangents' && this.currentStep.point && this.currentStep.hull_before) {
            const newPoint = this.currentStep.point;
            
            // Draw dotted lines from new point to all hull vertices
            this.currentStep.hull_before.forEach(hullVertex => {
                hullGroup.append('line')
                    .attr('x1', this.xScale(newPoint.x))
                    .attr('y1', this.yScale(newPoint.y))
                    .attr('x2', this.xScale(hullVertex.x))
                    .attr('y2', this.yScale(hullVertex.y))
                    .style('stroke', '#d1d5db')
                    .style('stroke-width', 1)
                    .style('stroke-dasharray', '3,3')
                    .style('opacity', 0.4);
            });
        }
        
        // Draw new hull after modification (solid green)
        if (this.currentStep.type === 'splice_done' && this.currentStep.hull_after && this.currentStep.hull_after.length > 2) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y))
                .curve(d3.curveLinearClosed);
            
            // New hull with solid green outline
            hullGroup.append('path')
                .datum(this.currentStep.hull_after)
                .attr('d', line)
                .style('fill', 'rgba(16, 185, 129, 0.1)')
                .style('stroke', '#10b981')
                .style('stroke-width', 4);
            
            // Draw new hull vertices
            this.currentStep.hull_after.forEach(point => {
                hullGroup.append('circle')
                    .attr('cx', this.xScale(point.x))
                    .attr('cy', this.yScale(point.y))
                    .attr('r', 7)
                    .style('fill', '#10b981')
                    .style('stroke', 'white')
                    .style('stroke-width', 2);
            });
        }
        
        // Show preview of new hull edges during tangent phase (dotted green)
        if (this.currentStep.type === 'tangents' && this.currentStep.point && 
            this.currentStep.right_tangent_vertex && this.currentStep.left_tangent_vertex) {
            const newPoint = this.currentStep.point;
            
            // Draw dotted preview lines showing how the hull will be modified
            hullGroup.append('line')
                .attr('x1', this.xScale(this.currentStep.right_tangent_vertex.x))
                .attr('y1', this.yScale(this.currentStep.right_tangent_vertex.y))
                .attr('x2', this.xScale(newPoint.x))
                .attr('y2', this.yScale(newPoint.y))
                .style('stroke', '#10b981')
                .style('stroke-width', 3)
                .style('stroke-dasharray', '6,3')
                .style('opacity', 0.8);
            
            hullGroup.append('line')
                .attr('x1', this.xScale(newPoint.x))
                .attr('y1', this.yScale(newPoint.y))
                .attr('x2', this.xScale(this.currentStep.left_tangent_vertex.x))
                .attr('y2', this.yScale(this.currentStep.left_tangent_vertex.y))
                .style('stroke', '#10b981')
                .style('stroke-width', 3)
                .style('stroke-dasharray', '6,3')
                .style('opacity', 0.8);
        }
    }

    renderTangents() {
        const tangentGroup = this.groups.tangents;
        tangentGroup.selectAll('*').remove();
        
        if (!this.currentStep || this.currentStep.type !== 'tangents') return;
        
        const candidate = this.currentStep.point;
        
        if (!candidate) return;
        
        // Right tangent (orange thick dashed line)
        if (this.currentStep.right_tangent_vertex) {
            tangentGroup.append('line')
                .attr('x1', this.xScale(candidate.x))
                .attr('y1', this.yScale(candidate.y))
                .attr('x2', this.xScale(this.currentStep.right_tangent_vertex.x))
                .attr('y2', this.yScale(this.currentStep.right_tangent_vertex.y))
                .attr('class', 'tangent-line right')
                .style('stroke', '#f59e0b')
                .style('stroke-width', 5)
                .style('stroke-dasharray', '10,5')
                .style('opacity', 1.0);
            
            // Add label for right tangent
            const midX = (this.xScale(candidate.x) + this.xScale(this.currentStep.right_tangent_vertex.x)) / 2;
            const midY = (this.yScale(candidate.y) + this.yScale(this.currentStep.right_tangent_vertex.y)) / 2;
            
            tangentGroup.append('text')
                .attr('x', midX)
                .attr('y', midY - 12)
                .text('Right Tangent')
                .style('fill', '#f59e0b')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('text-anchor', 'middle')
                .style('background', 'white')
                .style('padding', '2px');
        }
        
        // Left tangent (purple thick dashed line)
        if (this.currentStep.left_tangent_vertex) {
            tangentGroup.append('line')
                .attr('x1', this.xScale(candidate.x))
                .attr('y1', this.yScale(candidate.y))
                .attr('x2', this.xScale(this.currentStep.left_tangent_vertex.x))
                .attr('y2', this.yScale(this.currentStep.left_tangent_vertex.y))
                .attr('class', 'tangent-line left')
                .style('stroke', '#8b5cf6')
                .style('stroke-width', 5)
                .style('stroke-dasharray', '10,5')
                .style('opacity', 1.0);
            
            // Add label for left tangent
            const midX = (this.xScale(candidate.x) + this.xScale(this.currentStep.left_tangent_vertex.x)) / 2;
            const midY = (this.yScale(candidate.y) + this.yScale(this.currentStep.left_tangent_vertex.y)) / 2;
            
            tangentGroup.append('text')
                .attr('x', midX)
                .attr('y', midY + 22)
                .text('Left Tangent')
                .style('fill', '#8b5cf6')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('text-anchor', 'middle')
                .style('background', 'white')
                .style('padding', '2px');
        }
    }

    renderPoints() {
        const pointsGroup = this.groups.points;
        
        // Optimize rendering for large datasets
        const pointCount = this.points.length;
        const isLargeDataset = pointCount > 100;
        const isVeryLargeDataset = pointCount > 300;
        
        // Adjust point size and stroke based on dataset size
        const pointRadius = this.getOptimalPointRadius(pointCount);
        const strokeWidth = isVeryLargeDataset ? 1 : 2;
        const animationDuration = isLargeDataset ? 0 : this.animationDuration / 2;
        
        // Bind data
        const points = pointsGroup.selectAll('.point')
            .data(this.points, d => d.id);
        
        // Remove old points (no animation for large datasets)
        if (isLargeDataset) {
            points.exit().remove();
        } else {
            points.exit()
                .transition()
                .duration(animationDuration)
                .attr('r', 0)
                .remove();
        }
        
        // Add new points
        const newPoints = points.enter()
            .append('circle')
            .attr('class', 'point')
            .attr('cx', d => this.xScale(d.x))
            .attr('cy', d => this.yScale(d.y))
            .attr('r', isLargeDataset ? pointRadius : 0)
            .style('fill', '#9ca3af')
            .style('stroke', isVeryLargeDataset ? 'none' : 'white')
            .style('stroke-width', strokeWidth)
            .style('cursor', 'pointer');
        
        // Update all points
        const allPoints = newPoints.merge(points);
        
        // Update positions immediately (no transition for position)
        allPoints
            .attr('cx', d => this.xScale(d.x))
            .attr('cy', d => this.yScale(d.y));
        
        // Only animate visual properties (skip animation for large datasets)
        if (isLargeDataset) {
            allPoints
                .attr('r', d => this.getPointRadius(d))
                .style('fill', d => this.getPointColor(d))
                .style('stroke', d => this.getPointStroke(d))
                .style('stroke-width', d => this.getPointStrokeWidth(d));
        } else {
            allPoints
                .transition()
                .duration(animationDuration)
                .attr('r', d => this.getPointRadius(d))
                .style('fill', d => this.getPointColor(d))
                .style('stroke', d => this.getPointStroke(d))
                .style('stroke-width', d => this.getPointStrokeWidth(d));
        }
        
        // Add click handler for new points
        newPoints.on('click', (event, d) => {
            this.onPointClick(d);
        });
    }

    getOptimalPointRadius(pointCount) {
        // Scale point size based on dataset size for better visibility
        if (pointCount <= 20) return 8;
        if (pointCount <= 50) return 6;
        if (pointCount <= 100) return 5;
        if (pointCount <= 200) return 4;
        if (pointCount <= 300) return 3;
        return 2; // Very large datasets
    }

    get animationDuration() {
        // Reduce animation duration for large datasets
        const pointCount = this.points.length;
        if (pointCount > 300) return 0; // No animation for very large datasets
        if (pointCount > 100) return this.baseAnimationDuration * 0.3;
        if (pointCount > 50) return this.baseAnimationDuration * 0.6;
        return this.baseAnimationDuration;
    }

    getPointRadius(point) {
        if (!this.currentStep) return 8;  // Bigger default size
        
        // Current point being processed
        if (this.currentStep.current_point && 
            point.x === this.currentStep.current_point.x && 
            point.y === this.currentStep.current_point.y) {
            return 14;  // Much bigger for current point
        }
        
        // Popped point
        if (this.currentStep.popped_point && 
            point.x === this.currentStep.popped_point.x && 
            point.y === this.currentStep.popped_point.y) {
            return 12;
        }
        
        // Candidate/added points (incremental)
        if ((this.currentStep.candidate_point || this.currentStep.added_point) && 
            point.x === (this.currentStep.candidate_point || this.currentStep.added_point).x && 
            point.y === (this.currentStep.candidate_point || this.currentStep.added_point).y) {
            return 12;
        }
        
        // Hull vertices
        if (this.isHullVertex(point)) {
            return 10;
        }
        
        return 8;  // Bigger default size
    }

    getPointColor(point) {
        if (!this.currentStep) return '#9ca3af';
        
        // For Chan's algorithm, don't color points specially - let the hull rendering handle it
        if (this.currentStep.type === 'mini_hull' || this.currentStep.type === 'jarvis_phase') {
            return '#9ca3af';  // Keep all points gray for Chan's algorithm
        }
        
        // Current point (red circle - the point we're starting from)
        if (this.currentStep.current_point && 
            point.x === this.currentStep.current_point.x && 
            point.y === this.currentStep.current_point.y) {
            return '#ef4444';
        }
        
        // Candidate being tested (orange for Jarvis March)
        if (this.currentStep.type === 'testing' && this.currentStep.candidate && 
            point.x === this.currentStep.candidate.x && 
            point.y === this.currentStep.candidate.y) {
            return this.currentStep.is_better ? '#f59e0b' : '#ef4444';  // Orange if better, red if worse
        }
        
        // Next point (current best candidate - green)
        if (this.currentStep.next_point && 
            point.x === this.currentStep.next_point.x && 
            point.y === this.currentStep.next_point.y) {
            return '#10b981';
        }
        
        // Selected candidate (bright green)
        if (this.currentStep.type === 'candidate_selected' && this.currentStep.selected_candidate && 
            point.x === this.currentStep.selected_candidate.x && 
            point.y === this.currentStep.selected_candidate.y) {
            return '#22c55e';
        }
        
        // Popped point (Graham's scan) - red
        if (this.currentStep.popped_point && 
            point.x === this.currentStep.popped_point.x && 
            point.y === this.currentStep.popped_point.y) {
            return '#ef4444';
        }
        
        // Current point being processed (Graham's scan) - highlight color
        if (this.currentStep.current_point && 
            point.x === this.currentStep.current_point.x && 
            point.y === this.currentStep.current_point.y &&
            (this.currentStep.type === 'upper_hull' || this.currentStep.type === 'lower_hull')) {
            return this.currentStep.type === 'upper_hull' ? '#3b82f6' : '#10b981';
        }
        
        // Added point (incremental)
        if (this.currentStep.point && 
            point.x === this.currentStep.point.x && 
            point.y === this.currentStep.point.y) {
            return '#10b981';
        }
        
        // Removed point (incremental)
        if (this.currentStep.removed_point && 
            point.x === this.currentStep.removed_point.x && 
            point.y === this.currentStep.removed_point.y) {
            return '#ef4444';
        }
        
        // Tangent vertices
        if (this.currentStep.right_tangent_vertex && 
            point.x === this.currentStep.right_tangent_vertex.x && 
            point.y === this.currentStep.right_tangent_vertex.y) {
            return '#f59e0b';
        }
        
        if (this.currentStep.left_tangent_vertex && 
            point.x === this.currentStep.left_tangent_vertex.x && 
            point.y === this.currentStep.left_tangent_vertex.y) {
            return '#8b5cf6';
        }
        
        // Hull vertices
        if (this.isHullVertex(point)) {
            return '#3b82f6';
        }
        
        return '#9ca3af';
    }

    getPointStroke(point) {
        if (this.currentStep && this.currentStep.current_point && 
            point.x === this.currentStep.current_point.x && 
            point.y === this.currentStep.current_point.y) {
            return '#7f1d1d';
        }
        return 'white';
    }

    getPointStrokeWidth(point) {
        if (this.currentStep && this.currentStep.current_point && 
            point.x === this.currentStep.current_point.x && 
            point.y === this.currentStep.current_point.y) {
            return 3;
        }
        return 2;
    }

    isHullVertex(point) {
        if (!this.currentStep) return false;
        
        const hullArrays = [
            this.currentStep.upper_hull,
            this.currentStep.lower_hull,
            this.currentStep.current_hull,
            this.currentStep.hull_before,
            this.currentStep.hull_after,
            this.currentStep.hull_so_far
        ].filter(Boolean);
        
        return hullArrays.some(hull => 
            hull.some(hullPoint => 
                hullPoint.x === point.x && hullPoint.y === point.y
            )
        );
    }

    renderLabels() {
        const labelsGroup = this.groups.labels;
        labelsGroup.selectAll('*').remove();
        
        // Show point labels for all algorithms (like Python scripts)
        if (this.points.length > 0) {
            const labels = labelsGroup.selectAll('.point-label')
                .data(this.points, d => d.id);
            
            labels.enter()
                .append('text')
                .attr('class', 'point-label')
                .style('font-size', '10px')
                .style('font-weight', '500')
                .style('fill', '#6b7280')
                .style('text-anchor', 'start')
                .style('dominant-baseline', 'central')
                .style('pointer-events', 'none')
                .attr('x', d => this.xScale(d.x) + 8)
                .attr('y', d => this.yScale(d.y) + 8)
                .text((d, i) => `P${i + 1}`);  // Like Python script: P1, P2, etc.
        }
    }

    renderAnnotations() {
        const annotationsGroup = this.groups.annotations;
        annotationsGroup.selectAll('*').remove();
        
        if (!this.currentStep) return;
        
        // Removed: Algorithm Complete text - let the visualization speak for itself
    }

    onPointClick(point) {
        // Emit event for point click
        const event = new CustomEvent('pointClick', { detail: point });
        this.container.node().dispatchEvent(event);
    }

    // Public methods
    resetZoom() {
        // Zoom is disabled, just reset scales and re-render
        this.updateScales();
        this.render();
    }

    fitToData() {
        this.updateScales();
        this.render();
        this.resetZoom();
    }

    setAnimationDuration(duration) {
        this.animationDuration = duration;
    }

    // Add point manually
    addPoint(x, y) {
        const worldX = this.xScale.invert(x);
        const worldY = this.yScale.invert(y);
        
        const newPoint = {
            x: Math.round(worldX),
            y: Math.round(worldY),
            id: this.points.length,
            originalIndex: this.points.length
        };
        
        this.points.push(newPoint);
        this.render();
        
        // Emit event
        const event = new CustomEvent('pointAdded', { detail: newPoint });
        this.container.node().dispatchEvent(event);
    }

    // Clear all points
    clearPoints() {
        this.points = [];
        this.currentStep = null;
        this.updateScales();
        this.render();
    }

    // Get current points in API format
    getPoints() {
        return this.points.map(p => ({ x: p.x, y: p.y }));
    }
}

// Export for use in other modules
window.D3ConvexHullVisualizer = D3ConvexHullVisualizer;