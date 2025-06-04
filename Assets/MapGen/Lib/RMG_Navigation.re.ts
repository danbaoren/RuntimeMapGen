import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";

interface BiomeDefinition {
    displayName: string;
    foliageIndexes: number[];
    textures: string[];
    audio: {
        event: string[];
        loop: string[];
        soundtrack: string[];
    };
}

export default class RMG_Navigation {

  //  #region MINIMAP

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

        static fullscreenViewScale = 1.0;
    static fullscreenMinScale = 0.5;
    static fullscreenMaxScale = 3.0;
    static fullscreenPanX = 0;
    static fullscreenPanY = 0;
    static isPanningFullscreen = false;
    static fsPanStartX = 0;
    static fsPanStartY = 0;


    private static coordsDisplay: HTMLDivElement | null = null;



// #region Main rendering

static drawTerrain(): void {
      if (!this.minimapImageCache || !RuntimeMapGen.get().activeCameras.length) return;

      const ctx = this.isFullscreen ? this.fullscreenCtx : this.minimapCtx;
      const canvas = ctx.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;

      const camera = RuntimeMapGen.get().activeCameras[0];
      const pos = new THREE.Vector3();
      camera.getWorldPosition(pos);

      // Add the call to updateCurrentRegion after getting the camera position
      this.updateCurrentRegion(pos);

      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);

      // Get map data including potential player arrow texture and size
      const tm = RuntimeMapGen.get();
      const playerArrow = tm.playerArrow; // Assumes playerArrow is an Image, HTMLCanvasElement, or similar
      const arrowSize = tm.arrowSize ?? 20; // Assumes arrowSize is a number, fallback to 20 if not set

      // Waypoint icon and font scaling
      // waypointBaseIconSize is used for the fallback diamond size
      const waypointBaseIconSize = this.waypointIconSize ?? 10;

      // Adjust emoji font size relative to the base icon size
      const fullscreenEmojiFontSize = Math.max(12, waypointBaseIconSize * 2); // Fullscreen emojis are larger
      const minimapEmojiFontSize = Math.max(8, waypointBaseIconSize * 1.5); // Minimap emojis are smaller

      // Font size for labels
      const minimapFontSize = this.waypointFontSize.replace(/\d+/, size =>
        Math.max(1, Math.floor(parseInt(size) * 0.8)).toString()
      );

      // Shadow properties for waypoints
      const shadowColor = 'rgba(0, 0, 0, 0.8)'; // Dark semi-transparent shadow
      const shadowBlur = 4; // Adjust blur for desired effect
      const shadowOffsetX = 2; // Horizontal shadow offset
      const shadowOffsetY = 2; // Vertical shadow offset


      if (this.isFullscreen) {
        const img = this.minimapImageCache!;
        const imgAspect = img.width / img.height;
        const canvasW = canvas.width;
        const canvasH = canvas.height;

        // Calculate initial dimensions without zoom
        let drawW: number, drawH: number, initialOffsetX = 0, initialOffsetY = 0;
        if (canvasW / canvasH > imgAspect) {
          drawH = canvasH;
          drawW = canvasH * imgAspect;
          initialOffsetX = (canvasW - drawW) / 2;
        } else {
          drawW = canvasW;
          drawH = canvasW / imgAspect;
          initialOffsetY = (canvasH - drawH) / 2;
        }

        // Apply zoom scaling
        drawW *= this.fullscreenViewScale;
        drawH *= this.fullscreenViewScale;

        // *** Free pan: no clamping to canvas borders ***
        const offsetX = initialOffsetX + this.fullscreenPanOffsetX;
        const offsetY = initialOffsetY + this.fullscreenPanOffsetY;

        // Store current draw parameters for hover calculations
        this.currentDrawParams = {
          width: drawW,
          height: drawH,
          offsetX: offsetX,
          offsetY: offsetY,
          imgWidth: img.width,
          imgHeight: img.height
        };

        // Draw map image
        ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, drawW, drawH);

        // Terrain dimensions
        const terrainW = tm.heightmapSize.width * tm.Scale.x;
        const terrainH = tm.heightmapSize.height * tm.Scale.z;

        // Player arrow position and angle
        const px = offsetX + ((pos.x - tm.Offset.x) / terrainW + 0.5) * drawW;
        const py = offsetY + ((pos.z - tm.Offset.z) / terrainH + 0.5) * drawH;
        const angle = Math.atan2(dir.x, -dir.z) + Math.PI;

        // Use texture arrow if available, fallback to CSS arrow, both using `arrowSize`
        if (playerArrow) {
            this.drawTextureArrow(ctx, px, py, angle, playerArrow, arrowSize); // Assuming drawTextureArrow exists
        } else {
            this.drawArrow(ctx, px, py, angle, arrowSize); // Assuming drawArrow exists
        }

        // Waypoints on fullscreen
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top'; // Keep text baseline consistent

        for (const wp of this.waypoints) {
          const wx = offsetX + wp.xNorm * drawW;
          const wy = offsetY + wp.yNorm * drawH;

          // Apply shadow for the waypoint icon/emoji and label
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = shadowBlur;
          ctx.shadowOffsetX = shadowOffsetX;
          ctx.shadowOffsetY = shadowOffsetY;


          // Check if an emoji icon is defined
          if (wp.icon && wp.icon.trim() !== '') {
              // Draw the emoji
              ctx.font = `${fullscreenEmojiFontSize}px sans-serif`; // Use specific emoji font size
              ctx.textBaseline = 'middle'; // Adjust baseline for emoji
              ctx.fillText(wp.icon.trim(), wx, wy); // Draw emoji centered on the point
              ctx.textBaseline = 'top'; // Reset baseline for label

              // Draw the label below the emoji
              ctx.font = this.waypointFontSize; // Use standard waypoint font size for label
              ctx.fillStyle = '#fff'; // Label color
              ctx.fillText(wp.label, wx, wy + fullscreenEmojiFontSize / 2 + 4); // Position label below emoji
          } else {
              // Draw the default diamond icon if no emoji is present
              const size = waypointBaseIconSize;
              ctx.beginPath();
              ctx.moveTo(wx, wy - size);
              ctx.lineTo(wx + size, wy);
              ctx.lineTo(wx, wy + size);
              ctx.lineTo(wx - size, wy);
              ctx.closePath();
              ctx.fillStyle = wp.color; // Use waypoint color for the diamond
              ctx.fill();

              // Draw the label below the diamond
              ctx.font = this.waypointFontSize; // Use standard waypoint font size for label
              ctx.fillStyle = '#fff'; // Label color
              ctx.fillText(wp.label, wx, wy + size + 4); // Position label below diamond
          }

          // Reset shadow properties after drawing each waypoint
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

      } else {
        // Minimap view (circular)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY);
        const letterRadius = radius * 0.85;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        ctx.translate(centerX, centerY);
        const mapRotationAngle = Math.atan2(dir.x, -dir.z);
        ctx.rotate(-mapRotationAngle);

        const cache = this.minimapImageCache!;
        const terrainW = tm.heightmapSize.width * tm.Scale.x;
        const terrainH = tm.heightmapSize.height * tm.Scale.z;
        const cacheW = cache.width;
        const cacheH = cache.height;
        const viewSide = Math.max(cacheW, cacheH) * this.minimapViewScale;

        const playerX_cache = ((pos.x - tm.Offset.x) / terrainW + 0.5) * cacheW;
        const playerY_cache = ((pos.z - tm.Offset.z) / terrainH + 0.5) * cacheH;
        const srcX = playerX_cache - viewSide / 2;
        const srcY = playerY_cache - viewSide / 2;

        ctx.drawImage(
          cache,
          srcX, srcY, viewSide, viewSide,
          -centerX, -centerY,
          canvas.width, canvas.height
        );

        // Draw waypoints on minimap
        for (const wp of this.waypoints) {
          const wpX_cache = wp.xNorm * cacheW;
          const wpY_cache = wp.yNorm * cacheH;
          const relX = (wpX_cache - playerX_cache) * (canvas.width / viewSide);
          const relY = (wpY_cache - playerY_cache) * (canvas.width / viewSide);
          const dist = Math.hypot(relX, relY);
          const ang = Math.atan2(relY, relX);
          const isOff = dist > radius - 2;
          const drawX = isOff ? letterRadius * Math.cos(ang) : relX;
          const drawY = isOff ? letterRadius * Math.sin(ang) : relY;

          // Save context before drawing each waypoint element
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(mapRotationAngle); // Rotate text/icon back to be upright

          // Apply shadow for the waypoint icon/emoji and label
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = shadowBlur;
          ctx.shadowOffsetX = shadowOffsetX;
          ctx.shadowOffsetY = shadowOffsetY;

          // Check if an emoji icon is defined
          if (wp.icon && wp.icon.trim() !== '') {
              // Draw the emoji
              ctx.font = `${minimapEmojiFontSize}px sans-serif`; // Use specific minimap emoji font size
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle'; // Adjust baseline for emoji
              ctx.fillText(wp.icon.trim(), 0, 0); // Draw emoji centered on the point
              ctx.textBaseline = 'top'; // Reset baseline for label

              // Draw the label below the emoji
              ctx.font = minimapFontSize; // Use minimap waypoint font size for label
              ctx.fillStyle = '#fff'; // Label color
              ctx.textAlign = 'center';
              ctx.fillText(wp.label, 0, minimapEmojiFontSize / 2 + 2); // Position label below emoji (adjusted spacing)
          } else {
              // Draw the default diamond icon if no emoji is present
              const size = 15; // Use minimap icon size for diamond
              ctx.beginPath();
              ctx.moveTo(0, -size);
              ctx.lineTo(size, 0);
              ctx.lineTo(0, size);
              ctx.lineTo(-size, 0);
              ctx.closePath();
              ctx.fillStyle = wp.color; // Use waypoint color for the diamond
              ctx.fill();

              // Draw the label below the diamond
              ctx.font = minimapFontSize; // Use minimap waypoint font size for label
              ctx.fillStyle = '#fff'; // Label color
              ctx.textAlign = 'center';
              ctx.fillText(wp.label, 0, size + 2); // Position label below diamond (adjusted spacing)
          }

          // Restore context for the next waypoint element (resets shadow properties)
          ctx.restore();
        }


        // Cardinal letters (already have shadows, keeping the existing code)
        const drawCardinal = (letter: string, x: number, y: number) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(mapRotationAngle); // Rotate letters back to be upright
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, 0, 0);
          ctx.restore();
        };

        ctx.font = 'bold 14px Arial'; // Font for cardinal letters
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        drawCardinal('N', 0, -letterRadius);
        drawCardinal('S', 0, letterRadius);
        drawCardinal('E', letterRadius, 0);
        drawCardinal('W', -letterRadius, 0);

        ctx.restore(); // Restore context before drawing the shadow gradient

        // Shadow gradient
        ctx.save(); // Save context for gradient clipping
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 1000; // Large blur for a soft gradient effect
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = 'transparent'; // Fill with transparent to just use the shadow
        ctx.fill();
        ctx.restore(); // Restore context after shadow clipping

        const gradient = ctx.createRadialGradient(
          centerX, centerY, radius * 0.6,
          centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.8, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(51,51,51,0.8)'); // Darkening at the edges
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);


        // Use texture arrow if available, fallback to CSS arrow, both using `arrowSize`
        // Center player arrow in minimap
        if (playerArrow) {
            this.drawTextureArrow(this.minimapCtx, centerX, centerY, Math.PI, playerArrow, arrowSize); // Assuming drawTextureArrow exists
        } else {
            this.drawArrow(this.minimapCtx, centerX, centerY, Math.PI, arrowSize); // Assuming drawArrow exists
        }


        // Update coords display
        const camPos = new THREE.Vector3();
        RuntimeMapGen.get().activeCameras[0].getWorldPosition(camPos);
        if (this.coordsDisplay) { // Assuming coordsDisplay is available
          const xVal = this.formatNumberWithSeparators(Math.round(camPos.x / this.hoverPrecisionScale)); // Assuming formatNumberWithSeparators and hoverPrecisionScale exist
          const zVal = this.formatNumberWithSeparators(Math.round(camPos.z / this.hoverPrecisionScale));
          this.coordsDisplay.innerText = `X ${xVal}   Z ${zVal} \n${this.getCurrentRegion()}`;
        }
      }
    }
