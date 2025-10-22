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
        this.renderGrid();
        this.renderHull();
        this.renderTangents();
        this.renderPoints();
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
        } else if (this.currentStep.type === 'mini_hull' || this.currentStep.type === 'jarvis') {
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
        
        // For complete Graham's scan, combine upper and lower hulls into final closed polygon
        if (this.currentStep.type === 'complete' && this.currentStep.upper_hull && this.currentStep.lower_hull) {
            // Combine upper and lower hulls to form complete hull
            const completeHull = [...this.currentStep.upper_hull, ...this.currentStep.lower_hull.slice(1, -1).reverse()];
            
            if (completeHull.length > 2) {
                const closedLine = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y))
                    .curve(d3.curveLinearClosed);
                
                // Fill first
                hullGroup.append('path')
                    .datum(completeHull)
                    .attr('d', closedLine)
                    .style('fill', 'rgba(59, 130, 246, 0.2)')
                    .style('stroke', 'none');
                
                // Then closed outline
                hullGroup.append('path')
                    .datum(completeHull)
                    .attr('d', closedLine)
                    .style('fill', 'none')
                    .style('stroke', '#3b82f6')
                    .style('stroke-width', 4)
                    .style('stroke-linejoin', 'round');
                
                // Hull vertices
                completeHull.forEach(point => {
                    hullGroup.append('circle')
                        .attr('cx', this.xScale(point.x))
                        .attr('cy', this.yScale(point.y))
                        .attr('r', 8)
                        .style('fill', '#3b82f6')
                        .style('stroke', 'white')
                        .style('stroke-width', 2);
                });
            }
            return; // Don't draw individual upper/lower hulls for complete step
        }
        
        // Upper hull
        if (this.currentStep.upper_hull && this.currentStep.upper_hull.length > 1) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y));
            
            hullGroup.append('path')
                .datum(this.currentStep.upper_hull)
                .attr('d', line)
                .attr('class', 'hull-line upper')
                .style('fill', 'none')
                .style('stroke', '#3b82f6')
                .style('stroke-width', this.currentStep.type === 'upper_hull' ? 4 : 2)
                .style('stroke-dasharray', this.currentStep.type === 'upper_hull' ? 'none' : '5,5');
        }
        
        // Lower hull
        if (this.currentStep.lower_hull && this.currentStep.lower_hull.length > 1) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y));
            
            hullGroup.append('path')
                .datum(this.currentStep.lower_hull)
                .attr('d', line)
                .attr('class', 'hull-line lower')
                .style('fill', 'none')
                .style('stroke', '#10b981')
                .style('stroke-width', this.currentStep.type === 'lower_hull' ? 4 : 2)
                .style('stroke-dasharray', this.currentStep.type === 'lower_hull' ? 'none' : '5,5');
        }
        
        // Current hull being built
        if (this.currentStep.current_hull && this.currentStep.current_hull.length > 1) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y));
            
            const color = this.currentStep.type === 'upper_hull' ? '#3b82f6' : '#10b981';
            
            hullGroup.append('path')
                .datum(this.currentStep.current_hull)
                .attr('d', line)
                .attr('class', 'hull-line current')
                .style('fill', 'none')
                .style('stroke', color)
                .style('stroke-width', 4)
                .style('stroke-linejoin', 'round');
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
        
        // Draw line from current to candidate point (orange dashed)
        if (this.currentStep.current_point && this.currentStep.candidate_point) {
            hullGroup.append('line')
                .attr('x1', this.xScale(this.currentStep.current_point.x))
                .attr('y1', this.yScale(this.currentStep.current_point.y))
                .attr('x2', this.xScale(this.currentStep.candidate_point.x))
                .attr('y2', this.yScale(this.currentStep.candidate_point.y))
                .style('stroke', '#f59e0b')
                .style('stroke-width', 2)
                .style('stroke-dasharray', '5,5')
                .style('opacity', 0.7);
        }
        
        // Draw test line (for testing phase - yellow dashed)
        if (this.currentStep.type === 'testing' && this.currentStep.current_point && this.currentStep.testing_point) {
            hullGroup.append('line')
                .attr('x1', this.xScale(this.currentStep.current_point.x))
                .attr('y1', this.yScale(this.currentStep.current_point.y))
                .attr('x2', this.xScale(this.currentStep.testing_point.x))
                .attr('y2', this.yScale(this.currentStep.testing_point.y))
                .style('stroke', '#eab308')
                .style('stroke-width', 2)
                .style('stroke-dasharray', '5,5')
                .style('opacity', 0.7);
        }
    }

    renderChanHull() {
        const hullGroup = this.groups.hull;
        const colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink', 'cyan'];
        
        // Debug logging
        console.log('=== Chan Hull Debug ===');
        console.log('Step type:', this.currentStep.type);
        console.log('Group index:', this.currentStep.group_idx);
        console.log('all_mini_hulls exists:', !!this.currentStep.all_mini_hulls);
        if (this.currentStep.all_mini_hulls) {
            console.log('all_mini_hulls length:', this.currentStep.all_mini_hulls.length);
            console.log('all_mini_hulls content:', this.currentStep.all_mini_hulls);
        }
        console.log('mini_hull exists:', !!this.currentStep.mini_hull);
        if (this.currentStep.mini_hull) {
            console.log('mini_hull length:', this.currentStep.mini_hull.length);
        }
        
        if (this.currentStep.type === 'mini_hull') {
            // Phase 1: Computing mini-hulls - ALWAYS show all computed mini-hulls
            
            // Draw all computed mini-hulls so far (this is the key fix!)
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
                                .style('stroke-width', 3);
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
                                .style('stroke-width', 3);
                        }
                        
                        // Draw hull vertices as circles
                        hull.forEach(point => {
                            hullGroup.append('circle')
                                .attr('cx', this.xScale(point.x))
                                .attr('cy', this.yScale(point.y))
                                .attr('r', 6)
                                .style('fill', color)
                                .style('stroke', 'white')
                                .style('stroke-width', 2);
                        });
                    }
                });
            }
            
            // Highlight current mini-hull being computed with thicker outline
            if (this.currentStep.mini_hull && this.currentStep.group_idx !== undefined) {
                const currentColor = colors[this.currentStep.group_idx % colors.length];
                const hull = this.currentStep.mini_hull;
                if (hull.length >= 2) {
                    if (hull.length === 2) {
                        // Highlight line with thicker stroke
                        hullGroup.append('line')
                            .attr('x1', this.xScale(hull[0].x))
                            .attr('y1', this.yScale(hull[0].y))
                            .attr('x2', this.xScale(hull[1].x))
                            .attr('y2', this.yScale(hull[1].y))
                            .style('stroke', currentColor)
                            .style('stroke-width', 5)
                            .style('opacity', 0.9);
                    } else {
                        // Highlight polygon with thicker outline
                        const line = d3.line()
                            .x(d => this.xScale(d.x))
                            .y(d => this.yScale(d.y))
                            .curve(d3.curveLinearClosed);
                        hullGroup.append('path')
                            .datum(hull)
                            .attr('d', line)
                            .style('fill', 'none')
                            .style('stroke', currentColor)
                            .style('stroke-width', 5)
                            .style('opacity', 0.9);
                    }
                }
            }
            
        } else if (this.currentStep.type === 'jarvis') {
            // Phase 2: Jarvis March merging - show faded mini-hulls and growing final hull
            
            // Draw mini-hulls in faded colors with dashed lines
            if (this.currentStep.mini_hulls) {
                this.currentStep.mini_hulls.forEach((hull, i) => {
                    if (hull && hull.length >= 2) {
                        const color = colors[i % colors.length];
                        
                        if (hull.length === 2) {
                            // Faded line
                            hullGroup.append('line')
                                .attr('x1', this.xScale(hull[0].x))
                                .attr('y1', this.yScale(hull[0].y))
                                .attr('x2', this.xScale(hull[1].x))
                                .attr('y2', this.yScale(hull[1].y))
                                .style('stroke', color)
                                .style('stroke-width', 2)
                                .style('stroke-dasharray', '5,5')
                                .style('opacity', 0.4);
                        } else {
                            // Faded polygon
                            const line = d3.line()
                                .x(d => this.xScale(d.x))
                                .y(d => this.yScale(d.y))
                                .curve(d3.curveLinearClosed);
                            
                            hullGroup.append('path')
                                .datum(hull)
                                .attr('d', line)
                                .style('fill', color)
                                .style('fill-opacity', 0.1)
                                .style('stroke', color)
                                .style('stroke-width', 1)
                                .style('stroke-dasharray', '3,3')
                                .style('opacity', 0.4);
                        }
                    }
                });
            }
            
            // Draw final hull being built (black line with yellow fill when complete)
            if (this.currentStep.final_hull && this.currentStep.final_hull.length > 1) {
                const line = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y));
                
                // If hull is complete (closed), add yellow fill first
                if (this.currentStep.final_hull.length > 2) {
                    const closedLine = d3.line()
                        .x(d => this.xScale(d.x))
                        .y(d => this.yScale(d.y))
                        .curve(d3.curveLinearClosed);
                    
                    hullGroup.append('path')
                        .datum(this.currentStep.final_hull)
                        .attr('d', closedLine)
                        .style('fill', 'yellow')
                        .style('fill-opacity', 0.3)
                        .style('stroke', 'none');
                }
                
                // Hull line (black, thick)
                hullGroup.append('path')
                    .datum(this.currentStep.final_hull)
                    .attr('d', line)
                    .style('fill', 'none')
                    .style('stroke', 'black')
                    .style('stroke-width', 4);
                
                // Hull vertices as black circles
                this.currentStep.final_hull.forEach(point => {
                    hullGroup.append('circle')
                        .attr('cx', this.xScale(point.x))
                        .attr('cy', this.yScale(point.y))
                        .attr('r', 8)
                        .style('fill', 'black')
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
        
        // Draw current hull
        if (currentHull) {
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
            
            // Hull outline
            hullGroup.append('path')
                .datum(currentHull)
                .attr('d', line)
                .style('fill', 'none')
                .style('stroke', '#3b82f6')
                .style('stroke-width', this.currentStep.type === 'complete' ? 4 : 3);
            
            // Draw hull vertices
            currentHull.forEach(point => {
                hullGroup.append('circle')
                    .attr('cx', this.xScale(point.x))
                    .attr('cy', this.yScale(point.y))
                    .attr('r', 7)
                    .style('fill', '#3b82f6')
                    .style('stroke', 'white')
                    .style('stroke-width', 2);
            });
        }
        
        // Draw hull after (for splice_done steps) - show the new hull
        if (this.currentStep.type === 'splice_done' && this.currentStep.hull_after && this.currentStep.hull_after.length > 2) {
            const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y))
                .curve(d3.curveLinearClosed);
            
            hullGroup.append('path')
                .datum(this.currentStep.hull_after)
                .attr('d', line)
                .style('fill', 'none')
                .style('stroke', '#10b981')
                .style('stroke-width', 4)
                .style('stroke-dasharray', '8,4');
        }
        
        // Draw tangent lines for tangent steps
        if (this.currentStep.type === 'tangents' && this.currentStep.candidate_point) {
            const candidate = this.currentStep.candidate_point;
            
            // Right tangent
            if (this.currentStep.right_tangent_vertex) {
                hullGroup.append('line')
                    .attr('x1', this.xScale(candidate.x))
                    .attr('y1', this.yScale(candidate.y))
                    .attr('x2', this.xScale(this.currentStep.right_tangent_vertex.x))
                    .attr('y2', this.yScale(this.currentStep.right_tangent_vertex.y))
                    .style('stroke', '#f59e0b')
                    .style('stroke-width', 3)
                    .style('stroke-dasharray', '8,4');
            }
            
            // Left tangent
            if (this.currentStep.left_tangent_vertex) {
                hullGroup.append('line')
                    .attr('x1', this.xScale(candidate.x))
                    .attr('y1', this.yScale(candidate.y))
                    .attr('x2', this.xScale(this.currentStep.left_tangent_vertex.x))
                    .attr('y2', this.yScale(this.currentStep.left_tangent_vertex.y))
                    .style('stroke', '#8b5cf6')
                    .style('stroke-width', 3)
                    .style('stroke-dasharray', '8,4');
            }
        }
    }

    renderTangents() {
        const tangentGroup = this.groups.tangents;
        tangentGroup.selectAll('*').remove();
        
        if (!this.currentStep || this.currentStep.type !== 'tangents') return;
        
        const candidate = this.currentStep.candidate_point;
        
        // Right tangent
        if (this.currentStep.right_tangent_vertex) {
            tangentGroup.append('line')
                .attr('x1', this.xScale(candidate.x))
                .attr('y1', this.yScale(candidate.y))
                .attr('x2', this.xScale(this.currentStep.right_tangent_vertex.x))
                .attr('y2', this.yScale(this.currentStep.right_tangent_vertex.y))
                .attr('class', 'tangent-line right')
                .style('stroke', '#f59e0b')
                .style('stroke-width', 3)
                .style('stroke-dasharray', '8,4');
        }
        
        // Left tangent
        if (this.currentStep.left_tangent_vertex) {
            tangentGroup.append('line')
                .attr('x1', this.xScale(candidate.x))
                .attr('y1', this.yScale(candidate.y))
                .attr('x2', this.xScale(this.currentStep.left_tangent_vertex.x))
                .attr('y2', this.yScale(this.currentStep.left_tangent_vertex.y))
                .attr('class', 'tangent-line left')
                .style('stroke', '#8b5cf6')
                .style('stroke-width', 3)
                .style('stroke-dasharray', '8,4');
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
        if (this.currentStep.type === 'mini_hull' || this.currentStep.type === 'jarvis') {
            return '#9ca3af';  // Keep all points gray for Chan's algorithm
        }
        
        // Current point
        if (this.currentStep.current_point && 
            point.x === this.currentStep.current_point.x && 
            point.y === this.currentStep.current_point.y) {
            return '#ef4444';
        }
        
        // Testing point (Jarvis March - yellow triangle)
        if (this.currentStep.testing_point && 
            point.x === this.currentStep.testing_point.x && 
            point.y === this.currentStep.testing_point.y) {
            return '#eab308';  // Yellow like Python script
        }
        
        // Candidate point (Jarvis March - orange square)
        if (this.currentStep.candidate_point && 
            point.x === this.currentStep.candidate_point.x && 
            point.y === this.currentStep.candidate_point.y) {
            if (this.currentStep.type === 'inside') return '#ef4444';
            if (this.currentStep.type === 'splice_done') return '#10b981';
            return '#f59e0b';  // Orange like Python script
        }
        
        // Popped point (Graham's scan)
        if (this.currentStep.popped_point && 
            point.x === this.currentStep.popped_point.x && 
            point.y === this.currentStep.popped_point.y) {
            return '#f59e0b';
        }
        
        // Added point (incremental)
        if (this.currentStep.added_point && 
            point.x === this.currentStep.added_point.x && 
            point.y === this.currentStep.added_point.y) {
            return '#10b981';
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