import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";

export default class RMG_Navigation {

  //  #region MINIMAP & NAVIGATION

// Minimap System with Fullscreen Toggle
    static minimapImageCache: HTMLCanvasElement | null = null;
    static minimapContainer: HTMLDivElement;
    static fullscreenContainer: HTMLDivElement;
    static minimapCanvas: HTMLCanvasElement;
    static fullscreenCanvas: HTMLCanvasElement;
    static minimapCtx: CanvasRenderingContext2D;
    static fullscreenCtx: CanvasRenderingContext2D;
    static isFullscreen = false;
    static fullscreenHeader: HTMLDivElement | null = null;
    static manualCopyContainer: HTMLDivElement | null = null; // New container for manual copy elements
    static hoverPositionDisplay: HTMLDivElement | null = null;
    static fullscreenImageOffsetX: number = 0; // Store offset X for the fullscreen image
    static fullscreenImageOffsetY: number = 0; // Store offset Y for the fullscreen image
    static fullscreenImageWidth: number = 0;  // Store width of the fullscreen image
    static fullscreenImageHeight: number = 0; // Store height of the fullscreen image

    // Drag functionality
    static isDragging = false;
    static startX: number = 0;
    static startY: number = 0;
    static offsetX: number = 0;
    static offsetY: number = 0;
    static lastMinimapRight: string = '20px'; // Store last right position
    static lastMinimapBottom: string = '20px'; // Store last bottom position
    static lastMinimapLeft: string = '20px';   // Store last left position
    static lastMinimapTop:  string = '20px';   // Store last top position

    // Configuration Parameters
    static minimapViewScale = 0.25; // Range: 0.1 (zoomed in) to 0.5 (zoomed out)
    static minimapHeightScale = 1.5; // Range: 1.0 (normal) to 2.0 (exaggerated)
    static minimapScaleAnimationDuration = 20; // Duration for scale animation in ms

    // Flags and IDs for cancelling loops & intervals
    static _updateLoopActive: boolean = true;
    static _rafId: number | null = null;
    static _prepareIntervalId: number | null = null;

    public static createMinimap(): void {
  // Reset any previous state
  this._updateLoopActive = true;
  this.isFullscreen = false;
  this._rafId = null;

  // Create containers
  this.minimapContainer = document.createElement('div');
  this.fullscreenContainer = document.createElement('div');

  // Determine initial position based on user setting
  let initialTop: string = 'auto';
  let initialLeft: string = 'auto';
  let initialRight: string = '20px';
  let initialBottom: string = '20px';
  switch (RuntimeMapGen.get().minimapPosition) {
    case 'top-left':
      initialTop = '20px';
      initialLeft = '20px';
      initialRight = 'auto';
      initialBottom = 'auto';
      break;
    case 'top-right':
      initialTop = '20px';
      initialLeft = 'auto';
      initialRight = '20px';
      initialBottom = 'auto';
      break;
    case 'bottom-left':
      initialTop = 'auto';
      initialLeft = '20px';
      initialRight = 'auto';
      initialBottom = '20px';
      break;
    case 'bottom-right':
    default:
      // already set
      break;
  }

  // Style minimap container
  Object.assign(this.minimapContainer.style, {
    position: 'fixed',
    top:    initialTop,
    left:   initialLeft,
    right:  initialRight,
    bottom: initialBottom,
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    boxShadow: '10px 10px 15px rgba(106, 86, 56, 0.3)',
    background: 'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%)',
    zIndex: '1000',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'grab',
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, border-radius 0.3s ease-in-out, top 0.3s ease, left 0.3s ease, right 0.3s ease, bottom 0.3s ease'
  });

  // Style fullscreen container
  Object.assign(this.fullscreenContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'transparent',
    zIndex: '10000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-in-out',
    backdropFilter: 'blur(10px)'
  });

