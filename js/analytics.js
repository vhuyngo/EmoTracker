/**
 * Analytics Module - Session statistics, emotion history, and timeline data
 */

const Analytics = {
    // Configuration
    config: {
        historyDuration: 300, // seconds (5 minutes max)
        sampleInterval: 100,  // ms between samples
        smoothingFactor: 0.3, // EMA alpha (0-1, lower = more smoothing)
        stabilityFrames: 5,   // frames needed for "stable" emotion
        timelineResolution: 1000 // ms per timeline point
    },

    // Session state
    session: {
        startTime: null,
        firstDetectionTime: null,
        isActive: false,
        totalFrames: 0,
        framesWithFace: 0
    },

    // Emotion tracking
    emotions: {
        history: [], // [{timestamp, emotion, confidence, faceCount, rawExpressions}]
        smoothed: {}, // EMA smoothed values for each emotion
        stable: null, // Current stable emotion
        stableCount: 0, // Frames at current stable emotion
        frequencyCount: {}, // Count per emotion
        confidenceSum: {}, // Sum of confidences per emotion
    },

    // Calibration
    calibration: {
        isCalibrated: false,
        baseline: null, // Baseline expressions when neutral
        deviationThreshold: 0.15
    },

    // Attention tracking
    attention: {
        isLookingAtCamera: false,
        lookAwayCount: 0,
        totalAttentionTime: 0,
        lastAttentionCheck: null
    },

    // Blink/Yawn detection
    fatigue: {
        blinkCount: 0,
        yawnCount: 0,
        lastEyeState: 'open',
        lastMouthState: 'closed',
        eyeAspectRatioHistory: [],
        mouthAspectRatioHistory: []
    },

    /**
     * Initialize/reset analytics
     */
    init() {
        this.reset();
        console.log('Analytics initialized');
    },

    /**
     * Reset all analytics data
     */
    reset() {
        this.session = {
            startTime: null,
            firstDetectionTime: null,
            isActive: false,
            totalFrames: 0,
            framesWithFace: 0
        };

        this.emotions = {
            history: [],
            smoothed: {
                neutral: 0, happy: 0, sad: 0, angry: 0,
                fearful: 0, disgusted: 0, surprised: 0
            },
            stable: null,
            stableCount: 0,
            frequencyCount: {
                neutral: 0, happy: 0, sad: 0, angry: 0,
                fearful: 0, disgusted: 0, surprised: 0
            },
            confidenceSum: {
                neutral: 0, happy: 0, sad: 0, angry: 0,
                fearful: 0, disgusted: 0, surprised: 0
            }
        };

        this.calibration = {
            isCalibrated: false,
            baseline: null,
            deviationThreshold: 0.15
        };

        this.attention = {
            isLookingAtCamera: false,
            lookAwayCount: 0,
            totalAttentionTime: 0,
            lastAttentionCheck: null
        };

        this.fatigue = {
            blinkCount: 0,
            yawnCount: 0,
            lastEyeState: 'open',
            lastMouthState: 'closed',
            eyeAspectRatioHistory: [],
            mouthAspectRatioHistory: []
        };
    },

    /**
     * Start a new session
     */
    startSession() {
        this.reset();
        this.session.startTime = Date.now();
        this.session.isActive = true;
        console.log('Analytics session started');
    },

    /**
     * End current session
     */
    endSession() {
        this.session.isActive = false;
        console.log('Analytics session ended');
    },

    /**
     * Get session duration in seconds
     */
    getSessionDuration() {
        if (!this.session.startTime) return 0;
        return (Date.now() - this.session.startTime) / 1000;
    },

    /**
     * Get time to first detection in seconds
     */
    getTimeToFirstDetection() {
        if (!this.session.startTime || !this.session.firstDetectionTime) return null;
        return (this.session.firstDetectionTime - this.session.startTime) / 1000;
    },

    /**
     * Apply EMA smoothing to emotion values
     */
    applySmoothing(expressions) {
        const alpha = this.config.smoothingFactor;
        const smoothed = {};

        Object.keys(expressions).forEach(emotion => {
            const prev = this.emotions.smoothed[emotion] || 0;
            const curr = expressions[emotion] || 0;
            smoothed[emotion] = alpha * curr + (1 - alpha) * prev;
            this.emotions.smoothed[emotion] = smoothed[emotion];
        });

        return smoothed;
    },

    /**
     * Get dominant emotion from expressions
     */
    getDominantEmotion(expressions) {
        let maxEmotion = null;
        let maxValue = 0;

        Object.entries(expressions).forEach(([emotion, value]) => {
            if (value > maxValue) {
                maxValue = value;
                maxEmotion = emotion;
            }
        });

        return { emotion: maxEmotion, confidence: maxValue };
    },

    /**
     * Update stable emotion tracking
     */
    updateStableEmotion(emotion) {
        if (emotion === this.emotions.stable) {
            this.emotions.stableCount++;
        } else {
            this.emotions.stable = emotion;
            this.emotions.stableCount = 1;
        }

        return this.emotions.stableCount >= this.config.stabilityFrames;
    },

    /**
     * Calibrate baseline (capture neutral face)
     */
    calibrate(expressions) {
        this.calibration.baseline = { ...expressions };
        this.calibration.isCalibrated = true;
        console.log('Calibration complete:', this.calibration.baseline);
        return true;
    },

    /**
     * Get deviation from calibrated baseline
     */
    getDeviationFromBaseline(expressions) {
        if (!this.calibration.isCalibrated || !this.calibration.baseline) {
            return expressions;
        }

        const deviation = {};
        Object.keys(expressions).forEach(emotion => {
            const current = expressions[emotion] || 0;
            const baseline = this.calibration.baseline[emotion] || 0;
            deviation[emotion] = Math.max(0, current - baseline);
        });

        return deviation;
    },

    /**
     * Calculate Eye Aspect Ratio (EAR) for blink detection
     * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
     */
    calculateEAR(eyePoints) {
        if (!eyePoints || eyePoints.length < 6) return 1;

        const p1 = eyePoints[0], p2 = eyePoints[1], p3 = eyePoints[2];
        const p4 = eyePoints[3], p5 = eyePoints[4], p6 = eyePoints[5];

        const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

        const vertical1 = dist(p2, p6);
        const vertical2 = dist(p3, p5);
        const horizontal = dist(p1, p4);

        if (horizontal === 0) return 1;
        return (vertical1 + vertical2) / (2 * horizontal);
    },

    /**
     * Calculate Mouth Aspect Ratio (MAR) for yawn detection
     */
    calculateMAR(mouthPoints) {
        if (!mouthPoints || mouthPoints.length < 12) return 0;

        // Use outer mouth points for vertical, horizontal measurement
        const top = mouthPoints[3];
        const bottom = mouthPoints[9];
        const left = mouthPoints[0];
        const right = mouthPoints[6];

        const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

        const vertical = dist(top, bottom);
        const horizontal = dist(left, right);

        if (horizontal === 0) return 0;
        return vertical / horizontal;
    },

    /**
     * Detect blink from EAR
     */
    detectBlink(ear) {
        const EAR_THRESHOLD = 0.2;
        const currentState = ear < EAR_THRESHOLD ? 'closed' : 'open';

        if (this.fatigue.lastEyeState === 'open' && currentState === 'closed') {
            // Eye just closed - potential blink start
        } else if (this.fatigue.lastEyeState === 'closed' && currentState === 'open') {
            // Eye just opened - blink completed
            this.fatigue.blinkCount++;
        }

        this.fatigue.lastEyeState = currentState;
        return currentState === 'closed';
    },

    /**
     * Detect yawn from MAR
     */
    detectYawn(mar) {
        const MAR_THRESHOLD = 0.6;
        const currentState = mar > MAR_THRESHOLD ? 'open' : 'closed';

        if (this.fatigue.lastMouthState === 'closed' && currentState === 'open') {
            // Mouth just opened wide - potential yawn start
        } else if (this.fatigue.lastMouthState === 'open' && currentState === 'closed') {
            // Mouth closed - yawn completed
            this.fatigue.yawnCount++;
        }

        this.fatigue.lastMouthState = currentState;
        return currentState === 'open';
    },

    /**
     * Check if looking at camera using eye landmarks
     */
    checkGaze(landmarks) {
        if (!landmarks) return false;

        try {
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const nose = landmarks.getNose();

            if (!leftEye || !rightEye || !nose || nose.length < 4) return false;

            // Get eye centers
            const leftCenter = {
                x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length,
                y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length
            };
            const rightCenter = {
                x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length,
                y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length
            };

            // Get nose tip
            const noseTip = nose[3];

            // Calculate face center (midpoint between eyes)
            const faceCenter = {
                x: (leftCenter.x + rightCenter.x) / 2,
                y: (leftCenter.y + rightCenter.y) / 2
            };

            // Calculate horizontal deviation of nose from face center
            const eyeDistance = Math.abs(rightCenter.x - leftCenter.x);
            const noseDeviation = Math.abs(noseTip.x - faceCenter.x) / eyeDistance;

            // If nose is roughly centered between eyes, likely looking at camera
            const isLooking = noseDeviation < 0.3;

            // Update attention tracking
            const now = Date.now();
            if (this.attention.lastAttentionCheck) {
                const elapsed = now - this.attention.lastAttentionCheck;
                if (isLooking) {
                    this.attention.totalAttentionTime += elapsed;
                }
            }
            this.attention.lastAttentionCheck = now;

            if (!isLooking && this.attention.isLookingAtCamera) {
                this.attention.lookAwayCount++;
            }

            this.attention.isLookingAtCamera = isLooking;
            return isLooking;

        } catch (e) {
            return false;
        }
    },

    /**
     * Process a detection frame
     */
    processFrame(detections) {
        if (!this.session.isActive) return null;

        this.session.totalFrames++;
        const timestamp = Date.now();
        const result = {
            timestamp,
            faceCount: detections.length,
            faces: [],
            isStable: false,
            dominantEmotion: null,
            confidence: 0,
            attention: false,
            isBlinking: false,
            isYawning: false
        };

        if (detections.length === 0) {
            return result;
        }

        // Record first detection
        if (!this.session.firstDetectionTime) {
            this.session.firstDetectionTime = timestamp;
        }

        this.session.framesWithFace++;

        // Process each face
        detections.forEach((detection, index) => {
            const expressions = detection.expressions;
            const landmarks = detection.landmarks;

            // Apply smoothing (for primary face)
            const smoothed = index === 0 ? this.applySmoothing(expressions) : expressions;

            // Apply calibration deviation
            const adjusted = this.calibration.isCalibrated 
                ? this.getDeviationFromBaseline(smoothed) 
                : smoothed;

            // Get dominant emotion
            const { emotion, confidence } = this.getDominantEmotion(adjusted);

            // Check stability (primary face only)
            if (index === 0) {
                result.isStable = this.updateStableEmotion(emotion);
                result.dominantEmotion = emotion;
                result.confidence = confidence;

                // Update frequency counts
                if (emotion) {
                    this.emotions.frequencyCount[emotion]++;
                    this.emotions.confidenceSum[emotion] += confidence;
                }

                // Attention/gaze detection
                result.attention = this.checkGaze(landmarks);

                // Blink detection
                if (landmarks) {
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();
                    const leftEAR = this.calculateEAR(leftEye);
                    const rightEAR = this.calculateEAR(rightEye);
                    const avgEAR = (leftEAR + rightEAR) / 2;
                    result.isBlinking = this.detectBlink(avgEAR);

                    // Yawn detection
                    const mouth = landmarks.getMouth();
                    const mar = this.calculateMAR(mouth);
                    result.isYawning = this.detectYawn(mar);
                }
            }

            result.faces.push({
                id: index,
                emotion,
                confidence,
                expressions: adjusted,
                box: detection.detection.box
            });
        });

        // Add to history (throttled)
        const lastEntry = this.emotions.history[this.emotions.history.length - 1];
        if (!lastEntry || timestamp - lastEntry.timestamp >= this.config.timelineResolution) {
            this.emotions.history.push({
                timestamp,
                emotion: result.dominantEmotion,
                confidence: result.confidence,
                faceCount: result.faceCount
            });

            // Trim history to max duration
            const cutoff = timestamp - (this.config.historyDuration * 1000);
            this.emotions.history = this.emotions.history.filter(e => e.timestamp >= cutoff);
        }

        return result;
    },

    /**
     * Get most frequent emotion
     */
    getMostFrequentEmotion() {
        let maxEmotion = null;
        let maxCount = 0;

        Object.entries(this.emotions.frequencyCount).forEach(([emotion, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxEmotion = emotion;
            }
        });

        return maxEmotion;
    },

    /**
     * Get average confidence for an emotion (or overall)
     */
    getAverageConfidence(emotion = null) {
        if (emotion) {
            const count = this.emotions.frequencyCount[emotion];
            const sum = this.emotions.confidenceSum[emotion];
            return count > 0 ? sum / count : 0;
        }

        // Overall average
        let totalCount = 0;
        let totalSum = 0;
        Object.keys(this.emotions.frequencyCount).forEach(e => {
            totalCount += this.emotions.frequencyCount[e];
            totalSum += this.emotions.confidenceSum[e];
        });

        return totalCount > 0 ? totalSum / totalCount : 0;
    },

    /**
     * Get timeline data for charting
     */
    getTimelineData(durationSeconds = 60) {
        const now = Date.now();
        const cutoff = now - (durationSeconds * 1000);
        
        return this.emotions.history
            .filter(e => e.timestamp >= cutoff)
            .map(e => ({
                time: (e.timestamp - this.session.startTime) / 1000,
                emotion: e.emotion,
                confidence: e.confidence,
                faceCount: e.faceCount
            }));
    },

    /**
     * Get session summary for share card
     */
    getSessionSummary() {
        const duration = this.getSessionDuration();
        const ttfd = this.getTimeToFirstDetection();
        const mostFrequent = this.getMostFrequentEmotion();
        const avgConfidence = this.getAverageConfidence();
        const attentionPercent = duration > 0 
            ? (this.attention.totalAttentionTime / (duration * 1000)) * 100 
            : 0;

        return {
            duration: Math.round(duration),
            timeToFirstDetection: ttfd ? ttfd.toFixed(1) : 'N/A',
            mostFrequentEmotion: mostFrequent || 'None',
            averageConfidence: Math.round(avgConfidence * 100),
            framesAnalyzed: this.session.totalFrames,
            framesWithFace: this.session.framesWithFace,
            faceDetectionRate: this.session.totalFrames > 0 
                ? Math.round((this.session.framesWithFace / this.session.totalFrames) * 100) 
                : 0,
            blinkCount: this.fatigue.blinkCount,
            yawnCount: this.fatigue.yawnCount,
            lookAwayCount: this.attention.lookAwayCount,
            attentionPercent: Math.round(attentionPercent),
            emotionBreakdown: { ...this.emotions.frequencyCount },
            isCalibrated: this.calibration.isCalibrated
        };
    },

    /**
     * Update config
     */
    updateConfig(options) {
        Object.assign(this.config, options);
    }
};
