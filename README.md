# 🎄 Golden Core

**Golden Core** is an experimental, reactive 3D experience that bridges physical gestures with digital geometry. It acts as a particle engine where users control the entropy of 10,000 particles using real-time computer vision.

Built with **React Three Fiber**, **GLSL Shaders**, and **Google MediaPipe**.



https://github.com/user-attachments/assets/afcfa503-4883-4568-bdc8-261a650dae39



---

## 🚀 The Concept

The application explores the balance between **Order** and **Chaos**:

*   **Phase I (Link):** The system connects to your webcam and maps your hand's physical depth to the 3D camera rig.
*   **Phase II (Entropy):** Opening your hand releases the magnetic hold, scattering particles into a chaotic, floating sphere (The Void).
*   **Phase III (Order):** Closing your fist ignites the core, pulling particles into a mathematically perfect golden spiral (The Tree).

## 🛠️ Technical Stack

*   **Core:** [React 19](https://react.dev/), TypeScript, Vite
*   **3D Engine:** [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
*   **Shaders:** Custom GLSL (Vertex & Fragment)
*   **Computer Vision:** [Google MediaPipe](https://developers.google.com/mediapipe) (WASM)
*   **Styling:** Tailwind CSS

## ✨ Key Features

### 1. GPU-Accelerated Physics
Instead of calculating particle positions on the CPU (which is slow for 10k points), the physics morphing is handled entirely in a custom **Vertex Shader**.
-   **Cubic Bezier Interpolation:** Smooth, "viscous" transitions between the spiral and sphere shapes.
-   **Direct Attribute Manipulation:** Particles flow organically based on a uniform float driven by React state.

### 2. Procedural "Cinematic" Shaders
No image textures are used in this project.
-   **StarMaterial:** A custom fragment shader using **Signed Distance Functions (SDFs)** to create a camera-facing lens flare. It simulates an infinite-resolution light source with additive blending, "breathing" animations, and soft falloff.

### 3. Real-time Computer Vision
The app runs a lightweight AI model (MediaPipe Hand Landmarker) directly in the browser via WebAssembly.
-   **Parallax Rig:** Hand X/Y coordinates control the camera angle.
-   **Depth Mapping:** Hand Z-depth controls the camera zoom (Push/Pull mechanic).
-   **Gesture Recognition:** Detects "Open Palm" vs "Closed Fist" to trigger physics state changes.

## 📦 Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Allow Camera Access**
    The application requires webcam access to track hand gestures. All processing is done locally on your device; no video data is sent to the cloud.

## 📐 The Mathematics

The "Tree" shape is generated using a modified Golden Spiral algorithm:

```typescript
// Simplified logic from src/utils/math.ts
const angle = i * GOLDEN_ANGLE;
const radius = Math.sqrt(i) * spread;
const x = radius * Math.cos(angle);
const z = radius * Math.sin(angle);
const y = i * heightFactor;
```

This ensures a mathematically aesthetic distribution of points that mimics phyllotaxis patterns found in nature (pinecones, sunflowers).

## 📄 License

MIT License. Feel free to fork and experiment!