public static createMinimap(): void {
        // Reset any previous state
        this._updateLoopActive = true;
        this.isFullscreen       = false;
        this._rafId            = null;

        // Create outer container (no clipping)
        this.minimapContainer = document.createElement('div');
        // Fullscreen overlay container
        this.fullscreenContainer = document.createElement('div');


        const tm = RuntimeMapGen.get();
        const hasBorder = !!tm.minimapBorder;

        // Determine initial position based on user setting
        let initialTop     = 'auto';
        let initialLeft    = 'auto';
        let initialRight   = '20px';
        let initialBottom  = '20px';
        switch (RuntimeMapGen.get().minimapPosition) {
            case 'top-left':
                initialTop     = '20px';
                initialLeft    = '20px';
                initialRight   = 'auto';
                initialBottom  = 'auto';
                break;
            case 'top-right':
                initialTop     = '20px';
                initialLeft    = 'auto';
                initialRight   = '20px';
                initialBottom  = 'auto';
                break;
            case 'bottom-left':
                initialTop     = 'auto';
                initialLeft    = '20px';
                initialRight   = 'auto';
                initialBottom  = '20px';
                break;
            case 'bottom-right':
            default:
                // already set
                break;
        }

        // Style outer minimap container - Adjusted size to accommodate potential border outside the masked area
        const containerSize = 280; // Base size for the masked content

        Object.assign(this.minimapContainer.style, {
            position:      'fixed',
            top:           initialTop,
            left:          initialLeft,
            right:         initialRight,
            bottom:        initialBottom,
            // Initial size can be based on the canvas size plus some padding for potential border
            width:         `${containerSize}px`,
            height:        `${containerSize}px`,
            cursor:        'grab',
            zIndex:        '1000',
            transition:    'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, border-radius 0.3s ease-in-out, top 0.3s ease, left 0.3s ease, right 0.3s ease, bottom 0.3s ease'
            // Do not set overflow: hidden here
        });

        this.loadMinimapPosition();

        // Style fullscreen container
        Object.assign(this.fullscreenContainer.style, {
            position:      'fixed',
            top:           '0',
            left:          '0',
            width:         '100%',
            height:        '100%',
            background:    'transparent',
            zIndex:        '10000',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            justifyContent:'center',
            opacity:       '0',
            pointerEvents: 'none',
            transition:    'opacity 0.3s ease-in-out'
        });

        // Create and size canvases
        this.minimapCanvas      = document.createElement('canvas');
        this.fullscreenCanvas = document.createElement('canvas');
        this.minimapCtx       = this.minimapCanvas.getContext('2d')!;
        this.fullscreenCtx    = this.fullscreenCanvas.getContext('2d')!;

        const baseSize = 360; // Internal canvas drawing size
        const displaySize = '100%'; // How the canvas fills its container (maskWrapper)

        this.minimapCanvas.width  = baseSize;
        this.minimapCanvas.height = baseSize;
        Object.assign(this.minimapCanvas.style, {
            width:  displaySize,
            height: displaySize,
            display:'block'
        });

        Object.assign(this.fullscreenCanvas.style, {
            maxWidth:  '70%',
            maxHeight: '70%'
        });

        // 1) Create circular mask wrapper (clips only the canvas)
        const maskWrapper = document.createElement('div');
        Object.assign(maskWrapper.style, {
            position:      'absolute',
            top:           '0',
            left:          '0',
            width:         '100%',
            height:        '100%',
            borderRadius:  '50%',
            overflow:      'hidden', // This is where the clipping happens
            boxShadow:     hasBorder ? 'none' : '5px 5px 10px rgba(0,0,0,0.2)', // Remove shadow if border exists
            background:    'radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%)'
        });

        // Append canvas to the mask wrapper
        maskWrapper.appendChild(this.minimapCanvas);


        // Create and position the border image outside the maskWrapper but inside minimapContainer
        if (tm.minimapBorder) {
            const borderImg = document.createElement('img');
            borderImg.src = (tm.minimapBorder.image as HTMLImageElement).src;

            const borderBaseSize = baseSize * tm.borderSize; // e.g., 360 * 1.2 = 432

            Object.assign(borderImg.style, {
                position: 'absolute',
                width: `${borderBaseSize}px`,   // Set explicit pixel size based on scaled internal size
                height: `${borderBaseSize}px`,  // Set explicit pixel size based on scaled internal size
                // Center the image within the minimapContainer, then apply offset
                left: `calc(50% + ${tm.borderOffset.x}px)`,
                top: `calc(50% + ${tm.borderOffset.y}px)`,
                transform: 'translate(-50%, -50%)', // Center the image itself
                pointerEvents: 'none', // Ensure clicks go through the border
                objectFit: 'contain', // Or 'fill', depending on desired aspect ratio handling
                zIndex: '1001' // Ensure border is above the canvas and mask, but below coordsDisplay
            });

            // Append border image directly to the minimapContainer
            this.minimapContainer.appendChild(borderImg);
        }


        // 2) Create coordinate display inside the outer container
        this.coordsDisplay = document.createElement('div');
        Object.assign(this.coordsDisplay.style, {
            position: 'absolute',
            bottom: '-20%',
            left: '50%',                   // Center horizontally
            transform: 'translateX(-50%)', // Fine-tune centering
            padding: '2px 6px',
            background: 'rgba(0,0,0,0.4)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '16px',
            borderRadius: '1px',
            pointerEvents: 'none',
            zIndex: '1002',
            whiteSpace: 'nowrap',          // Prevent line breaks
            overflow: 'hidden',            // Optional: contain overflow
            textOverflow: 'ellipsis'       // Optional: add ... if truncated
        });
        this.coordsDisplay.innerText = 'X 0   Z 0';

        // Assemble DOM - Append maskWrapper and coordsDisplay to minimapContainer
        this.minimapContainer.appendChild(maskWrapper); // maskWrapper contains the canvas and is clipped
        this.minimapContainer.appendChild(this.coordsDisplay); // Coords display is sibling to maskWrapper
        // The border image is also a sibling of maskWrapper and coordsDisplay if it exists

        this.fullscreenContainer.appendChild(this.fullscreenCanvas);
        document.body.appendChild(this.minimapContainer);
        document.body.appendChild(this.fullscreenContainer);

        // Hook up all event handlers
        document.addEventListener('keydown',          this._keydownHandler);
        this.minimapContainer.addEventListener('click',       this.toggleFullscreen);
        this.minimapContainer.addEventListener('mouseenter',  this._minimapEnterHandler);
        this.minimapContainer.addEventListener('mouseleave',  this._minimapLeaveHandler);
        this.minimapContainer.addEventListener('mousedown',   this.startDrag);
        document.addEventListener('mousemove',              this.drag);
        document.addEventListener('mouseup',                this.endDrag);
        window.addEventListener('resize',                   this.handleWindowResize);
        this.minimapCanvas.addEventListener('contextmenu', this.preventContextMenu);
        this.fullscreenCanvas.addEventListener('contextmenu', this.preventContextMenu);

        // Build the minimap cache and start the render loop
        this.prepareMinimapCache().then(() => {
            clearInterval(this._prepareIntervalId!);
            this.updateMinimapCanvasSize(); // This might need adjustment based on the new container structure
            this.updateFullscreenCanvasSize();
            this.startUpdateLoop();
            this.loadWaypointsFromLocalStorage();
            return this.loadRegionMap();
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

    static toggleFullscreen(): void {
  this.isFullscreen = !this.isFullscreen;

  if (this.isFullscreen) {
    // Save current minimap positions
    this.lastMinimapTop    = this.minimapContainer.style.top;
    this.lastMinimapLeft   = this.minimapContainer.style.left;
    this.lastMinimapBottom = this.minimapContainer.style.bottom;
    this.lastMinimapRight  = this.minimapContainer.style.right;
    

    // Disable interactions and animate minimap collapse
    this.minimapContainer.style.pointerEvents = 'none';
    this.minimapContainer.style.transition = [
      'transform 0.3s ease-in-out',
      'opacity 0.3s ease-in-out',
      'border-radius 0.3s ease-in-out',
      'top 0.3s ease',
      'left 0.3s ease',
      'bottom 0.3s ease',
      'right 0.3s ease',
      'width 0.3s ease-in-out',
      'height 0.3s ease-in-out',
      'margin 0.3s ease-in-out'
    ].join(',');

    requestAnimationFrame(() => {
      // Shrink and fade out the minimap into the center
      this.minimapContainer.style.transform     = 'scale(0.2)';
      this.minimapContainer.style.opacity       = '0';
      this.minimapContainer.style.borderRadius  = '0%';
      this.minimapContainer.style.bottom        = '50%';
      this.minimapContainer.style.right         = '50%';
      this.minimapContainer.style.width         = '50px';
      this.minimapContainer.style.height        = '50px';
      this.minimapContainer.style.marginLeft    = '-25px';
      this.minimapContainer.style.marginBottom  = '-25px';
    });

    setTimeout(() => {
      // Hide minimap and show fullscreen overlay
      this.minimapContainer.style.display          = 'none';
      this.fullscreenContainer.style.opacity       = '1';
      this.fullscreenContainer.style.pointerEvents = 'auto';

      // — Fullscreen overlay styling for dim + blur backdrop:
      Object.assign(this.fullscreenContainer.style, {
        position:       'fixed',
        top:            '0',
        left:           '0',
        width:          '100vw',
        height:         '100vh',
        backgroundColor:'rgba(0,0,0,0.4)',    // dim the rest of the page
        backdropFilter: 'blur(8px)',          // blur underlying content
        display:        'flex',               // center the map canvas
        justifyContent: 'center',
        alignItems:     'center',
        zIndex:         '10000',
      });

      // Resize canvas for fullscreen
      this.updateFullscreenCanvasSize();

      // Initial zoom: zoom in close to max
      this.fullscreenViewScale = this.fullscreenMaxScale;

      // Center view on player
      this.centerFullscreenOnPlayer();
      this.drawTerrain();

      // Attach fullscreen interaction handlers
      this.fullscreenCanvas.addEventListener('mousemove', this.handleFullscreenMouseMove);
      this.fullscreenCanvas.addEventListener('mouseout',   this.removeHoverPositionDisplay);
      this.fullscreenCanvas.addEventListener('click',      this._onFullscreenClick);
      this.fullscreenCanvas.addEventListener('mousedown',  this.startFullscreenPan);
      this.fullscreenCanvas.addEventListener('wheel',      this.handleFullscreenWheel);
      document.addEventListener('mousemove',               this.panFullscreen);
      document.addEventListener('mouseup',                 this.endFullscreenPan);
    }, 300);

  } else {
    // Close any open UI
    this.closeWaypointModal?.();

    // Fade out fullscreen overlay
    this.fullscreenContainer.style.opacity       = '0';
    this.fullscreenContainer.style.pointerEvents = 'none';

    // Re-show minimap container and reset its transition
    this.minimapContainer.style.display         = 'flex';
    this.minimapContainer.style.pointerEvents  = 'none';
    this.minimapContainer.style.transition     = [
      'transform 0.3s ease-in-out',
      'opacity 0.3s ease-in-out',
      'border-radius 0.3s ease-in-out',
      'top 0.3s ease',
      'left 0.3s ease',
      'bottom 0.3s ease',
      'right 0.3s ease',
      'width 0.3s ease-in-out',
      'height 0.3s ease-in-out',
      'margin 0.3s ease-in-out'
    ].join(',');

    requestAnimationFrame(() => {
      // Expand and restore minimap to previous position
      this.minimapContainer.style.transform     = 'scale(1)';
      this.minimapContainer.style.opacity       = '1';
      this.minimapContainer.style.borderRadius  = '50%';
      this.minimapContainer.style.top           = this.lastMinimapTop;
      this.minimapContainer.style.left          = this.lastMinimapLeft;
      this.minimapContainer.style.bottom        = this.lastMinimapBottom;
      this.minimapContainer.style.right         = this.lastMinimapRight;
      this.minimapContainer.style.width         = '280px';
      this.minimapContainer.style.height        = '280px';
      this.minimapContainer.style.marginLeft    = '';
      this.minimapContainer.style.marginBottom  = '';
    });

    setTimeout(() => {
      // Re-enable interactions and reset panning
      this.minimapContainer.style.pointerEvents = 'auto';
      this.fullscreenPanOffsetX = 0;
      this.fullscreenPanOffsetY = 0;

      // Rebuild minimap canvas and redraw
      if (this.minimapContainer.contains(this.minimapCanvas)) {
        try {
          this.minimapContainer.removeChild(this.minimapCanvas);
        } catch (Error) {
          return;
        }
      }
      const newCanvas = document.createElement('canvas');
      newCanvas.width  = 280;
      newCanvas.height = 280;
      Object.assign(newCanvas.style, { width: '100%', height: '100%', display: 'block' });
      this.minimapCtx    = newCanvas.getContext('2d')!;
      this.minimapCanvas = newCanvas;
      this.minimapContainer.appendChild(newCanvas);
      this.drawTerrain();

      // Detach fullscreen interaction handlers
      this.fullscreenCanvas.removeEventListener('mousemove', this.handleFullscreenMouseMove);
      this.fullscreenCanvas.removeEventListener('mouseout',   this.removeHoverPositionDisplay);
      this.fullscreenCanvas.removeEventListener('click',      this._onFullscreenClick);
      this.fullscreenCanvas.removeEventListener('mousedown',  this.startFullscreenPan);
      this.fullscreenCanvas.removeEventListener('wheel',      this.handleFullscreenWheel);
      document.removeEventListener('mousemove',              this.panFullscreen);
      document.removeEventListener('mouseup',                this.endFullscreenPan);
    }, 300);
  }
}


    static formatNumberWithSeparators(number: number): string {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static handleFullscreenMouseMove = (event: MouseEvent) => {
  if (!this.minimapImageCache || !this.currentDrawParams) return;

  const canvas = this.fullscreenCanvas;
  const rect = canvas.getBoundingClientRect();
  const { width: drawW, height: drawH, offsetX, offsetY, imgWidth, imgHeight } = this.currentDrawParams;

  // Convert mouse position to buffer coordinates
  const cssX = event.clientX - rect.left;
  const cssY = event.clientY - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const bufX = cssX * scaleX;
  const bufY = cssY * scaleY;

  // Check if mouse is over the image
  if (bufX < offsetX || bufX > offsetX + drawW || bufY < offsetY || bufY > offsetY + drawH) {
    if (this.hoverPositionDisplay) this.hoverPositionDisplay.style.display = 'none';
    return;
  }

  // Calculate normalized coordinates
  const normX = (bufX - offsetX) / drawW;
  const normZ = (bufY - offsetY) / drawH;

  // Calculate world position
  const tm = RuntimeMapGen.get();
  const worldW = tm.heightmapSize.width * tm.Scale.x;
  const worldH = tm.heightmapSize.height * tm.Scale.z;
  const hoverX = (normX - 0.5) * worldW;
  const hoverZ = (normZ - 0.5) * worldH;

  // Compute player position
  const camPos = new THREE.Vector3();
  tm.activeCameras[0].getWorldPosition(camPos);

  // Compute distance
  const deltaX = hoverX - camPos.x;
  const deltaZ = hoverZ - camPos.z;
  const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

  // Format coordinates
  const scaledHoverX = hoverX / this.hoverPrecisionScale;
  const scaledHoverZ = hoverZ / this.hoverPrecisionScale;
  const hoverLine = `X ${this.formatNumberWithSeparators(Math.round(scaledHoverX))}   Z ${this.formatNumberWithSeparators(Math.round(scaledHoverZ))}`;
  const formattedDistance = this.formatNumberWithSeparators(Math.round(distance / 10));
  const distanceLine = `(Distance ${formattedDistance}m)`;

  // Check if over player arrow
  const arrowBufX = offsetX + ((camPos.x - tm.Offset.x) / worldW + 0.5) * drawW;
  const arrowBufY = offsetY + ((camPos.z - tm.Offset.z) / worldH + 0.5) * drawH;
  const arrowSize = 20;
  const overArrow = Math.hypot(bufX - arrowBufX, bufY - arrowBufY) <= arrowSize;

  let tooltipText = `${hoverLine}\n${distanceLine}`;
  if (overArrow) {
    const scaledCamX = camPos.x / this.hoverPrecisionScale;
    const scaledCamZ = camPos.z / this.hoverPrecisionScale;
    const playerLine = `Your Location:\nX ${this.formatNumberWithSeparators(Math.round(scaledCamX))}   Z ${this.formatNumberWithSeparators(Math.round(scaledCamZ))}`;
    tooltipText += `\n\n${playerLine}`;
  }

  // Update or create tooltip
  if (!this.hoverPositionDisplay) {
    this.hoverPositionDisplay = document.createElement('div');
    Object.assign(this.hoverPositionDisplay.style, {
      position: 'fixed',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      pointerEvents: 'none',
      zIndex: '10001',
      whiteSpace: 'pre'
    });
    document.body.appendChild(this.hoverPositionDisplay);
  }

  this.hoverPositionDisplay.innerText = tooltipText;
  this.hoverPositionDisplay.style.left = `${event.clientX + 10}px`;
  this.hoverPositionDisplay.style.top = `${event.clientY + 10}px`;
  this.hoverPositionDisplay.style.display = 'block';
};

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
  const img   = this.minimapImageCache!;
  const scale = this.fullscreenMapScale;

  // 1) “Natural” size at your fullscreen scale
  let w = Math.round(img.width  * scale);
  let h = Math.round(img.height * scale);

  // 2) If you still want to clamp to e.g. 70% viewport, compute a single
  //    fit-scale so you never distort:
  const maxW = window.innerWidth  * 0.7;
  const maxH = window.innerHeight * 0.7;
  const fit  = Math.min(1, maxW / w, maxH / h);
  w = Math.round(w * fit);
  h = Math.round(h * fit);

  // 3) Apply _both_ buffer and CSS sizes from the same values
  this.fullscreenCanvas.width  = w;
  this.fullscreenCanvas.height = h;
  Object.assign(this.fullscreenCanvas.style, {
    width:  `${w}px`,
    height: `${h}px`,
  });

  // 4) Redraw the terrain
  this.drawTerrain();
}

    static startFullscreenPan = (event) => {
      event.preventDefault();
      this.fullscreenPanning = true;
      this.fullscreenPanStart = { x: event.clientX, y: event.clientY };
      this.fullscreenPanOrigin = { x: this.fullscreenPanOffsetX, y: this.fullscreenPanOffsetY };
    };

    static panFullscreen = (event) => {
      if (!this.fullscreenPanning) return;
      const dx = event.clientX - this.fullscreenPanStart.x;
      const dy = event.clientY - this.fullscreenPanStart.y;
      this.fullscreenPanOffsetX = this.fullscreenPanOrigin.x + dx;
      this.fullscreenPanOffsetY = this.fullscreenPanOrigin.y + dy;
      this.drawTerrain(); // Redraw with updated offsets
    };

    static endFullscreenPan = () => {
      this.fullscreenPanning = false;
    };

    static handleFullscreenWheel = (e: WheelEvent) => {
  e.preventDefault();

  // 1) Compute new scale
  const delta   = e.deltaY > 0 ? 0.9 : 1.1;  // zoom factor
  const oldScale = this.fullscreenViewScale;
  let   newScale = oldScale * delta;
  newScale = Math.min(Math.max(newScale, this.fullscreenMinScale), this.fullscreenMaxScale);

  // 2) Mouse position → canvas buffer coords
  const rect    = this.fullscreenCanvas.getBoundingClientRect();
  const mouseX  = e.clientX - rect.left;
  const mouseY  = e.clientY - rect.top;
  const bufferX = mouseX * (this.fullscreenCanvas.width  / rect.width);
  const bufferY = mouseY * (this.fullscreenCanvas.height / rect.height);

  // 3) Grab the last-drawn image metrics
  const { width: oldDrawW, height: oldDrawH, offsetX: oldOffX, offsetY: oldOffY } =
    this.currentDrawParams;

  // 4) Figure out where, within the image, the mouse hit (0…1 normalized)
  const relX = (bufferX - oldOffX) / oldDrawW;
  const relY = (bufferY - oldOffY) / oldDrawH;

  // 5) Compute the new image size
  const scaleFactor = newScale / oldScale;
  const newDrawW    = oldDrawW * scaleFactor;
  const newDrawH    = oldDrawH * scaleFactor;

  // 6) Compute the new offsets so the same image-pixel sits under the cursor
  const newOffX = bufferX - relX * newDrawW;
  const newOffY = bufferY - relY * newDrawH;

  // 7) Translate back into pan offsets (we keep initial centering separate)
  const initOffX = oldOffX - this.fullscreenPanOffsetX;
  const initOffY = oldOffY - this.fullscreenPanOffsetY;
  this.fullscreenPanOffsetX = newOffX - initOffX;
  this.fullscreenPanOffsetY = newOffY - initOffY;

  // 8) Commit and redraw
  this.fullscreenViewScale = newScale;
  this.drawTerrain();
};

    private static centerFullscreenOnPlayer(): void {
  if (!this.minimapImageCache) return;

  const img       = this.minimapImageCache;
  const tm        = RuntimeMapGen.get();
  const terrainW  = tm.heightmapSize.width  * tm.Scale.x;
  const terrainH  = tm.heightmapSize.height * tm.Scale.z;
  const cw        = this.fullscreenCanvas.width;
  const ch        = this.fullscreenCanvas.height;
  const imgAspect = img.width / img.height;

  // Compute initial image size & centering:
  let drawW: number, drawH: number, initOffX = 0, initOffY = 0;
  if (cw / ch > imgAspect) {
    drawH      = ch;
    drawW      = ch * imgAspect;
    initOffX   = (cw - drawW) / 2;
  } else {
    drawW      = cw;
    drawH      = cw / imgAspect;
    initOffY   = (ch - drawH) / 2;
  }
  drawW *= this.fullscreenViewScale;
  drawH *= this.fullscreenViewScale;

  // Figure out the player's normalized coords within the terrain [0…1]:
  const camPos = new THREE.Vector3();
  tm.activeCameras[0].getWorldPosition(camPos);
  const normX  = (camPos.x - tm.Offset.x) / terrainW + 0.5;
  const normY  = (camPos.z - tm.Offset.z) / terrainH + 0.5;

  // Compute panOffsets so that (normX*drawW + initOffX) == cw/2, and same for Y:
  this.fullscreenPanOffsetX = (cw / 2 - normX * drawW) - initOffX;
  this.fullscreenPanOffsetY = (ch / 2 - normY * drawH) - initOffY;
}



    static fullscreenMapScale = 2;
    static hoverPrecisionScale: number = 10;

    static fullscreenPanOffsetX = 0;
    static fullscreenPanOffsetY = 0;
    static fullscreenPanning = false;
    static fullscreenPanStart = { x: 0, y: 0 };
    static fullscreenPanOrigin = { x: 0, y: 0 };

    static currentDrawParams = {
      width: 1,
      height: 1,
      offsetX: 1,
      offsetY: 1,
      imgWidth: 1,
      imgHeight: 1
    };

// #endregion Main rendering



// #region PLAYER

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
    ctx.lineTo(0, size * 0.7);           // Tip (points downwards with rotation 0)
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

private static drawTextureArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number, // This rotation will now be the base, and we add 180 degrees
  texture: THREE.Texture,
  size: number
) {
  const img = texture.image as HTMLImageElement;
  if (!img?.complete) return; // Ensure image is loaded

  const width = size;
  const height = (img.naturalHeight / img.naturalWidth) * width; // Maintain aspect ratio

  // Add Math.PI to the provided rotation to flip the arrow 180 degrees
  const adjustedRotation = rotation + Math.PI;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(adjustedRotation); // Use the adjusted rotation
  ctx.drawImage(img, -width/2, -height/2, width, height);
  ctx.restore();
}

// #endregion PLAYER



// #region Coloring texturing

static async prepareMinimapCache(): Promise<void> {
  // First check for custom minimap
  const tm = RuntimeMapGen.get();
  if (tm.customMinimap?.image) {
    const texture = tm.customMinimap;
    const img = texture.image as HTMLImageElement;

    // Wait for image load
    await new Promise<void>(resolve => {
      if (img.complete) resolve();
      else img.onload = () => resolve();
    });

    
    const MAX_DIM = RuntimeMapGen.get().minimap_Resolution;
    const scale = Math.min(1, MAX_DIM / img.width, MAX_DIM / img.height);
    const sw = Math.floor(img.width * scale);
    const sh = Math.floor(img.height * scale);

    this.minimapImageCache = document.createElement('canvas');
    this.minimapImageCache.width = sw;
    this.minimapImageCache.height = sh;
    const ctx = this.minimapImageCache.getContext('2d')!;
    ctx.imageSmoothingEnabled = true; // Keep smoothing for custom image downscaling
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, sw, sh);

    //console.log("Minimap cache prepared using custom minimap image.");
    return; // Stop here if custom minimap was used
  }

  // --- Start of Original Heightmap Processing Logic ---

  // If no custom minimap, proceed with original heightmap processing
  if (!RuntimeMapGen.get().heightmapTexture?.image) {
    // Poll for heightmap readiness
    this._prepareIntervalId = window.setInterval(() => {
      if (RuntimeMapGen.get().heightmapTexture?.image) {
        clearInterval(this._prepareIntervalId!);
        //console.log("Heightmap texture ready after polling.");
      }
    }, 100);

  
     if (!RuntimeMapGen.get().heightmapTexture?.image) {
   
        //console.warn("Heightmap texture not immediately available for processing.");
     
     }
  }


  // Wait for image load (for heightmap texture)
  // This promise wait might be redundant if the polling already confirms 'image' exists.
  // It's safer to keep it or refactor the polling to wait for the promise.
  const texture = RuntimeMapGen.get().heightmapTexture!; // Non-null assertion based on original code, but check poll logic
  const img = texture.image as HTMLImageElement;
  await new Promise<void>(resolve => {
    if (img.complete) resolve();
    else img.onload = () => resolve();
  });
   //console.log("Heightmap image loaded for processing.");

  const MAX_DIM = RuntimeMapGen.get().minimap_Resolution;; 
  const scale = Math.min(1, MAX_DIM / img.width, MAX_DIM / img.height);
  const sw = Math.floor(img.width * scale), sh = Math.floor(img.height * scale);

  // Final cache canvas
  this.minimapImageCache = document.createElement('canvas');
  this.minimapImageCache.width = sw;
  this.minimapImageCache.height = sh;
  const ctx = this.minimapImageCache.getContext('2d')!;
  // Note: imageSmoothingEnabled is false for the final rendering of the pixelated map

  // Temp canvas for height sampling
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sw; tempCanvas.height = sh;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.imageSmoothingEnabled = true; // Keep smoothing for height sampling
  tempCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, sw, sh);
   //console.log("Heightmap drawn to temp canvas for sampling.");

  // Extract heights
  const { data } = tempCtx.getImageData(0, 0, sw, sh);
  const totalPixels = sw * sh;
  const heights = new Float32Array(totalPixels);
  // const tm = RuntimeMapGen.get(); // Already declared at the top
  const terrainMax = tm.terrainMaxHeight;
  // Assuming this.minimapHeightScale is a class property
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    // Assuming height is encoded in the red channel
    heights[p] = (data[i] / 255) * terrainMax * this.minimapHeightScale;
  }
   //console.log("Heights extracted from heightmap data.");


  // Define color stops and thresholds with more granularity
  const oceanH = tm.oceanLevel * terrainMax;
  const veryDeepWaterH = oceanH * 0.5; // Added very deep water
  const deepWaterH = oceanH * 0.7;
  const midWaterH = oceanH * 0.9;
  const shallowWaterH = oceanH * 0.98; // Added shallow water near shore
  const beachStartH = oceanH + (tm.beachRange * terrainMax * 0.2); // Beach transition starts slightly above ocean level
  const beachEndH = oceanH + tm.beachRange * terrainMax; // End of beach
  const grassMinH = tm.grassMin * terrainMax;
  const lushGrassH = grassMinH + (terrainMax - grassMinH) * 0.05; // Added lush grass at lower elevations
  const sparseGrassH = grassMinH + (terrainMax - grassMinH) * 0.2; // Added sparse grass at higher elevations
  const lowMtnH = grassMinH + (terrainMax - grassMinH) * 0.3;
  const midMtnH = grassMinH + (terrainMax - grassMinH) * 0.5; // Added mid mountain level
  const highMtnH = grassMinH + (terrainMax - grassMinH) * 0.7;
  const rockyPeakH = grassMinH + (terrainMax - grassMinH) * 0.85; // Added rocky peaks before snow
  const snowH = terrainMax * 0.9;
  const peakSnowH = terrainMax * 0.95; // Added a step for brighter peak snow

  // Color Palette (R, G, B) - More granular colors
  const colorStops: [number, [number, number, number]][] = [
    [0, [20, 40, 90]],          // Very Deep Water
    [veryDeepWaterH, [30, 50, 100]],  // Deep Water
    [deepWaterH, [40, 70, 160]],      // Mid Water
    [midWaterH, [90, 120, 180]],     // Shallow Water
    [shallowWaterH, [120, 160, 200]], // Very Shallow Water
    [oceanH, [130, 170, 210]],       // Ocean Surface (brighter)
    [beachStartH, [250, 240, 200]],   // Wet Sand/Shallow Beach
    [beachEndH, [245, 235, 190]],    // Beach
    [grassMinH, [200, 190, 140]],    // Dunes/Dry Sand (transition to grass) - Adjusted threshold
    [grassMinH + 0.001, [90, 160, 70]], // Start of Grass (slight offset to avoid fighting beach)
    [lushGrassH, [70, 150, 50]],      // Lush Grass
    [sparseGrassH, [110, 170, 90]],   // Sparse Grass
    [lowMtnH, [100, 120, 90]],       // Low Mountain (more green/brown)
    [midMtnH, [120, 120, 110]],      // Mid Mountain (rocky green/gray)
    [highMtnH, [130, 130, 130]],     // High Mountain (gray)
    [rockyPeakH, [150, 140, 130]],   // Rocky Peaks (darker gray/brown)
    [snowH, [220, 230, 240]],       // Snowline (transition to snow)
    [peakSnowH, [240, 245, 250]],    // Peak Snow (brighter white)
    [terrainMax, [255, 255, 255]],   // Highest Peaks (pure white)
  ];

  // Ensure color stops are sorted by height
  colorStops.sort((a, b) => a[0] - b[0]);
   //console.log("Color stops defined and sorted.");


  // Outline settings
  const edgeThreshold = 1.5 * this.minimapHeightScale;
  const outlineColor = [0, 0, 0] as const;

  // Lighting vector (normalized) - adjusted for a slightly steeper angle
  const lightDir = (() => {
    const lx = -1, ly = -1, lz = 3; // Increased lz for more top-down light
    const len = Math.hypot(lx, ly, lz);
    return [lx/len, ly/len, lz/len];
  })();
   //console.log("Lighting direction calculated.");

  // Pseudo-random noise function
  const noise2D = (x: number, y: number) => {
    const v = Math.sin(x*12.9898 + y*78.233) * 43758.5453123;
    return v - Math.floor(v);
  };
   //console.log("Noise function defined.");


  // Height fetch with clamp
  const getH = (x: number, y: number) => {
    x = Math.max(0, Math.min(x, sw-1));
    y = Math.max(0, Math.min(y, sh-1));
    return heights[y*sw + x];
  };
   //console.log("Helper function getH defined.");


  // Interpolate color based on height
  const getColorAtHeight = (h: number): [number, number, number] => {
    if (h < colorStops[0][0]) return colorStops[0][1];
    if (h >= colorStops[colorStops.length - 1][0]) return colorStops[colorStops.length - 1][1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      const [h1, color1] = colorStops[i];
      const [h2, color2] = colorStops[i + 1];

      if (h >= h1 && h <= h2) {
        const factor = (h - h1) / (h2 - h1);
        const r = color1[0] + (color2[0] - color1[0]) * factor;
        const g = color1[1] + (color2[1] - color1[1]) * factor;
        const b = color1[2] + (color2[2] - color1[2]) * factor;
        return [r, g, b];
      }
    }
    return colorStops[0][1]; // Should not happen with sorted stops and checks
  };
   //console.log("Color interpolation function defined.");


  // Pixelation
  const pixelFactor = this.pixelFactor; // Assuming pixelFactor is a class property
  const pixelSW = Math.floor(sw / pixelFactor);
  const pixelSH = Math.floor(sh / pixelFactor);
  const pixelCanvas = document.createElement('canvas');
  pixelCanvas.width = pixelSW; pixelCanvas.height = pixelSH;
  const pctx = pixelCanvas.getContext('2d')!;
  const pImg = pctx.createImageData(pixelSW, pixelSH);
  const pdata = pImg.data;
   //console.log(`Starting pixelation process with factor ${pixelFactor}.`);

  for (let py = 0; py < pixelSH; py++) {
    for (let px = 0; px < pixelSW; px++) {
      const x0 = px * pixelFactor, y0 = py * pixelFactor;
      const x = Math.min(x0, sw-1), y = Math.min(y0, sh-1);
      const idx = y*sw + x;
      const h = heights[idx];

      // Compute slope vector (using neighbors for a more accurate normal)
      const h_dx = (getH(x+1,y) - getH(x-1,y)) / 2;
      const h_dy = (getH(x,y+1) - getH(x,y-1)) / 2;
      // Pseudo-normal vector (pointing upwards) is proportional to [-dh/dx, -dh/dy, 1]
      const nx = -h_dx;
      const ny = -h_dy;
      const nz = 1; // Z component is always positive (upwards)
      const nl = Math.hypot(nx, ny, nz);
      const normalX = nx / nl;
      const normalY = ny / nl;
      const normalZ = nz / nl;

      // Calculate slope magnitude
      const slope = Math.hypot(h_dx, h_dy);
      const slopeThresh = tm.STONE_SLOPE; // Re-using existing slope threshold

      // Base color selection using gradients
      let [r, g, b] = getColorAtHeight(h);

      // Apply rock/stone color on steep slopes above grass level
      if (h >= grassMinH && slope > slopeThresh) {
          const slopeFactor = Math.min(1, (slope - slopeThresh) / (slopeThresh * 2)); // Increase rock effect with steeper slope
          // Interpolate rock color based on height for more variation
          const lowRockColor: [number, number, number] = [110, 110, 110];
          const midRockColor: [number, number, number] = [130, 130, 130];
          const highRockColor: [number, number, number] = [160, 160, 160];

          let rockColor: [number, number, number];
          if (h >= highMtnH) rockColor = highRockColor;
          else if (h >= midMtnH) rockColor = midRockColor;
          else rockColor = lowRockColor;

          r = r * (1 - slopeFactor) + rockColor[0] * slopeFactor;
          g = g * (1 - slopeFactor) + rockColor[1] * slopeFactor;
          b = b * (1 - slopeFactor) + rockColor[2] * slopeFactor;
      }


      // Lighting: dot product of normal and light direction
      const dot = Math.max(0, normalX*lightDir[0] + normalY*lightDir[1] + normalZ*lightDir[2]);

      // Enhanced lighting model (ambient + diffuse)
      const ambient = 0.3; // Base light always present
      const diffuse = 0.7; // Directional light contribution
      const lightFactor = ambient + diffuse * dot;

      // Apply lighting
      r *= lightFactor;
      g *= lightFactor;
      b *= lightFactor;

      // Procedural noise variation
      const n = (noise2D(x, y) - 0.5) * 0.08; // Reduced noise intensity ±4% for subtlety
      const vf = 1 + n;

      // Apply noise
      r *= vf;
      g *= vf;
      b *= vf;

      // Clamp colors
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // Edge detection
      let edge = false;
      // Only apply edge detection above very shallow water
      if (h >= shallowWaterH) {
          for (let oy=-1; oy<=1 && !edge; oy++) {
            for (let ox=-1; ox<=1; ox++) {
              if (ox===0 && oy===0) continue;
              const nh = getH(x+ox, y+oy);
              // Increased threshold for less frequent, more pronounced edges
              if (Math.abs(nh - h) > edgeThreshold * 1.5) {
                edge = true;
                break;
              }
            }
          }
      }

      if (edge) [r,g,b] = outlineColor;

      // Write to pixel buffer
      const pi = (py*pixelSW + px)*4;
      pdata[pi]   = r;
      pdata[pi+1] = g;
      pdata[pi+2] = b;
      pdata[pi+3] = 255;
    }
     // Optional: Add a console log or progress indicator here for large maps
     // if (py % 50 === 0) console.log(`Processing minimap row ${py}/${pixelSH}`);
  }
   //console.log("Pixelation complete.");


  // Render low-res to final canvas
  pctx.putImageData(pImg, 0, 0);
  ctx.imageSmoothingEnabled = false; // Ensure pixelated look
  ctx.drawImage(pixelCanvas, 0, 0, pixelSW, pixelSH, 0, 0, sw, sh);
   //console.log("Minimap cache prepared using heightmap processing.");

  // --- End of Original Heightmap Processing Logic ---
}

  private static pixelFactor = 1;

  // #endregion Coloring texturing



