/**
 * API Client for Convex Hull Algorithms
 * Handles communication with the Flask backend
 */

class ConvexHullAPI {
    constructor(baseUrl = 'https://visualizechan-production.up.railway.app') {
        this.baseUrl = baseUrl;
        this.isConnected = false;
    }

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            this.isConnected = response.ok && data.status === 'healthy';
            return { success: this.isConnected, data };
        } catch (error) {
            this.isConnected = false;
            return { success: false, error: error.message };
        }
    }

    async runAlgorithm(algorithm, points) {
        try {
            const response = await fetch(`${this.baseUrl}/${algorithm}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ points })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            throw new Error(`API Error: ${error.message}`);
        }
    }

    async compareAlgorithms(points, algorithms = ['graham', 'jarvis', 'chan', 'incremental']) {
        try {
            const response = await fetch(`${this.baseUrl}/compare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ points, algorithms })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            throw new Error(`API Error: ${error.message}`);
        }
    }

    async getApiInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/`);
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(`API Error: ${error.message}`);
        }
    }
}

// Export for use in other modules
window.ConvexHullAPI = ConvexHullAPI;