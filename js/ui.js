/**
 * UI Module - Handles all UI updates and rendering
 */

const UI = {
    // DOM element references
    elements: {
        video: null,
        canvas: null,
        ctx: null,
        loadingOverlay: null,
        loadingText: null,
        startBtn: null,
        stopBtn: null,
        emotionIcon: null,
        emotionName: null,
        confidenceFill: null,
        confidenceText: null,
        fpsCounter: null,
        faceCount: null,
        status: null
    },

    // Emotion to emoji mapping
    emotionEmojis: {
        neutral: '😐',
        happy: '😊',
        sad: '😢',
        angry: '😠',
        fearful: '😨',
        disgusted: '🤢',
        surprised: '😲'
    },

    // Emotion colors for visualization
    emotionColors: {
        neutral: '#a0a0b0',
        happy: '#00cec9',
        sad: '#74b9ff',
        angry: '#ff7675',
        fearful: '#fdcb6e',
        disgusted: '#55efc4',
        surprised: '#e17055'
    },

    /**
     * Initialize UI elements
     */
    init() {
        this.elements.video = document.getElementById('video');
        this.elements.canvas = document.getElementById('overlay');
        this.elements.ctx = this.elements.canvas.getContext('2d');
        this.elements.loadingOverlay = document.getElementById('loading-overlay');
        this.elements.loadingText = document.getElementById('loading-text');
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.stopBtn = document.getElementById('stop-btn');
        this.elements.emotionIcon = document.getElementById('emotion-icon');
        this.elements.emotionName = document.getElementById('emotion-name');
        this.elements.confidenceFill = document.getElementById('confidence-fill');
        this.elements.confidenceText = document.getElementById('confidence-text');
        this.elements.fpsCounter = document.getElementById('fps-counter');
        this.elements.faceCount = document.getElementById('face-count');
        this.elements.status = document.getElementById('status');

        console.log('UI initialized');
    },

    /**
     * Update loading text
     */
    setLoadingText(text) {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = text;
        }
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    },

    /**
     * Show loading overlay
     */
    showLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    },

    /**
     * Enable/disable start button
     */
    setStartButtonEnabled(enabled) {
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = !enabled;
        }
    },

    /**
     * Enable/disable stop button
     */
    setStopButtonEnabled(enabled) {
        if (this.elements.stopBtn) {
            this.elements.stopBtn.disabled = !enabled;
        }
    },

    /**
     * Update status text
     */
    setStatus(text) {
        if (this.elements.status) {
            this.elements.status.textContent = text;
        }
    },

    /**
     * Update FPS counter
     */
    updateFPS(fps) {
        if (this.elements.fpsCounter) {
            this.elements.fpsCounter.textContent = Math.round(fps);
        }
    },

    /**
     * Update face count
     */
    updateFaceCount(count) {
        if (this.elements.faceCount) {
            this.elements.faceCount.textContent = count;
        }
    },

    /**
     * Resize canvas to match video dimensions
     */
    resizeCanvas() {
        const video = this.elements.video;
        const canvas = this.elements.canvas;
        
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
    },

    /**
     * Clear the canvas
     */
    clearCanvas() {
        const ctx = this.elements.ctx;
        const canvas = this.elements.canvas;
        
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    /**
     * Draw facial landmarks on canvas
     */
    drawLandmarks(detections) {
        const ctx = this.elements.ctx;
        const canvas = this.elements.canvas;
        
        if (!ctx || !canvas || !detections) return;

        this.clearCanvas();

        detections.forEach(detection => {
            const landmarks = detection.landmarks;
            const positions = landmarks.positions;

            // Draw all 68 landmark points
            ctx.fillStyle = '#6c5ce7';
            positions.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Draw connections for facial features
            this.drawFaceOutline(ctx, landmarks);
        });
    },

    /**
     * Draw face outline and feature connections
     */
    drawFaceOutline(ctx, landmarks) {
        ctx.strokeStyle = '#a29bfe';
        ctx.lineWidth = 1;

        // Jaw line (0-16)
        this.drawPath(ctx, landmarks.getJawOutline());
        
        // Left eyebrow (17-21)
        this.drawPath(ctx, landmarks.getLeftEyeBrow());
        
        // Right eyebrow (22-26)
        this.drawPath(ctx, landmarks.getRightEyeBrow());
        
        // Nose bridge (27-30)
        this.drawPath(ctx, landmarks.getNose());
        
        // Left eye (36-41)
        this.drawPath(ctx, landmarks.getLeftEye(), true);
        
        // Right eye (42-47)
        this.drawPath(ctx, landmarks.getRightEye(), true);
        
        // Outer mouth (48-59)
        this.drawPath(ctx, landmarks.getMouth(), true);
    },

    /**
     * Draw a path connecting points
     */
    drawPath(ctx, points, closed = false) {
        if (!points || points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        if (closed) {
            ctx.closePath();
        }
        
        ctx.stroke();
    },

    /**
     * Draw bounding box around face
     */
    drawBoundingBox(ctx, box, emotion) {
        const color = this.emotionColors[emotion] || '#6c5ce7';
        const canvas = this.elements.canvas;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw emotion label above box (un-mirrored so text is readable)
        if (emotion) {
            const emoji = this.emotionEmojis[emotion] || '';
            const label = `${emoji} ${emotion}`;
            
            ctx.font = '16px Segoe UI, sans-serif';
            const textWidth = ctx.measureText(label).width;
            const padding = 6;
            
            // Calculate mirrored x position for the label
            // Since canvas is CSS-mirrored, we need to flip the text back
            const labelX = box.x;
            const labelY = box.y - 28;
            
            // Save context, flip horizontally at the label position, draw text, restore
            ctx.save();
            
            // Move to center of where text will be, flip, move back
            const centerX = labelX + (textWidth + padding * 2) / 2;
            ctx.translate(centerX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, 0);
            
            // Background for label
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(labelX, labelY, textWidth + padding * 2, 24);
            
            // Label text
            ctx.fillStyle = color;
            ctx.fillText(label, labelX + padding, box.y - 10);
            
            ctx.restore();
        }
    },

    /**
     * Update the main emotion display
     */
    updateEmotionDisplay(emotion, confidence) {
        if (!emotion) {
            this.elements.emotionIcon.textContent = '😐';
            this.elements.emotionName.textContent = 'No face detected';
            this.elements.confidenceFill.style.width = '0%';
            this.elements.confidenceText.textContent = '0%';
            return;
        }

        const emoji = this.emotionEmojis[emotion] || '😐';
        const percentage = Math.round(confidence * 100);

        this.elements.emotionIcon.textContent = emoji;
        this.elements.emotionName.textContent = emotion;
        this.elements.confidenceFill.style.width = `${percentage}%`;
        this.elements.confidenceText.textContent = `${percentage}%`;

        // Update icon color based on emotion
        this.elements.emotionIcon.style.filter = 'none';
    },

    /**
     * Update all emotion bars
     */
    updateEmotionBars(expressions) {
        if (!expressions) return;

        const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
        
        // Find dominant emotion
        let maxEmotion = null;
        let maxValue = 0;
        
        emotions.forEach(emotion => {
            const value = expressions[emotion] || 0;
            if (value > maxValue) {
                maxValue = value;
                maxEmotion = emotion;
            }
        });

        // Update each bar
        emotions.forEach(emotion => {
            const value = expressions[emotion] || 0;
            const percentage = Math.round(value * 100);
            
            const barFill = document.getElementById(`bar-${emotion}`);
            const valText = document.getElementById(`val-${emotion}`);
            const barItem = document.querySelector(`.emotion-bar-item[data-emotion="${emotion}"]`);
            
            if (barFill) {
                barFill.style.width = `${percentage}%`;
            }
            
            if (valText) {
                valText.textContent = `${percentage}%`;
            }
            
            // Highlight dominant emotion
            if (barItem) {
                if (emotion === maxEmotion) {
                    barItem.classList.add('active');
                } else {
                    barItem.classList.remove('active');
                }
            }
        });
    },

    /**
     * Process and display detection results
     */
    displayResults(detections) {
        this.updateFaceCount(detections.length);

        if (detections.length === 0) {
            this.updateEmotionDisplay(null, 0);
            this.updateEmotionBars(null);
            return;
        }

        // Get the first (largest/closest) face
        const detection = detections[0];
        const expressions = detection.expressions;

        // Find dominant emotion
        let dominantEmotion = null;
        let maxConfidence = 0;

        Object.entries(expressions).forEach(([emotion, confidence]) => {
            if (confidence > maxConfidence) {
                maxConfidence = confidence;
                dominantEmotion = emotion;
            }
        });

        // Update main emotion display
        this.updateEmotionDisplay(dominantEmotion, maxConfidence);
        
        // Update all emotion bars
        this.updateEmotionBars(expressions);

        // Draw on canvas
        this.clearCanvas();
        
        detections.forEach(det => {
            // Find this face's dominant emotion
            let faceEmotion = null;
            let faceMaxConf = 0;
            Object.entries(det.expressions).forEach(([emotion, conf]) => {
                if (conf > faceMaxConf) {
                    faceMaxConf = conf;
                    faceEmotion = emotion;
                }
            });

            // Draw bounding box
            this.drawBoundingBox(this.elements.ctx, det.detection.box, faceEmotion);
            
            // Draw landmarks
            const landmarks = det.landmarks;
            const positions = landmarks.positions;
            
            this.elements.ctx.fillStyle = this.emotionColors[faceEmotion] || '#6c5ce7';
            positions.forEach(point => {
                this.elements.ctx.beginPath();
                this.elements.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                this.elements.ctx.fill();
            });

            // Draw face outline
            this.elements.ctx.strokeStyle = this.emotionColors[faceEmotion] || '#a29bfe';
            this.elements.ctx.lineWidth = 1;
            this.drawFaceOutline(this.elements.ctx, landmarks);
        });
    },

    /**
     * Show error message
     */
    showError(message) {
        this.hideLoading();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const main = document.querySelector('main');
        main.insertBefore(errorDiv, main.firstChild);
        
        this.setStatus('Error');
    }
};
