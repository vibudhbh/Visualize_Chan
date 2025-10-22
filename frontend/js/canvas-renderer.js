/**
 * Canvas Renderer for Convex Hull Visualization
 * Handles all drawing operations
 */

class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Viewport settings
        this.viewportX = 0;
        this.viewportY = 0;
        this.scale = 1;
        
        // Display settings
        this.showLabels = true;
        this.showGrid = true;
        this.pointSize = 6;
        
        // Colors
        this.colors = {
            background: '#ffffff',
            grid: '#e5e7eb',
            point: '#6b7280',
            pointHighlight: '#ef4444',
            pointCurrent: '#f59e0b',
            hull: '#2563eb',
            hullFill: 'rgba(37, 99, 235, 0.1)',
            text: '#374151'
        };
        
        this.setupCanvas();
    }

    setupCanvas() {
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        console.log('Canvas setup - rect:', rect);
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Set default transform - center origin and flip Y axis
        this.resetView();
        
        // Draw a test pattern to verify canvas is working
        this.drawTestPattern();
        
        // Handle resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.setupCanvas(), 100);
        });
    }

    resetView() {
        const rect = this.canvas.getBoundingClientRect();
        this.viewportX = 0;
        this.viewportY = 0;
        this.scale = 1;
        
        // Center coordinate system and flip Y axis for mathematical coordinates
        this.ctx.setTransform(1, 0, 0, -1, rect.width / 2, rect.height / 2);
    }

    drawTestPattern() {
        // Draw a simple test pattern to verify canvas is working
        this.ctx.save();
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        
        // Draw cross in center
        this.ctx.beginPath();
        this.ctx.moveTo(-50, 0);
        this.ctx.lineTo(50, 0);
        this.ctx.moveTo(0, -50);
        this.ctx.lineTo(0, 50);
        this.ctx.stroke();
        
        // Draw circle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    canvasToWorld(canvasX, canvasY) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        return {
            x: (canvasX - centerX) / this.scale + this.viewportX,
            y: -(canvasY - centerY) / this.scale + this.viewportY
        };
    }

    worldToCanvas(worldX, worldY) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        return {
            x: (worldX - this.viewportX) * this.scale + centerX,
            y: -(worldY - this.viewportY) * this.scale + centerY
        };
    }

    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Restore proper transform
        this.resetView();
    }

    drawGrid() {
        if (!this.showGrid) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const gridSpacing = 50;
        
        if (gridSpacing * this.scale < 10) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1 / this.scale;
        this.ctx.setLineDash([]);
        
        const worldWidth = rect.width / this.scale;
        const worldHeight = rect.height / this.scale;
        
        const minX = this.viewportX - worldWidth / 2;
        const maxX = this.viewportX + worldWidth / 2;
        const minY = this.viewportY - worldHeight / 2;
        const maxY = this.viewportY + worldHeight / 2;
        
        // Vertical lines
        const startX = Math.floor(minX / gridSpacing) * gridSpacing;
        for (let x = startX; x <= maxX; x += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, minY);
            this.ctx.lineTo(x, maxY);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        const startY = Math.floor(minY / gridSpacing) * gridSpacing;
        for (let y = startY; y <= maxY; y += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(minX, y);
            this.ctx.lineTo(maxX, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawPoint(point, color = this.colors.point, size = this.pointSize) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawPointLabel(point, label) {
        if (!this.showLabels) return;
        
        this.ctx.save();
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `${12 / this.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Scale and flip text back to normal orientation
        this.ctx.scale(1, -1);
        this.ctx.fillText(label, point.x, -(point.y + this.pointSize + 5));
        
        this.ctx.restore();
    }

    drawPoints(points) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            this.drawPoint(point);
            this.drawPointLabel(point, `P${i + 1}`);
        }
    }

    drawHull(hull) {
        if (hull.length < 2) return;
        
        this.ctx.save();
        
        // Draw hull area
        if (hull.length >= 3) {
            this.ctx.fillStyle = this.colors.hullFill;
            this.ctx.beginPath();
            this.ctx.moveTo(hull[0].x, hull[0].y);
            for (let i = 1; i < hull.length; i++) {
                this.ctx.lineTo(hull[i].x, hull[i].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Draw hull edges
        this.ctx.strokeStyle = this.colors.hull;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(hull[0].x, hull[0].y);
        for (let i = 1; i < hull.length; i++) {
            this.ctx.lineTo(hull[i].x, hull[i].y);
        }
        if (hull.length >= 3) {
            this.ctx.closePath();
        }
        this.ctx.stroke();
        
        // Draw hull vertices
        for (const point of hull) {
            this.drawPoint(point, this.colors.hull, this.pointSize * 1.2);
        }
        
        this.ctx.restore();
    }

    drawStep(step) {
        if (!step) return;
        
        this.ctx.save();
        
        // Draw step-specific visualizations based on step type
        switch (step.type) {
            case 'upper_hull':
            case 'lower_hull':
                this.drawGrahamStep(step);
                break;
            case 'jarvis_step':
            case 'testing':
                this.drawJarvisStep(step);
                break;
            case 'mini_hull':
                this.drawChanStep(step);
                break;
            case 'seed':
            case 'inside':
            case 'tangents':
            case 'splice_done':
                this.drawIncrementalStep(step);
                break;
            case 'complete':
                this.drawCompleteStep(step);
                break;
        }
        
        this.ctx.restore();
    }

    drawGrahamStep(step) {
        // Draw all points with indices (like Python script)
        if (step.sorted_points) {
            for (let i = 0; i < step.sorted_points.length; i++) {
                const point = step.sorted_points[i];
                this.drawPoint(point, '#d1d5db', this.pointSize * 0.8);
                
                // Draw point index
                this.ctx.save();
                this.ctx.scale(1, -1);
                this.ctx.fillStyle = '#6b7280';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`${i+1}`, point.x + 8, -point.y + 3);
                this.ctx.restore();
            }
        }
        
        // Draw upper hull (always show if available, even during lower hull phase)
        if (step.upper_hull && step.upper_hull.length > 1) {
            this.ctx.strokeStyle = '#2563eb';
            this.ctx.lineWidth = step.type === 'upper_hull' ? 3 : 2;
            this.ctx.setLineDash(step.type === 'upper_hull' ? [] : [5, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.upper_hull[0].x, step.upper_hull[0].y);
            for (let i = 1; i < step.upper_hull.length; i++) {
                this.ctx.lineTo(step.upper_hull[i].x, step.upper_hull[i].y);
            }
            this.ctx.stroke();
            
            // Draw upper hull points
            for (const point of step.upper_hull) {
                this.drawPoint(point, '#2563eb', this.pointSize * 1.2);
            }
        }
        
        // Draw lower hull (when available)
        if (step.lower_hull && step.lower_hull.length > 1) {
            this.ctx.strokeStyle = '#059669';
            this.ctx.lineWidth = step.type === 'lower_hull' ? 3 : 2;
            this.ctx.setLineDash(step.type === 'lower_hull' ? [] : [5, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.lower_hull[0].x, step.lower_hull[0].y);
            for (let i = 1; i < step.lower_hull.length; i++) {
                this.ctx.lineTo(step.lower_hull[i].x, step.lower_hull[i].y);
            }
            this.ctx.stroke();
            
            // Draw lower hull points
            for (const point of step.lower_hull) {
                this.drawPoint(point, '#059669', this.pointSize * 1.2);
            }
        }
        
        // Highlight current point being processed
        if (step.current_point) {
            this.drawPoint(step.current_point, '#dc2626', this.pointSize * 2.0);
            
            // Draw star shape for current point (like Python script)
            this.ctx.save();
            this.ctx.fillStyle = '#dc2626';
            this.ctx.strokeStyle = '#7f1d1d';
            this.ctx.lineWidth = 2;
            
            const x = step.current_point.x;
            const y = step.current_point.y;
            const size = this.pointSize * 1.5;
            
            // Draw star
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5;
                const px = x + size * Math.cos(angle);
                const py = y + size * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
            
            // Draw label for current point
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = '#dc2626';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('Current', step.current_point.x + 15, -step.current_point.y - 10);
            this.ctx.restore();
        }
        
        // Highlight popped point with X marker (like Python script)
        if (step.phase === 'popping' && step.popped_point) {
            const point = step.popped_point;
            
            // Draw X marker
            this.ctx.save();
            this.ctx.strokeStyle = '#f97316';
            this.ctx.lineWidth = 4;
            const size = this.pointSize * 1.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(point.x - size, point.y - size);
            this.ctx.lineTo(point.x + size, point.y + size);
            this.ctx.moveTo(point.x - size, point.y + size);
            this.ctx.lineTo(point.x + size, point.y - size);
            this.ctx.stroke();
            this.ctx.restore();
            
            // Draw label for popped point
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = '#f97316';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('Popping', point.x + 15, -point.y + 20);
            this.ctx.restore();
        }
    }

    drawJarvisStep(step) {
        // Draw hull so far
        if (step.hullSoFar && step.hullSoFar.length > 1) {
            this.ctx.strokeStyle = this.colors.hull;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.hullSoFar[0].x, step.hullSoFar[0].y);
            for (let i = 1; i < step.hullSoFar.length; i++) {
                this.ctx.lineTo(step.hullSoFar[i].x, step.hullSoFar[i].y);
            }
            this.ctx.stroke();
        }
        
        // Draw lines from current point
        if (step.currentPoint && step.candidatePoint) {
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.currentPoint.x, step.currentPoint.y);
            this.ctx.lineTo(step.candidatePoint.x, step.candidatePoint.y);
            this.ctx.stroke();
        }
        
        if (step.currentPoint && step.testingPoint) {
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.currentPoint.x, step.currentPoint.y);
            this.ctx.lineTo(step.testingPoint.x, step.testingPoint.y);
            this.ctx.stroke();
        }
        
        // Highlight points
        if (step.currentPoint) {
            this.drawPoint(step.currentPoint, this.colors.pointCurrent, this.pointSize * 1.8);
        }
        if (step.candidatePoint) {
            this.drawPoint(step.candidatePoint, '#fbbf24', this.pointSize * 1.3);
        }
        if (step.testingPoint) {
            this.drawPoint(step.testingPoint, this.colors.pointHighlight, this.pointSize * 1.2);
        }
    }

    drawChanStep(step) {
        // Draw mini-hulls with different colors
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
        
        if (step.allMiniHulls) {
            step.allMiniHulls.forEach((hull, i) => {
                if (hull && hull.length > 2) {
                    const color = colors[i % colors.length];
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = i === step.groupIdx ? 3 : 1;
                    this.ctx.setLineDash([]);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(hull[0].x, hull[0].y);
                    for (let j = 1; j < hull.length; j++) {
                        this.ctx.lineTo(hull[j].x, hull[j].y);
                    }
                    this.ctx.closePath();
                    this.ctx.stroke();
                }
            });
        }
    }

    drawIncrementalStep(step) {
        // Draw current hull
        if (step.hull_before && step.hull_before.length > 2) {
            this.ctx.strokeStyle = this.colors.hull;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.hull_before[0].x, step.hull_before[0].y);
            for (let i = 1; i < step.hull_before.length; i++) {
                this.ctx.lineTo(step.hull_before[i].x, step.hull_before[i].y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            // Highlight hull vertices
            for (const point of step.hull_before) {
                this.drawPoint(point, this.colors.hull, this.pointSize * 1.1);
            }
        }
        
        // Draw hull after (for splice_done steps)
        if (step.hull_after && step.hull_after.length > 2 && step.type === 'splice_done') {
            this.ctx.strokeStyle = '#16a34a';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.hull_after[0].x, step.hull_after[0].y);
            for (let i = 1; i < step.hull_after.length; i++) {
                this.ctx.lineTo(step.hull_after[i].x, step.hull_after[i].y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
        
        // Highlight candidate point
        if (step.candidate_point || step.added_point) {
            const point = step.candidate_point || step.added_point;
            let color = this.colors.pointCurrent;
            let label = 'Candidate';
            
            if (step.type === 'inside') {
                color = '#ef4444';
                label = 'Inside';
            } else if (step.type === 'seed') {
                color = '#16a34a';
                label = 'Added';
            } else if (step.type === 'splice_done') {
                color = '#16a34a';
                label = 'Spliced';
            }
            
            this.drawPoint(point, color, this.pointSize * 1.8);
            
            // Draw label
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = color;
            this.ctx.font = '12px Arial';
            this.ctx.fillText(label, point.x + 10, -point.y - 10);
            this.ctx.restore();
        }
        
        // Draw tangent lines for tangent steps
        if (step.type === 'tangents' && step.candidate_point) {
            const candidate = step.candidate_point;
            
            // Right tangent
            if (step.right_tangent_vertex) {
                this.ctx.strokeStyle = '#f59e0b';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([10, 5]);
                
                this.ctx.beginPath();
                this.ctx.moveTo(candidate.x, candidate.y);
                this.ctx.lineTo(step.right_tangent_vertex.x, step.right_tangent_vertex.y);
                this.ctx.stroke();
                
                this.drawPoint(step.right_tangent_vertex, '#f59e0b', this.pointSize * 1.3);
            }
            
            // Left tangent
            if (step.left_tangent_vertex) {
                this.ctx.strokeStyle = '#8b5cf6';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([10, 5]);
                
                this.ctx.beginPath();
                this.ctx.moveTo(candidate.x, candidate.y);
                this.ctx.lineTo(step.left_tangent_vertex.x, step.left_tangent_vertex.y);
                this.ctx.stroke();
                
                this.drawPoint(step.left_tangent_vertex, '#8b5cf6', this.pointSize * 1.3);
            }
        }
    }

    drawCompleteStep(step) {
        // Draw final hull with fill (like Python script)
        if (step.final_hull && step.final_hull.length > 2) {
            // Draw filled hull
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.strokeStyle = '#2563eb';
            this.ctx.lineWidth = 3;
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.final_hull[0].x, step.final_hull[0].y);
            for (let i = 1; i < step.final_hull.length; i++) {
                this.ctx.lineTo(step.final_hull[i].x, step.final_hull[i].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
            
            // Draw hull vertices
            for (const point of step.final_hull) {
                this.drawPoint(point, '#2563eb', this.pointSize * 1.5);
            }
        }
        
        // Draw upper and lower hulls if available
        if (step.upper_hull && step.upper_hull.length > 1) {
            this.ctx.strokeStyle = '#2563eb';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.upper_hull[0].x, step.upper_hull[0].y);
            for (let i = 1; i < step.upper_hull.length; i++) {
                this.ctx.lineTo(step.upper_hull[i].x, step.upper_hull[i].y);
            }
            this.ctx.stroke();
        }
        
        if (step.lower_hull && step.lower_hull.length > 1) {
            this.ctx.strokeStyle = '#059669';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(step.lower_hull[0].x, step.lower_hull[0].y);
            for (let i = 1; i < step.lower_hull.length; i++) {
                this.ctx.lineTo(step.lower_hull[i].x, step.lower_hull[i].y);
            }
            this.ctx.stroke();
        }
        
        // Add completion text
        this.ctx.save();
        this.ctx.scale(1, -1);
        this.ctx.fillStyle = '#2563eb';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Algorithm Complete!', 0, 50);
        this.ctx.restore();
    }

    render(data) {
        this.clear();
        this.drawGrid();
        
        if (data.points && data.points.length > 0) {
            this.drawPoints(data.points);
        }
        
        // Only show final hull if we're not in step mode or if it's the complete step
        if (data.hull && data.hull.length > 0) {
            if (!data.step || data.step.type === 'complete') {
                this.drawHull(data.hull);
            }
        }
        
        if (data.step) {
            this.drawStep(data.step);
        }
    }

    fitToPoints(points) {
        if (!points || points.length === 0) return;
        
        // Find bounding box
        let minX = points[0].x, maxX = points[0].x;
        let minY = points[0].y, maxY = points[0].y;
        
        for (const point of points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        if (width === 0 && height === 0) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const padding = 50;
        
        const scaleX = (rect.width - 2 * padding) / width;
        const scaleY = (rect.height - 2 * padding) / height;
        
        this.scale = Math.min(scaleX, scaleY, 2);
        this.viewportX = (minX + maxX) / 2;
        this.viewportY = (minY + maxY) / 2;
        
        this.resetView();
    }
}

// Export for use in other modules
window.CanvasRenderer = CanvasRenderer;