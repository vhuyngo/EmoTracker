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
        calibrateBtn: null,
        screenshotBtn: null,
        emotionIcon: null,
        emotionName: null,
        confidenceFill: null,
        confidenceText: null,
        fpsCounter: null,
        faceCount: null,
        status: null,
        stabilityIndicator: null,
        calibratedIndicator: null,
        attentionIndicator: null,
        attentionText: null,
        blinkCount: null,
        yawnCount: null,
        fatigueIndicators: null,
        timelineCanvas: null,
        timelineCtx: null,
        sessionDuration: null,
        timeToDetect: null,
        mostFrequent: null,
        avgConfidence: null,
        attentionPercent: null,
        detectionRate: null,
        multifacePanel: null,
        multifaceGrid: null,
        screenshotModal: null,
        screenshotCanvas: null
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

    // Timeline settings
    timeline: {
        duration: 300, // seconds
        updateInterval: null
    },

    /**
     * Initialize UI elements
     */
    init() {
        // Core elements
        this.elements.video = document.getElementById('video');
        this.elements.canvas = document.getElementById('overlay');
        this.elements.ctx = this.elements.canvas.getContext('2d');
        this.elements.loadingOverlay = document.getElementById('loading-overlay');
        this.elements.loadingText = document.getElementById('loading-text');
        
        // Buttons
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.stopBtn = document.getElementById('stop-btn');
        this.elements.calibrateBtn = document.getElementById('calibrate-btn');
        this.elements.screenshotBtn = document.getElementById('screenshot-btn');
        
        // Emotion display
        this.elements.emotionIcon = document.getElementById('emotion-icon');
        this.elements.emotionName = document.getElementById('emotion-name');
        this.elements.confidenceFill = document.getElementById('confidence-fill');
        this.elements.confidenceText = document.getElementById('confidence-text');
        this.elements.stabilityIndicator = document.getElementById('stability-indicator');
        this.elements.calibratedIndicator = document.getElementById('calibrated-indicator');
        
        // Stats
        this.elements.fpsCounter = document.getElementById('fps-counter');
        this.elements.faceCount = document.getElementById('face-count');
        this.elements.status = document.getElementById('status');
        
        // Attention & Fatigue
        this.elements.attentionIndicator = document.getElementById('attention-indicator');
        this.elements.attentionText = document.getElementById('attention-text');
        this.elements.blinkCount = document.getElementById('blink-count');
        this.elements.yawnCount = document.getElementById('yawn-count');
        this.elements.fatigueIndicators = document.getElementById('fatigue-indicators');
        
        // Timeline
        this.elements.timelineCanvas = document.getElementById('timeline-canvas');
        if (this.elements.timelineCanvas) {
            this.elements.timelineCtx = this.elements.timelineCanvas.getContext('2d');
        }
        
        // Analytics
        this.elements.sessionDuration = document.getElementById('session-duration');
        this.elements.timeToDetect = document.getElementById('time-to-detect');
        this.elements.mostFrequent = document.getElementById('most-frequent');
        this.elements.avgConfidence = document.getElementById('avg-confidence');
        this.elements.attentionPercent = document.getElementById('attention-percent');
        this.elements.detectionRate = document.getElementById('detection-rate');
        
        // Multi-face
        this.elements.multifacePanel = document.getElementById('multiface-panel');
        this.elements.multifaceGrid = document.getElementById('multiface-grid');
        
        // Screenshot
        this.elements.screenshotModal = document.getElementById('screenshot-modal');
        this.elements.screenshotCanvas = document.getElementById('screenshot-canvas');

        // Setup timeline duration selector
        const timelineDuration = document.getElementById('timeline-duration');
        if (timelineDuration) {
            timelineDuration.addEventListener('change', (e) => {
                this.timeline.duration = parseInt(e.target.value);
            });
        }

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
     * Enable/disable calibrate button
     */
    setCalibrateButtonEnabled(enabled) {
        if (this.elements.calibrateBtn) {
            this.elements.calibrateBtn.disabled = !enabled;
        }
    },

    /**
     * Enable/disable screenshot button
     */
    setScreenshotButtonEnabled(enabled) {
        if (this.elements.screenshotBtn) {
            this.elements.screenshotBtn.disabled = !enabled;
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

        // Also resize timeline canvas
        this.resizeTimelineCanvas();
    },

    /**
     * Resize timeline canvas
     */
    resizeTimelineCanvas() {
        const container = document.querySelector('.timeline-chart');
        const canvas = this.elements.timelineCanvas;
        
        if (container && canvas) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
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
     * Draw face outline and feature connections
     */
    drawFaceOutline(ctx, landmarks) {
        // Jaw line
        this.drawPath(ctx, landmarks.getJawOutline());
        // Left eyebrow
        this.drawPath(ctx, landmarks.getLeftEyeBrow());
        // Right eyebrow
        this.drawPath(ctx, landmarks.getRightEyeBrow());
        // Nose
        this.drawPath(ctx, landmarks.getNose());
        // Left eye
        this.drawPath(ctx, landmarks.getLeftEye(), true);
        // Right eye
        this.drawPath(ctx, landmarks.getRightEye(), true);
        // Mouth
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
     * Draw bounding box around face with un-mirrored label
     */
    drawBoundingBox(ctx, box, emotion, faceId = null) {
        const color = this.emotionColors[emotion] || '#6c5ce7';
        const canvas = this.elements.canvas;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw emotion label above box (un-mirrored so text is readable)
        const emoji = this.emotionEmojis[emotion] || '';
        const idLabel = faceId !== null ? `#${faceId + 1} ` : '';
        const label = `${idLabel}${emoji} ${emotion || 'detecting...'}`;
        
        ctx.font = '14px Segoe UI, sans-serif';
        const textWidth = ctx.measureText(label).width;
        const padding = 6;
        
        // Calculate label position
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
    },

    /**
     * Update the main emotion display
     */
    updateEmotionDisplay(emotion, confidence, isStable = false, isCalibrated = false) {
        if (!emotion) {
            this.elements.emotionIcon.textContent = '😐';
            this.elements.emotionName.textContent = 'No face detected';
            this.elements.confidenceFill.style.width = '0%';
            this.elements.confidenceText.textContent = '0%';
            this.elements.stabilityIndicator?.classList.add('hidden');
            return;
        }

        const emoji = this.emotionEmojis[emotion] || '😐';
        const percentage = Math.round(confidence * 100);

        this.elements.emotionIcon.textContent = emoji;
        this.elements.emotionName.textContent = emotion;
        this.elements.confidenceFill.style.width = `${percentage}%`;
        this.elements.confidenceText.textContent = `${percentage}%`;

        // Update stability indicator
        if (this.elements.stabilityIndicator) {
            if (isStable) {
                this.elements.stabilityIndicator.classList.remove('hidden');
            } else {
                this.elements.stabilityIndicator.classList.add('hidden');
            }
        }

        // Update calibrated indicator
        if (this.elements.calibratedIndicator) {
            if (isCalibrated) {
                this.elements.calibratedIndicator.classList.remove('hidden');
            } else {
                this.elements.calibratedIndicator.classList.add('hidden');
            }
        }
    },

    /**
     * Update all emotion bars
     */
    updateEmotionBars(expressions) {
        if (!expressions) {
            const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
            emotions.forEach(emotion => {
                const barFill = document.getElementById(`bar-${emotion}`);
                const valText = document.getElementById(`val-${emotion}`);
                if (barFill) barFill.style.width = '0%';
                if (valText) valText.textContent = '0%';
            });
            return;
        }

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
     * Update attention indicator
     */
    updateAttentionIndicator(isLooking, enabled = true) {
        if (!this.elements.attentionIndicator) return;

        if (!enabled) {
            this.elements.attentionIndicator.classList.add('hidden');
            return;
        }

        this.elements.attentionIndicator.classList.remove('hidden');
        
        if (isLooking) {
            this.elements.attentionIndicator.classList.add('looking');
            this.elements.attentionIndicator.classList.remove('away');
            if (this.elements.attentionText) {
                this.elements.attentionText.textContent = 'Looking at camera';
            }
        } else {
            this.elements.attentionIndicator.classList.remove('looking');
            this.elements.attentionIndicator.classList.add('away');
            if (this.elements.attentionText) {
                this.elements.attentionText.textContent = 'Looking away';
            }
        }
    },

    /**
     * Update fatigue indicators
     */
    updateFatigueIndicators(blinkCount, yawnCount) {
        if (this.elements.fatigueIndicators) {
            this.elements.fatigueIndicators.classList.remove('hidden');
        }
        if (this.elements.blinkCount) {
            this.elements.blinkCount.textContent = blinkCount;
        }
        if (this.elements.yawnCount) {
            this.elements.yawnCount.textContent = yawnCount;
        }
    },

    /**
     * Update multi-face panel
     */
    updateMultifacePanel(faces) {
        if (!this.elements.multifacePanel || !this.elements.multifaceGrid) return;

        if (!faces || faces.length <= 1) {
            this.elements.multifacePanel.classList.add('hidden');
            return;
        }

        this.elements.multifacePanel.classList.remove('hidden');
        this.elements.multifaceGrid.innerHTML = '';

        faces.forEach((face, index) => {
            const card = document.createElement('div');
            card.className = `face-card${index === 0 ? ' primary' : ''}`;
            card.innerHTML = `
                <div class="face-id">Face #${index + 1}${index === 0 ? ' (Primary)' : ''}</div>
                <div class="face-emotion">${this.emotionEmojis[face.emotion] || '😐'}</div>
                <div class="face-label">${face.emotion || 'detecting...'}</div>
            `;
            this.elements.multifaceGrid.appendChild(card);
        });
    },

    /**
     * Update session analytics display
     */
    updateAnalytics(summary) {
        if (!summary) return;

        // Session duration
        if (this.elements.sessionDuration) {
            const mins = Math.floor(summary.duration / 60);
            const secs = summary.duration % 60;
            this.elements.sessionDuration.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Time to first detection
        if (this.elements.timeToDetect) {
            this.elements.timeToDetect.textContent = summary.timeToFirstDetection !== 'N/A' 
                ? `${summary.timeToFirstDetection}s` 
                : '--';
        }

        // Most frequent emotion
        if (this.elements.mostFrequent) {
            const emoji = this.emotionEmojis[summary.mostFrequentEmotion] || '';
            this.elements.mostFrequent.textContent = summary.mostFrequentEmotion !== 'None' 
                ? `${emoji} ${summary.mostFrequentEmotion}` 
                : '--';
        }

        // Average confidence
        if (this.elements.avgConfidence) {
            this.elements.avgConfidence.textContent = `${summary.averageConfidence}%`;
        }

        // Attention rate
        if (this.elements.attentionPercent) {
            this.elements.attentionPercent.textContent = `${summary.attentionPercent}%`;
        }

        // Detection rate
        if (this.elements.detectionRate) {
            this.elements.detectionRate.textContent = `${summary.faceDetectionRate}%`;
        }
    },

    /**
     * Draw emotion timeline chart
     */
    drawTimeline(data) {
        const canvas = this.elements.timelineCanvas;
        const ctx = this.elements.timelineCtx;
        
        if (!canvas || !ctx || !data || data.length === 0) return;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 10;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = 'rgba(37, 37, 64, 0.5)';
        ctx.fillRect(0, 0, width, height);

        if (data.length < 2) return;

        // Draw confidence line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(162, 155, 254, 0.5)';
        ctx.lineWidth = 1;

        const xStep = (width - padding * 2) / (data.length - 1);
        
        data.forEach((point, i) => {
            const x = padding + i * xStep;
            const y = height - padding - (point.confidence * (height - padding * 2));
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw emotion points
        data.forEach((point, i) => {
            const x = padding + i * xStep;
            const y = height - padding - (point.confidence * (height - padding * 2));
            const color = this.emotionColors[point.emotion] || '#a0a0b0';

            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw time axis labels
        ctx.fillStyle = 'rgba(160, 160, 176, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        const duration = this.timeline.duration;
        const intervals = [0, duration / 2, duration];
        
        intervals.forEach((sec, i) => {
            const x = padding + (i / 2) * (width - padding * 2);
            const label = sec === 0 ? 'now' : `-${sec}s`;
            ctx.fillText(label, width - x, height - 2);
        });
    },

    /**
     * Start timeline update interval
     */
    startTimelineUpdates() {
        this.resizeTimelineCanvas();
        
        // Update every second
        this.timeline.updateInterval = setInterval(() => {
            if (typeof Analytics !== 'undefined' && Analytics.session.isActive) {
                const data = Analytics.getTimelineData(this.timeline.duration);
                this.drawTimeline(data);
                
                const summary = Analytics.getSessionSummary();
                this.updateAnalytics(summary);
            }
        }, 1000);
    },

    /**
     * Stop timeline updates
     */
    stopTimelineUpdates() {
        if (this.timeline.updateInterval) {
            clearInterval(this.timeline.updateInterval);
            this.timeline.updateInterval = null;
        }
    },

    /**
     * Process and display detection results with analytics
     */
    displayResults(detections, analyticsResult = null) {
        this.updateFaceCount(detections.length);

        if (detections.length === 0) {
            this.updateEmotionDisplay(null, 0);
            this.updateEmotionBars(null);
            this.updateMultifacePanel(null);
            this.updateAttentionIndicator(false);
            return;
        }

        // Use analytics result if available
        if (analyticsResult) {
            const primaryFace = analyticsResult.faces[0];
            
            // Update main emotion display
            this.updateEmotionDisplay(
                analyticsResult.dominantEmotion,
                analyticsResult.confidence,
                analyticsResult.isStable,
                typeof Analytics !== 'undefined' && Analytics.calibration.isCalibrated
            );
            
            // Update all emotion bars
            if (primaryFace) {
                this.updateEmotionBars(primaryFace.expressions);
            }

            // Update attention
            this.updateAttentionIndicator(analyticsResult.attention);

            // Update fatigue
            if (typeof Analytics !== 'undefined') {
                this.updateFatigueIndicators(
                    Analytics.fatigue.blinkCount,
                    Analytics.fatigue.yawnCount
                );
            }

            // Update multi-face panel
            this.updateMultifacePanel(analyticsResult.faces);

            // Update theme
            if (typeof Themes !== 'undefined' && analyticsResult.isStable) {
                Themes.updateForEmotion(analyticsResult.dominantEmotion, analyticsResult.confidence);
            }
        } else {
            // Fallback to basic display
            const detection = detections[0];
            const expressions = detection.expressions;

            let dominantEmotion = null;
            let maxConfidence = 0;

            Object.entries(expressions).forEach(([emotion, confidence]) => {
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    dominantEmotion = emotion;
                }
            });

            this.updateEmotionDisplay(dominantEmotion, maxConfidence);
            this.updateEmotionBars(expressions);
        }

        // Draw on canvas
        this.clearCanvas();
        
        detections.forEach((det, index) => {
            let faceEmotion = null;
            let faceMaxConf = 0;
            
            Object.entries(det.expressions).forEach(([emotion, conf]) => {
                if (conf > faceMaxConf) {
                    faceMaxConf = conf;
                    faceEmotion = emotion;
                }
            });

            // Draw bounding box with face ID
            this.drawBoundingBox(this.elements.ctx, det.detection.box, faceEmotion, index);
            
            // Draw landmarks
            const landmarks = det.landmarks;
            const positions = landmarks.positions;
            const color = this.emotionColors[faceEmotion] || '#6c5ce7';
            
            this.elements.ctx.fillStyle = color;
            positions.forEach(point => {
                this.elements.ctx.beginPath();
                this.elements.ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                this.elements.ctx.fill();
            });

            // Draw face outline
            this.elements.ctx.strokeStyle = color;
            this.elements.ctx.lineWidth = 1;
            this.drawFaceOutline(this.elements.ctx, landmarks);
        });
    },

    /**
     * Generate and show screenshot/share card
     */
    generateScreenshot() {
        if (!this.elements.screenshotCanvas || typeof Analytics === 'undefined') return;

        const canvas = this.elements.screenshotCanvas;
        const ctx = canvas.getContext('2d');
        const summary = Analytics.getSessionSummary();

        // Set canvas size
        canvas.width = 400;
        canvas.height = 500;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header
        ctx.fillStyle = '#a29bfe';
        ctx.font = 'bold 24px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Emotion Tracker', canvas.width / 2, 40);

        ctx.fillStyle = '#6c5ce7';
        ctx.font = '14px Segoe UI, sans-serif';
        ctx.fillText('Session Summary', canvas.width / 2, 60);

        // Main emotion
        const emoji = this.emotionEmojis[summary.mostFrequentEmotion] || '😐';
        ctx.font = '60px Segoe UI Emoji, sans-serif';
        ctx.fillText(emoji, canvas.width / 2, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Segoe UI, sans-serif';
        ctx.fillText(summary.mostFrequentEmotion || 'No Data', canvas.width / 2, 165);

        ctx.fillStyle = '#a0a0b0';
        ctx.font = '12px Segoe UI, sans-serif';
        ctx.fillText('Most Frequent Emotion', canvas.width / 2, 185);

        // Stats grid
        const stats = [
            { label: 'Session Length', value: `${Math.floor(summary.duration / 60)}:${(summary.duration % 60).toString().padStart(2, '0')}` },
            { label: 'Avg Confidence', value: `${summary.averageConfidence}%` },
            { label: 'Attention Rate', value: `${summary.attentionPercent}%` },
            { label: 'Detection Rate', value: `${summary.faceDetectionRate}%` },
            { label: 'Blinks', value: summary.blinkCount },
            { label: 'Yawns', value: summary.yawnCount }
        ];

        const startY = 220;
        const colWidth = 180;
        const rowHeight = 60;

        stats.forEach((stat, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = 30 + col * colWidth;
            const y = startY + row * rowHeight;

            // Background
            ctx.fillStyle = 'rgba(37, 37, 64, 0.5)';
            ctx.beginPath();
            ctx.roundRect(x, y, 160, 50, 8);
            ctx.fill();

            // Value
            ctx.fillStyle = '#a29bfe';
            ctx.font = 'bold 18px Segoe UI, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(stat.value, x + 15, y + 25);

            // Label
            ctx.fillStyle = '#a0a0b0';
            ctx.font = '11px Segoe UI, sans-serif';
            ctx.fillText(stat.label, x + 15, y + 42);
        });

        // Footer
        ctx.fillStyle = '#3d3d5c';
        ctx.font = '10px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Generated with Emotion Tracker', canvas.width / 2, canvas.height - 20);
        ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height - 8);

        // Show modal
        this.elements.screenshotModal.classList.remove('hidden');
    },

    /**
     * Download screenshot
     */
    downloadScreenshot() {
        if (!this.elements.screenshotCanvas) return;

        const link = document.createElement('a');
        link.download = `emotion-tracker-${Date.now()}.png`;
        link.href = this.elements.screenshotCanvas.toDataURL('image/png');
        link.click();
    },

    /**
     * Copy screenshot to clipboard
     */
    async copyScreenshot() {
        if (!this.elements.screenshotCanvas) return;

        try {
            const blob = await new Promise(resolve => {
                this.elements.screenshotCanvas.toBlob(resolve, 'image/png');
            });
            
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            
            alert('Screenshot copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard. Try downloading instead.');
        }
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
        const existing = main.querySelector('.error-message');
        if (existing) existing.remove();
        
        main.insertBefore(errorDiv, main.firstChild);
        
        this.setStatus('Error');
    },

    /**
     * Reset UI to initial state
     */
    reset() {
        this.clearCanvas();
        this.updateEmotionDisplay(null, 0);
        this.updateEmotionBars(null);
        this.updateMultifacePanel(null);
        this.updateFPS(0);
        this.updateFaceCount(0);
        this.stopTimelineUpdates();
        
        if (this.elements.attentionIndicator) {
            this.elements.attentionIndicator.classList.add('hidden');
        }
        if (this.elements.fatigueIndicators) {
            this.elements.fatigueIndicators.classList.add('hidden');
        }
        if (this.elements.stabilityIndicator) {
            this.elements.stabilityIndicator.classList.add('hidden');
        }
        if (this.elements.calibratedIndicator) {
            this.elements.calibratedIndicator.classList.add('hidden');
        }
    }
};
