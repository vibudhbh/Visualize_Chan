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
        
        // No default algorithm selection - let users choose after generating points
        console.log('Initializing - users will select algorithm after generating points');
        
        this.updateUI();
        this.testAPIConnection();
        this.generateInitialPoints();
        
        console.log('🔺 Modern Convex Hull Visualizer initialized');
    }

    setupEventListeners() {
        // Algorithm selection
        document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectAlgorithm(e.target.value, true);
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
                this.selectAlgorithm(algorithm, true);
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

    selectAlgorithm(algorithm, isUserAction = false) {
        console.log('Selecting algorithm:', algorithm, 'User action:', isUserAction);
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
            
            // Only complete step 2 if this is a user action, not initialization
            if (isUserAction && typeof completeStep !== 'undefined') {
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
        
        // Clear algorithm selection - let users choose
        this.selectAlgorithm(null);
        
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
        
        // Don't auto-complete steps - let user choose algorithm first
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

        // Update Step 1 description (Point Generation)
        const pointCount = this.visualizer.getPoints().length;
        const step1Desc = document.getElementById('step-1-description');
        if (step1Desc) {
            if (pointCount === 0) {
                step1Desc.textContent = 'Create your dataset to explore';
            } else {
                step1Desc.textContent = `${pointCount} points generated`;
            }
        }

        // Update Step 2 description (Algorithm Selection)
        const step2Desc = document.getElementById('step-2-description');
        if (step2Desc) {
            if (this.currentAlgorithm) {
                step2Desc.textContent = `${algorithmNames[this.currentAlgorithm]} selected`;
            } else {
                step2Desc.textContent = 'Select your convex hull algorithm';
            }
        }

        // Update Step 3 description (Run Visualization)
        const step3Desc = document.getElementById('step-3-description');
        if (step3Desc) {
            if (this.currentAlgorithm && pointCount >= 3) {
                step3Desc.textContent = `Ready to run ${algorithmNames[this.currentAlgorithm]} or compare all algorithms`;
            } else if (pointCount < 3) {
                step3Desc.textContent = 'Need at least 3 points to visualize';
            } else if (!this.currentAlgorithm) {
                step3Desc.textContent = 'Select algorithm first';
            } else {
                step3Desc.textContent = 'Execute and watch the algorithm';
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
        
        const titles = {
            graham: {
                sorting: `Sorting Points`,
                upper_hull: {
                    processing: `Processing Point & Checking Turn`,
                    testing: `Processing Point & Checking Turn`,
                    popping: `Removing Non-Convex Point`,
                    accepted: `Processing Point & Checking Turn`,
                    added: `Added to Upper Hull`
                },
                lower_hull: {
                    processing: `Processing Point & Checking Turn`,
                    testing: `Processing Point & Checking Turn`,
                    popping: `Removing Non-Convex Point`,
                    accepted: `Processing Point & Checking Turn`,
                    added: `Added to Lower Hull`
                },
                complete: `Graham's Scan Complete`
            },
            jarvis: {
                jarvis_step: `Gift Wrapping`,
                testing: `Testing Candidate`,
                candidate_selected: `Update Best`,
                complete: `Wrapping Complete`
            },
            chan: {
                mini_hull: `Computing Mini-Hull`,
                jarvis_phase: `Connecting Hulls`,
                connecting_edge: `Finding Connection`,
                complete: `Algorithm Complete`,
                trying_m: `Testing Hull Size = ${step.m}`,
                failed_m: `Hull Size Too Small — Expanding`
            },
            incremental: {
                seed: `Seeding Hull`,
                inside: `Point Inside Hull`,
                tangents: `Finding Tangents`,
                splice_done: `Splicing Point`,
                complete: `Algorithm Complete`
            }
        };
        
        const algoTitles = titles[this.currentAlgorithm] || {};
        
        if (step.type === 'upper_hull' || step.type === 'lower_hull') {
            return algoTitles[step.type]?.[step.phase] || `${step.type} - ${step.phase}`;
        }
        
        return algoTitles[step.type] || `${step.type}`;
    }

    getStepDescription(step) {
        if (!step) return 'Ready to start algorithm execution.';
        
        // Educational descriptions that explain WHY and HOW each algorithm works
        const descriptions = {
            graham: {
                sorting: (s) => `Graham's Scan begins by sorting all points by x-coordinate. This establishes a left-to-right order so we can trace the convex boundary-first the upper edge, then the lower. Sorting ensures a consistent progression across the plane.`,
                upper_hull: {
                    processing: (s) => `Building the upper hull: we move left-to-right, adding points that preserve a counter-clockwise (left) turn. Each point is tested to check if it maintains a convex boundary. Currently examining point ${s.point_index + 1} of ${s.sorted_points.length}.`,
                    testing: (s) => `Testing the turn direction with the new point. Orientation value: ${s.orientation.toFixed(3)}. ${s.orientation > 0 ? 'Positive = Left turn ✓' : 'Negative or zero = Right turn'}`,
                    popping: (s) => `Right turn detected. The previous point disrupts convexity and is removed to restore the proper outward shape.`,
                    accepted: (s) => `Left turn detected. The new point preserves convexity and will be kept for the next hull segment.`,
                    added: (s) => `Point added successfully! The upper hull extends outward and now includes ${s.upper_hull.length} points.`
                },
                lower_hull: {
                    processing: (s) => `Building the lower hull: we move right-to-left, adding points that preserve a counter-clockwise (left) turn in this direction. Each point is tested to check if it maintains a convex boundary. Currently examining point ${s.point_index + 1} of ${s.sorted_points.length}.`,
                    testing: (s) => `Testing the turn direction at point (${s.current_point.x.toFixed(1)}, ${s.current_point.y.toFixed(1)}). Orientation value: ${s.orientation.toFixed(3)}. ${s.orientation > 0 ? 'Positive = Left turn ✓' : 'Negative or zero = Right turn'}`,
                    popping: (s) => `Right turn detected. The previous point disrupts convexity and is removed to restore the proper outward shape.`,
                    accepted: (s) => `Left turn detected. The new point preserves convexity and will be kept for the next hull segment.`,
                    added: (s) => `Point added successfully! The lower hull extends outward and now includes ${s.lower_hull.length} points.`
                },
                complete: (s) => `Graham's Scan complete! We built the upper hull (${s.upper_hull.length} points) and lower hull (${s.lower_hull.length} points), then combined them into the final convex hull with ${s.final_hull.length} vertices. The algorithm maintains convexity by ensuring all turns are counter-clockwise.`
            },
            jarvis: {
                jarvis_step: (s) => `Jarvis March (“gift wrapping”) starts at the leftmost point and repeatedly picks the point with the largest outward turn from our current position, like wrapping string around the outside of all points.`,
                testing: (s) => `Testing a candidate against the current best: Check the "turn direction" - ${s.orientation > 0 ? 'this point makes a more outward turn, it\'s a better choice for the hull boundary' : s.orientation < 0 ? 'this point makes an inward turn, our current candidate is still better' : 'this point is collinear — choose the farther one'}.`,
                complete: (s) => `Jarvis March complete! We "wrapped" around all points like putting a rubber band around them, always choosing the most outward point at each step. The final hull has ${s.final_hull.length} vertices.`,
                candidate_selected: (s) => `Best candidate updated. The new point makes a stronger outward turn from the current point, so it becomes part of the convex hull boundary.`

            },
            chan: {
                mini_hull: (s) => `Dividing points into smaller groups and building a convex hull for each. Processing group ${s.group_idx + 1} of ${s.num_groups}. This "divide and conquer" approach makes the algorithm faster for large datasets.`,
                jarvis_phase: (s) => `Using Jarvis March to connect all the mini-hulls together. Instead of checking every single point, we only need to check the boundaries of each mini-hull (shown as dotted polygons). This is much faster than checking all ${s.mini_hulls ? s.mini_hulls.flat().length : 'original'} points!`,
                connecting_edge: (s) => `Finding the next connecting edge from current point to mini-hull ${s.connecting_hull_idx + 1}. The dotted orange line shows the edge being considered for the final hull.`,
                complete: (s) => `Chan's Algorithm complete! We divided the problem into smaller pieces (mini-hulls), then efficiently combined them. This hybrid approach gives us the best of both worlds.`,
                trying_m: (s) => `Starting a new phase with hull size m = ${s.m}. The algorithm assumes the final hull will have no more than m vertices and proceeds to build mini-hulls of size ≤ m.`,
                failed_m: (s) => `Phase with m = ${s.m} failed to find the complete hull. The actual hull has more than ${s.m} vertices, so we need to increase m and try again.`
            },
            incremental: {
                seed: (s) => `Incremental Hull builds the convex hull one point at a time. We're starting with this triangle as our initial hull. This approach is useful when points arrive one by one, or when we want to see how the hull evolves.`,
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

// Algorithm Information Modal Functions
function showAlgorithmInfo(algorithm, event) {
    // Prevent the label click from selecting the radio button
    event.preventDefault();
    event.stopPropagation();
    
    const modal = document.getElementById('algorithm-info-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const algorithmData = getAlgorithmInfo(algorithm);
    
    title.textContent = algorithmData.title;
    body.innerHTML = algorithmData.content;
    
    modal.style.display = 'block';
    
    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeAlgorithmModal();
        }
    };
}

function closeAlgorithmModal() {
    const modal = document.getElementById('algorithm-info-modal');
    modal.style.display = 'none';
}

function getAlgorithmInfo(algorithm) {
    const algorithmInfo = {
        graham: {
            title: "Graham's Scan Algorithm",
            content: `
                <div class="algorithm-overview">
                    <h3>Algorithm Overview</h3>
                    <p>Graham's Scan constructs the convex hull by sorting points and using a stack-based approach to build upper and lower hull segments separately. Our implementation builds the upper hull first (left to right), then the lower hull (right to left), using orientation tests to maintain convexity.</p>
                </div>

                <div class="complexity-info">
                    <h4>Time Complexity Analysis</h4>
                    <div class="complexity-grid">
                        <div class="complexity-item">
                            <strong>Best Case:</strong> O(n log n)
                        </div>
                        <div class="complexity-item">
                            <strong>Average Case:</strong> O(n log n)
                        </div>
                        <div class="complexity-item">
                            <strong>Worst Case:</strong> O(n log n)
                        </div>
                        <div class="complexity-item">
                            <strong>Space:</strong> O(n)
                        </div>
                    </div>
                    <p>Complexity dominated by sorting. Hull construction is O(n) with each point added/removed at most once.</p>
                </div>

                <div class="algorithm-steps">
                    <h3>Implementation Steps</h3>
                    
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Sort Points by X-Coordinate</h4>
                            <p>Sort all points by x-coordinate (then y-coordinate for ties). This creates the left-to-right ordering needed for the two-pass hull construction.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Build Upper Hull</h4>
                            <p>Process points from left to right, maintaining a stack. Use the left turn test: for three consecutive points A→B→C, keep only left turns (positive orientation). Pop points that create right turns or are collinear.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Build Lower Hull</h4>
                            <p>Process points from right to left, applying the same left turn test. This constructs the lower portion of the convex hull using the same orientation-based elimination.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Combine Hull Segments</h4>
                            <p>Concatenate upper and lower hulls, removing duplicate endpoints to form the complete convex hull in counter-clockwise order.</p>
                        </div>
                    </div>
                </div>

                <div class="algorithm-overview" style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>Left Turn Test Explained</h4>
                    <p>The core of Graham's Scan is the <strong>left turn test</strong> using orientation:</p>
                    <ul style="margin: 12px 0; padding-left: 20px;">
                        <li><strong>Positive orientation</strong>: Points form a left turn (counter-clockwise) → Keep the point</li>
                        <li><strong>Zero orientation</strong>: Points are collinear → Remove middle point</li>
                        <li><strong>Negative orientation</strong>: Points form a right turn (clockwise) → Remove middle point</li>
                    </ul>
                    <p>This ensures we maintain a convex hull by eliminating any "inward bends" that would violate convexity.</p>
                </div>



                <div class="pros-cons">
                    <div class="pros">
                        <h4>Advantages</h4>
                        <ul>
                            <li>Optimal O(n log n) time complexity</li>
                            <li>Predictable performance regardless of input</li>
                            <li>Robust handling of edge cases and collinear points</li>
                            <li>Well-suited for general-purpose use</li>
                            <li>Clear geometric interpretation with left turn test</li>
                        </ul>
                    </div>
                    <div class="cons">
                        <h4>Disadvantages</h4>
                        <ul>
                            <li>Not output-sensitive (doesn't benefit from small hulls)</li>
                            <li>Sorting overhead for small datasets</li>
                            <li>More complex than Jarvis March conceptually</li>
                            <li>Requires careful orientation predicate implementation</li>
                        </ul>
                    </div>
                </div>

                <div class="algorithm-overview">
                    <h3>Usage Recommendations</h3>
                    <p><strong>Best for:</strong> General-purpose convex hull computation when you need predictable O(n log n) performance. Recommended as the default choice for most applications.</p>
                    <p><strong>Consider alternatives when:</strong> Working with very small datasets where simpler algorithms might have lower overhead, or when hull size is guaranteed to be very small.</p>
                </div>
            `
        },
        
        jarvis: {
            title: "Jarvis March Algorithm",
            content: `
                <div class="algorithm-overview">
                    <h3>Algorithm Overview</h3>
                    <p>Jarvis March constructs the convex hull by iteratively finding the next hull vertex using orientation tests. Starting from the leftmost point, it "wraps" around the point set by always selecting the most counter-clockwise point as the next hull vertex.</p>
                </div>

                <div class="complexity-info">
                    <h4>Time Complexity Analysis</h4>
                    <div class="complexity-grid">
                        <div class="complexity-item">
                            <strong>Best Case:</strong> O(n) when h = 3
                        </div>
                        <div class="complexity-item">
                            <strong>Average Case:</strong> O(n × h)
                        </div>
                        <div class="complexity-item">
                            <strong>Worst Case:</strong> O(n²) when h = n
                        </div>
                        <div class="complexity-item">
                            <strong>Space:</strong> O(h)
                        </div>
                    </div>
                    <p>This is an output-sensitive algorithm - performance depends on hull size (h). Often faster than Graham's Scan for small hulls.</p>
                </div>

                <div class="algorithm-steps">
                    <h3>Implementation Steps</h3>
                    
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Find Leftmost Point</h4>
                            <p>Identify the point with the smallest x-coordinate (leftmost y-coordinate for ties). This point is guaranteed to be on the convex hull.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Initialize Hull Construction</h4>
                            <p>Start with the leftmost point as the first hull vertex and set it as the current point for the wrapping process.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Find Next Hull Vertex</h4>
                            <p>For each candidate point, use orientation tests to determine if it forms a more counter-clockwise angle than the current best. Select the most counter-clockwise point.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Continue Hull Wrapping</h4>
                            <p>Add the selected point to the hull and make it the new current point. Repeat the selection process from this new position.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <h4>Complete Hull</h4>
                            <p>Continue until returning to the starting point, completing the convex hull. The algorithm naturally terminates when the hull is closed.</p>
                        </div>
                    </div>
                </div>



                <div class="pros-cons">
                    <div class="pros">
                        <h4>Advantages</h4>
                        <ul>
                            <li>Output-sensitive: excellent for small hulls</li>
                            <li>Simple conceptual model and implementation</li>
                            <li>Excellent cache locality with linear scans</li>
                            <li>Low memory overhead</li>
                            <li>Often fastest for practical datasets</li>
                            <li>Intuitive geometric interpretation</li>
                        </ul>
                    </div>
                    <div class="cons">
                        <h4>Disadvantages</h4>
                        <ul>
                            <li>Performance degrades with hull size</li>
                            <li>Can reach O(n²) for large hulls</li>
                            <li>No worst-case guarantees</li>
                            <li>Less predictable than Graham's Scan</li>
                        </ul>
                    </div>
                </div>

                <div class="algorithm-overview">
                    <h3>Usage Recommendations</h3>
                    <p><strong>Best for:</strong> Small to medium datasets, especially when the convex hull is expected to have few vertices. Excellent choice for real-time applications with typical point distributions.</p>
                    <p><strong>Consider alternatives when:</strong> Working with large datasets where hull size is unpredictable, or when you need guaranteed O(n log n) performance bounds.</p>
                </div>
            `
        },
        
        chan: {
            title: "Chan's Algorithm",
            content: `
                <div class="algorithm-overview">
                    <h3>Algorithm Overview</h3>
                    <p>Chan's Algorithm is a hybrid approach that combines Graham's Scan and Jarvis March using iterative doubling. Our implementation includes optimized tangent finding with binary search to achieve theoretical O(n log h) complexity, making it optimal for large datasets with small hulls.</p>
                </div>

                <div class="complexity-info">
                    <h4>Time Complexity Analysis</h4>
                    <div class="complexity-grid">
                        <div class="complexity-item">
                            <strong>Best Case:</strong> O(n log h)
                        </div>
                        <div class="complexity-item">
                            <strong>Average Case:</strong> O(n log h)
                        </div>
                        <div class="complexity-item">
                            <strong>Worst Case:</strong> O(n log h)
                        </div>
                        <div class="complexity-item">
                            <strong>Space:</strong> O(n)
                        </div>
                    </div>
                    <p>Optimal output-sensitive complexity with binary search optimization for tangent finding on convex mini-hulls.</p>
                </div>

                <div class="algorithm-steps">
                    <h3>Implementation Steps</h3>
                    
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Iterative Doubling</h4>
                            <p>Try parameter values m = 2^(2^t) for t = 1, 2, 3, ... (m = 4, 16, 256, 65536, ...). This adaptive strategy finds the optimal parameter automatically.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Point Partitioning</h4>
                            <p>Divide input points into groups of size m. Each group will be processed independently to create mini-hulls.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Mini-Hull Computation</h4>
                            <p>Apply Graham's Scan to each group to compute convex mini-hulls. These contain all potentially relevant boundary points from each partition.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Optimized Jarvis March</h4>
                            <p>Use Jarvis March to connect mini-hulls, with binary search for tangent finding (O(log m) per mini-hull). Includes collinear point handling for correctness.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <h4>Success Condition Check</h4>
                            <p>If hull completes within m steps, return result. Otherwise, try next m value. Fallback to Graham's Scan if iterations exceed reasonable bounds.</p>
                        </div>
                    </div>
                </div>



                <div class="pros-cons">
                    <div class="pros">
                        <h4>Advantages</h4>
                        <ul>
                            <li>Optimal O(n log h) theoretical complexity</li>
                            <li>Output-sensitive performance</li>
                            <li>Combines benefits of Graham's and Jarvis</li>
                            <li>Binary search optimization implemented</li>
                            <li>Adaptive parameter selection</li>
                            <li>Handles collinear points correctly</li>
                        </ul>
                    </div>
                    <div class="cons">
                        <h4>Disadvantages</h4>
                        <ul>
                            <li>High implementation complexity</li>
                            <li>Significant constant factor overhead</li>
                            <li>Slower than simpler algorithms for small inputs</li>
                            <li>Multiple algorithm coordination required</li>
                            <li>Binary search tangent finding is complex</li>
                        </ul>
                    </div>
                </div>

                <div class="algorithm-overview">
                    <h3>Usage Recommendations</h3>
                    <p><strong>Best for:</strong> Very large datasets (10,000+ points) with small expected hull sizes. Ideal when you need guaranteed optimal complexity regardless of input characteristics.</p>
                    <p><strong>Consider alternatives when:</strong> Working with small to medium datasets where simpler algorithms have lower overhead, or when implementation complexity is a concern.</p>
                </div>

                <div class="algorithm-overview" style="background: var(--bg-secondary); border-left: 4px solid var(--primary); margin-top: 24px;">
                    <h3>Implementation Notes</h3>
                    <p>Our implementation includes the binary search optimization for tangent finding and proper collinear point handling. While theoretically optimal, the constant factors make it most beneficial for very large datasets with small hull ratios.</p>
                </div>
            `
        },
        
        incremental: {
            title: "Incremental Hull Algorithm",
            content: `
                <div class="algorithm-overview">
                    <h3>Algorithm Overview</h3>
                    <p>The Incremental Hull algorithm constructs the convex hull by processing points one at a time. It maintains the hull of processed points and efficiently updates it when adding each new point using binary search for tangent finding and hull splicing operations.</p>
                </div>

                <div class="complexity-info">
                    <h4>Time Complexity Analysis</h4>
                    <div class="complexity-grid">
                        <div class="complexity-item">
                            <strong>Best Case:</strong> O(n log n)
                        </div>
                        <div class="complexity-item">
                            <strong>Average Case:</strong> O(n log h)
                        </div>
                        <div class="complexity-item">
                            <strong>Worst Case:</strong> O(n log n)
                        </div>
                        <div class="complexity-item">
                            <strong>Space:</strong> O(h)
                        </div>
                    </div>
                    <p>Performance depends on point insertion order and hull size. Binary search optimization provides O(log h) tangent finding per point.</p>
                </div>

                <div class="algorithm-steps">
                    <h3>Implementation Steps</h3>
                    
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Initialize Base Hull</h4>
                            <p>Create initial hull from first few points. Handle degenerate cases (collinear points) and establish a valid starting convex polygon.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Point Classification</h4>
                            <p>For each new point, determine its position relative to the current hull: inside, on boundary, or outside using point-in-convex-polygon tests.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Interior Point Handling</h4>
                            <p>Skip points that lie inside the current hull as they don't affect the convex boundary. This optimization reduces unnecessary hull updates.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Tangent Computation</h4>
                            <p>For exterior points, use binary search to find left and right tangent points on the current hull. These define the visible portion of the hull from the new point.</p>
                        </div>
                    </div>

                    <div class="step-item">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <h4>Hull Splicing</h4>
                            <p>Remove hull vertices between tangent points (now interior) and insert the new point, creating updated hull with proper vertex ordering.</p>
                        </div>
                    </div>
                </div>



                <div class="pros-cons">
                    <div class="pros">
                        <h4>Advantages</h4>
                        <ul>
                            <li>Online algorithm suitable for streaming data</li>
                            <li>Binary search optimization for tangent finding</li>
                            <li>Good average-case performance</li>
                            <li>Natural for dynamic scenarios</li>
                            <li>Excellent for educational visualization</li>
                            <li>Efficient point-in-polygon tests</li>
                        </ul>
                    </div>
                    <div class="cons">
                        <h4>Disadvantages</h4>
                        <ul>
                            <li>Performance sensitive to point insertion order</li>
                            <li>Complex tangent finding implementation</li>
                            <li>Hull splicing requires careful vertex management</li>
                            <li>More implementation complexity than Graham's Scan</li>
                            <li>Worst-case can approach O(n²) behavior</li>
                        </ul>
                    </div>
                </div>

                <div class="algorithm-overview">
                    <h3>Usage Recommendations</h3>
                    <p><strong>Best for:</strong> Online/streaming applications, educational demonstrations of hull evolution, or scenarios where points arrive dynamically and you need incremental updates.</p>
                    <p><strong>Consider alternatives when:</strong> All points are available upfront and you need predictable performance, or when point insertion order might be adversarial.</p>
                </div>

                <div class="algorithm-overview" style="background: var(--bg-secondary); border-left: 4px solid var(--success); margin-top: 24px;">
                    <h3>Educational Benefits</h3>
                    <p>This algorithm excellently demonstrates how convex hulls evolve as points are added, making it valuable for understanding the geometric properties of convex hulls and the challenges of online computational geometry.</p>
                </div>
            `
        }
    };
    
    return algorithmInfo[algorithm] || {
        title: "Algorithm Information",
        content: "<p>Information not available for this algorithm.</p>"
    };
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAlgorithmModal();
    }
});