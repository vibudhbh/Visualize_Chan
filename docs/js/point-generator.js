/**
 * Point Generator
 * Generates various distributions of points for testing
 */

class PointGenerator {
    static generate(count, distribution = 'random', options = {}) {
        const defaults = {
            width: 400,
            height: 300,
            centerX: 0,
            centerY: 0,
            radius: 150
        };
        
        const opts = { ...defaults, ...options };
        
        switch (distribution.toLowerCase()) {
            case 'random':
                return this.generateRandom(count, opts);
            case 'circle':
                return this.generateCircle(count, opts);
            case 'square':
                return this.generateSquare(count, opts);
            case 'grid':
                return this.generateGrid(count, opts);
            default:
                return this.generateRandom(count, opts);
        }
    }

    static generateRandom(count, opts) {
        const points = [];
        
        for (let i = 0; i < count; i++) {
            points.push({
                x: opts.centerX + (Math.random() - 0.5) * opts.width,
                y: opts.centerY + (Math.random() - 0.5) * opts.height
            });
        }
        
        return points;
    }

    static generateCircle(count, opts) {
        const points = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i) / count;
            const radiusVariation = opts.radius * (0.8 + Math.random() * 0.4);
            
            points.push({
                x: opts.centerX + radiusVariation * Math.cos(angle),
                y: opts.centerY + radiusVariation * Math.sin(angle)
            });
        }
        
        return points;
    }

    static generateSquare(count, opts) {
        const points = [];
        const sideLength = opts.radius * 1.4;
        const halfSide = sideLength / 2;
        
        const pointsPerSide = Math.ceil(count / 4);
        
        // Top side
        for (let i = 0; i < pointsPerSide && points.length < count; i++) {
            const t = i / (pointsPerSide - 1);
            points.push({
                x: opts.centerX + (t - 0.5) * sideLength,
                y: opts.centerY + halfSide
            });
        }
        
        // Right side
        for (let i = 0; i < pointsPerSide && points.length < count; i++) {
            const t = i / (pointsPerSide - 1);
            points.push({
                x: opts.centerX + halfSide,
                y: opts.centerY + (0.5 - t) * sideLength
            });
        }
        
        // Bottom side
        for (let i = 0; i < pointsPerSide && points.length < count; i++) {
            const t = i / (pointsPerSide - 1);
            points.push({
                x: opts.centerX + (0.5 - t) * sideLength,
                y: opts.centerY - halfSide
            });
        }
        
        // Left side
        for (let i = 0; i < pointsPerSide && points.length < count; i++) {
            const t = i / (pointsPerSide - 1);
            points.push({
                x: opts.centerX - halfSide,
                y: opts.centerY + (t - 0.5) * sideLength
            });
        }
        
        return points.slice(0, count);
    }

    static generateGrid(count, opts) {
        const points = [];
        const gridSize = Math.ceil(Math.sqrt(count));
        const spacing = Math.min(opts.width, opts.height) / gridSize;
        const jitter = spacing * 0.3;
        
        let pointCount = 0;
        
        for (let i = 0; i < gridSize && pointCount < count; i++) {
            for (let j = 0; j < gridSize && pointCount < count; j++) {
                const baseX = opts.centerX + (i - gridSize / 2) * spacing;
                const baseY = opts.centerY + (j - gridSize / 2) * spacing;
                
                points.push({
                    x: baseX + (Math.random() - 0.5) * jitter,
                    y: baseY + (Math.random() - 0.5) * jitter
                });
                
                pointCount++;
            }
        }
        
        return points.slice(0, count);
    }
}

// Export for use in other modules
window.PointGenerator = PointGenerator;