// #region Waypoints

// Update the waypoint type definition to include an optional icon property
static waypoints: Array<{
  label: string;
  color: string;
  icon?: string; // Added optional icon property
  xNorm: number;
  yNorm: number;
}> = [];

private static waypointModal: HTMLDivElement | null = null;
private static waypointFontSize: string = '25px sans-serif'; // Keep these for drawing logic
private static waypointIconSize: number = 12; // Keep these for drawing logic (adjust drawing as needed for emojis)
private static _documentClickListener: ((this: Document, ev: MouseEvent) => any) | null = null; // To track the document click listener
private static _stylesInjected: boolean = false; // Flag to ensure styles are injected only once

private static suggestedEmojis: string[] = [
  // Points of interest & markers
  '📍', '🚩', '📌',

  // Quest & objectives
  '📜', '🎯', '🏅', '🎖️',

  // Resources & materials
  '🌳', '💧', '🔥', '🍄', '💎', '🌾',

  // Trade & inventory
  '📦', '💰', '🛒',

  // Crafting & stations
  '⚒️', '🔨', '🧵', '🏭',

  // Combat & war
  '🗡️', '🛡️', '⚔️', '☠️', '💀', '👹',

  // Exploration & dungeons
  '🚪', '🗝️', '🕳️', '🌀',

  // Magic & buffs
  '✨', '🌟', '🔮', '🪄', '⚗️',

  // Health & status
  '❤️', '💪', '🩹', '🩸', '💤',

  // Mana & energy
  '🔋',

  // Alerts & focus
  '❓', '❗️', '⚠️', '✅', '❌',

  // Navigation & direction
  '⬆️', '➡️', '⬇️', '⬅️', '🔄',

  // Social & grouping
  '💬', '👥', '🤝', '🗣️',

  // Factions & guilds
  '🏰', '🏳️', '🏴',

  // Time & events
  '⏳', '⏰', '📆', '🎉',

  // Environmental & weather
  '☀️', '☁️', '🌧️', '❄️', '⚡️', '🌪️',

  // Animals & creatures
  '🐉', '🐺', '🦅',

  // Points & rewards
  '⭐️', '🎁',

  // Misc & utility
  '🔗', '📎', '🗑️', '🪤', '🔔',
];


