# Facial Emotion Tracker

A real-time facial emotion detection web application that uses your webcam to track emotions using machine learning. Built with face-api.js (TensorFlow.js) and designed to run entirely in the browser.

## Features

- Real-time face detection with 68 facial landmark points
- Emotion recognition for 7 expressions:
  - Neutral
  - Happy
  - Sad
  - Angry
  - Fearful
  - Disgusted
  - Surprised
- Visual overlay showing facial landmarks
- Confidence percentages for all detected emotions
- Works entirely client-side (no server required)
- Privacy-focused: video never leaves your device

## Demo

The application is hosted on GitHub Pages: `https://[your-username].github.io/emotion-track`

## Quick Start

### Install dependencies

```bash
npm install
```

### Option 1: Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/[your-username]/emotion-track.git
   cd emotion-track
   ```

2. Start a local server (required for camera access):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx serve
   
   # Or using PHP
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

4. Click "Start Camera" and allow camera access when prompted

### Option 2: GitHub Pages Deployment

1. Fork or push this repository to GitHub

2. Go to repository Settings > Pages

3. Under "Source", select "Deploy from a branch"

4. Select `main` branch and `/ (root)` folder

5. Click Save

6. Your site will be available at `https://[username].github.io/emotion-track`

> 💡 A GitHub Actions workflow (`.github/workflows/deploy.yml`) runs `npm run dist` and publishes the generated `dist/` folder to the `gh-pages` branch automatically on every push to `main`.

## Project Structure

```
emotion-track/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Dark theme styling
├── js/
│   ├── main.js         # App initialization and camera handling
│   ├── faceDetection.js # face-api.js integration
│   └── ui.js           # UI updates and canvas rendering
├── models/             # (Optional) Local model files
└── README.md           # This file
```

## Technology Stack

- **face-api.js** ([@vladmandic/face-api](https://github.com/vladmandic/face-api)) - Face detection and emotion recognition
- **TensorFlow.js** - Underlying ML framework
- **HTML5 Canvas** - Facial landmark rendering
- **WebRTC getUserMedia** - Camera access
- **Vanilla JavaScript** - No framework dependencies

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 53+     | Supported |
| Firefox | 36+     | Supported |
| Safari  | 11+     | Supported |
| Edge    | 79+     | Supported |

**Requirements:**
- HTTPS connection (required for camera access, GitHub Pages provides this)
- WebGL support (for TensorFlow.js acceleration)

## Build & Obfuscation

The project ships minified and obfuscated JavaScript for deployment. Run:

```bash
npm run dist
```

This command:

1. Clears `dist/`
2. Copies `index.html`, `css/`, and `models/` into `dist/`
3. Obfuscates every script in `js/` and exports them to `dist/js/`

Use `dist/` as the published folder when serving or deploying manually.

## Configuration

### Using Local Models (Offline Support)

By default, models are loaded from CDN. To use local models:

1. Download models from [vladmandic/face-api models](https://github.com/vladmandic/face-api/tree/master/model)

2. Place these files in the `models/` directory:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1`

3. Update `js/faceDetection.js`:
   ```javascript
   config: {
       modelPath: './models',  // Change from CDN URL
       // ...
   }
   ```

### Performance Tuning

In `js/faceDetection.js`, you can adjust:

```javascript
config: {
    inputSize: 320,       // Lower = faster, less accurate (128, 160, 224, 320, 416, 512)
    minConfidence: 0.5,   // Minimum face detection confidence (0-1)
}
```

## Troubleshooting

### Camera not working

1. Ensure you're using HTTPS (or localhost)
2. Check browser permissions for camera access
3. Try a different browser
4. Ensure no other application is using the camera

### Low FPS / Slow Performance

1. Reduce `inputSize` in configuration
2. Close other browser tabs
3. Ensure hardware acceleration is enabled in browser settings
4. Use a more powerful device

### Models not loading

1. Check browser console for errors
2. Ensure stable internet connection (for CDN models)
3. Try clearing browser cache
4. Check if ad blockers are interfering

## Privacy

This application:
- Processes all video locally in your browser
- Never sends video or images to any server
- Does not store any data
- Does not use cookies or tracking

## License

MIT License - Feel free to use, modify, and distribute.

## Credits

- [face-api.js](https://github.com/vladmandic/face-api) by Vladimir Mandic (fork of justadudewhohacks/face-api.js)
- [TensorFlow.js](https://www.tensorflow.org/js) by Google

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