  // Create and size canvases
  this.minimapCanvas = document.createElement('canvas');
  this.fullscreenCanvas = document.createElement('canvas');
  this.minimapCtx = this.minimapCanvas.getContext('2d')!;
  this.fullscreenCtx = this.fullscreenCanvas.getContext('2d')!;
  const baseSize = 360;
  this.minimapCanvas.width = baseSize;
  this.minimapCanvas.height = baseSize;
  Object.assign(this.minimapCanvas.style, { width: '100%', height: '100%', display: 'block' });
  Object.assign(this.fullscreenCanvas.style, { maxWidth: '70%', maxHeight: '70%' });

  // Assemble DOM
  this.minimapContainer.appendChild(this.minimapCanvas);
  this.fullscreenContainer.appendChild(this.fullscreenCanvas);
  document.body.appendChild(this.minimapContainer);
  document.body.appendChild(this.fullscreenContainer);

  // Hook up all named event handlers
  document.addEventListener('keydown', this._keydownHandler);
  this.minimapContainer.addEventListener('click', this.toggleFullscreen);
  this.minimapContainer.addEventListener('mouseenter', this._minimapEnterHandler);
  this.minimapContainer.addEventListener('mouseleave', this._minimapLeaveHandler);
  this.minimapContainer.addEventListener('mousedown', this.startDrag);
  document.addEventListener('mousemove', this.drag);
  document.addEventListener('mouseup', this.endDrag);
  window.addEventListener('resize', this.handleWindowResize);