private static generateRandomHexColor(): string {
    const randomColor = Math.floor(Math.random() * 16777215);
    let hexColor = randomColor.toString(16);
    while (hexColor.length < 6) {
        hexColor = '0' + hexColor;
    }
    return '#' + hexColor;
}

private static _onFullscreenClick = (evt: MouseEvent) => {
  // If a modal is open, don’t place a new waypoint
  if (this.waypointModal) return;

  const canvas = this.fullscreenCanvas; // Assuming fullscreenCanvas is available
  const rect   = canvas.getBoundingClientRect();

  // Map CSS coords to buffer coords
  const bufX = (evt.clientX - rect.left)  * (canvas.width  / rect.width);
  const bufY = (evt.clientY - rect.top )  * (canvas.height / rect.height);

  // Pull in the last draw parameters (with pan & zoom) - Assuming currentDrawParams is available
  const { width: drawW, height: drawH, offsetX, offsetY } = this.currentDrawParams;

  // Compute image‐space coords (relative to the top‐left of the drawn image)
  const imgX = bufX - offsetX;
  const imgY = bufY - offsetY;

  // If click is outside the drawn area, bail out
  if (imgX < 0 || imgY < 0 || imgX > drawW || imgY > drawH) return;

  // Now normalized [0..1]
  const xNorm = imgX / drawW;
  const yNorm = imgY / drawH;

  // Hit‐test existing waypoints (in image space)
  // Hit radius might need adjustment based on emoji size. Emojis are ~16-24px depending on font.
  // Let's make the hit radius generous.
  const hitR = Math.max(this.waypointIconSize, 24) + 8; // Use larger of defined size or a base emoji size
  for (let i = 0; i < this.waypoints.length; i++) {
    const wp = this.waypoints[i];
    const wpX = wp.xNorm * drawW;
    const wpY = wp.yNorm * drawH;
    // Calculate distance squared
    const distSq = (imgX - wpX) * (imgX - wpX) + (imgY - wpY) * (imgY - wpY);
    if (distSq <= hitR * hitR) {
      return this.showWaypointModal(i, wp.xNorm, wp.yNorm, evt.clientX, evt.clientY);
    }
  }

  // Otherwise, create a new one at (xNorm,yNorm)
  this.showWaypointModal(null, xNorm, yNorm, evt.clientX, evt.clientY);
};


