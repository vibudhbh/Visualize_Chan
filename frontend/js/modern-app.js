/**
 * Modern Convex Hull Application
 * Production-quality app using D3.js visualization
 */

class ModernConvexHullApp {
    constructor() {
        this.api = new ConvexHullAPI();
        this.visualizer = new D3ConvexHullVisualizer('visualization');
        this.animationController = new AnimationController(this);
        this.pointGenerator = new PointGenerator();
        
        // State
        this.currentAlgorithm = 'graham';
        this.currentResult = null;
        this.currentStep = 0;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupVisualizationEvents();
        
        // Set Graham's Scan as default selection
        console.log('Initializing with Graham\'s Scan as default');
        this.selectAlgorithm('graham');
        
        this.updateUI();
        this.testAPIConnection();
        this.generateInitialPoints();
        
        console.log('🔺 Modern Convex Hull Visualizer initialized');
    }

    setupEventListeners() {
        // Algorithm selection
        document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectAlgorithm(e.target.value);
            });
        });

        // Algorithm cards
        document.querySelectorAll('.algorithm-card').forEach(card => {
            card.addEventListener('click', () => {
                const algorithm = card.dataset.algorithm;
                const radio = card.querySelector('input[type="radio"]');
                
                // If this algorithm is already selected, don't do anything
                // Just ensure the radio is checked and select it
                radio.checked = true;
                this.selectAlgorithm(algorithm);
            });
        });

        // Action buttons
        document.getElementById('run-btn').addEventListener('click', () => {
            this.runAlgorithm();
        });

        document.getElementById('compare-btn').addEventListener('click', () => {
            this.compareAlgorithms();
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

        document.getElementById('persistent-clear-btn').addEventListener('click', () => {
            this.clearPoints();
        });

        // Point count selection
        document.getElementById('point-count-select').addEventListener('change', (e) => {
            this.updatePointCountInfo(parseInt(e.target.value));
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
            this.setAnimationSpeed(parseInt(e.target.value));
        });

        // Visualization controls
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('reset-zoom-btn').addEventListener('click', () => {
            this.resetZoom();
        });

        // API configuration
        document.getElementById('api-url').addEventListener('change', (e) => {
            this.api.setBaseUrl(e.target.value);
            this.testAPIConnection();
        });

        document.getElementById('test-api-btn').addEventListener('click', () => {
            this.testAPIConnection();
        });
    }

    setupVisualizationEvents() {
        const vizContainer = document.getElementById('visualization');
        
        // Point addition
        vizContainer.addEventListener('pointAdded', (e) => {
            this.onPointAdded(e.detail);
        });

        // Manual point addition via click
        vizContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'svg' || e.target.classList.contains('visualization-area')) {
                const rect = vizContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.visualizer.addPoint(x, y);
            }
        });
    }

    selectAlgorithm(algorithm) {
        console.log('Selecting algorithm:', algorithm);
        this.currentAlgorithm = algorithm;
        
        if (algorithm) {
            // Update radio button
            const radio = document.querySelector(`input[name="algorithm"][value="${algorithm}"]`);
            if (radio) {
                radio.checked = true;
            }
            
            // Update UI
            document.querySelectorAll('.algorithm-card').forEach(card => {
                card.classList.toggle('active', card.dataset.algorithm === algorithm);
            });
            
            // Complete step 2 and move to step 3
            if (typeof completeStep !== 'undefined') {
                completeStep(2);
            }
        } else {
            // Clear all selections
            document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
                radio.checked = false;
            });
            document.querySelectorAll('.algorithm-card').forEach(card => {
                card.classList.remove('active');
            });
        }
        
        this.updateAlgorithmInfo();
        this.updateStepDescriptions();
        this.clearResults();
    }

    async runAlgorithm() {
        const points = this.visualizer.getPoints();
        
        if (points.length < 3) {
            this.showStatus('Need at least 3 points to compute convex hull', 'error');
            return;
        }

        // Debug: Check if algorithm is selected
        console.log('Current algorithm:', this.currentAlgorithm);
        if (!this.currentAlgorithm) {
            this.showStatus('Please select an algorithm first', 'error');
            return;
        }

        this.setLoading(true);
        this.showStatus(`Running ${this.getAlgorithmName()}...`);

        try {
            this.currentResult = await this.api.runAlgorithm(this.currentAlgorithm, points);
            this.currentStep = 0;
            
            this.showStatus(`${this.getAlgorithmName()} completed in ${this.currentResult.stats.execution_time_ms.toFixed(2)}ms`, 'success');
            
            // Hide comparison modal if open
            const modal = document.getElementById('comparison-modal');
            if (modal) modal.style.display = 'none';
            
            this.updateUI();
            
            // Auto-start animation after a brief delay
            setTimeout(() => {
                if (this.currentResult && this.currentResult.steps && this.currentResult.steps.length > 0) {
                    this.animationController.play();
                }
            }, 500);
            
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            console.error('Algorithm execution error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    async compareAlgorithms() {
        const points = this.visualizer.getPoints();
        
        if (points.length < 3) {
            this.showStatus('Need at least 3 points to compare algorithms', 'error');
            return;
        }

        this.setLoading(true);
        this.showStatus('Comparing algorithms...');

        try {
            const result = await this.api.compareAlgorithms(points);
            this.showComparisonResults(result);
            // Don't show status message - modal is self-explanatory
            
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            console.error('Comparison error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    generateRandomPoints() {
        const pointCount = this.getSelectedPointCount();
        const config = this.getScaledGenerationConfig(pointCount);
        
        const points = PointGenerator.generate(pointCount, 'random', config);
        
        this.visualizer.setPoints(points);
        this.clearResults();
        this.updatePointCount();
        this.visualizer.fitToData();
        
        // Show performance warning for large datasets
        this.showPerformanceWarning(pointCount);
        
        // Complete step 1 and move to step 2
        if (typeof completeStep !== 'undefined') {
            completeStep(1);
        }
    }

    generateCirclePoints() {
        const pointCount = this.getSelectedPointCount();
        const config = this.getScaledGenerationConfig(pointCount);
        
        const points = PointGenerator.generate(pointCount, 'circle', {
            radius: config.width * 0.4, // Scale radius with area
            centerX: 0,
            centerY: 0
        });
        
        this.visualizer.setPoints(points);
        this.clearResults();
        this.updatePointCount();
        this.visualizer.fitToData();
        
        // Show performance warning for large datasets
        this.showPerformanceWarning(pointCount);
        
        // Complete step 1 and move to step 2
        if (typeof completeStep !== 'undefined') {
            completeStep(1);
        }
    }

    clearPoints() {
        console.log('Clearing all points and resetting state');
        this.visualizer.clearPoints();
        this.clearResults();
        this.updatePointCount();
        
        // Reset algorithm selection to default
        this.selectAlgorithm('graham');
        
        // Reset workflow to Step 1
        if (typeof resetWorkflow !== 'undefined') {
            resetWorkflow();
        }
        
        console.log('Clear complete - algorithm:', this.currentAlgorithm);
    }

    clearResults() {
        this.currentResult = null;
        this.currentStep = 0;
        this.visualizer.setStep(null);
        this.updateUI();
    }

    getSelectedPointCount() {
        const select = document.getElementById('point-count-select');
        return parseInt(select.value) || 20;
    }

    getScaledGenerationConfig(pointCount) {
        // Scale the generation area based on point count to maintain good density
        let baseWidth = 300;
        let baseHeight = 200;
        
        if (pointCount <= 20) {
            // Small datasets - keep compact
            return { width: baseWidth, height: baseHeight, centerX: 0, centerY: 0 };
        } else if (pointCount <= 50) {
            // Medium datasets - slightly larger area
            return { width: baseWidth * 1.2, height: baseHeight * 1.2, centerX: 0, centerY: 0 };
        } else if (pointCount <= 100) {
            // Large datasets - larger area
            return { width: baseWidth * 1.5, height: baseHeight * 1.5, centerX: 0, centerY: 0 };
        } else {
            // Very large datasets - maximum area
            return { width: baseWidth * 2, height: baseHeight * 2, centerX: 0, centerY: 0 };
        }
    }

    showPerformanceWarning(pointCount) {
        if (pointCount >= 200) {
            this.showStatus(`⚠️ Large dataset (${pointCount} points) - animations may be slower`, 'warning');
        } else if (pointCount >= 100) {
            this.showStatus(`ℹ️ Medium dataset (${pointCount} points) - some algorithms may take longer`, 'info');
        }
    }

    updatePointCountInfo(pointCount) {
        // Update any UI elements that show point count info
        const algorithmWarnings = {
            'jarvis': pointCount > 50 ? `⚠️ Jarvis March may be slow with ${pointCount} points (O(nh) complexity)` : null,
            'chan': pointCount < 50 ? `ℹ️ Chan's Algorithm works best with 50+ points` : null
        };

        const warning = algorithmWarnings[this.currentAlgorithm];
        if (warning) {
            this.showStatus(warning, pointCount > 100 ? 'warning' : 'info');
        }
    }

    generateInitialPoints() {
        // Generate points that fit well in the default view
        const points = PointGenerator.generate(20, 'random', {
            width: 300,  // Smaller range to ensure they fit
            height: 200,
            centerX: 0,
            centerY: 0
        });
        
        this.visualizer.setPoints(points);
        this.updatePointCount();
        // Don't call fitToData here - let the default scales handle it
        
        // Complete step 1 since we have initial points
        if (typeof completeStep !== 'undefined') {
            setTimeout(() => completeStep(1), 1000);
        }
    }

    onPointAdded(point) {
        this.updatePointCount();
        this.clearResults();
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
            this.updateStepVisualization();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepVisualization();
        }
    }

    firstStep() {
        this.currentStep = 0;
        this.updateStepVisualization();
    }

    lastStep() {
        if (this.currentResult) {
            this.currentStep = this.currentResult.steps.length - 1;
            this.updateStepVisualization();
        }
    }

    setAnimationSpeed(speed) {
        console.log('Setting animation speed to:', speed);
        this.animationController.setSpeed(speed);
        
        // Update visualization animation duration
        const duration = this.animationController.getStepDuration();
        this.visualizer.setAnimationDuration(duration / 2);
    }

    updateStepVisualization() {
        if (this.currentResult && this.currentResult.steps) {
            const step = this.currentResult.steps[this.currentStep];
            this.visualizer.setStep(step);
        }
        this.updateUI();
    }

    // UI update methods
    updateUI() {
        this.updateAlgorithmInfo();
        this.updateStepInfo();
        this.updateAnimationControls();
        this.updatePointCount();
        this.updateStepDescriptions();
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
        
        document.getElementById('current-algorithm').textContent = 
            this.currentAlgorithm ? algorithmNames[this.currentAlgorithm] : 'None Selected';
        document.getElementById('time-complexity').textContent = 
            this.currentAlgorithm ? complexities[this.currentAlgorithm] : '-';
        
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
            const stepDescription = this.getStepDescription(step);
            
            document.getElementById('step-title').textContent = stepTitle;
            document.getElementById('step-description').textContent = stepDescription;
            
        } else {
            document.getElementById('current-step').textContent = '0';
            document.getElementById('total-steps').textContent = '0';
            document.getElementById('step-title').textContent = 'Ready to Start';
            document.getElementById('step-description').textContent = 
                'Select an algorithm and click "Run Algorithm" to begin the visualization.';
        }
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
        
        const playBtn = document.getElementById('play-btn');
        playBtn.textContent = this.animationController.isPlaying ? '⏸' : '▶';
        playBtn.title = this.animationController.isPlaying ? 'Pause' : 'Play';
    }

    updatePointCount() {
        const count = this.visualizer.getPoints().length;
        document.getElementById('point-count').textContent = count;
        this.updateStepDescriptions();
    }

    updateStepDescriptions() {
        const algorithmNames = {
            graham: "Graham's Scan",
            jarvis: "Jarvis March",
            chan: "Chan's Algorithm",
            incremental: "Incremental Hull"
        };

        // Update Step 1 description
        const pointCount = this.visualizer.getPoints().length;
        const step1Desc = document.getElementById('step-1-description');
        if (step1Desc) {
            step1Desc.textContent = `${pointCount} points generated`;
        }

        // Update Step 2 description
        const step2Desc = document.getElementById('step-2-description');
        if (step2Desc) {
            if (this.currentAlgorithm) {
                step2Desc.textContent = `${algorithmNames[this.currentAlgorithm]} selected`;
            } else {
                step2Desc.textContent = 'Select convex hull algorithm to visualize';
            }
        }

        // Update Step 3 description
        const step3Desc = document.getElementById('step-3-description');
        if (step3Desc) {
            if (this.currentAlgorithm) {
                step3Desc.textContent = `Ready to run ${algorithmNames[this.currentAlgorithm]}`;
            } else {
                step3Desc.textContent = 'Execute algorithm or compare all';
            }
        }
    }

    showStatus(message, type = 'info') {
        // Create or update status message
        let statusEl = document.getElementById('status-message');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'status-message';
            statusEl.className = 'status-message';
            document.querySelector('.main-content').prepend(statusEl);
        }

        statusEl.textContent = message;
        statusEl.className = `status-message status-${type}`;
        statusEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (statusEl) {
                statusEl.style.display = 'none';
            }
        }, 5000);
    }

    getStepTitle(step) {
        if (!step) return 'Ready to Start';
        
        const stepNum = this.currentStep + 1;
        const totalSteps = this.currentResult.steps.length;
        
        const titles = {
            graham: {
                upper_hull: {
                    processing: `Step ${stepNum}/${totalSteps}: Processing Upper Hull`,
                    popping: `Step ${stepNum}/${totalSteps}: Removing Non-Convex Point`,
                    added: `Step ${stepNum}/${totalSteps}: Added to Upper Hull`
                },
                lower_hull: {
                    processing: `Step ${stepNum}/${totalSteps}: Processing Lower Hull`,
                    popping: `Step ${stepNum}/${totalSteps}: Removing Non-Convex Point`,
                    added: `Step ${stepNum}/${totalSteps}: Added to Lower Hull`
                },
                complete: `Step ${stepNum}/${totalSteps}: Algorithm Complete`
            },
            jarvis: {
                jarvis_step: `Step ${stepNum}/${totalSteps}: Gift Wrapping`,
                testing: `Step ${stepNum}/${totalSteps}: Testing Candidate`,
                complete: `Step ${stepNum}/${totalSteps}: Wrapping Complete`
            },
            chan: {
                mini_hull: `Step ${stepNum}/${totalSteps}: Computing Mini-Hull`,
                jarvis_phase: `Step ${stepNum}/${totalSteps}: Connecting Hulls`,
                complete: `Step ${stepNum}/${totalSteps}: Algorithm Complete`
            },
            incremental: {
                seed: `Step ${stepNum}/${totalSteps}: Seeding Hull`,
                inside: `Step ${stepNum}/${totalSteps}: Point Inside Hull`,
                tangents: `Step ${stepNum}/${totalSteps}: Finding Tangents`,
                splice_done: `Step ${stepNum}/${totalSteps}: Splicing Point`,
                complete: `Step ${stepNum}/${totalSteps}: Algorithm Complete`
            }
        };
        
        const algoTitles = titles[this.currentAlgorithm] || {};
        
        if (step.type === 'upper_hull' || step.type === 'lower_hull') {
            return algoTitles[step.type]?.[step.phase] || `Step ${stepNum}/${totalSteps}: ${step.type}`;
        }
        
        return algoTitles[step.type] || `Step ${stepNum}/${totalSteps}: ${step.type}`;
    }

    getStepDescription(step) {
        if (!step) return 'Ready to start algorithm execution.';
        
        // Educational descriptions that explain WHY and HOW each algorithm works
        const descriptions = {
            graham: {
                upper_hull: {
                    processing: (s) => `Graham's Scan builds the hull in two parts. First, we create the "upper boundary" by going left to right through sorted points. We're checking if this point should be part of the top edge of our convex shape - like the top of a rubber band stretched around all points.`,
                    popping: (s) => `This point creates an "inward bend" in our hull. For a convex shape, all turns must go outward, so we remove it. Think of tightening a rubber band - it can't have inward curves, only smooth outward curves.`,
                    added: (s) => `This point creates a proper outward turn, so it belongs on the upper boundary. Our upper hull now has ${s.current_hull.length} points forming the top edge of our convex shape.`
                },
                lower_hull: {
                    processing: (s) => `Now we're building the "lower boundary" - the bottom edge of our convex shape. We go right to left through the sorted points, checking if each point should be part of the bottom edge of our rubber band.`,
                    popping: (s) => `This point creates an inward bend in the lower boundary. Just like with the upper hull, we need all turns to be outward for a convex shape, so we remove this point.`,
                    added: (s) => `This point fits perfectly on the lower boundary. Our lower hull now has ${s.current_hull.length} points. When we combine upper and lower boundaries, we'll have our complete convex shape.`
                },
                complete: (s) => `Graham's Scan complete! We built the convex hull by creating an upper boundary (left to right) and lower boundary (right to left), then combining them into one shape with ${s.final_hull.length} vertices.`
            },
            jarvis: {
                jarvis_step: (s) => `Jarvis March works like "gift wrapping" - we start at the leftmost point and keep finding the next point that makes the most outward turn. We're looking for the point that would be most "counter-clockwise" from our current position, like wrapping string around the outside of all points.`,
                testing: (s) => `We're testing if this point is better than our current candidate. We check the "turn direction" - ${s.orientation > 0 ? 'this point makes a more outward turn, so it\'s a better choice for the hull boundary' : s.orientation < 0 ? 'this point makes an inward turn, so our current candidate is still better' : 'this point is exactly in line - we decide based on distance'}.`,
                complete: (s) => `Jarvis March complete! We "wrapped" around all points like putting a rubber band around them, always choosing the most outward point at each step. The final hull has ${s.final_hull.length} vertices.`
            },
            chan: {
                mini_hull: (s) => `Chan's Algorithm is clever - it divides points into small groups and finds the convex hull of each group first. We're working on group ${s.group_idx + 1} of ${s.num_groups}. This "divide and conquer" approach makes the algorithm faster for large datasets.`,
                jarvis_phase: () => `Now we use Jarvis March to connect all the mini-hulls together. Instead of checking every single point, we only need to check the boundaries of each mini-hull. This is much faster!`,
                complete: (s) => `Chan's Algorithm complete! We divided the problem into smaller pieces (mini-hulls), then efficiently combined them. This hybrid approach gives us the best of both worlds.`
            },
            incremental: {
                seed: (s) => `Incremental Hull builds the convex hull one point at a time. We're starting with this point as our initial hull. This approach is useful when points arrive one by one, or when we want to see how the hull evolves.`,
                inside: (s) => `This point is inside our current convex hull. Since the hull already contains this point within its boundary, we don't need to change anything. Only points on the outer boundary matter for the convex hull.`,
                tangents: (s) => `This point is outside our current hull, so we need to expand the hull to include it. We find "tangent lines" - lines from the new point that just touch the hull boundary. These show us exactly where to "cut" the old hull and insert the new point.`,
                splice_done: (s) => `We've successfully added this point to the hull! We removed the part of the old hull that was "hidden" behind the new point and connected the new point to the remaining boundary. The hull now has ${s.hull_after.length} vertices.`,
                complete: (s) => `Incremental Hull complete! We built the convex hull by adding one point at a time, expanding the hull whenever a new point was outside the current boundary. Perfect for understanding how convex hulls grow!`
            }
        };
        
        const algoDescriptions = descriptions[this.currentAlgorithm] || {};
        
        if (step.type === 'upper_hull' || step.type === 'lower_hull') {
            const phaseDescriptions = algoDescriptions[step.type] || {};
            const descriptionFn = phaseDescriptions[step.phase];
            return descriptionFn ? descriptionFn(step) : `${step.type} ${step.phase} step`;
        }
        
        const descriptionFn = algoDescriptions[step.type];
        return descriptionFn ? descriptionFn(step) : `Processing ${step.type} step in ${this.getAlgorithmName()}`;
    }

    showComparisonResults(result) {
        const panel = document.getElementById('comparison-panel');
        const table = document.getElementById('comparison-table');
        const chart = document.getElementById('comparison-chart');
        
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
            incremental: "O(n log n)"
        };
        
        // Sort results by execution time for better comparison
        const sortedResults = Object.entries(result.results)
            .sort(([,a], [,b]) => a.execution_time_ms - b.execution_time_ms);
        
        // Find fastest algorithm
        const fastest = sortedResults[0];
        
        // Create enhanced comparison table
        let html = `
            <div class="comparison-summary">
                <div class="summary-item">
                    <span class="summary-label">Input Points:</span>
                    <span class="summary-value">${result.input_size}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Fastest Algorithm:</span>
                    <span class="summary-value winner">${algorithmNames[fastest[0]]}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Hull Vertices:</span>
                    <span class="summary-value">${fastest[1].hull_size}</span>
                </div>
            </div>
            
            <table class="comparison-results-table">
                <thead>
                    <tr>
                        <th>Algorithm</th>
                        <th>Time Complexity</th>
                        <th>Execution Time</th>
                        <th>Steps</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>`;
        
        for (const [algoName, data] of sortedResults) {
            const isWinner = algoName === fastest[0];
            const relativeSpeed = data.execution_time_ms / fastest[1].execution_time_ms;
            const performanceClass = isWinner ? 'winner' : relativeSpeed < 2 ? 'good' : relativeSpeed < 5 ? 'average' : 'slow';
            
            html += `<tr class="${performanceClass}">
                <td class="algorithm-name">
                    ${algorithmNames[algoName] || algoName}
                    ${isWinner ? '<span class="winner-badge">★</span>' : ''}
                </td>
                <td class="complexity">${complexities[algoName] || 'O(?)'}</td>
                <td class="execution-time">${data.execution_time_ms.toFixed(2)} ms</td>
                <td class="step-count">${data.step_count.toLocaleString()}</td>
                <td class="performance-indicator">
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: ${Math.min(100, (data.execution_time_ms / fastest[1].execution_time_ms) * 20)}%"></div>
                    </div>
                    <span class="performance-text">
                        ${isWinner ? 'Fastest' : `${relativeSpeed.toFixed(1)}x slower`}
                    </span>
                </td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        
        // Show results in modal instead of sidebar panel
        const modalTable = document.getElementById('modal-comparison-table');
        const modalChart = document.getElementById('modal-comparison-chart');
        const modal = document.getElementById('comparison-modal');
        
        modalTable.innerHTML = html;
        
        // Create performance chart and insights
        const insights = this.generateComparisonInsights(result, sortedResults);
        this.createPerformanceChart(modalChart, sortedResults, algorithmNames, insights);
        
        // Show modal
        modal.style.display = 'flex';
        
        // Add modal close functionality
        this.setupModalCloseHandlers();
    }

    setupModalCloseHandlers() {
        const modal = document.getElementById('comparison-modal');
        const closeBtn = document.getElementById('close-comparison-modal');
        
        // Close on X button click
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        
        // Close on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }

    generateComparisonInsights(result, sortedResults) {
        const pointCount = result.input_size;
        const fastest = sortedResults[0];
        const slowest = sortedResults[sortedResults.length - 1];
        
        let insights = '<div class="comparison-insights"><h4>Performance Insights</h4><ul>';
        
        // Point count insights
        if (pointCount <= 20) {
            insights += '<li>Small dataset: All algorithms perform similarly</li>';
        } else if (pointCount <= 100) {
            insights += '<li>Medium dataset: Algorithm efficiency differences become apparent</li>';
        } else {
            insights += '<li>Large dataset: Complexity differences are clearly visible</li>';
        }
        
        // Algorithm-specific insights
        if (fastest[0] === 'jarvis' && pointCount > 50) {
            insights += '<li>Jarvis March is surprisingly fast - the hull might be very small</li>';
        }
        
        if (fastest[0] === 'chan' && pointCount >= 50) {
            insights += '<li>Chan\'s Algorithm shows its strength with larger datasets</li>';
        }
        
        if (slowest[0] === 'jarvis' && pointCount > 100) {
            insights += '<li>Jarvis March slows down with larger datasets due to O(nh) complexity</li>';
        }
        
        // Performance spread
        const speedRatio = slowest[1].execution_time_ms / fastest[1].execution_time_ms;
        if (speedRatio > 10) {
            insights += '<li>Large performance gap suggests dataset characteristics favor certain algorithms</li>';
        } else if (speedRatio < 2) {
            insights += '<li>Similar performance across algorithms for this dataset</li>';
        }
        
        insights += '</ul></div>';
        return insights;
    }

    createPerformanceChart(chartElement, sortedResults, algorithmNames, insights) {
        const maxTime = Math.max(...sortedResults.map(([,data]) => data.execution_time_ms));
        
        let chartHTML = `
            <div class="comparison-grid">
                <div class="performance-chart">
                    <h4>Execution Time Comparison</h4>`;
        
        for (const [algoName, data] of sortedResults) {
            const percentage = (data.execution_time_ms / maxTime) * 100;
            const isWinner = sortedResults[0][0] === algoName;
            
            chartHTML += `
                <div class="chart-bar ${isWinner ? 'winner' : ''}">
                    <div class="chart-label">${algorithmNames[algoName]}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${percentage}%"></div>
                        <span class="chart-value">${data.execution_time_ms.toFixed(2)}ms</span>
                    </div>
                </div>`;
        }
        
        chartHTML += `
                </div>
                ${insights}
            </div>`;
        
        chartElement.innerHTML = chartHTML;
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

    setLoading(loading) {
        this.isLoading = loading;
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.toggle('hidden', !loading);
        
        // Disable controls during loading
        document.getElementById('run-btn').disabled = loading;
        document.getElementById('compare-btn').disabled = loading;
    }

    showStatus(message, type = 'info') {
        document.getElementById('status-message').textContent = message;
        document.getElementById('execution-status').textContent = message;
        
        // Update status styling based on type
        const statusElement = document.getElementById('execution-status');
        statusElement.className = `status-detail ${type}`;
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    async testAPIConnection() {
        const statusElement = document.getElementById('api-status');
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('.status-text');
        
        text.textContent = 'Testing...';
        statusElement.className = 'api-status';
        
        try {
            const result = await this.api.testConnection();
            if (result.success) {
                text.textContent = 'Connected';
                statusElement.className = 'api-status connected';
            } else {
                text.textContent = 'Connection failed';
                statusElement.className = 'api-status error';
            }
        } catch (error) {
            text.textContent = `Error: ${error.message}`;
            statusElement.className = 'api-status error';
        }
    }

    toggleFullscreen() {
        const vizContainer = document.querySelector('.visualization-container');
        
        if (!document.fullscreenElement) {
            vizContainer.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    resetZoom() {
        this.visualizer.resetZoom();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modernConvexHullApp = new ModernConvexHullApp();
});