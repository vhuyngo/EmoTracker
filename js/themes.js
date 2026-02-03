/**
 * Themes Module - Emotion-triggered dynamic themes
 */

const Themes = {
    // Configuration
    config: {
        enabled: true,
        transitionDuration: 500, // ms
        intensity: 0.5 // 0-1, how much emotion affects colors
    },

    // Theme definitions
    emotionThemes: {
        neutral: {
            accent: '#6c5ce7',
            accentSecondary: '#a29bfe',
            background: 'rgba(108, 92, 231, 0.1)',
            glow: 'rgba(108, 92, 231, 0.3)'
        },
        happy: {
            accent: '#00cec9',
            accentSecondary: '#81ecec',
            background: 'rgba(0, 206, 201, 0.1)',
            glow: 'rgba(0, 206, 201, 0.3)'
        },
        sad: {
            accent: '#74b9ff',
            accentSecondary: '#a9d4ff',
            background: 'rgba(116, 185, 255, 0.1)',
            glow: 'rgba(116, 185, 255, 0.3)'
        },
        angry: {
            accent: '#ff7675',
            accentSecondary: '#ffb8b8',
            background: 'rgba(255, 118, 117, 0.1)',
            glow: 'rgba(255, 118, 117, 0.3)'
        },
        fearful: {
            accent: '#fdcb6e',
            accentSecondary: '#ffeaa7',
            background: 'rgba(253, 203, 110, 0.1)',
            glow: 'rgba(253, 203, 110, 0.3)'
        },
        disgusted: {
            accent: '#55efc4',
            accentSecondary: '#a8f0dc',
            background: 'rgba(85, 239, 196, 0.1)',
            glow: 'rgba(85, 239, 196, 0.3)'
        },
        surprised: {
            accent: '#e17055',
            accentSecondary: '#f0a694',
            background: 'rgba(225, 112, 85, 0.1)',
            glow: 'rgba(225, 112, 85, 0.3)'
        }
    },

    // Default theme (fallback)
    defaultTheme: {
        accent: '#6c5ce7',
        accentSecondary: '#a29bfe',
        background: 'rgba(108, 92, 231, 0.1)',
        glow: 'rgba(108, 92, 231, 0.3)'
    },

    // Current state
    currentEmotion: null,
    targetTheme: null,
    transitionTimeout: null,

    /**
     * Initialize themes
     */
    init() {
        // Check for user preference
        const saved = localStorage.getItem('emotionThemeEnabled');
        if (saved !== null) {
            this.config.enabled = saved === 'true';
        }

        // Apply default theme
        this.applyTheme(this.defaultTheme, false);
        console.log('Themes initialized, enabled:', this.config.enabled);
    },

    /**
     * Enable/disable emotion themes
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        localStorage.setItem('emotionThemeEnabled', enabled);

        if (!enabled) {
            this.applyTheme(this.defaultTheme, true);
            this.currentEmotion = null;
        }
    },

    /**
     * Toggle theme enabled state
     */
    toggle() {
        this.setEnabled(!this.config.enabled);
        return this.config.enabled;
    },

    /**
     * Update theme based on emotion
     */
    updateForEmotion(emotion, confidence = 1) {
        if (!this.config.enabled) return;
        if (!emotion || emotion === this.currentEmotion) return;

        const theme = this.emotionThemes[emotion] || this.defaultTheme;
        this.currentEmotion = emotion;
        
        // Apply with transition
        this.applyTheme(theme, true, confidence);
    },

    /**
     * Apply theme to CSS variables
     */
    applyTheme(theme, animate = true, intensity = 1) {
        const root = document.documentElement;
        const factor = this.config.intensity * intensity;

        // Set transition
        if (animate) {
            root.style.setProperty('--theme-transition', `${this.config.transitionDuration}ms`);
        } else {
            root.style.setProperty('--theme-transition', '0ms');
        }

        // Apply theme colors
        root.style.setProperty('--accent-primary', theme.accent);
        root.style.setProperty('--accent-secondary', theme.accentSecondary);
        root.style.setProperty('--emotion-bg', theme.background);
        root.style.setProperty('--emotion-glow', theme.glow);

        // Update video container glow
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.style.boxShadow = `0 0 30px ${theme.glow}`;
        }

        // Update emotion display glow
        const emotionDisplay = document.querySelector('.emotion-display');
        if (emotionDisplay) {
            emotionDisplay.style.borderColor = theme.accent;
        }
    },

    /**
     * Get current theme colors
     */
    getCurrentTheme() {
        if (this.currentEmotion && this.emotionThemes[this.currentEmotion]) {
            return this.emotionThemes[this.currentEmotion];
        }
        return this.defaultTheme;
    },

    /**
     * Reset to default theme
     */
    reset() {
        this.currentEmotion = null;
        this.applyTheme(this.defaultTheme, true);
    },

    /**
     * Update config
     */
    updateConfig(options) {
        Object.assign(this.config, options);
    }
};