// Helper function to close the modal and clean up
private static closeWaypointModal() {
    if (this.waypointModal) {
        // Remove event listeners specific to modal elements if they weren't automatically cleaned up
        // For this setup, removing the modal element is usually sufficient.
        document.body.removeChild(this.waypointModal);
        this.waypointModal = null;
    }
    // Remove the global click listener if it exists
    if (this._documentClickListener) {
        document.removeEventListener('click', this._documentClickListener);
        this._documentClickListener = null;
    }
    // Trigger a redraw after modal closes, just in case something changed visually
    // (e.g., if drawTerrain wasn't called on save/delete)
    // This might be redundant if save/delete already calls it, but safer.
    // this.drawTerrain(); // Uncomment if needed
}

private static showWaypointModal(
    index: number | null,
    xNorm: number,
    yNorm: number,
    clientX: number, // Mouse click X coordinate
    clientY: number  // Mouse click Y coordinate
) {
    // --- Inject Styles if not already done ---
    if (!this._stylesInjected) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .waypoint-modal {
              position: fixed;
              /* top, left will be set dynamically */
              background: #2d2d2d; /* Slightly lighter dark than #222 */
              color: #e0e0e0; /* Light grey text */
              padding: 20px; /* Increased padding */
              border-radius: 10px; /* Slightly more rounded */
              z-index: 10001;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Modern font stack */
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6); /* More pronounced shadow */
              min-width: 250px; /* Increased min-width */
              max-width: 350px; /* Added max-width */
              display: flex;
              flex-direction: column;
              gap: 15px; /* Increased gap between main sections */
              border: 1px solid #444; /* Subtle border */
              box-sizing: border-box; /* Include padding and border in element's total width and height */
            }

            .waypoint-modal-title {
              font-size: 1.3em; /* Slightly larger title */
              font-weight: 600; /* Semi-bold */
              margin-bottom: 10px; /* More space below title */
              text-align: center;
              color: #ffffff; /* White title */
            }

            .waypoint-input-group {
                display: flex;
                flex-direction: column;
                gap: 8px; /* Gap within input groups */
            }

            .waypoint-input-group label {
                font-size: 0.9em;
                color: #b0b0b0; /* Lighter grey for labels */
            }

            .waypoint-modal input[type="text"],
            .waypoint-modal input[type="color"] {
              display: block;
              width: 100%; /* Full width */
              padding: 10px; /* Increased padding */
              border: 1px solid #555;
              border-radius: 5px; /* Slightly more rounded corners */
              box-sizing: border-box;
              background-color: #3a3a3a; /* Darker input background */
              color: #eee;
              font-size: 1em;
              outline: none; /* Remove default outline */
              transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .waypoint-modal input[type="text"]:focus,
            .waypoint-modal input[type="color"]:focus {
                border-color: #007bff; /* Highlight focus */
                box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
            }

            .waypoint-modal input[type="color"] {
                height: 40px; /* Adjust height for consistency */
                padding: 5px; /* Adjust padding */
            }

             /* Flex container for icon input and button */
            .waypoint-icon-input-container {
                display: flex;
                gap: 5px;
                align-items: center; /* Vertically align items */
            }

            .waypoint-modal input[data-element="icon-input"] {
                flex-grow: 1; /* Allow input to take available space */
                text-align: center;
                font-size: 1.8em; /* Larger emoji */
                padding: 5px 10px;
                cursor: text; /* Indicate it's a text input */
                 /* Override default input transition for icon field */
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

             /* Style for the emoji toggle button */
             .waypoint-emoji-toggle-button {
                padding: 0 10px; /* Adjusted padding */
                font-size: 1.2em;
                border: 1px solid #555;
                background-color: #3a3a3a;
                color: #eee;
                border-radius: 5px;
                cursor: pointer;
                flex-shrink: 0; /* Prevent button from shrinking */
                 height: 40px; /* Match input height */
                 display: flex; /* Use flex to center emoji */
                 justify-content: center;
                 align-items: center;
                 transition: background-color 0.2s ease;
            }

            .waypoint-emoji-toggle-button:hover {
                 background-color: #555;
            }


            .waypoint-emoji-suggestions {
                /* display: grid; <-- This will be set by JS when shown */
                grid-template-columns: repeat(auto-fit, minmax(30px, 1fr)); /* Responsive grid */
                gap: 5px; /* Gap between emojis */
                max-height: 180px; /* Increased height for more visibility */
                overflow-y: auto;
                padding: 5px;
                background-color: #3a3a3a; /* Match input background */
                border-radius: 5px;
                border: 1px solid #555;
                 margin-top: 5px; /* Space above suggestions when shown */

                 /* Scrollbar styles for better appearance */
                 scrollbar-width: thin;
                 scrollbar-color: #555 #3a3a3a; /* thumb track */
            }
             /* Webkit scrollbar styles */
            .waypoint-emoji-suggestions::-webkit-scrollbar {
               width: 8px;
            }
            .waypoint-emoji-suggestions::-webkit-scrollbar-track {
               background: #3a3a3a;
               border-radius: 4px;
            }
            .waypoint-emoji-suggestions::-webkit-scrollbar-thumb {
               background-color: #555;
               border-radius: 4px;
               border: 2px solid #3a3a3a; /* Padding inside thumb */
            }


            .waypoint-emoji-suggestions span {
                text-align: center;
                font-size: 1.5em; /* Emoji size in the grid */
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: background-color 0.1s ease;
            }

            .waypoint-emoji-suggestions span:hover {
                background-color: #555; /* Highlight on hover */
            }

            .waypoint-modal-actions {
              display: flex;
              justify-content: space-between;
              gap: 10px; /* Gap between buttons */
              margin-top: 10px; /* Space above buttons */
            }

            .waypoint-modal button {
              padding: 10px 15px; /* Increased padding */
              border: none;
              border-radius: 5px; /* Slightly more rounded */
              cursor: pointer;
              font-size: 1em;
              transition: background-color 0.2s ease, opacity 0.2s ease;
              flex-grow: 1;
              font-weight: 600;
            }

            .waypoint-modal button:not(.waypoint-emoji-toggle-button):hover {
                opacity: 0.9; /* Subtle hover effect for action buttons */
            }

            .waypoint-modal button#waypoint-save {
              background-color: #5cb85c;
              color: white;
            }
            .waypoint-modal button#waypoint-save:hover {
                background-color: #4cae4c;
            }

            .waypoint-modal button#waypoint-delete {
              background-color: #d9534f;
              color: white;
            }
            .waypoint-modal button#waypoint-delete:hover {
                background-color: #c9302c;
            }

            .waypoint-modal button#waypoint-cancel {
              background-color: #555; /* Darker grey for cancel */
              color: white;
            }
             .waypoint-modal button#waypoint-cancel:hover {
                background-color: #666;
            }
        `;
        document.head.appendChild(style);
        this._stylesInjected = true; // Set the flag
    }
    // --- End Inject Styles ---


    // Close previously opened modal and cleanup listeners
    this.closeWaypointModal();

    const isNew = index === null;
    const wp    = isNew ? null : this.waypoints[index!];

    const defaultColor = isNew ? this.generateRandomHexColor() : wp!.color;
    const defaultIcon = isNew ? '' : (wp!.icon || ''); // Default icon is empty or existing

    const modal = document.createElement('div');
    modal.classList.add('waypoint-modal'); // Add CSS class

    // --- Calculate and Set Modal Position (Improved Viewport Adaptation) ---
    // Estimate modal size (adjust these based on your CSS and content)
    // A more accurate way would be to append it hidden, measure, then position.
    // But estimations often work for simple modals.
    const estimatedModalWidth = 280; // Adjusted estimate
    const estimatedModalHeight = isNew ? 250 : 300; // Estimate slightly taller for edit mode (delete button) + emoji list potential space
    const padding = 15; // Padding from viewport edge

    // Calculate preferred position (slightly offset from click)
    let preferredX = clientX + 20;
    let preferredY = clientY + 20;

    // Clamp the final position to stay within the viewport
    let finalX = Math.max(padding, preferredX);
    finalX = Math.min(finalX, window.innerWidth - estimatedModalWidth - padding);

    let finalY = Math.max(padding, preferredY);
    finalY = Math.min(finalY, window.innerHeight - estimatedModalHeight - padding);

     // Handle edge case where modal is wider/taller than viewport
     if (estimatedModalWidth > window.innerWidth - 2 * padding) {
         finalX = padding; // Flush left
     }
     if (estimatedModalHeight > window.innerHeight - 2 * padding) {
         finalY = padding; // Flush top
     }


    Object.assign(modal.style, {
        top:     `${finalY}px`,
        left:    `${finalX}px`,
        // CSS class handles other styles now
    });
     // --- End Position Calculation ---


    // Generate emoji suggestion HTML
    const emojiSuggestionsHtml = this.suggestedEmojis.map(emoji =>
        `<span data-emoji="${emoji}">${emoji}</span>`
    ).join('');


    modal.innerHTML = `
        <div class="waypoint-modal-title">
            ${isNew ? 'Create Waypoint' : 'Edit Waypoint'}
        </div>

        <div class="waypoint-input-group">
            <label for="waypoint-label">Label:</label>
            <input type="text" id="waypoint-label" data-element="label-input" placeholder="e.g., Base Camp"
                   value="${wp ? wp.label.replace(/"/g,'&quot;') : ''}">
        </div>

        <div class="waypoint-input-group waypoint-icon-group">
            <label for="waypoint-icon">Icon:</label>
            <div class="waypoint-icon-input-container">
                 <input type="text" id="waypoint-icon" data-element="icon-input" placeholder="✨" maxlength="2"> <button type="button" id="toggle-emoji-suggestions" class="waypoint-emoji-toggle-button" title="Toggle Emoji Picker">😊</button>
            </div>
            <div class="waypoint-emoji-suggestions" style="display: none;">
                ${emojiSuggestionsHtml}
            </div>
        </div>

         <div class="waypoint-input-group">
            <label for="waypoint-color">Color:</label>
            <input type="color" id="waypoint-color" data-element="color-input" value="${defaultColor}">
        </div>


        <div class="waypoint-modal-actions">
            <button id="waypoint-save">${isNew ? 'Create' : 'Save'}</button>
            ${isNew ? '' : '<button id="waypoint-delete">Delete</button>'}
            <button id="waypoint-cancel">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
    this.waypointModal = modal; // Store the reference

    // --- Event Listeners ---

    // Use querySelector with data-element or specific IDs for elements
    const labelInput = modal.querySelector('[data-element="label-input"]') as HTMLInputElement;
    const iconInput = modal.querySelector('[data-element="icon-input"]') as HTMLInputElement;
    const colorInput = modal.querySelector('[data-element="color-input"]') as HTMLInputElement;
    const saveButton = modal.querySelector('#waypoint-save') as HTMLButtonElement;
    const deleteButton = modal.querySelector('#waypoint-delete') as HTMLButtonElement; // Can be null
    const cancelButton = modal.querySelector('#waypoint-cancel') as HTMLButtonElement;
    const emojiSuggestionsContainer = modal.querySelector('.waypoint-emoji-suggestions') as HTMLDivElement;
    const toggleEmojiButton = modal.querySelector('#toggle-emoji-suggestions') as HTMLButtonElement;


    // Set focus to the label input
    labelInput.focus();

    // Populate icon input if editing
    if (!isNew && wp!.icon) {
        iconInput.value = wp!.icon;
    } else {
         // Set a default placeholder value if creating and no icon exists
         // (Placeholder is already set in HTML, but this ensures value is empty)
         iconInput.value = '';
    }

    // Handle Emoji Selection - Click on an emoji in the grid
    emojiSuggestionsContainer.addEventListener('click', (evt) => {
        const target = evt.target as HTMLElement;
        const emoji = target.getAttribute('data-emoji');
        if (emoji && iconInput) {
            iconInput.value = emoji;
            // Hide the container after selecting an emoji
            emojiSuggestionsContainer.style.display = 'none';
            // Reset toggle button text/icon
            if (toggleEmojiButton) {
                toggleEmojiButton.textContent = '😊'; // Or the initial icon
                toggleEmojiButton.setAttribute('title', 'Toggle Emoji Picker');
            }
            labelInput.focus(); // Optionally move focus back to label or save button
        }
         // Stop propagation to prevent the document click listener from closing the modal
         // if the emoji picker is clicked inside the modal.
         evt.stopPropagation();
    });

     // Handle Toggle Emoji Suggestions button click
     toggleEmojiButton.addEventListener('click', (evt) => {
         const isHidden = emojiSuggestionsContainer.style.display === 'none';
         emojiSuggestionsContainer.style.display = isHidden ? 'grid' : 'none';
         // Optional: Change button text/icon to indicate state
         toggleEmojiButton.textContent = isHidden ? '▼' : '😊'; // Or different icons
         toggleEmojiButton.setAttribute('title', isHidden ? 'Hide Emoji Picker' : 'Toggle Emoji Picker');

         if (isHidden) {
             // If showing, scroll the input into view just in case
             iconInput.scrollIntoView({ block: 'nearest' });
         }

         // Stop propagation to prevent the document click listener from closing the modal
         evt.stopPropagation();
     });


    // Handle Cancel
    cancelButton.addEventListener('click', () => {
        this.closeWaypointModal();
    });

    // Handle Save
    saveButton.addEventListener('click', () => {
        const label = labelInput.value.trim() || 'Waypoint'; // Default label if empty
        const icon = iconInput.value.trim(); // Get the icon value
        const color = colorInput.value;

        if (isNew) {
            this.waypoints.push({ label, color, icon, xNorm, yNorm }); // Include icon in new waypoint
        } else {
            wp!.label = label;
            wp!.color = color;
            wp!.icon = icon; // Update icon for existing waypoint
        }
        this.closeWaypointModal();
        this.drawTerrain(); // Assuming this redraws waypoints including icons
        this.saveWaypointsToLocalStorage(); 
    });

    // Handle Delete (only if editing, confirmation removed)
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (!isNew) { // Double-check we are in edit mode
                // Removed the confirm() prompt as requested
                this.waypoints.splice(index!, 1);
                this.closeWaypointModal();
                this.drawTerrain(); // Assuming this redraws waypoints
                this.saveWaypointsToLocalStorage(); 
            }
        });
    }

    // Handle Click Outside to Close
    // Attach listener to document and check if the click is outside the modal
    this._documentClickListener = (evt: MouseEvent) => {
        // Check if the click target is outside the modal element
        // We also check if the modal still exists (it might have been closed by other means)
        if (this.waypointModal && !this.waypointModal.contains(evt.target as Node)) {
            // Make sure the click wasn't on the canvas trigger itself if needed,
            // but typically clicking outside implies wanting to close.
            this.closeWaypointModal();
        }
    };
    // Use a short timeout to allow the initial click event that *opened* the modal
    // to fully propagate and avoid immediately closing it.
    setTimeout(() => {
        document.addEventListener('click', this._documentClickListener!);
    }, 0); // 0ms timeout effectively defers the listener until the next event loop tick.

      // Prevent clicks *inside* the modal from propagating to the document listener
      // and potentially closing the modal unexpectedly.
      // This listener is already on the modal div, covering all its children.
      // We added specific stopPropagation calls to the emoji grid and toggle button
      // listeners as well, just to be extra safe with nested interactive elements.
      modal.addEventListener('click', (evt) => {
        // For clicks directly on the modal background, or elements without specific handlers
        evt.stopPropagation();
      });

}

