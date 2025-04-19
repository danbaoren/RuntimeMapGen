import * as RE from 'rogue-engine';
import * as THREE from 'three';

@RE.registerComponent
export default class DebugDisplay extends RE.Component {

  @RE.props.checkbox() debugMode: boolean = true;

  private debugPanel: HTMLDivElement | null = null;

  private fpsElement: HTMLDivElement | null = null;
  private frameTimeElement: HTMLDivElement | null = null;
  private memoryElement: HTMLDivElement | null = null;
  private trianglesElement: HTMLDivElement | null = null;
  private visibleTrianglesElement: HTMLDivElement | null = null;
  private activeObjectsElement: HTMLDivElement | null = null;

  private drawCallsElement: HTMLDivElement | null = null;
  private geometriesElement: HTMLDivElement | null = null;
  private texturesElement: HTMLDivElement | null = null;
  private programsElement: HTMLDivElement | null = null;

  private lastTime: number = 0;
  private frames: number = 0;
  private frameTimes: number[] = [];

  awake() {
    this.initializeDebugDisplay();
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  start() {
    RE.Runtime.onStop(() => {

      if (this.debugPanel && this.debugPanel.parentNode) {
        this.debugPanel.parentNode.removeChild(this.debugPanel);
        this.debugPanel.remove();
        this.debugPanel = null;
      }

      window.removeEventListener('keydown', this.onKeyDown.bind(this));

      this.fpsElement = null;
      this.frameTimeElement = null;
      this.memoryElement = null;
      this.trianglesElement = null;
      this.visibleTrianglesElement = null;
      this.activeObjectsElement.remove();
      this.activeObjectsElement = null;
      this.drawCallsElement = null;
      this.texturesElement.remove();
      this.geometriesElement = null;
      this.texturesElement = null;
      this.programsElement = null;

      this.lastTime = 0;
      this.frames = 0;
      this.frameTimes = [];

      this.debugMode = false;

      console.log('Debug UI and data fully deleted and disposed on Runtime Stop.');
    });
  }

  private initializeDebugDisplay() {
    this.debugPanel = document.createElement('div');
    this.debugPanel.style.position = 'absolute';
    this.debugPanel.style.top = '20px';
    this.debugPanel.style.left = '20px';
    this.debugPanel.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    this.debugPanel.style.color = '#eee';
    this.debugPanel.style.padding = '20px';
    this.debugPanel.style.borderRadius = '8px';
    this.debugPanel.style.zIndex = '1000';
    this.debugPanel.style.display = this.debugMode ? 'block' : 'none';
    this.debugPanel.style.fontFamily = 'Consolas, monospace';
    this.debugPanel.style.fontSize = '14px';
    this.debugPanel.style.lineHeight = '1.5';
    document.body.appendChild(this.debugPanel);

    // --- Priority 1: Performance ---
    const performanceBlock = this.createDebugBlock('Performance  [press ~ to hide]');
    this.fpsElement = this.createElement('div', performanceBlock);
    this.frameTimeElement = this.createElement('div', performanceBlock);
    this.memoryElement = this.createElement('div', performanceBlock);
    this.trianglesElement = this.createElement('div', performanceBlock);
    this.visibleTrianglesElement = this.createElement('div', performanceBlock);
    this.activeObjectsElement = this.createElement('div', performanceBlock);

    // --- More Resources ---
    const resourcesBlock = this.createDebugBlock('Resources');
    this.drawCallsElement = this.createElement('div', resourcesBlock);
    this.geometriesElement = this.createElement('div', resourcesBlock);
    this.texturesElement = this.createElement('div', resourcesBlock);
    this.programsElement = this.createElement('div', resourcesBlock);
  }

  private createDebugBlock(title: string): HTMLDivElement {
    const block = document.createElement('div');
    block.style.marginBottom = '15px';
    block.style.padding = '10px';
    block.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
    block.style.borderRadius = '5px';
    const titleElement = document.createElement('div');
    titleElement.style.fontWeight = 'bold';
    titleElement.style.marginBottom = '8px';
    titleElement.style.color = '#ddd';
    titleElement.textContent = title;
    block.appendChild(titleElement);
    this.debugPanel!.appendChild(block);
    return block;
  }

  private createElement(tagName: string, parent: HTMLElement): HTMLDivElement {
    const element = document.createElement(tagName);
    element.style.marginBottom = '5px';
    parent.appendChild(element);
    return element as HTMLDivElement;
  }

  update() {
    this.updateDebugDisplay();
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.key === '`' || event.key === '~') {
      this.debugMode = !this.debugMode;
      if (this.debugPanel) {
        this.debugPanel.style.display = this.debugMode ? 'block' : 'none';
      }
    }
  }

  private countObjects(object: THREE.Object3D): number {
    let count = 1;
    for (const child of object.children) {
      count += this.countObjects(child);
    }
    return count;
  }

  private updateDebugDisplay() {
    if (!this.debugMode) {
      return;
    }

    // Priority 1: Performance
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    if (deltaTime > 1000) {
      const fps = Math.round((this.frames * 1000) / deltaTime);
      this.fpsElement!.textContent = `FPS: ${fps}`;
      this.frames = 0;
      this.lastTime = now;
    }
    this.frames++;

    this.frameTimes.push(RE.Runtime.deltaTime * 1000);
    if (this.frameTimes.length > 30) {
      this.frameTimes.shift();
    }
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimeElement!.textContent = `Frame Time: ${averageFrameTime.toFixed(2)} ms`;

    const renderer = RE.Runtime.renderer as THREE.WebGLRenderer;
    const scene = RE.App.currentScene;
    const camera = RE.Runtime.camera;
    const info = renderer.info;

    let totalTriangles = 0;
    let visibleTriangles = 0;
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    scene.traverse((object: THREE.Object3D) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        const geometry = mesh.geometry;
        if (geometry) {
          let triangleCount = 0;
          if (geometry.index) {
            triangleCount = Math.floor(geometry.index.count / 3);
          } else if (geometry.attributes && geometry.attributes.position) {
            triangleCount = Math.floor(geometry.attributes.position.count / 3);
          }
          totalTriangles += triangleCount;

          // Check visibility
          if (mesh.material && (mesh.visible || (mesh as any).layers?.mask & camera.layers.mask) && frustum.intersectsObject(mesh)) {
            visibleTriangles += triangleCount;
          }
        }
      }
    });
    this.trianglesElement!.textContent = `Triangles Total ${totalTriangles.toLocaleString()}`;
    this.visibleTrianglesElement!.textContent = `Triangles Visible ${visibleTriangles.toLocaleString()}`;

    const totalObjects = this.countObjects(scene);
    this.activeObjectsElement!.textContent = `Scene Objects: ${totalObjects}`;

    // Priority 2: System Info
    const memory = (performance as any).memory;
    const memoryUsed = memory ? (memory.usedJSHeapSize / memory.totalJSHeapSize * 100).toFixed(2) : 'N/A';
    this.memoryElement!.textContent = `Memory Usage: ${memoryUsed}%`;

    // More Resources
    this.drawCallsElement!.textContent = `Draw Calls: ${info.render.calls}`;
    this.geometriesElement!.textContent = `Geometries: ${info.memory.geometries}`;
    this.texturesElement!.textContent = `Textures: ${info.memory.textures}`;
    this.programsElement!.textContent = `Shaders: ${info.programs!.length}`;
  }
}