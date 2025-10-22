/**
 * Main Application
 * Coordinates the frontend components and API communication
 */

class ConvexHullApp {
    constructor() {
        this.api = new ConvexHullAPI();
        this.canvas = document.getElementById('main-canvas');
        console.log('Canvas element found:', this.canvas);
        this.renderer = new CanvasRenderer(this.canvas);
        this.animationController = new AnimationController(this);
        
        this.points = [];
        this.currentResult = null;
        this.currentStep = 0;
        this.currentAlgorithm = 'graham';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.testAPIConnection();
        
        // Generate initial points
        this.generateRandomPoints();
        
        console.log('Convex Hull Visualizer initialized');
    }

    setupEventListeners() {
        // Algorithm selection
        document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentAlgorithm = e.target.value;
                this.updateAlgorithmInfo();
            });
        });

        // Point generation
        document.getElementById('generate-random-btn').addEventListener('click', () => {
            this.generateRandomPoints();
        });

        document.getElementById('generate-circle-btn').addEventListener('click', () => {
            this.generateCirclePoints();
        });

        document.getElementById('clear-points-btn').addEventListener('click', () => {
            this.clearPoints();
        });

        // Algorithm execution
        document.getElementById('run-btn').addEventListener('click', () => {
            this.runAlgorithm();
        });

        document.getElementById('compare-btn').addEventListener('click', () => {
            this.compareAlgorithms();
        });

        // Animation controls
        document.getElementById('play-btn').addEventListener('click', () => {
            this.toggleAnimation();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextStep();
        });

        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousStep();
        });

        document.getElementById('first-btn').addEventListener('click', () => {
            this.firstStep();
        });

        document.getElementById('last-btn').addEventListener('click', () => {
            this.lastStep();
        });

        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.animationController.setSpeed(parseInt(e.target.value));
        });

        // API configuration
        document.getElementById('api-url').addEventListener('change', (e) => {
            this.api.setBaseUrl(e.target.value);
            this.testAPIConnection();
        });

        document.getElementById('test-api-btn').addEventListener('click', () => {
            this.testAPIConnection();
        });

        // Canvas clicks for manual point input
        this.canvas.addEventListener('click', (e) => {
            this.addPointFromClick(e);
        });
    }

    async testAPIConnection() {
        const statusElement = document.getElementById('api-status');
        statusElement.textContent = 'Testing...';
        statusElement.className = 'api-status';
        
        try {
            const result = await this.api.testConnection();
            if (result.success) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'api-status connected';
            } else {
                statusElement.textContent = 'Connection failed';
                statusElement.className = 'api-status error';
            }
        } catch (error) {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.className = 'api-status error';
        }
    }

    generateRandomPoints() {
        this.points = PointGenerator.generate(20, 'random', {
            width: 400,
            height: 300,
            centerX: 0,
            centerY: 0
        });
        this.updateUI();
        this.renderer.fitToPoints(this.points);
    }

    generateCirclePoints() {
        this.points = PointGenerator.generate(16, 'circle', {
            radius: 120,
            centerX: 0,
            centerY: 0
        });
        this.updateUI();
        this.renderer.fitToPoints(this.points);
    }

    clearPoints() {
        this.points = [];
        this.currentResult = null;
        this.currentStep = 0;
        this.updateUI();
    }

    addPointFromClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        const worldPoint = this.renderer.canvasToWorld(canvasX, canvasY);
        this.points.push({
            x: Math.round(worldPoint.x),
            y: Math.round(worldPoint.y)
        });
        
        this.updateUI();
    }

    async runAlgorithm() {
        if (this.points.length < 3) {
            this.showStatus('Need at least 3 points to compute convex hull', 'error');
            return;
        }

        this.showLoading(true);
        this.showStatus(`Running ${this.getAlgorithmName()}...`);

        try {
            this.currentResult = await this.api.runAlgorithm(this.currentAlgorithm, this.points);
            this.currentStep = 0;  // Start at first step
            
            this.showStatus(`${this.getAlgorithmName()} completed in ${this.currentResult.stats.execution_time_ms.toFixed(2)}ms`);
            
            // Hide comparison results when running new algorithm
            document.getElementById('comparison-results').style.display = 'none';
            
            this.updateUI();
            
            // Ensure proper view scaling for the algorithm
            this.renderer.fitToPoints(this.points);
            
            // Don't auto-start animation - let user control it
            // Animation controls will be enabled by updateUI()
            
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            console.error('Algorithm execution error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    async compareAlgorithms() {
        if (this.points.length < 3) {
            this.showStatus('Need at least 3 points to compare algorithms', 'error');
            return;
        }

        this.showLoading(true);
        this.showStatus('Comparing algorithms...');

        try {
            const result = await this.api.compareAlgorithms(this.points);
            this.showComparisonResults(result);
            this.showStatus('Algorithm comparison completed');
            
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            console.error('Comparison error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    showComparisonResults(result) {
        const section = document.getElementById('comparison-results');
        const table = document.getElementById('comparison-table');
        
        let html = '<table class="comparison-table">';
        html += '<thead><tr><th>Algorithm</th><th>Time (ms)</th><th>Hull Size</th><th>Steps</th></tr></thead>';
        html += '<tbody>';
        
        const algorithmNames = {
            graham: "Graham's Scan",
            jarvis: "Jarvis March",
            chan: "Chan's Algorithm",
            incremental: "Incremental Hull"
        };
        
        for (const [algoName, data] of Object.entries(result.results)) {
            html += `<tr>
                <td>${algorithmNames[algoName] || algoName}</td>
                <td>${data.execution_time_ms.toFixed(2)}</td>
                <td>${data.hull_size}</td>
                <td>${data.step_count}</td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        table.innerHTML = html;
        section.style.display = 'block';
    }

    // Animation methods
    toggleAnimation() {
        if (this.animationController.isPlaying) {
            this.animationController.pause();
        } else {
            this.animationController.play();
        }
    }

    nextStep() {
        if (this.currentResult && this.currentStep < this.currentResult.steps.length - 1) {
            this.currentStep++;
            this.updateStepInfo();
            this.render();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepInfo();
            this.render();
        }
    }

    firstStep() {
        this.currentStep = 0;
        this.updateStepInfo();
        this.render();
    }

    lastStep() {
        if (this.currentResult) {
            this.currentStep = this.currentResult.steps.length - 1;
            this.updateStepInfo();
            this.render();
        }
    }

    // UI update methods
    updateUI() {
        this.updatePointCount();
        this.updateAlgorithmInfo();
        this.updateStepInfo();
        this.updateAnimationControls();
        this.render();
    }

    updatePointCount() {
        document.getElementById('point-count').textContent = this.points.length;
    }

    updateAlgorithmInfo() {
        const algorithmNames = {
            graham: "Graham's Scan",
            jarvis: "Jarvis March",
            chan: "Chan's Algorithm",
            incremental: "Incremental Hull"
        };
        
        const complexities = {
            graham: "O(n log n)",
            jarvis: "O(nh)",
            chan: "O(n log h)",
            incremental: "O(n log h)"
        };
        
        document.getElementById('current-algorithm').textContent = algorithmNames[this.currentAlgorithm];
        document.getElementById('time-complexity').textContent = complexities[this.currentAlgorithm];
        
        if (this.currentResult) {
            document.getElementById('hull-size').textContent = this.currentResult.stats.hull_size;
            document.getElementById('execution-time').textContent = 
                `${this.currentResult.stats.execution_time_ms.toFixed(2)}ms`;
        } else {
            document.getElementById('hull-size').textContent = '-';
            document.getElementById('execution-time').textContent = '-';
        }
    }

    updateStepInfo() {
        if (this.currentResult && this.currentResult.steps && this.currentStep < this.currentResult.steps.length) {
            const step = this.currentResult.steps[this.currentStep];
            const totalSteps = this.currentResult.steps.length;
            
            document.getElementById('current-step').textContent = this.currentStep + 1;
            document.getElementById('total-steps').textContent = totalSteps;
            
            // Update step details
            const stepTitle = this.getStepTitle(step);
            document.getElementById('step-title').textContent = stepTitle;
            document.getElementById('step-description').textContent = 
                this.getStepDescription(step);
            
        } else {
            document.getElementById('current-step').textContent = '0';
            document.getElementById('total-steps').textContent = '0';
            document.getElementById('step-title').textContent = 'Ready to start';
            document.getElementById('step-description').textContent = 
                'Select an algorithm and click "Run Algorithm" to begin.';
        }
    }

    getStepTitle(step) {
        if (!step) return 'Ready to start';
        
        const stepNum = this.currentStep + 1;
        const totalSteps = this.currentResult.steps.length;
        
        if (this.currentAlgorithm === 'graham') {
            if (step.type === 'upper_hull') {
                if (step.phase === 'processing') return `Step ${stepNum}/${totalSteps}: Processing Upper Hull`;
                if (step.phase === 'popping') return `Step ${stepNum}/${totalSteps}: Removing Non-Convex Point`;
                if (step.phase === 'added') return `Step ${stepNum}/${totalSteps}: Added to Upper Hull`;
            } else if (step.type === 'lower_hull') {
                if (step.phase === 'processing') return `Step ${stepNum}/${totalSteps}: Processing Lower Hull`;
                if (step.phase === 'popping') return `Step ${stepNum}/${totalSteps}: Removing Non-Convex Point`;
                if (step.phase === 'added') return `Step ${stepNum}/${totalSteps}: Added to Lower Hull`;
            } else if (step.type === 'complete') {
                return `Step ${stepNum}/${totalSteps}: Algorithm Complete`;
            }
        } else if (this.currentAlgorithm === 'jarvis') {
            if (step.type === 'jarvis_step') return `Step ${stepNum}/${totalSteps}: Gift Wrapping`;
            if (step.type === 'testing') return `Step ${stepNum}/${totalSteps}: Testing Candidate`;
            if (step.type === 'complete') return `Step ${stepNum}/${totalSteps}: Wrapping Complete`;
        } else if (this.currentAlgorithm === 'chan') {
            if (step.type === 'mini_hull') return `Step ${stepNum}/${totalSteps}: Computing Mini-Hull`;
            if (step.type === 'jarvis_phase') return `Step ${stepNum}/${totalSteps}: Connecting Hulls`;
            if (step.type === 'complete') return `Step ${stepNum}/${totalSteps}: Algorithm Complete`;
        } else if (this.currentAlgorithm === 'incremental') {
            if (step.type === 'seed') return `Step ${stepNum}/${totalSteps}: Seeding Hull`;
            if (step.type === 'inside') return `Step ${stepNum}/${totalSteps}: Point Inside Hull`;
            if (step.type === 'tangents') return `Step ${stepNum}/${totalSteps}: Finding Tangents`;
            if (step.type === 'splice_done') return `Step ${stepNum}/${totalSteps}: Splicing Point`;
            if (step.type === 'complete') return `Step ${stepNum}/${totalSteps}: Algorithm Complete`;
        }
        
        return `Step ${stepNum}/${totalSteps}: ${step.type}`;
    }

    getStepDescription(step) {
        if (!step) return 'Ready to start algorithm execution.';
        
        // Handle Graham's Scan detailed steps
        if (this.currentAlgorithm === 'graham') {
            if (step.type === 'upper_hull') {
                if (step.phase === 'processing') {
                    const point = step.current_point;
                    return `Processing point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) for upper hull. Checking if it maintains convexity.`;
                } else if (step.phase === 'popping') {
                    const popped = step.popped_point;
                    return `Removing point (${popped.x.toFixed(1)}, ${popped.y.toFixed(1)}) - it creates a clockwise turn (not convex).`;
                } else if (step.phase === 'added') {
                    const added = step.current_point;
                    return `Added point (${added.x.toFixed(1)}, ${added.y.toFixed(1)}) to upper hull. Current hull has ${step.current_hull.length} points.`;
                }
            } else if (step.type === 'lower_hull') {
                if (step.phase === 'processing') {
                    const point = step.current_point;
                    return `Processing point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) for lower hull. Building from right to left.`;
                } else if (step.phase === 'popping') {
                    const popped = step.popped_point;
                    return `Removing point (${popped.x.toFixed(1)}, ${popped.y.toFixed(1)}) - creates clockwise turn in lower hull.`;
                } else if (step.phase === 'added') {
                    const added = step.current_point;
                    return `Added point (${added.x.toFixed(1)}, ${added.y.toFixed(1)}) to lower hull. Current hull has ${step.current_hull.length} points.`;
                }
            } else if (step.type === 'complete') {
                return `Graham's Scan completed! Final convex hull has ${step.final_hull.length} vertices.`;
            }
        }
        
        // Handle Jarvis March steps
        else if (this.currentAlgorithm === 'jarvis') {
            if (step.type === 'jarvis_step') {
                const current = step.current_point;
                const next = step.next_point;
                return `From point (${current.x.toFixed(1)}, ${current.y.toFixed(1)}), found next hull vertex at (${next.x.toFixed(1)}, ${next.y.toFixed(1)}).`;
            } else if (step.type === 'testing') {
                const candidate = step.candidate_point;
                return `Testing point (${candidate.x.toFixed(1)}, ${candidate.y.toFixed(1)}) as potential next hull vertex.`;
            } else if (step.type === 'complete') {
                return `Jarvis March completed! Hull wrapping finished with ${step.final_hull.length} vertices.`;
            }
        }
        
        // Handle Chan's Algorithm steps
        else if (this.currentAlgorithm === 'chan') {
            if (step.type === 'mini_hull') {
                return `Computing mini-hull for group ${step.groupIdx + 1} of ${step.totalGroups}. Found ${step.mini_hull.length} vertices.`;
            } else if (step.type === 'jarvis_phase') {
                return `Using Jarvis march to connect mini-hulls. Finding tangent lines between convex sub-hulls.`;
            } else if (step.type === 'complete') {
                return `Chan's Algorithm completed! Combined ${step.mini_hulls_count} mini-hulls into final hull with ${step.final_hull.length} vertices.`;
            }
        }
        
        // Handle Incremental Hull steps
        else if (this.currentAlgorithm === 'incremental') {
            if (step.type === 'seed') {
                const point = step.added_point;
                return `Adding initial point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) to seed the convex hull.`;
            } else if (step.type === 'inside') {
                const point = step.candidate_point;
                return `Point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) is inside current hull - skipping.`;
            } else if (step.type === 'tangents') {
                const point = step.candidate_point;
                const rt = step.right_tangent_vertex;
                const lt = step.left_tangent_vertex;
                return `Point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) is outside. Found tangents to (${rt.x.toFixed(1)}, ${rt.y.toFixed(1)}) and (${lt.x.toFixed(1)}, ${lt.y.toFixed(1)}).`;
            } else if (step.type === 'splice_done') {
                const point = step.candidate_point;
                return `Spliced point (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) into hull. New hull has ${step.hull_after.length} vertices.`;
            } else if (step.type === 'complete') {
                return `Incremental Hull completed! Final hull has ${step.final_hull.length} vertices.`;
            }
        }
        
        // Fallback for unknown step types
        return `${step.type} step in ${this.getAlgorithmName()}`;
    }

    updateAnimationControls() {
        const hasSteps = this.currentResult && this.currentResult.steps && this.currentResult.steps.length > 0;
        const isFirstStep = this.currentStep === 0;
        const isLastStep = hasSteps && this.currentStep >= this.currentResult.steps.length - 1;
        
        document.getElementById('first-btn').disabled = !hasSteps || isFirstStep;
        document.getElementById('prev-btn').disabled = !hasSteps || isFirstStep;
        document.getElementById('next-btn').disabled = !hasSteps || isLastStep;
        document.getElementById('last-btn').disabled = !hasSteps || isLastStep;
        document.getElementById('play-btn').disabled = !hasSteps;
        
        document.getElementById('play-btn').textContent = 
            this.animationController.isPlaying ? '⏸' : '▶';
    }

    render() {
        const currentStep = this.currentResult && this.currentResult.steps ? 
                          this.currentResult.steps[this.currentStep] : null;
        
        // Only show final hull if no steps or if we're at the complete step
        const showFinalHull = !this.currentResult || !this.currentResult.steps || 
                             (currentStep && currentStep.type === 'complete');
        
        this.renderer.render({
            points: this.points,
            hull: showFinalHull && this.currentResult ? this.currentResult.hull : [],
            step: currentStep
        });
    }

    // Utility methods
    getAlgorithmName() {
        const names = {
            graham: "Graham's Scan",
            jarvis: "Jarvis March",
            chan: "Chan's Algorithm",
            incremental: "Incremental Hull"
        };
        return names[this.currentAlgorithm] || this.currentAlgorithm;
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.toggle('hidden', !show);
    }

    showStatus(message, type = 'info') {
        document.getElementById('status-message').textContent = message;
        document.getElementById('execution-status').textContent = message;
        
        // You could add different styling based on type here
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.convexHullApp = new ConvexHullApp();
});