// #endregion Waypoints



// #region  Dragging

  static isRightDragging = false;
  static preventContextMenuOnDrag = (e: MouseEvent) => {
    e.preventDefault();
  };

  // Modified startDrag method
  static startDrag = (e: MouseEvent) => {
    // Check if right mouse button is pressed
    if (e.button === 2) {
      RMG_Navigation.isRightDragging = true;
      document.addEventListener('contextmenu', RMG_Navigation.preventContextMenuOnDrag);
    }

    this.isDragging = true;
    this.minimapContainer.style.cursor = 'grabbing';
    this.startX = e.clientX;
    this.startY = e.clientY;

    const rect = this.minimapContainer.getBoundingClientRect();
    this.offsetX = rect.left;
    this.offsetY = rect.top;

    this.lastMinimapLeft = this.minimapContainer.style.left;
    this.lastMinimapTop = this.minimapContainer.style.top;

    // Prevent click-to-fullscreen while dragging
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

  static preventContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

// Modify endDrag to handle right-click specifically:
    static endDrag = (e: MouseEvent) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.minimapContainer.style.cursor = 'grab';
        this.minimapContainer.addEventListener('click', this.toggleFullscreen);

        if (e.button === 2) {
            document.removeEventListener('contextmenu', this.preventContextMenuOnDrag);
            this.isRightDragging = false;
            e.preventDefault();
            e.stopPropagation();
        }

        this.saveMinimapPosition(); // Save position after dragging
    };

