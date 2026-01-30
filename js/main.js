/**
 * Main Application Entry Point
 */

const App = {
    // State
    stream: null,
    isInitialized: false,

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Emotion Tracker...');
        
        // Initialize UI
        UI.init();

        try {
            // Load face detection models
            await FaceDetection.loadModels((text) => {
                UI.setLoadingText(text);
            });

            // Hide loading overlay
            UI.hideLoading();
            UI.setStartButtonEnabled(true);
            UI.setStatus('Ready');

            // Setup event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Initialization failed:', error);
            UI.showError(`Failed to initialize: ${error.message}. Please refresh the page and try again.`);
        }
    },

    /**
     * Setup button event listeners
     */
    setupEventListeners() {
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');

        startBtn.addEventListener('click', () => this.startCamera());
        stopBtn.addEventListener('click', () => this.stopCamera());

        // Handle video metadata loaded (when dimensions are available)
        const video = document.getElementById('video');
        video.addEventListener('loadedmetadata', () => {
            UI.resizeCanvas();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.stream) {
                UI.resizeCanvas();
            }
        });
    },

    /**
     * Start the camera and detection
     */
    async startCamera() {
        if (!this.isInitialized) {
            UI.showError('Application not initialized. Please refresh the page.');
            return;
        }

        try {
            UI.setStatus('Starting camera...');
            UI.setStartButtonEnabled(false);

            // Request camera access
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const video = document.getElementById('video');
            video.srcObject = this.stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                video.onloadeddata = resolve;
            });

            // Resize canvas to match video
            UI.resizeCanvas();

            // Start face detection loop
            FaceDetection.startDetectionLoop(
                video,
                (detections) => {
                    UI.displayResults(detections);
                },
                (fps) => {
                    UI.updateFPS(fps);
                }
            );

            UI.setStopButtonEnabled(true);
            UI.setStatus('Detecting');
            console.log('Camera started');

        } catch (error) {
            console.error('Camera access error:', error);
            UI.setStartButtonEnabled(true);
            
            let errorMessage = 'Failed to access camera.';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is in use by another application.';
            }
            
            UI.showError(errorMessage);
        }
    },

    /**
     * Stop the camera and detection
     */
    stopCamera() {
        // Stop detection loop
        FaceDetection.stopDetectionLoop();

        // Stop all video tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }

        // Clear video source
        const video = document.getElementById('video');
        video.srcObject = null;

        // Clear canvas
        UI.clearCanvas();

        // Reset UI
        UI.setStartButtonEnabled(true);
        UI.setStopButtonEnabled(false);
        UI.setStatus('Stopped');
        UI.updateFPS(0);
        UI.updateFaceCount(0);
        UI.updateEmotionDisplay(null, 0);
        UI.updateEmotionBars(null);

        console.log('Camera stopped');
    },

    /**
     * Get current app state for debugging
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            hasStream: !!this.stream,
            detection: FaceDetection.getDebugInfo()
        };
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && App.stream) {
        console.log('Page hidden, detection continues in background');
    }
});

// Expose for debugging
window.EmotionTracker = {
    app: App,
    ui: UI,
    detection: FaceDetection
};
