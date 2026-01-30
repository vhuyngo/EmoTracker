/**
 * Face Detection Module - Handles face-api.js integration
 */

const FaceDetection = {
    // Configuration
    config: {
        // Use CDN for models - more reliable and reduces repo size
        modelPath: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
        detectorOptions: null,
        minConfidence: 0.5,
        inputSize: 320 // 128, 160, 224, 320, 416, 512, 608
    },

    // State
    isRunning: false,
    lastDetectionTime: 0,
    fpsHistory: [],
    animationFrameId: null,

    /**
     * Load face-api.js models
     */
    async loadModels(onProgress) {
        try {
            console.log('Loading face detection models...');
            
            if (onProgress) onProgress('Loading face detector model...');
            await faceapi.nets.tinyFaceDetector.loadFromUri(this.config.modelPath);
            console.log('✓ Tiny Face Detector loaded');

            if (onProgress) onProgress('Loading facial landmark model...');
            await faceapi.nets.faceLandmark68Net.loadFromUri(this.config.modelPath);
            console.log('✓ Face Landmark 68 Net loaded');

            if (onProgress) onProgress('Loading expression recognition model...');
            await faceapi.nets.faceExpressionNet.loadFromUri(this.config.modelPath);
            console.log('✓ Face Expression Net loaded');

            // Initialize detector options
            this.config.detectorOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: this.config.inputSize,
                scoreThreshold: this.config.minConfidence
            });

            console.log('All models loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading models:', error);
            throw new Error(`Failed to load models: ${error.message}`);
        }
    },

    /**
     * Detect faces in video frame
     */
    async detectFaces(video) {
        if (!video || video.paused || video.ended) {
            return [];
        }

        try {
            const detections = await faceapi
                .detectAllFaces(video, this.config.detectorOptions)
                .withFaceLandmarks()
                .withFaceExpressions();

            return detections;
        } catch (error) {
            console.error('Detection error:', error);
            return [];
        }
    },

    /**
     * Calculate current FPS
     */
    calculateFPS() {
        const now = performance.now();
        const elapsed = now - this.lastDetectionTime;
        this.lastDetectionTime = now;

        if (elapsed > 0) {
            const fps = 1000 / elapsed;
            this.fpsHistory.push(fps);
            
            // Keep last 10 frames for average
            if (this.fpsHistory.length > 10) {
                this.fpsHistory.shift();
            }

            // Return average FPS
            const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
            return avgFps;
        }

        return 0;
    },

    /**
     * Start detection loop
     */
    startDetectionLoop(video, onDetection, onFPS) {
        if (this.isRunning) {
            console.log('Detection loop already running');
            return;
        }

        this.isRunning = true;
        this.lastDetectionTime = performance.now();
        this.fpsHistory = [];

        const detectLoop = async () => {
            if (!this.isRunning) {
                return;
            }

            const detections = await this.detectFaces(video);
            
            // Calculate and report FPS
            const fps = this.calculateFPS();
            if (onFPS) {
                onFPS(fps);
            }

            // Report detections
            if (onDetection) {
                onDetection(detections);
            }

            // Continue loop
            this.animationFrameId = requestAnimationFrame(detectLoop);
        };

        // Start the loop
        this.animationFrameId = requestAnimationFrame(detectLoop);
        console.log('Detection loop started');
    },

    /**
     * Stop detection loop
     */
    stopDetectionLoop() {
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.fpsHistory = [];
        console.log('Detection loop stopped');
    },

    /**
     * Update detector options
     */
    updateOptions(options) {
        if (options.inputSize) {
            this.config.inputSize = options.inputSize;
        }
        if (options.minConfidence) {
            this.config.minConfidence = options.minConfidence;
        }

        this.config.detectorOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: this.config.inputSize,
            scoreThreshold: this.config.minConfidence
        });
    },

    /**
     * Get detection info for debugging
     */
    getDebugInfo() {
        return {
            isRunning: this.isRunning,
            inputSize: this.config.inputSize,
            minConfidence: this.config.minConfidence,
            avgFPS: this.fpsHistory.length > 0 
                ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length 
                : 0
        };
    }
};