// #endregion  Dragging


//#region Disposing and Utility

    static _keydownHandler = (e: KeyboardEvent) => {
  // Prevent M key from closing map when typing in waypoint modal
  if (e.key.toLowerCase() === 'm') {
    const target = e.target as HTMLElement;
    if (this.waypointModal && target.tagName === 'INPUT') {
      return;
    }
    this.toggleFullscreen();
  }
  if (e.key === '+' || e.key === '-') this.changeMinimapScale(e.key);
  if (e.key === '=' || e.key === '+') this.changeMinimapScale('+');

  // Handle ESC key to close modals and fullscreen
  if (e.key === 'Escape') {
    if (this.waypointModal) {
      this.closeWaypointModal();
      e.preventDefault();
    } else if (this.isFullscreen) {
      this.toggleFullscreen();
      e.preventDefault();
    }
  }
};

    static _minimapEnterHandler = () => {
      if (!this.isDragging) {
        this.minimapContainer.style.transform = 'scale(1.05)';
      }
    };

    static _minimapLeaveHandler = () => {
      if (!this.isDragging) {
        this.minimapContainer.style.transform = 'scale(1)';
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
    (this.coordsDisplay as any) = null;

    // Clear cache
    this.minimapImageCache = null;

    if (this.waypointModal && document.body.contains(this.waypointModal)) {
    document.body.removeChild(this.waypointModal);
    this.waypointModal = null;
  }

  this.waypoints = [];

  if (this.fullscreenCanvas) {
    this.fullscreenCanvas.removeEventListener('click', this._onFullscreenClick);
  }

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

//#endregion Disposing and Utility



// #region Export

  static exportGrayscale(): void {
  const tm = RuntimeMapGen.get();
  const texture = tm.heightmapTexture;
  if (!texture?.image) {
    console.error('Heightmap texture not loaded.');
    return;
  }
  const img = texture.image as HTMLImageElement;

  // Use same dimensions as minimap cache
  const MAX_DIM = RuntimeMapGen.get().minimap_Resolution;
  const scale = Math.min(1, MAX_DIM / img.width, MAX_DIM / img.height);
  const sw = Math.floor(img.width * scale);
  const sh = Math.floor(img.height * scale);

  // Create canvas and draw downscaled heightmap
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, sw, sh);

  // Convert to grayscale (using red channel)
  const imageData = ctx.getImageData(0, 0, sw, sh);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i]; // Red channel = height
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);

  // Trigger download
  const link = document.createElement('a');
  link.download = 'minimap_grayscale.png';
  link.href = canvas.toDataURL();
  link.click();
}

static exportColored(): void {
  if (!this.minimapImageCache) {
    console.error('Colored minimap not available.');
    return;
  }
  const link = document.createElement('a');
  link.download = 'minimap_colored.png';
  link.href = this.minimapImageCache.toDataURL();
  link.click();
}

// #endregion Export



// #region localStorage

private static saveWaypointsToLocalStorage(): void {
  try {
    localStorage.setItem('rmgWaypoints', JSON.stringify(this.waypoints));
  } catch (e) {
    console.error('Failed to save waypoints to localStorage:', e);
  }
}

private static loadWaypointsFromLocalStorage(): void {
  try {
    const stored = localStorage.getItem('rmgWaypoints');
    if (stored) {
      this.waypoints = JSON.parse(stored);
      this.drawTerrain(); // Refresh display after loading
    }
  } catch (e) {
    console.error('Failed to load waypoints from localStorage:', e);
    localStorage.removeItem('rmgWaypoints');
    this.waypoints = [];
  }
}

  static saveMinimapPosition(): void {
        const position = {
            top: this.lastMinimapTop,
            left: this.lastMinimapLeft,
            right: this.lastMinimapRight,
            bottom: this.lastMinimapBottom
        };
        localStorage.setItem('rmgMinimapPosition', JSON.stringify(position));
    }

    static loadMinimapPosition(): void {
        const saved = localStorage.getItem('rmgMinimapPosition');
        if (saved) {
            try {
                const position = JSON.parse(saved);
                this.minimapContainer.style.top = position.top;
                this.minimapContainer.style.left = position.left;
                this.minimapContainer.style.right = position.right;
                this.minimapContainer.style.bottom = position.bottom;
                // Update last known positions
                this.lastMinimapTop = position.top;
                this.lastMinimapLeft = position.left;
                this.lastMinimapRight = position.right;
                this.lastMinimapBottom = position.bottom;
            } catch (e) {
                console.error('Error loading minimap position:', e);
            }
        }
    }

// #endregion localStorage


