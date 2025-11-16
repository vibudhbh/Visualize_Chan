/**
 * Animation Controller
 * Manages step-by-step playback of algorithm execution
 */

class AnimationController {
    constructor(app) {
        this.app = app;
        this.isPlaying = false;
        this.speed = 3; // 1-10 scale (slower default)
        this.intervalId = null;
        
        // Speed mapping (milliseconds between steps)
        this.speedMap = {
            1: 3000,   // Very slow
            2: 2000,   // Slow
            3: 1500,   // Slow-medium
            4: 1200,   // Medium
            5: 900,    // Normal
            6: 700,
            7: 500,    // Fast
            8: 300,
            9: 200,    // Very fast
            10: 100
        };
        
        // Initialize speed display
        this.updateSpeedDisplay();
    }

    play() {
        if (this.isPlaying) return;
        
        if (!this.app.currentResult || !this.app.currentResult.steps) {
            console.warn('No algorithm steps to animate');
            return;
        }
        
        this.isPlaying = true;
        this.startPlayback();
        this.app.updateAnimationControls();
    }

    pause() {
        this.isPlaying = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.app.updateAnimationControls();
    }

    stop() {
        this.pause();
        this.app.currentStep = 0;
        this.app.updateStepInfo();
        this.app.render();
    }

    setSpeed(speed) {
        this.speed = Math.max(1, Math.min(10, speed));
        this.updateSpeedDisplay();
        
        // If currently playing, restart with new speed
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    updateSpeedDisplay() {
        const speedMap = {
            1: 'Very Slow', 2: 'Slow', 3: 'Slow', 4: 'Medium', 5: 'Normal',
            6: 'Normal', 7: 'Fast', 8: 'Fast', 9: 'Very Fast', 10: 'Very Fast'
        };
        
        const speedDisplayEl = document.getElementById('speed-display');
        if (speedDisplayEl) {
            speedDisplayEl.textContent = speedMap[this.speed] || 'Normal';
        }
    }

    startPlayback() {
        const delay = this.speedMap[this.speed] || 600;
        
        this.intervalId = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                return;
            }
            
            // Check if we've reached the end
            if (this.app.currentStep >= this.app.currentResult.steps.length - 1) {
                this.pause();
                return;
            }
            
            // Advance to next step
            this.app.nextStep();
            
        }, delay);
    }

    goToStep(stepIndex) {
        if (!this.app.currentResult || !this.app.currentResult.steps) return;
        
        const maxStep = this.app.currentResult.steps.length - 1;
        this.app.currentStep = Math.max(0, Math.min(stepIndex, maxStep));
        this.app.updateStepInfo();
        this.app.render();
    }

    getState() {
        return {
            isPlaying: this.isPlaying,
            speed: this.speed,
            currentStep: this.app.currentStep,
            totalSteps: this.app.currentResult ? this.app.currentResult.steps.length : 0
        };
    }
}

// Export for use in other modules
window.AnimationController = AnimationController;