  // Build the cache and launch the update loop
  this.prepareMinimapCache().then(() => {
    clearInterval(this._prepareIntervalId!);
    this.updateMinimapCanvasSize();
    this.updateFullscreenCanvasSize();
    this.startUpdateLoop();
  });
}

    static handleWindowResize = (): void => {
  if (!this.minimapContainer) return;
  const { innerWidth, innerHeight } = window;
  const rect = this.minimapContainer.getBoundingClientRect();
  const width  = rect.width;
  const height = rect.height;

  // Determine current left/top (fallback to pixel values if style is empty)
  let currentLeft = parseInt(this.minimapContainer.style.left  || `${rect.left}`, 10);
  let currentTop  = parseInt(this.minimapContainer.style.top   || `${rect.top}`,  10);

  // Clamp inside viewport
  currentLeft = Math.min(Math.max(currentLeft, 0), innerWidth  - width);
  currentTop  = Math.min(Math.max(currentTop,  0), innerHeight - height);

  this.minimapContainer.style.left = `${currentLeft}px`;
  this.minimapContainer.style.top  = `${currentTop}px`;

  this.lastMinimapLeft = this.minimapContainer.style.left;
  this.lastMinimapTop  = this.minimapContainer.style.top;
};

    static startDrag = (e: MouseEvent) => {
  this.isDragging = true;
  this.minimapContainer.style.cursor = 'grabbing';
  this.startX = e.clientX;
  this.startY = e.clientY;

  const rect = this.minimapContainer.getBoundingClientRect();
  this.offsetX = rect.left;
  this.offsetY = rect.top;

  this.lastMinimapLeft  = this.minimapContainer.style.left;
  this.lastMinimapTop   = this.minimapContainer.style.top;

  // Prevent click‐to‐fullscreen while dragging
  this.minimapContainer.removeEventListener('click', this.toggleFullscreen);
};

    static drag = (e: MouseEvent) => {
  if (!this.isDragging) return;

  const deltaX = e.clientX - this.startX;
  const deltaY = e.clientY - this.startY;

  const maxLeft = window.innerWidth  - this.minimapContainer.clientWidth;
  const maxTop  = window.innerHeight - this.minimapContainer.clientHeight;

  let newLeft = this.offsetX + deltaX;
  let newTop  = this.offsetY + deltaY;

  // Clamp inside viewport
  newLeft = Math.min(Math.max(newLeft, 0), maxLeft);
  newTop  = Math.min(Math.max(newTop,  0), maxTop);

  this.minimapContainer.style.left   = `${newLeft}px`;
  this.minimapContainer.style.top    = `${newTop}px`;
  this.minimapContainer.style.right  = 'auto';
  this.minimapContainer.style.bottom = 'auto';

  this.lastMinimapLeft = this.minimapContainer.style.left;
  this.lastMinimapTop  = this.minimapContainer.style.top;
};

    static endDrag = () => {
  if (!this.isDragging) return;
  this.isDragging = false;
  this.minimapContainer.style.cursor = 'grab';
  this.minimapContainer.addEventListener('click', this.toggleFullscreen);
};

    static changeMinimapScale(key: string) {
      const scaleStep = 0.05;
      const minScale = 0.1;
      const maxScale = 0.3; // Adjusted max scale to be more reasonable for this logic
      const targetScale = key === '+' ? Math.min(maxScale, this.minimapViewScale + scaleStep) : Math.max(minScale, this.minimapViewScale - scaleStep);

      const startTime = performance.now();
      const startScale = this.minimapViewScale;
      const animateScale = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(1, elapsedTime / this.minimapScaleAnimationDuration);
        this.minimapViewScale = startScale + (targetScale - startScale) * progress;
        this.updateMinimapCanvasSize();
        if (progress < 1) {
          requestAnimationFrame(animateScale);
        }
      };
      requestAnimationFrame(animateScale);
    }

    static async prepareMinimapCache(): Promise<void> {
  // Begin polling for the heightmap image
  this._prepareIntervalId = window.setInterval(() => {
    if (RuntimeMapGen.get().heightmapTexture?.image) {
      clearInterval(this._prepareIntervalId!);
    }
  }, 100);

  // Wait for the image element to be ready
  const texture = RuntimeMapGen.get().heightmapTexture!;
  const img = texture.image as HTMLImageElement;
  await new Promise<void>(resolve => {
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
    }
  });

  // Compute downscale factor to cap dimensions at 1024
  const MAX_DIM = 1024;
  const scale = Math.min(1, MAX_DIM / img.width, MAX_DIM / img.height);
  const sw = Math.floor(img.width * scale);
  const sh = Math.floor(img.height * scale);

  // Create offscreen canvas for caching
  this.minimapImageCache = document.createElement('canvas');
  this.minimapImageCache.width = sw;
  this.minimapImageCache.height = sh;
  const ctx = this.minimapImageCache.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, sw, sh);

  // Extract pixel data
  const imageData = ctx.getImageData(0, 0, sw, sh);
  const data = imageData.data;
  const totalPixels = sw * sh;
  const heights = new Float32Array(totalPixels);
  const tm = RuntimeMapGen.get();
  const terrainMax = tm.terrainMaxHeight;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    heights[p] = (data[i] / 255) * terrainMax * this.minimapHeightScale;
  }

  // Precompute thresholds
  const oceanH      = tm.oceanLevel    * terrainMax;
  const beachH      = oceanH + tm.beachRange * terrainMax;
  const grassH      = tm.grassMin     * terrainMax;
  const lowMtnH     = grassH + 0.2    * terrainMax;
  const highMtnH    = lowMtnH + 0.3   * terrainMax;
  const deepWater   = oceanH * 0.7;
  const midWater    = oceanH * 0.9;
  const slopeThresh = tm.STONE_SLOPE;

  // Color each pixel based on height & slope
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const p = y * sw + x;
      const h = heights[p];
      // compute slope
      const getH = (xx: number, yy: number) => heights[Math.min(Math.max(yy,0),sh-1)*sw + Math.min(Math.max(xx,0),sw-1)];
      const dx = (getH(x+1,y) - getH(x-1,y)) / 2;
      const dy = (getH(x,y+1) - getH(x,y-1)) / 2;
      const slope = Math.hypot(dx, dy);

      let r: number, g: number, b: number;
      if (h < deepWater) {
        const f = h / deepWater;
        r = 30 + 30*f; g = 50 + 50*f; b = 100 + 100*f;
      } else if (h < midWater) {
        const f = (h - deepWater) / (midWater - deepWater);
        r = 40 + 20*f; g = 70 + 30*f; b = 160 + 40*f;
      } else if (h < oceanH) {
        const f = (h - midWater) / (oceanH - midWater);
        r = 90 + 30*f; g = 120 + 40*f; b = 180 + 30*f;
      } else if (h < beachH) {
        [r, g, b] = [245, 235, 190];
      } else if (slope > slopeThresh) {
        if (h >= highMtnH) [r, g, b] = [160,160,160];
        else if (h >= lowMtnH) [r, g, b] = [130,130,130];
        else [r, g, b] = [110,110,110];
      } else if (h >= grassH) {
        if (h < grassH + 0.15*terrainMax) [r, g, b] = [90,160,70];
        else if (h < grassH + 0.30*terrainMax) [r, g, b] = [60,130,50];
        else [r, g, b] = [30,100,40];
      } else {
        [r, g, b] = [150,130,100];
      }

      const idx = p * 4;
      data[idx]     = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  // Put colored image back into cache
  ctx.putImageData(imageData, 0, 0);
}

    static toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
      if (this.isFullscreen) {
        // Store current position before going fullscreen
        this.lastMinimapRight = this.minimapContainer.style.right;
        this.lastMinimapBottom = this.minimapContainer.style.bottom;

        // Animate from minimap to fullscreen
        this.minimapContainer.style.pointerEvents = 'none'; // Disable interaction during transition
        this.minimapContainer.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, border-radius 0.3s ease-in-out, bottom 0.3s ease-in-out, right 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, margin 0.3s ease-in-out'; // Ensure transition is set

        // Initial state for animation
        requestAnimationFrame(() => {
          this.minimapContainer.style.transform = 'scale(0.2)'; // Scale down more for a better effect
          this.minimapContainer.style.opacity = '0';
          this.minimapContainer.style.borderRadius = '0%';
          this.minimapContainer.style.bottom = '50%';
          this.minimapContainer.style.right = '50%';
          this.minimapContainer.style.width = '50px';
          this.minimapContainer.style.height = '50px';
          this.minimapContainer.style.marginLeft = '-25px';
          this.minimapContainer.style.marginBottom = '-25px';
        });

        setTimeout(() => {
          this.minimapContainer.style.display = 'none'; // Hide after the scale down animation
          this.fullscreenContainer.style.opacity = '1';
          this.fullscreenContainer.style.pointerEvents = 'auto'; // Enable interaction
          this.updateFullscreenCanvasSize();

          // Create container for manual copy elements
          this.manualCopyContainer = document.createElement('div');
          Object.assign(this.manualCopyContainer.style, {
            marginTop: '20px', // Adjust margin as needed
            textAlign: 'center',
            color: '#eee',
          });
          this.fullscreenContainer.appendChild(this.manualCopyContainer);

          // Create label
          // const locationLabel = document.createElement('p');
          // locationLabel.innerText = 'Location:';
          // Object.assign(locationLabel.style, {
          //   fontSize: '14px',
          //   marginBottom: '5px',
          // });
          // this.manualCopyContainer.appendChild(locationLabel);

          // Create input field for position
          // const positionInput = document.createElement('input');
          // positionInput.type = 'text';
          // positionInput.readOnly = true;
          // Object.assign(positionInput.style, {
          //   padding: '8px',
          //   borderRadius: '4px',
          //   border: '1px solid #555',
          //   backgroundColor: '#333',
          //   color: '#eee',
          //   fontSize: '16px',
          //   fontFamily: 'monospace',
          //   textAlign: 'center',
          //   width: '200px',
          //   boxSizing: 'border-box',
          // });
          // this.manualCopyContainer.appendChild(positionInput);
          // this.playerPositionDisplay = positionInput; // Assign input to playerPositionDisplay for updating

          // Conditionally add copy button if clipboard API is available
          // if (navigator.clipboard) {
          //   const copyButton = document.createElement('button');
          //   copyButton.innerText = 'Copy to Clipboard';
          //   Object.assign(copyButton.style, {
          //     padding: '8px 12px',
          //     borderRadius: '4px',
          //     border: 'none',
          //     backgroundColor: '#5cb85c',
          //     color: 'white',
          //     fontSize: '14px',
          //     cursor: 'pointer',
          //     marginLeft: '10px',
          //     transition: 'background-color 0.2s ease-in-out',
          //   });
          //   copyButton.addEventListener('mouseenter', () => copyButton.style.backgroundColor = '#4cae4c');
          //   copyButton.addEventListener('mouseleave', () => copyButton.style.backgroundColor = '#5cb85c');
          //   copyButton.addEventListener('click', this.copyPlayerPosition);
          //   this.manualCopyContainer.appendChild(copyButton);
          // }

          // Add hover effect for world position
          this.fullscreenCanvas.addEventListener('mousemove', this.handleFullscreenMouseMove);
          this.fullscreenCanvas.addEventListener('mouseout', this.removeHoverPositionDisplay);

        }, 300); // Match the transition duration
      } else {
        // Animate from fullscreen to minimap
        this.fullscreenContainer.style.opacity = '0';
        this.fullscreenContainer.style.pointerEvents = 'none'; // Disable interaction during transition

        this.minimapContainer.style.display = 'flex'; // Show immediately
        this.minimapContainer.style.pointerEvents = 'none'; // Disable interaction during transition

        // Reset minimap styles with transition
        this.minimapContainer.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, border-radius 0.3s ease-in-out, bottom 0.3s ease-in-out, right 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, margin 0.3s ease-in-out';

        requestAnimationFrame(() => {
          this.minimapContainer.style.transform = 'scale(1)';
          this.minimapContainer.style.opacity = '1';
          this.minimapContainer.style.borderRadius = '50%';
          this.minimapContainer.style.bottom = this.lastMinimapBottom; // Apply stored bottom position
          this.minimapContainer.style.right = this.lastMinimapRight;   // Apply stored right position
          this.minimapContainer.style.width = '280px'; // Revert to original width
          this.minimapContainer.style.height = '280px'; // Revert to original height
          this.minimapContainer.style.marginLeft = '';
          this.minimapContainer.style.marginBottom = '';
        });

        setTimeout(() => {
          this.minimapContainer.style.pointerEvents = 'auto'; // Re-enable interaction after transition
          // Remove the old canvas
          if (this.minimapContainer.contains(this.minimapCanvas)) {
            this.minimapContainer.removeChild(this.minimapCanvas);
          }

          // Create a new canvas
          this.minimapCanvas = document.createElement('canvas');
          this.minimapCtx = this.minimapCanvas.getContext('2d')!;

          // Set the size of the new canvas
          const container = this.minimapContainer;
          const size = Math.min(container.clientWidth, container.clientHeight);
          this.minimapCanvas.width = size;
          this.minimapCanvas.height = size;

          Object.assign(this.minimapCanvas.style, { width: '100%', height: '100%', display: 'block' });

          // Append the new canvas
          this.minimapContainer.appendChild(this.minimapCanvas);

          this.drawTerrain(); // Draw on the new canvas

          // Remove the manual copy container from fullscreen
          if (this.manualCopyContainer && this.fullscreenContainer.contains(this.manualCopyContainer)) {
            this.fullscreenContainer.removeChild(this.manualCopyContainer);
            this.manualCopyContainer = null;
            // this.playerPositionDisplay = null; // Reset the reference - No longer needed
          }
          // Remove hover position display
          if (this.hoverPositionDisplay && document.body.contains(this.hoverPositionDisplay)) {
            document.body.removeChild(this.hoverPositionDisplay);
            this.hoverPositionDisplay = null;
          }
          this.fullscreenCanvas.removeEventListener('mousemove', this.handleFullscreenMouseMove);
          this.fullscreenCanvas.removeEventListener('mouseout', this.removeHoverPositionDisplay);

        }, 300);
      }
    }

    static formatNumberWithSeparators(number: number): string {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static handleFullscreenMouseMove = (event: MouseEvent) => {
      const canvas = this.fullscreenCanvas;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imageHeight = this.minimapImageCache?.height || 1;
      const imageWidth = this.minimapImageCache?.width || 1;
      const aspect = imageWidth / imageHeight;
      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasWidth / canvasHeight > aspect) {
        drawWidth = canvasHeight * aspect;
        offsetX = (canvasWidth - drawWidth) / 2;
      } else {
        drawHeight = canvasWidth / aspect;
        offsetY = (canvasHeight - drawHeight) / 2;
      }

      this.fullscreenImageOffsetX = offsetX;
      this.fullscreenImageOffsetY = offsetY;
      this.fullscreenImageWidth = drawWidth;
      this.fullscreenImageHeight = drawHeight;

      // Check if mouse is within the drawn image bounds
      if (mouseX >= offsetX && mouseX <= offsetX + drawWidth && mouseY >= offsetY && mouseY <= offsetY + drawHeight) {
        const normalizedX = (mouseX - offsetX) / drawWidth;
        const normalizedZ = (mouseY - offsetY) / drawHeight;

        const worldWidth = RuntimeMapGen.get().heightmapSize.width * RuntimeMapGen.get().Scale.x;
        const worldHeight = RuntimeMapGen.get().heightmapSize.height * RuntimeMapGen.get().Scale.z;

        // Adjusted worldX and worldZ calculation
        const worldX = RuntimeMapGen.get().Offset.x + normalizedX * worldWidth;
        const worldZ = RuntimeMapGen.get().Offset.z + normalizedZ * worldHeight;

        const formattedX = this.formatNumberWithSeparators(Math.round(worldX));
        const formattedZ = this.formatNumberWithSeparators(Math.round(worldZ));
        const positionText = `X: ${formattedX}, Z: ${formattedZ}`;

        if (!this.hoverPositionDisplay) {
          this.hoverPositionDisplay = document.createElement('div');
          Object.assign(this.hoverPositionDisplay.style, {
            position: 'fixed',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: '10001',
            pointerEvents: 'none',
          });
          document.body.appendChild(this.hoverPositionDisplay);
        }

        this.hoverPositionDisplay.innerText = positionText;
        this.hoverPositionDisplay.style.left = `${event.clientX + 10}px`;
        this.hoverPositionDisplay.style.top = `${event.clientY + 10}px`;
        this.hoverPositionDisplay.style.display = 'block';
      } else if (this.hoverPositionDisplay) {
        this.hoverPositionDisplay.style.display = 'none';
      }
    }

    static removeHoverPositionDisplay = () => {
      if (this.hoverPositionDisplay && document.body.contains(this.hoverPositionDisplay)) {
        this.hoverPositionDisplay.style.display = 'none';
      }
    }

    static updateMinimapCanvasSize() {
      const container = this.minimapContainer;
      const size = Math.min(container.clientWidth, container.clientHeight);
      this.minimapCanvas.width = size;
      this.minimapCanvas.height = size;
      this.drawTerrain();
    }

    static updateFullscreenCanvasSize() {
      const container = this.fullscreenContainer;
      const headerHeight = this.fullscreenHeader?.offsetHeight || 0;
      this.fullscreenCanvas.width = container.clientWidth;
      this.fullscreenCanvas.height = container.clientHeight - headerHeight;
      this.drawTerrain();
    }

    static drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, size: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw arrow body
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.3); // Tail left
    ctx.lineTo(0, size * 0.7);           // Tip
    ctx.lineTo(size * 0.5, -size * 0.3);  // Tail right
    ctx.lineTo(0, -size * 0.7);          // Back
    ctx.closePath();
    ctx.fillStyle = '#00ff00';
    ctx.fill();

    // Add a white outline for better visibility
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.stroke();

    ctx.restore();
  }

    static drawTerrain() {
    if (!this.minimapImageCache || !RuntimeMapGen.get().activeCameras.length) return;
    const ctx = this.isFullscreen ? this.fullscreenCtx : this.minimapCtx;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    const camera = RuntimeMapGen.get().activeCameras[0];
    const pos = new THREE.Vector3();
    camera.getWorldPosition(pos);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    if (this.isFullscreen) {
      const aspect = this.minimapImageCache.width / this.minimapImageCache.height;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      let drawWidth = canvasWidth;
      let drawHeight = canvasHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasWidth / canvasHeight > aspect) {
        drawWidth = canvasHeight * aspect;
        offsetX = (canvasWidth - drawWidth) / 2;
      } else {
        drawHeight = canvasWidth / aspect;
        offsetY = (canvasHeight - drawHeight) / 2;
      }

      this.fullscreenImageOffsetX = offsetX;
      this.fullscreenImageOffsetY = offsetY;
      this.fullscreenImageWidth = drawWidth;
      this.fullscreenImageHeight = drawHeight;

      ctx.drawImage(this.minimapImageCache, 0, 0, this.minimapImageCache.width, this.minimapImageCache.height, offsetX, offsetY, drawWidth, drawHeight);
      const terrainWidth = RuntimeMapGen.get().heightmapSize.width * RuntimeMapGen.get().Scale.x;
      const terrainHeight = RuntimeMapGen.get().heightmapSize.height * RuntimeMapGen.get().Scale.z;
      const playerXOnMap = offsetX + ((pos.x - RuntimeMapGen.get().Offset.x) / terrainWidth + 0.5) * drawWidth;
      const playerYOnMap = offsetY + ((pos.z - RuntimeMapGen.get().Offset.z) / terrainHeight + 0.5) * drawHeight;
      const angle = Math.atan2(dir.x, -dir.z) + Math.PI; // Added Math.PI to flip the arrow
      this.drawArrow(ctx, playerXOnMap, playerYOnMap, angle, 20); // Use the modified drawArrow

      // Update player position display - REMOVED
      // if (this.playerPositionDisplay) {
      //   const formattedX = this.formatNumberWithSeparators(Math.round(pos.x));
      //   const formattedZ = this.formatNumberWithSeparators(Math.round(pos.z));
      //   this.playerPositionDisplay.value = `${formattedX}, ${formattedZ}`;
      // }
    } else {
      const terrainWidth = RuntimeMapGen.get().heightmapSize.width * RuntimeMapGen.get().Scale.x;
      const terrainHeight = RuntimeMapGen.get().heightmapSize.height * RuntimeMapGen.get().Scale.z;
      const cacheWidth = this.minimapImageCache.width;
      const cacheHeight = this.minimapImageCache.height;
      const viewSide = Math.max(cacheWidth, cacheHeight) * this.minimapViewScale;
      const playerX = ((pos.x - RuntimeMapGen.get().Offset.x) / terrainWidth + 0.5) * cacheWidth;
      const playerY = ((pos.z - RuntimeMapGen.get().Offset.z) / terrainHeight + 0.5) * cacheHeight;

      let halfSide = viewSide / 2;
      let srcX = playerX - halfSide;
      let srcY = playerY - halfSide;

      // Define srcWidth and srcHeight here to ensure they are in scope
      const srcWidth = viewSide;
      const srcHeight = viewSide;

      ctx.save();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.max(0, canvas.width / 2);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(
        this.minimapImageCache,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Add light inner shadow
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 1000;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = 'transparent'; // Fill with transparent to only show shadow
      ctx.fill();

      // Create radial gradient for transparent fade out effect
      const innerRadius = radius * 0.6;
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)'); // Start with transparent
      gradient.addColorStop(0.8, 'rgba(0,0,0,0)'); // Still mostly transparent
      gradient.addColorStop(1, 'rgba(51,51,51,0.8)');   // Fade to a semi-transparent black at the edge
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.restore();

      const angle = Math.atan2(dir.x, -dir.z) + Math.PI;
      this.drawArrow(this.minimapCtx, centerX, centerY, angle, 20);
    }
  }

    static _keydownHandler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') this.toggleFullscreen();
      if (e.key === '+' || e.key === '-') this.changeMinimapScale(e.key);
      if (e.key === '=' || e.key === '+') this.changeMinimapScale('+');
    };

    static _minimapEnterHandler = () => {
      if (!this.isDragging) {
        this.minimapContainer.style.transform = 'scale(1.05)';
        this.minimapContainer.style.boxShadow = '0 0 35px rgba(106, 86, 56, 0.6)';
      }
    };

    static _minimapLeaveHandler = () => {
      if (!this.isDragging) {
        this.minimapContainer.style.transform = 'scale(1)';
        this.minimapContainer.style.boxShadow = '0 0 25px rgba(106, 86, 56, 0.4)';
      }
    };

    public static disposeMapAndNavigation(): void {
    // Stop update loop
    this._updateLoopActive = false;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    if (this._prepareIntervalId !== null) clearInterval(this._prepareIntervalId);

    // Remove document listeners
    document.removeEventListener('keydown', this._keydownHandler);
    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.endDrag);
    window.removeEventListener('resize', this.handleWindowResize);

    // Cleanup minimap container
    if (this.minimapContainer) {
      this.minimapContainer.removeEventListener('mousedown', this.startDrag);
      this.minimapContainer.removeEventListener('click', this.toggleFullscreen);
      this.minimapContainer.removeEventListener('mouseenter', this._minimapEnterHandler);
      this.minimapContainer.removeEventListener('mouseleave', this._minimapLeaveHandler);
      if (this.minimapContainer.parentNode) this.minimapContainer.parentNode.removeChild(this.minimapContainer);
      (this.minimapContainer as any) = null;
    }

    // Cleanup fullscreen container
    if (this.fullscreenContainer) {
      this.fullscreenCanvas.removeEventListener('mousemove', this.handleFullscreenMouseMove);
      this.fullscreenCanvas.removeEventListener('mouseout', this.removeHoverPositionDisplay);
      if (this.manualCopyContainer && this.fullscreenContainer.contains(this.manualCopyContainer)) {
        this.fullscreenContainer.removeChild(this.manualCopyContainer);
        this.manualCopyContainer = null;
      }
      if (this.fullscreenContainer.parentNode) this.fullscreenContainer.parentNode.removeChild(this.fullscreenContainer);
      (this.fullscreenContainer as any) = null;
    }

    // Hover display
    if (this.hoverPositionDisplay && document.body.contains(this.hoverPositionDisplay)) {
      document.body.removeChild(this.hoverPositionDisplay);
      this.hoverPositionDisplay = null;
    }

    // Clear canvases and contexts
    (this.minimapCanvas as any) = null;
    (this.fullscreenCanvas as any) = null;
    (this.minimapCtx as any) = null;
    (this.fullscreenCtx as any) = null;

    // Clear cache
    this.minimapImageCache = null;
  }

    static startUpdateLoop() {
      if (!this._updateLoopActive) return;
      this._rafId = requestAnimationFrame(() => {
        this.drawTerrain();
        this.startUpdateLoop();
      });
    }

    public static async refreshMapCanvas(): Promise<void> {
      if (this.minimapImageCache) {
        this.minimapImageCache.width = 0;
        this.minimapImageCache.height = 0;
        this.minimapImageCache = null;
      }

      await this.prepareMinimapCache();
      this.updateMinimapCanvasSize();
      this.updateFullscreenCanvasSize();
      this.drawTerrain();
    }








}