// #region Biomes

    static regionMapData: ImageData | null = null;
    static regions: Map<string, string> = new Map();
    static defaultRegionLabel: string = "Unknown Region";
    static voidBiomeName: string = "Void";
    public static currentRegion: string = this.defaultRegionLabel;
    static previousRegion: string = "";

    static async loadRegionMap(): Promise<void> {
        // Load region map texture
        const texture = RuntimeMapGen.get().BiomesMap;
        if (!texture?.image) return;

        const img = texture.image as HTMLImageElement;
        await new Promise<void>(resolve => {
            if (img.complete) resolve();
            else img.onload = () => resolve();
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        this.regionMapData = ctx.getImageData(0, 0, img.width, img.height);

        // Load biome definitions from JSON
        await this.loadBiomesData();
    }

    static async loadBiomesData(): Promise<void> {
        try {
          const tm = (RuntimeMapGen).get();
            const path = RE.getStaticPath(`${tm.BiomeJsonPath}`);
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();

            this.regions.clear();
            for (const [colorHex, biomeData] of Object.entries(data.biomes)) {
                const normalizedColor = colorHex.toLowerCase().replace(/^#/, '');
                const biomeInfo = biomeData as { displayName: string };
                this.regions.set(`#${normalizedColor}`, biomeInfo.displayName);
            }

            // Set defaults from JSON
            this.defaultRegionLabel = data.defaultBiomeName || "Unknown Region";
            this.voidBiomeName = data.voidBiomeName || "Void";
        } catch (error) {
            console.error("Failed to load biome data:", error);
            this.defaultRegionLabel = "Unknown Region";
            this.voidBiomeName = "Void";
        }
    }

    static updateCurrentRegion(pos: THREE.Vector3): void {
        const newRegion = this.getBiomeAt(pos.x, pos.z);
        if (newRegion !== this.currentRegion) {
            this.previousRegion = this.currentRegion;
            this.currentRegion = newRegion;
            //console.log(`Region changed to: ${this.currentRegion}`);
        }
    }

    public static getCurrentRegion(): string {
        return this.currentRegion;
    }

    public static getBiomeAt(x: number, z: number): string {
        if (!this.regionMapData) return this.defaultRegionLabel;

        const tm = RuntimeMapGen.get();
        const terrainW = tm.heightmapSize.width * tm.Scale.x;
        const terrainH = tm.heightmapSize.height * tm.Scale.z;

        // Convert world coordinates to UV space
        const u = ((x - tm.Offset.x) / terrainW) + 0.5;
        const v = ((z - tm.Offset.z) / terrainH) + 0.5;

        if (u < 0 || u > 1 || v < 0 || v > 1) {
            return this.voidBiomeName;
        }


        // Get pixel coordinates in region map
        const px = Math.floor(u * this.regionMapData.width);
        const py = Math.floor(v * this.regionMapData.height);

        // Clamp coordinates
        const xClamped = Math.max(0, Math.min(this.regionMapData.width - 1, px));
        const yClamped = Math.max(0, Math.min(this.regionMapData.height - 1, py));

        // Get pixel color data
        const idx = (yClamped * this.regionMapData.width + xClamped) * 4;
        const [r, g, b, a] = this.regionMapData.data.slice(idx, idx + 4);

        if (a < 255 || (r === g && g === b)) {
            return this.defaultRegionLabel;
        }

        // Format color key and lookup
        const colorKey = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        return this.regions.get(colorKey.toLowerCase()) || this.defaultRegionLabel;
    }

    // #endregion Biomes


// #region BiomeGen
static generatedBiomeImage: HTMLCanvasElement | null = null;

public static generateAndExportBiomes(): void {
    this.generateBiomeMap();
    this.exportBiomeMap();
    this.exportBiomeConfig();
}

private static generateBiomeMap(): void {
    const tm = (RuntimeMapGen as any).get(); // Assuming get() is static
    if (!tm.heightmapTexture?.image) {
        console.error("Heightmap not available for biome generation");
        return;
    }

    const heightmap = tm.heightmapTexture.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Use same dimensions as minimap cache for consistency
    const MAX_DIM = RuntimeMapGen.get().minimap_Resolution;
    const scale = Math.min(1, MAX_DIM / heightmap.width, MAX_DIM / heightmap.height);
    canvas.width = Math.floor(heightmap.width * scale);
    canvas.height = Math.floor(heightmap.height * scale);

    ctx.drawImage(heightmap, 0, 0, canvas.width, canvas.height);
    const heightData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Create biome canvas
    const biomeCanvas = document.createElement('canvas');
    biomeCanvas.width = canvas.width;
    biomeCanvas.height = canvas.height;
    const biomeCtx = biomeCanvas.getContext('2d')!;
    const biomeImageData = biomeCtx.createImageData(canvas.width, canvas.height);

    // Initialize noise functions for temperature and moisture
    // Use different seeds or offsets for temperature and moisture noise
    const tempNoise = this.createPerlinNoise(tm.biomeSeed);
    const moistureNoise = this.createPerlinNoise(tm.biomeSeed + 12345); // Use a different seed

    const terrainW = tm.heightmapSize.width * tm.Scale.x;
    const terrainH = tm.heightmapSize.height * tm.Scale.z;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            // Height value normalized to 0-1 based on terrainMaxHeight
            const heightValueNormalized = heightData[idx] / 255;
            const heightValueAbsolute = heightValueNormalized * tm.terrainMaxHeight;

            // Get world coordinates for noise sampling
            const worldX = (x / canvas.width - 0.5) * terrainW + tm.Offset.x;
            const worldZ = (y / canvas.height - 0.5) * terrainH + tm.Offset.z;

            // Calculate slope
            const slope = this.calculateSlope(heightData, x, y, canvas.width, canvas.height);

            // Determine biome color based on height, slope, temperature, and moisture
            const color = this.getBiomeColor(
                heightValueNormalized, // Pass normalized height
                slope,
                worldX,
                worldZ,
                tempNoise,
                moistureNoise,
                tm.oceanLevel,
                tm.beachRange,
                tm.STONE_SLOPE,
                tm.biomeScale,
                tm.noiseOctaves,
                tm.noiseLacunarity,
                tm.noisePersistence,
                tm.mountainHeightThreshold,
                tm.forestHeightThreshold,
                tm.valleyHeightThreshold,
                tm.tempThresholdTaiga,
                tm.moistureThresholdDesert,
                tm.tempThresholdDesert
            );

            // Set pixel color
            biomeImageData.data[idx] = parseInt(color.substr(1, 2), 16);
            biomeImageData.data[idx + 1] = parseInt(color.substr(3, 2), 16);
            biomeImageData.data[idx + 2] = parseInt(color.substr(5, 2), 16);
            biomeImageData.data[idx + 3] = 255;
        }
    }

    biomeCtx.putImageData(biomeImageData, 0, 0);
    this.generatedBiomeImage = biomeCanvas;
}

private static getBiomeColor(
    heightValueNormalized: number,
    slope: number,
    x: number,
    z: number,
    tempNoiseFunc: (x: number, y: number) => number,
    moistureNoiseFunc: (x: number, y: number) => number,
    oceanLevel: number,
    beachRange: number,
    stoneSlope: number,
    biomeScale: number,
    noiseOctaves: number,
    noiseLacunarity: number,
    noisePersistence: number,
    mountainHeightThreshold: number,
    forestHeightThreshold: number,
    valleyHeightThreshold: number,
    tempThresholdTaiga: number,
    moistureThresholdDesert: number,
    tempThresholdDesert: number
): string {

    // Ocean
    if (heightValueNormalized <= oceanLevel) {
        return "#00ddff"; // Ocean Blue
    }

    // Beach
    if (heightValueNormalized <= oceanLevel + beachRange) {
        return "#fff600"; // Beach Yellow
    }

    // Mountains (check slope first for steep areas)
    if (slope > stoneSlope || heightValueNormalized >= mountainHeightThreshold) {
         // Ensure mountains are not underwater or beach
         if (heightValueNormalized > oceanLevel + beachRange) {
             return "#a0522d"; // Mountain Brown (Replaced grayscale #888888)
         }
    }

    // Land biomes based on height, temperature, and moisture
    const temperature = this.generateFBM(tempNoiseFunc, x, z, biomeScale, noiseOctaves, noiseLacunarity, noisePersistence);
    const moisture = this.generateFBM(moistureNoiseFunc, x, z, biomeScale, noiseOctaves, noiseLacunarity, noisePersistence);

    // Taiga (High altitude, low temperature)
    if (heightValueNormalized >= forestHeightThreshold && temperature < tempThresholdTaiga) {
         // Ensure Taiga is not within mountain color range unless explicitly desired
         if (!(slope > stoneSlope || heightValueNormalized >= mountainHeightThreshold)) {
             return "#005500"; // Taiga Dark Green
         }
    }

    // Desert (Low moisture, high temperature)
    if (moisture < moistureThresholdDesert && temperature > tempThresholdDesert) {
         // Ensure Desert is not within mountain color range unless explicitly desired
         if (!(slope > stoneSlope || heightValueNormalized >= mountainHeightThreshold)) {
              return "#ffcc00"; // Desert Orange/Yellow
         }
    }

    // Forest (Moderate conditions, mid-high altitude)
    if (heightValueNormalized >= forestHeightThreshold) {
         // Ensure Forest is not within mountain color range unless explicitly desired
         if (!(slope > stoneSlope || heightValueNormalized >= mountainHeightThreshold)) {
             return "#00aa00"; // Forest Green
         }
    }

    // Valley (Default for lower land areas not covered by other specific biomes)
    // This acts as a fallback for areas that are not ocean, beach, mountain, taiga, desert, or higher forest.
    return "#55aa55"; // Valley Lighter Green
}

// Basic Perlin-like noise implementation (from original code)
// Returns values roughly between 0 and 1
private static createPerlinNoise(seed: number): (x: number, y: number) => number {
    const rand = (x: number, y: number) => {
        const v = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
        return v - Math.floor(v);
    };

    return (x: number, y: number) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const tl = rand(xi, yi);
        const tr = rand(xi + 1, yi);
        const bl = rand(xi, yi + 1);
        const br = rand(xi + 1, yi + 1);

        // Cosine interpolation
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        return tl + (tr - tl) * u + (bl - tl) * v + (br - tr - bl + tl) * u * v;
    };
}

// Function to generate Fractional Brownian Motion (fBM)
// Combines multiple octaves of noise
private static generateFBM(
    noiseFunc: (x: number, y: number) => number,
    x: number,
    y: number,
    scale: number,
    octaves: number,
    lacunarity: number,
    persistence: number
): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0; // Used for normalization

    for (let i = 0; i < octaves; i++) {
        // The base noise function returns 0-1, so we don't need to adjust for -1 to 1 range
        total += noiseFunc(x * frequency / scale, y * frequency / scale) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    // Normalize the result to be roughly between 0 and 1
    // Note: The range might slightly exceed 0-1 depending on the base noise and parameters,
    // but for biome thresholds, this normalization is usually sufficient.
    return total / maxAmplitude;
}


// Calculates the slope at a given point using the height data
private static calculateSlope(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): number {
    const getHeight = (px: number, py: number) => {
        px = Math.max(0, Math.min(px, width - 1));
        py = Math.max(0, Math.min(py, height - 1));
        return data[(py * width + px) * 4] / 255; // Normalized height
    };

    // Central difference method to estimate gradient
    const dx = (getHeight(x + 1, y) - getHeight(x - 1, y)) / 2;
    const dy = (getHeight(x, y + 1) - getHeight(x, y - 1)) / 2;

    // Magnitude of the gradient vector
    return Math.hypot(dx, dy);
}

// Exports the generated biome map as a PNG image
private static exportBiomeMap(): void {
    if (!this.generatedBiomeImage) return;

    const tm = (RuntimeMapGen as any).get();
    const link = document.createElement('a');
    link.download = `biomes_${tm.biomeSeed}.png`;
    link.href = this.generatedBiomeImage.toDataURL();
    link.click();
}

// Exports the biome configuration as a JSON file
private static exportBiomeConfig(): void {
    const tm = (RuntimeMapGen as any).get();
    const biomeConfig = {
        "defaultBiomeName": "Forest", // Default fallback biome name
        "voidBiomeName": "Void", // Biome name for areas outside the map (if applicable)
        "audioBaseDirectory": "MapGen/audio/", // Base directory for audio assets

        "biomes": {
            // Mapping biome colors to biome definitions
            "#00ddff": this.createBiomeDefinition("Ocean"),
            "#fff600": this.createBiomeDefinition("Beach"),
            "#a0522d": this.createBiomeDefinition("Mountain"),
            "#005500": this.createBiomeDefinition("Taiga"),
            "#ffcc00": this.createBiomeDefinition("Desert"),
            "#00aa00": this.createBiomeDefinition("Forest"),
            "#55aa55": this.createBiomeDefinition("Valley")
        }
    };

    const blob = new Blob([JSON.stringify(biomeConfig, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `biomes_${tm.biomeSeed}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
}

// Helper function to create a biome definition structure based on the new format
private static createBiomeDefinition(name: string): any { // Using 'any' for simplicity, define interface if available
    const lowerName = name.toLowerCase();
    return {
        displayName: name,
        foliageIndexes: [], // Always empty array from the start

        Sand_Texture: `MapGen/textures/${lowerName}_sand.png`,
        Dirt_Texture: `MapGen/textures/${lowerName}_dirt.png`,
        Grass_Texture: `MapGen/textures/${lowerName}_grass.png`,
        Stone_Texture: `MapGen/textures/${lowerName}_stone.png`,
        Snow_Texture: `MapGen/textures/${lowerName}_snow.png`,

        audio: {
            event: [`${lowerName}_event_01.wav`], // Example event audio path
            loop: [`${lowerName}_loop_01.wav`], // Example loop audio path
            soundtrack: [`${lowerName}_soundtrack_01.mp3`] // Example soundtrack audio path
        }
    };
}
// #endregion BiomeGen


  

  }