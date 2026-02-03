/**
 * Main Application Entry Point
 */

const App = {
    // State
    stream: null,
    isInitialized: false,
    isFullscreen: false,
    selectedDeviceId: null,
    availableCameras: [],

    // Settings
    settings: {
        showAttention: true,
        reducedMotion: false,
        themeEnabled: true
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Emotion Tracker...');
        
        // Initialize modules
        UI.init();
        Analytics.init();
        Themes.init();

        // Setup privacy banner
        this.setupPrivacyBanner();

        try {
            // Load face detection models
            await FaceDetection.loadModels((text) => {
                UI.setLoadingText(text);
            });

            // Enumerate cameras
            await this.enumerateCameras();

            // Hide loading overlay
            UI.hideLoading();
            UI.setStartButtonEnabled(true);
            UI.setStatus('Ready');

            // Setup event listeners
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            this.setupSettingsControls();
            this.setupModals();

            this.isInitialized = true;
            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Initialization failed:', error);
            UI.showError(`Failed to initialize: ${error.message}. Please refresh the page and try again.`);
        }
    },

    /**
     * Setup privacy banner
     */
    setupPrivacyBanner() {
        const banner = document.getElementById('privacy-banner');
        const dismissBtn = document.getElementById('privacy-dismiss');
        
        // Check if previously dismissed
        if (localStorage.getItem('privacyBannerDismissed') === 'true') {
            banner?.classList.add('hidden');
        }

        dismissBtn?.addEventListener('click', () => {
            banner?.classList.add('hidden');
            localStorage.setItem('privacyBannerDismissed', 'true');
        });
    },

    /**
     * Enumerate available cameras
     */
    async enumerateCameras() {
        try {
            // Need to request permission first to get labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());

            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(d => d.kind === 'videoinput');

            const select = document.getElementById('camera-select');
            if (select && this.availableCameras.length > 0) {
                select.innerHTML = '';
                this.availableCameras.forEach((camera, index) => {
                    const option = document.createElement('option');
                    option.value = camera.deviceId;
                    option.textContent = camera.label || `Camera ${index + 1}`;
                    select.appendChild(option);
                });
                select.disabled = false;
            }
        } catch (err) {
            console.log('Could not enumerate cameras:', err);
        }
    },

    /**
     * Setup button event listeners
     */
    setupEventListeners() {
        // Start/Stop buttons
        document.getElementById('start-btn')?.addEventListener('click', () => this.startCamera());
        document.getElementById('stop-btn')?.addEventListener('click', () => this.stopCamera());

        // Calibrate button
        document.getElementById('calibrate-btn')?.addEventListener('click', () => this.calibrate());

        // Screenshot button
        document.getElementById('screenshot-btn')?.addEventListener('click', () => {
            UI.generateScreenshot();
        });

        // Camera selector
        document.getElementById('camera-select')?.addEventListener('change', (e) => {
            this.selectedDeviceId = e.target.value;
            if (this.stream) {
                this.restartCamera();
            }
        });

        // Fullscreen button
        document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Video metadata loaded
        const video = document.getElementById('video');
        video?.addEventListener('loadedmetadata', () => {
            UI.resizeCanvas();
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.stream) {
                UI.resizeCanvas();
            }
            UI.resizeTimelineCanvas();
        });

        // Fullscreen change
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            document.body.classList.toggle('fullscreen-mode', this.isFullscreen);
        });
    },

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Toggle shortcuts panel
        const shortcutsToggle = document.getElementById('shortcuts-toggle');
        const shortcutsPanel = document.getElementById('shortcuts-panel');
        
        shortcutsToggle?.addEventListener('click', () => {
            shortcutsPanel?.classList.toggle('hidden');
        });

        // Close shortcuts panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.shortcuts-help')) {
                shortcutsPanel?.classList.add('hidden');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    if (this.stream) {
                        this.stopCamera();
                    } else {
                        this.startCamera();
                    }
                    break;

                case 'c':
                    if (this.stream) {
                        this.calibrate();
                    }
                    break;

                case 's':
                    if (this.stream) {
                        UI.generateScreenshot();
                    }
                    break;

                case 'f':
                    this.toggleFullscreen();
                    break;

                case 't':
                    const enabled = Themes.toggle();
                    const toggle = document.getElementById('theme-toggle');
                    if (toggle) toggle.checked = enabled;
                    break;

                case 'escape':
                    if (this.isFullscreen) {
                        document.exitFullscreen();
                    }
                    // Close modals
                    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
                    break;
            }
        });
    },

    /**
     * Setup settings controls
     */
    setupSettingsControls() {
        // Smoothing slider
        const smoothingSlider = document.getElementById('smoothing-slider');
        const smoothingValue = document.getElementById('smoothing-value');
        smoothingSlider?.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            smoothingValue.textContent = value.toFixed(2);
            Analytics.updateConfig({ smoothingFactor: value });
        });

        // Stability slider
        const stabilitySlider = document.getElementById('stability-slider');
        const stabilityValue = document.getElementById('stability-value');
        stabilitySlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            stabilityValue.textContent = value;
            Analytics.updateConfig({ stabilityFrames: value });
        });

        // Confidence slider
        const confidenceSlider = document.getElementById('confidence-slider');
        const confidenceValue = document.getElementById('confidence-value');
        confidenceSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            confidenceValue.textContent = `${value}%`;
            FaceDetection.updateOptions({ minConfidence: value / 100 });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('change', (e) => {
            Themes.setEnabled(e.target.checked);
            this.settings.themeEnabled = e.target.checked;
        });

        // Reduced motion toggle
        const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
        reducedMotionToggle?.addEventListener('change', (e) => {
            this.settings.reducedMotion = e.target.checked;
            document.body.classList.toggle('reduced-motion', e.target.checked);
        });

        // Check system preference for reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            reducedMotionToggle.checked = true;
            this.settings.reducedMotion = true;
            document.body.classList.add('reduced-motion');
        }

        // Attention toggle
        const attentionToggle = document.getElementById('attention-toggle');
        attentionToggle?.addEventListener('change', (e) => {
            this.settings.showAttention = e.target.checked;
        });
    },

    /**
     * Setup modal handlers
     */
    setupModals() {
        // Screenshot modal
        const screenshotModal = document.getElementById('screenshot-modal');
        const modalClose = document.getElementById('modal-close');
        const downloadBtn = document.getElementById('download-screenshot');
        const copyBtn = document.getElementById('copy-screenshot');

        modalClose?.addEventListener('click', () => {
            screenshotModal?.classList.add('hidden');
        });

        downloadBtn?.addEventListener('click', () => {
            UI.downloadScreenshot();
        });

        copyBtn?.addEventListener('click', () => {
            UI.copyScreenshot();
        });

        // Close on backdrop click
        screenshotModal?.addEventListener('click', (e) => {
            if (e.target === screenshotModal) {
                screenshotModal.classList.add('hidden');
            }
        });

        // Offline info modal
        const offlineModal = document.getElementById('offline-modal');
        const offlineLink = document.getElementById('offline-info-link');
        const offlineClose = document.getElementById('offline-modal-close');

        offlineLink?.addEventListener('click', (e) => {
            e.preventDefault();
            offlineModal?.classList.remove('hidden');
        });

        offlineClose?.addEventListener('click', () => {
            offlineModal?.classList.add('hidden');
        });

        offlineModal?.addEventListener('click', (e) => {
            if (e.target === offlineModal) {
                offlineModal.classList.add('hidden');
            }
        });
    },

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const container = document.getElementById('video-container');
        
        if (!document.fullscreenElement) {
            container?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
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

            // Use selected camera if available
            if (this.selectedDeviceId) {
                constraints.video.deviceId = { exact: this.selectedDeviceId };
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const video = document.getElementById('video');
            video.srcObject = this.stream;

            // Wait for video to be ready
            await new Promise((resolve) => {
                video.onloadeddata = resolve;
            });

            // Resize canvas to match video
            UI.resizeCanvas();

            // Start analytics session
            Analytics.startSession();

            // Start timeline updates
            UI.startTimelineUpdates();

            // Start face detection loop
            FaceDetection.startDetectionLoop(
                video,
                (detections) => {
                    // Process with analytics
                    const result = Analytics.processFrame(detections);
                    UI.displayResults(detections, result);
                },
                (fps) => {
                    UI.updateFPS(fps);
                }
            );

            UI.setStopButtonEnabled(true);
            UI.setCalibrateButtonEnabled(true);
            UI.setScreenshotButtonEnabled(true);
            UI.setStatus('Detecting');
            
            // Enable camera selector for switching
            const cameraSelect = document.getElementById('camera-select');
            if (cameraSelect) cameraSelect.disabled = false;

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

        // End analytics session
        Analytics.endSession();

        // Stop timeline updates
        UI.stopTimelineUpdates();

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

        // Reset UI
        UI.reset();
        UI.setStartButtonEnabled(true);
        UI.setStopButtonEnabled(false);
        UI.setCalibrateButtonEnabled(false);
        UI.setScreenshotButtonEnabled(false);
        UI.setStatus('Stopped');

        // Reset theme
        Themes.reset();

        console.log('Camera stopped');
    },

    /**
     * Restart camera (for switching cameras)
     */
    async restartCamera() {
        if (this.stream) {
            // Remember that we were running
            FaceDetection.stopDetectionLoop();
            
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;

            // Start with new camera
            await this.startCamera();
        }
    },

    /**
     * Calibrate neutral face
     */
    calibrate() {
        if (!this.stream) return;

        // Get current expressions from last detection
        const video = document.getElementById('video');
        
        FaceDetection.detectFaces(video).then(detections => {
            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                const success = Analytics.calibrate(expressions);
                
                if (success) {
                    UI.setStatus('Calibrated');
                    // Show calibrated indicator
                    const indicator = document.getElementById('calibrated-indicator');
                    indicator?.classList.remove('hidden');
                    
                    // Flash feedback
                    const btn = document.getElementById('calibrate-btn');
                    btn?.classList.add('btn-primary');
                    setTimeout(() => {
                        btn?.classList.remove('btn-primary');
                        UI.setStatus('Detecting');
                    }, 1000);
                }
            } else {
                UI.showError('No face detected. Please face the camera and try again.');
            }
        });
    },

    /**
     * Get current app state for debugging
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            hasStream: !!this.stream,
            isFullscreen: this.isFullscreen,
            settings: this.settings,
            cameras: this.availableCameras.length,
            detection: FaceDetection.getDebugInfo(),
            analytics: Analytics.getSessionSummary()
        };
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && App.stream) {
        console.log('Page hidden, detection continues in background');
    }
});

// Expose for debugging
window.EmotionTracker = {
    app: App,
    ui: UI,
    detection: FaceDetection,
    analytics: Analytics,
    themes: Themes
};
