/**
                                                  ⣤⣤
                                               ⣀⣤⣤⣀▓█▒⣀
                                            ⣀⣤⣀⣀⣿⣀⣀▓████░⣀
                                         ⣀⣷⣷⣷░⣿⣿░⣿⣿▓███████⣿
                                      ⣀⣿⣿⣷⣿⣷░⣤⣿⣤⣀⣀ ▒██████████⣷
                                   ⣀⣤⣀⣀⣀⣷⣤⣀⣀ ⣤⣤⣀⣀  ▒████████████▓⣷
                                ⣀⣤⣀⣀ ⣷⣤⣀⣀⣷ ⣤⣷⣀ ⣷⣷⣀⣀▒███████████████▓⣤
                             ⣀⣤⣀⣀⣀⣿ ⣀⣀⣀⣤⣷⣤⣿⣷░⣿⣿░⣷⣷⣷▓██████████████████▒⣀
                          ⣀⣤⣤⣤⣷░⣷⣷⣷⣿⣿⣿⣿⣿⣿⣿⣷░⣤⣤⣿⣀⣀⣤⣀▒█████████████████████▒⣀
                       ⣀⣷⣿░⣿⣿░⣿⣷⣷⣤⣤⣤⣷    ⣀⣿⣀⣀⣀⣀⣤⣀⣀⣀▒████████████████████████▒⣀
                    ⣀⣿⣷⣤⣷⣤⣀⣀ ⣷⣀⣀⣀⣀⣀⣤⣷ ⣷⣤⣀ ⣀⣷⣀⣤⣤⣷▒⣿⣿▓███████████████████████████▒⣀
                 ⣀⣤⣀⣀⣀⣀⣤⣀⣀⣀⣀⣀⣀⣀⣤⣀⣀⣷⣷⣷⣿⣷░⣷⣿⣿⣿⣿⣷⣿⣀ ⣀▒██████████████████████████████▒⣀
              ⣀⣷⣀⣀⣷⣀⣀⣀⣀⣤⣷⣤░░░▒░⣷░▒⣿⣿⣷⣷⣿⣀⣀ ⣀⣿ ⣀⣀⣤⣷  ▒█████████████████████████████████▒⣀
           ⣀⣷⣀⣀⣿⣷⣷⣿▒⣿⣿░░⣿▒⣤⣤⣿ ⣀⣀⣤⣷⣀⣀⣀⣀⣿ ⣀⣿  ⣀⣀░⣷⣷⣿⣿▓████████████████████████████████████▒⣀
              ⣀⣤⣷⣷⣿⣷⣤⣷░⣀⣀⣀ ⣀⣀⣿⣀ ⣷⣤⣤⣀⣤⣷░⣿⣿⣿⣿⣿⣿░⣤⣤⣀⣀ ▒████████████████████████████▓▒░⣿⣷⣤⣀⣀
                      ⣀⣀⣤⣤⣷⣤⣷⣿⣷⣷⣿⣀⣀⣀⣀⣤⣷⣀⣀⣀⣀ ⣀⣀⣤░⣿⣿⣿▓███████████████████▓▒░░⣿⣷⣤⣀
                                         ⣀⣤⣷⣷⣷⣿⣷⣷⣤⣤▒██▓▒░⣿⣷⣤⣤⣀
                                                   ⣀⣀⣀


                                         ┳┓     •       ┳┳┓    ┏┓
                                         ┣┫┓┏┏┓╋┓┏┳┓┏┓  ┃┃┃┏┓┏┓┃┓┏┓┏┓
                                         ┛┗┗┻┛┗┗┗┛┗┗┗   ┛ ┗┗┻┣┛┗┛┗ ┛┗
                                                             ┛



                            Runtime MapGen -- Fast deployment of Large Scale Terrains
                                      Rogue Engine Open-World Generator
                                              [WebGL/Three.js]


                                               Progress Bar
                                          [##############-----]
                                           70% feature-complete



        Yet to implement:

            [!] InstancedMesh2 -- better solution for dense foliage [lod, frustrum per inctance, etc]

            [!] Biomes -- large-scale octave that determnies weight of textures + per-biome foliage

            [!] Foliage animation per-group checkbox

            [!] Extend API for full control

            [?] Virtual/Atlas texture

            [?] Overhangs & Caves (load-stage procedural process, save 3d geometry) (transform faces, displace them, make overhangs)

            [!] option to save tile data into .bin, Stream these saved tiles geometries instead of generating on-runtime

            [!] Improved faces discard which hided from camera (reduce triangles visibility as much as possible)



        KTX2 cmd commands:

            [https://github.com/KhronosGroup/KTX-Software]

            Terrain Textures: toktx --2d --genmipmap --target_type RGBA --t2 --encode etc1s --clevel 5 --qlevel 255 "OutputPath/stone.ktx2" "InputPath/stone.jpg"




 */






import * as RE from 'rogue-engine';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TextureLoadManager from './TextureLoadManager.re';
import RMG_Export from './RMG_Export.re';
import RMG_LoadingBar from './RMG_LoadingBar.re';
import RMG_Navigation from './RMG_Navigation.re';
import RMG_Collision from './RMG_Collision.re';





//=======================================================================================
//
// #region CACHE
//
//=======================================================================================

    interface GeometryCache {
      geometry: THREE.BufferGeometry;
      lastUsed: number;
    }

    interface ColorCache {
      colors: Float32Array;
      lastUsed: number;
    }

    interface HeightCache {
      heights: Float32Array;
      lastUsed: number;
    }



//=======================================================================================
//
// #region QUADTREE
//
//=======================================================================================
    type Boundary = { x: number; y: number; width: number; height: number };

    interface QuadPoint<T> {
      x: number;
      y: number;
      data: T;
    }

    class Quadtree<T> {
      boundary: Boundary;
      capacity: number;
      points: QuadPoint<T>[];
      divided: boolean;
      northeast: Quadtree<T> | null;
      northwest: Quadtree<T> | null;
      southeast: Quadtree<T> | null;
      southwest: Quadtree<T> | null;

      constructor(boundary: Boundary, capacity: number) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
      }

      contains(x: number, y: number): boolean {
        return (
          x >= this.boundary.x &&
          x < this.boundary.x + this.boundary.width &&
          y >= this.boundary.y &&
          y < this.boundary.y + this.boundary.height
        );
      }

      intersects(range: Boundary): boolean {
        return !(
          range.x > this.boundary.x + this.boundary.width ||
          range.x + range.width < this.boundary.x ||
          range.y > this.boundary.y + this.boundary.height ||
          range.y + range.height < this.boundary.y
        );
      }

      subdivide() {
        const { x, y, width, height } = this.boundary;
        const halfW = width / 2;
        const halfH = height / 2;
        this.northeast = new Quadtree({ x: x + halfW, y: y, width: halfW, height: halfH }, this.capacity);
        this.northwest = new Quadtree({ x: x, y: y, width: halfW, height: halfH }, this.capacity);
        this.southeast = new Quadtree({ x: x + halfW, y: y + halfH, width: halfW, height: halfH }, this.capacity);
        this.southwest = new Quadtree({ x: x, y: y + halfH, width: halfW, height: halfH }, this.capacity);
        this.divided = true;
      }

      insert(point: QuadPoint<T>): boolean {
        if (!this.contains(point.x, point.y)) {
          return false;
        }

        if (this.points.length < this.capacity) {
          this.points.push(point);
          return true;
        }

        if (!this.divided) {
          this.subdivide();
        }
        return (
          this.northeast!.insert(point) ||
          this.northwest!.insert(point) ||
          this.southeast!.insert(point) ||
          this.southwest!.insert(point)
        );
      }

      query(range: Boundary, found: QuadPoint<T>[] = []): QuadPoint<T>[] {
        if (!this.intersects(range)) {
          return found;
        }

        for (const p of this.points) {
          if (
            p.x >= range.x &&
            p.x < range.x + range.width &&
            p.y >= range.y &&
            p.y < range.y + range.height
          ) {
            found.push(p);
          }
        }
        if (this.divided) {
          this.northwest!.query(range, found);
          this.northeast!.query(range, found);
          this.southwest!.query(range, found);
          this.southeast!.query(range, found);
        }
        return found;
      }
    }

//---------------------------------------------------------------------
// #region Chunk Data type
//---------------------------------------------------------------------
    type ChunkData = {
      key: string;
      originalPosition: THREE.Vector3;
      chunkParams: { startX: number; startY: number; width: number; height: number };
      lodGroup?: THREE.Group;
      lastActive: number;
      cacheKey: string;
      clippingHeight?: number;
    };



@RE.registerComponent
export default class RuntimeMapGen extends RE.Component {


//=======================================================================================
//
// #region API
//
//=======================================================================================

    // Example Calls
    /**
     *
     *
     *      // Chunk key (100_100, etc) from world position
     *    const worldPos = new THREE.Vector3(200, 100, 200);
     *    const chunkInfo = RE.getComponent(WorldGen).getChunkFromWorldPosition(worldPos).chunkData!.key;
     *    console.log(chunkInfo);
     *
     *
     *      // Chunk key of player/cameras locaiton
     *   const target = new THREE.Vector3;
     *   const worldPos = this.PLAYER_OBJECT3D.getWorldPosition(target);
     *   const chunkInfo = RE.getComponent(WorldGen).getChunkFromWorldPosition(worldPos).chunkData?.key;
     *   console.log(chunkInfo!);
     *   console.log(worldPos);
     *
     *
     *      // Changing render distance for your custom Quality Settings Menu
     *   RE.getComponent(WorldGen).high_RenderDistance = 1; // Setting High detailed Terrain
     *   RE.getComponent(WorldGen).low_RenderDistance = 1; // Setting Low detailed Terrain
     *
     *   You can call almost all variables like this and update them Real-time for perfomance optimizations and visual intresting effects
     *
     *
     *
     *
     * if (chunkInfo.chunkData) {
     *     console.log('Chunk found with parameters:', chunkInfo.chunkParams);
     *     console.log('World position of chunk center:', chunkInfo.worldPosition);
     *
     *     if (chunkInfo.geometry) {
     *         // Use geometry for collisions or other calculations
     *         const vertices = chunkInfo.geometry.attributes.position.array;
     *     }
     *
     *     if (chunkInfo.heights) {
     *         // Access height data array
     *         const heightAtCenter = chunkInfo.heights[
     *             Math.floor(chunkInfo.chunkParams.width/2) *
     *             Math.floor(chunkInfo.chunkParams.height/2)
     *         ];
     *     }
     *
     *     // Get precise height at exact world position
     *     const exactHeight = RE.getComponent(WorldGen).getPreciseHeight(worldPos);
     * }
     *
     *
     *
     */

    public worldToOriginalPosition(worldPos: THREE.Vector3): THREE.Vector3 {
        return new THREE.Vector3(
            (worldPos.x - this.Offset.x) / this.Scale.x,
            (worldPos.y - this.Offset.y) / this.Scale.y,
            (worldPos.z - this.Offset.z) / this.Scale.z
        );
    }

    public originalToWorldPosition(originalPos: THREE.Vector3): THREE.Vector3 {
        return new THREE.Vector3(
            originalPos.x * this.Scale.x + this.Offset.x,
            (originalPos.y - this.Offset.y) / this.Scale.y,
            originalPos.z * this.Scale.z + this.Offset.z
        );
    }

    public getChunkKeyFromOriginalPos(originalX: number, originalZ: number): string {
        const chunkX = Math.floor(originalX / this.chunk_Size) * this.chunk_Size;
        const chunkZ = Math.floor(originalZ / this.chunk_Size) * this.chunk_Size;
        return `${chunkX}_${chunkZ}`;
    }

    public getChunkFromWorldPosition(worldPos: THREE.Vector3): {
        chunkData: ChunkData | null,
        geometry: THREE.BufferGeometry | null,
        heights: Float32Array | null,
        worldPosition: THREE.Vector3,
        chunkParams: { startX: number, startY: number, width: number, height: number }
    } {
        // Convert to original coordinate space
        const originalPos = this.worldToOriginalPosition(worldPos);

        // Get chunk key
        const chunkKey = this.getChunkKeyFromOriginalPos(originalPos.x, originalPos.z);

        // Get chunk data from map
        const chunkData = this.chunksMap.get(chunkKey) || null;

        // Get cached geometry if available
        let geometry: THREE.BufferGeometry | null = null;
        let heights: Float32Array | null = null;

        if (chunkData) {
            const cacheKey = this.getCacheKey(chunkData.chunkParams);
            geometry = this.geometryCache.get(cacheKey)?.geometry || null;

            // Get height data
            const heightCacheKey = this.getCacheKey({
                ...chunkData.chunkParams,
                step: 1 // Assuming you want full resolution heights
            });
            heights = this.heightCache.get(heightCacheKey)?.heights || null;
        }

        return {
            chunkData,
            geometry,
            heights,
            worldPosition: this.originalToWorldPosition(
                new THREE.Vector3(
                    chunkData?.originalPosition.x || 0,
                    0,
                    chunkData?.originalPosition.z || 0
                )
            ),
            chunkParams: chunkData?.chunkParams || {
                startX: 0,
                startY: 0,
                width: 0,
                height: 0
            }
        };
    }

    public getPreciseHeight(worldPos: THREE.Vector3): number {
        const originalPos = this.worldToOriginalPosition(worldPos);
        return this.getHeight(originalPos.x, originalPos.z);
    }


    // RMG_Collision.addCollisionAt()
    // RMG_Collision.removeCollisionAt()



  //=======================================================================================
  //
  // #region LIFECYCLE
  //
  //=======================================================================================

    async awake() {
        if (this.View_Mode) {
            const camera = new THREE.PerspectiveCamera(
                90,
                window.innerWidth / window.innerHeight,
                1,
                100000
            );
            camera.name = "View Mode Camera [MapGen]"
            camera.position.y = 5000;
            camera.rotation.set(-20, 0, 0);
            this.object3d.add(camera);
            RE.App.activeCamera = camera.uuid;
            camera.updateProjectionMatrix();
            this.orbitControls = new OrbitControls(camera, RE.Runtime.rogueDOMContainer);
            this.orbitControls.enablePan = true;
        }
    }

    async start() {
        try {
            await this.loadAllTextures();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Initialize materials with loaded textures
            this.lowDetailMaterial = await this.createMaterial(false);
            this.highDetailMaterial = await this.createMaterial(true);

            this.highRenderDistanceSquared = this.high_RenderDistance * this.high_RenderDistance;
            this.lowRenderDistanceSquared = this.low_RenderDistance * this.low_RenderDistance;

            await this.generate();
        } catch (error) {
            console.error("Failed to initialize WorldGen:", error);
        }

        // Stop Runtime
        RE.Runtime.onStop(() => {
            this.activeCameras[0].remove();
            RMG_Navigation.disposeMapAndNavigation();
            RMG_Collision.removeAllRapierObjects();
            this.NukeScene();
            RMG_Collision.disposeAllCollisionData();
            RMG_LoadingBar.hideProgressBar();
            this.cleanupCache();
            if (this.View_Mode) {this.orbitControls.dispose();}
            RE.dispose(RE.Runtime.scene);
            RE.Runtime.scene.remove();
        });
    }

 

    async update() {
      this.updateCameras();

      if (this.activeCameras.length > 0) {
        this.activeCameras[0].getWorldDirection(this.cameraDirection);
        this.cameraViewProjectionMatrix.multiplyMatrices(
          this.activeCameras[0].projectionMatrix,
          this.activeCameras[0].matrixWorldInverse
        );
        this.cameraFrustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);

      }

      // Check if Scale or Offset has changed and update chunk positions
      if (!this.Scale.equals(this.previousScale) || !this.Offset.equals(this.previousOffset)) {
        this.updateChunkPositions();
        this.previousScale.copy(this.Scale);
        this.previousOffset.copy(this.Offset);
      }

      const now = performance.now();
      if (now - this.lastLodUpdate > this.lodUpdateInterval) {
        this.updateChunkLoading();
        this.updateLOD();
        this.lastLodUpdate = now;
      }

      // Clean up cache periodically
      if (now - this.lastCacheCleanup > this.cacheCleanupInterval) {
        this.cleanupCache();
        this.lastCacheCleanup = now;
      }

      this.processChunkQueue();
      this.processHighDetailQueue().catch(console.error);

       if (this.isMapLoaded && this.RapierCollision && this.activeCameras.length > 0) {
          const cameraPos = new THREE.Vector3();
          this.activeCameras[0].getWorldPosition(cameraPos);
          RMG_Collision.updateCollisionChunks(cameraPos);
      }


    if (now - this.lastDeletionBatchTime >= this.deletionBatchDelay) {
        this.processDeactivationBatch();
        this.lastDeletionBatchTime = now;
      }

      // Process cleanup batches
      if (now - this.lastCleanupBatchTime >= this.deletionBatchDelay) {
        this.processCleanupBatch();
        this.lastCleanupBatchTime = now;
        }


      this.updateShaderUniforms();

    }

    private cleanupCache() {
      const now = Date.now();
      const maxAge = 60000; // 1 minute

      // Clean up geometry cache
      for (const [key, cache] of this.geometryCache) {
        if (now - cache.lastUsed > maxAge) {
          cache.geometry.dispose();
          this.geometryCache.delete(key);
        }
      }

      // Clean up color cache
      for (const [key, cache] of this.colorCache) {
        if (now - cache.lastUsed > maxAge) {
          this.colorCache.delete(key);
        }
      }

      // Clean up height cache
      for (const [key, cache] of this.heightCache) {
        if (now - cache.lastUsed > maxAge) {
          this.heightCache.delete(key);
        }
      }

      // If cache is still too large, remove least recently used items
      if (this.geometryCache.size > this.maxCacheSize) {
        const entries = Array.from(this.geometryCache.entries());
        entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

        for (let i = 0; i < entries.length - this.maxCacheSize; i++) {
          entries[i][1].geometry.dispose();
          this.geometryCache.delete(entries[i][0]);
        }
      }
    }

    private getCacheKey(params: {
      startX: number;
      startY: number;
      width: number;
      height: number;
      step?: number;
      lodFactor?: number;
      clippingHeight?: number;
    }): string {return `${params.startX}_${params.startY}_${params.width}_${params.height}_${params.step || 1}_${params.lodFactor || 1}`;}

    private async loadAllTextures(): Promise<void> {
    const textureDetails = [
        { prop: this.sandTexture, filename: "sand.ktx2", target: 'sandTexture' },
        { prop: this.grassTexture, filename: "grass.ktx2", target: 'grassTexture' },
        { prop: this.stoneTexture, filename: "stone.ktx2", target: 'stoneTexture' },
        { prop: this.dirtTexture, filename: "dirt.ktx2", target: 'dirtTexture' },
        { prop: this.snowTexture, filename: "snow.ktx2", target: 'snowTexture' }
    ];

    const texturePromises = textureDetails.map(async ({ prop, filename, target }) => {
        const fullPath = this.texturesStaticPath + filename;
        const texture = await TextureLoadManager.loadTexture(prop, fullPath);
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.colorSpace = THREE.LinearSRGBColorSpace;
            texture.flipY = true;
            texture.mapping = THREE.UVMapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            this[target] = texture;
        }
    });

    await Promise.all(texturePromises);
}

    private NukeScene(): void {
      const scene = RE.Runtime.scene as THREE.Scene;

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }

        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          const materials = Array.isArray(mat) ? mat : [mat];
          for (const m of materials) {
            for (const key of Object.keys(m)) {
              const value = (m as any)[key];
              if (value && value.isTexture) {
                (value as THREE.Texture).dispose();
              }
            }
            m.dispose();
          }
        }

        if ((obj as any).renderTarget instanceof THREE.WebGLRenderTarget) {
          (obj as any).renderTarget.dispose();
        }
      });

      scene.children.slice().forEach((child) => {
        scene.remove(child);
      });

        RE.traverseComponents((component: any, objectUUID: string) => {
          RE.removeComponent(component);
        });
    }



  //=======================================================================================
  //
  // #region LOD
  //
  //=======================================================================================

    private highDetailRemovalDelay: number = 1;
    private scheduledHighDetailRemovals: Map<THREE.Mesh, number> = new Map();

    private updateLOD() {
        if (!this.activeCameras.length) return;

        const now = Date.now();
        const transitionDelay = 1; // Delay (in ms) before switching to high-detail material
        const highRenderDistanceSquared = this.highRenderDistanceSquared;
        const offsetX = this.Offset.x;
        const offsetZ = this.Offset.z;
        const scaleX = this.Scale.x;
        const scaleZ = this.Scale.z;
        const invScaleX = scaleX !== 0 ? 1 / scaleX : 1;
        const invScaleZ = scaleZ !== 0 ? 1 / scaleZ : 1;
        const cullingThreshold = Math.cos(THREE.MathUtils.degToRad(this.backfaceCullingAngle));

        // Temporary vectors to avoid allocation
        const camPos = new THREE.Vector3();
        const groupPos = new THREE.Vector3();
        const chunkDirection = new THREE.Vector3();
        const chunkHorizontal = new THREE.Vector3();

        // Get the camera's world position and direction
        const camera = this.activeCameras[0];
        camera.getWorldPosition(camPos);
        camera.getWorldDirection(this.cameraDirection);

        // Apply an occlusion offset to the camera position
        const offsetDirection = this.cameraDirection.clone().negate().multiplyScalar(this.occlusionOffset);
        const offsetCamPos = camPos.clone().add(offsetDirection);

        // Convert camera position to "original space"
        const originalCamX = (offsetCamPos.x - offsetX) * invScaleX;
        const originalCamZ = (offsetCamPos.z - offsetZ) * invScaleZ;
        const cameraHorizontal = new THREE.Vector3(this.cameraDirection.x, 0, this.cameraDirection.z).normalize();

        // Array to hold chunks that require high-detail processing
        const chunksNeedingHighDetail: { group: THREE.Group; distanceSquared: number }[] = [];

        // **Triangle Limit Check and Deactivation**
        if (this.terrainTriangleCount >= this.triangleLimit) {
            //console.warn("Triangle limit reached in updateLOD. Deactivating furthest high-detail chunks.");

            const highDetailChunks: { group: THREE.Group; distanceSquared: number }[] = [];
            let closestChunkGroup: THREE.Group | null = null;
            let minDistanceSquared = Infinity;

            for (const lodGroup of this.lodGroups) {
                if (lodGroup.children.some(c => c.name === 'high')) {
                    lodGroup.getWorldPosition(groupPos);
                    const distanceSquared = camPos.distanceToSquared(groupPos);
                    highDetailChunks.push({ group: lodGroup, distanceSquared });
                    if (distanceSquared < minDistanceSquared) {
                        minDistanceSquared = distanceSquared;
                        closestChunkGroup = lodGroup;
                    }
                } else if (!lodGroup.children.some(c => c.name === 'low')) {
                    // Ensure all loaded chunks have at least a low-detail mesh
                    this.generateChunkLowDetail(lodGroup, 2);
                }
            }

            highDetailChunks.sort((a, b) => b.distanceSquared - a.distanceSquared);

            for (const chunkInfo of highDetailChunks) {
                if (this.terrainTriangleCount < this.triangleLimit) {
                    break; // Limit reached, stop deactivating
                }
                if (chunkInfo.group !== closestChunkGroup) {
                    this.deactivateHighDetailMesh(chunkInfo.group);
                }
            }
        }

        // Process each LOD group
        for (let i = 0, len = this.lodGroups.length; i < len; i++) {
            const group = this.lodGroups[i];
            group.getWorldPosition(groupPos);

            // Determine the horizontal direction from the camera to the chunk
            chunkDirection.copy(groupPos).sub(offsetCamPos).normalize();
            chunkHorizontal.set(chunkDirection.x, 0, chunkDirection.z).normalize();

            // Culling: if the chunk is not sufficiently facing the camera, schedule deactivation and skip it
            const horizontalDot = cameraHorizontal.dot(chunkHorizontal);
            const hasHighDetail = group.children.some(c => c.name === 'high');

            if (horizontalDot < cullingThreshold) {
                if (hasHighDetail) {
                    this.fastDeactivateHighDetailChunk(group);
                } else {
                    this.scheduleChunkDeactivation(group);
                }
                continue;
            } else {
                this.cancelChunkDeactivation(group);
                group.visible = true;
            }

            // Calculate the chunk's squared distance (in chunk units)
            const originalGroupX = (groupPos.x - offsetX) * invScaleX;
            const originalGroupZ = (groupPos.z - offsetZ) * invScaleZ;
            const distanceSquared = this.getSquaredDistanceInChunks(
                originalCamX,
                originalCamZ,
                originalGroupX,
                originalGroupZ
            );

            // Look for existing meshes by name ("high" for high-detail, "low" for low-detail)
            let highMesh: THREE.Mesh | undefined;
            let lowMesh: THREE.Mesh | undefined;
            for (let j = 0, clen = group.children.length; j < clen; j++) {
                const child = group.children[j];
                if (child.name === 'high') {
                    highMesh = child as THREE.Mesh;
                } else if (child.name === 'low') {
                    lowMesh = child as THREE.Mesh;
                }
            }

            // Within high-detail range
            if (distanceSquared <= highRenderDistanceSquared) {
                chunksNeedingHighDetail.push({ group, distanceSquared });
                if (highMesh) {
                    // If a high-detail mesh exists, start (or continue) the transition timer
                    if (!group.userData.highTransitionStart) {
                        group.userData.highTransitionStart = now;
                    }
                    if (now - group.userData.highTransitionStart >= transitionDelay) {
                        // Transition complete: show the high-detail mesh with its material
                        highMesh.material = this.highDetailMaterial;
                        highMesh.visible = true;
                        if (lowMesh) lowMesh.visible = false;
                    } else {
                        // Transition ongoing: keep low-detail mesh visible
                        if (lowMesh) {
                            lowMesh.material = this.lowDetailMaterial;
                            lowMesh.visible = true;
                        }
                        highMesh.visible = false;
                    }
                } else {
                    // If no high-detail mesh exists, queue generation and keep low mesh if available
                    this.addToHighDetailQueue(group, Math.sqrt(distanceSquared));
                    if (lowMesh) {
                        lowMesh.material = this.lowDetailMaterial;
                        lowMesh.visible = true;
                    }
                }
            } else {
                // Outside high-detail range: reset any transition timer
                group.userData.highTransitionStart = null;
                // Use the low-detail mesh exclusively
                if (lowMesh) {
                    lowMesh.material = this.lowDetailMaterial;
                    lowMesh.visible = true;
                } else {
                    this.activateChunk(group, Math.sqrt(distanceSquared));
                }
                if (highMesh) {
                    highMesh.visible = false;
                }
            }

            // Update the chunk's last active time for LOD management
            group.userData.lastActive = now;
        }

        // Process queued high-detail chunks (sorted by proximity)
        chunksNeedingHighDetail.sort((a, b) => a.distanceSquared - b.distanceSquared);
        for (let i = 0, len = chunksNeedingHighDetail.length; i < len; i++) {
            const { group, distanceSquared } = chunksNeedingHighDetail[i];
            if (distanceSquared <= highRenderDistanceSquared) {
                this.addToHighDetailQueue(group, Math.sqrt(distanceSquared));
            }
        }

        this.processHighDetailRemovals();
    }

    private fastDeactivateHighDetailChunk(group: THREE.Group) {
        const highMesh = group.children.find(c => c.name === 'high') as THREE.Mesh | undefined;
        const lowMesh = group.children.find(c => c.name === 'low') as THREE.Mesh | undefined;

        if (highMesh) {
            highMesh.visible = false;
            if (lowMesh) {
                lowMesh.visible = true;
                // Schedule removal of the high-detail mesh
                const removalTime = Date.now() + this.highDetailRemovalDelay;
                this.scheduledHighDetailRemovals.set(highMesh, removalTime);
                this.clearFoliage(group);
            } else {
                // Low-detail mesh is missing, add to processing queue to generate it
                this.processingQueue.push({ group, distance: 0 }); // Distance doesn't matter here, just need to trigger generation
                this.processingQueue.sort((a, b) => a.distance - b.distance);

                // Schedule removal of the high-detail mesh with the regular delay.
                const removalTime = Date.now() + this.highDetailRemovalDelay;
                this.scheduledHighDetailRemovals.set(highMesh, removalTime);
            }
        }
    }

    private processHighDetailRemovals() {
        const now = Date.now();
        const meshesToRemove: THREE.Mesh[] = [];

        this.scheduledHighDetailRemovals.forEach((time, mesh) => {
            if (now >= time) {
                const parent = mesh.parent;
                if (parent) {
                    const lowMesh = parent.children.find(c => c.name === 'low') as THREE.Mesh | undefined;
                    if (lowMesh) {
                        meshesToRemove.push(mesh);
                    }
                }
            }
        });

        meshesToRemove.forEach(mesh => {
            const parent = mesh.parent;
            if (parent) {
                parent.remove(mesh);
            }
            this.scheduledHighDetailRemovals.delete(mesh);
        });
    }

    private isChunkOccludedByHeightmap(cameraPos: THREE.Vector3, chunkPos: THREE.Vector3): boolean {
        const startX = Math.min(cameraPos.x, chunkPos.x);
        const endX = Math.max(cameraPos.x, chunkPos.x);
        const startZ = Math.min(cameraPos.z, chunkPos.z);
        const endZ = Math.max(cameraPos.z, chunkPos.z);

        const deltaX = chunkPos.x - cameraPos.x;
        const deltaY = chunkPos.y - cameraPos.y;
        const deltaZ = chunkPos.z - cameraPos.z;

        const distanceXZ = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
        if (distanceXZ === 0) return false; // No occlusion if camera and chunk are at the same spot

        const numSamples = Math.max(2, Math.floor(distanceXZ / Math.max(this.chunk_Size, this.chunk_Size) / 2)); // Adjust sampling density

        for (let i = 1; i <= numSamples; i++) {
            const fraction = i / (numSamples + 1);
            const sampleWorldX = cameraPos.x + deltaX * fraction;
            const sampleWorldZ = cameraPos.z + deltaZ * fraction;

            // Get terrain height at the sample point
            const terrainHeight = this.getHeight(sampleWorldX - this.Offset.x, sampleWorldZ - this.Offset.z);

            // Calculate the height of the line of sight at the sample point (linear interpolation)
            const lineOfSightHeight = cameraPos.y + deltaY * fraction;

            if (terrainHeight >= lineOfSightHeight + this.occlusionCheckTolerance) {
                return true; // Occluded
            }
        }

        return false; // Not occluded
    }

    private updateChunkLoading() {
        if (!this.activeCameras.length || !this.quadtree) return;

        const now = performance.now();
        if (now - this.lastPriorityUpdate < this.priority_UpdateInterval) return;
        this.lastPriorityUpdate = now;

        const HYSTERESIS_FACTOR = 1.2;
        const loadDistance = this.low_RenderDistance;
        const unloadDistance = this.low_RenderDistance * HYSTERESIS_FACTOR;
        const loadDistanceSquared = loadDistance * loadDistance;
        const unloadDistanceSquared = unloadDistance * unloadDistance;

        const camPos = new THREE.Vector3();
        this.activeCameras[0].getWorldPosition(camPos);
        this.activeCameras[0].getWorldDirection(this.cameraDirection);

        const offsetDirection = this.cameraDirection.clone().negate().multiplyScalar(this.occlusionOffset * HYSTERESIS_FACTOR);
        const offsetCamPos = camPos.clone().add(offsetDirection);

        const invScaleX = this.Scale.x !== 0 ? 1 / this.Scale.x : 1;
        const invScaleZ = this.Scale.z !== 0 ? 1 / this.Scale.z : 1;
        const originalCamX = (offsetCamPos.x - this.Offset.x) * invScaleX;
        const originalCamZ = (offsetCamPos.z - this.Offset.z) * invScaleZ;

        // Get terrain height at camera position (world space)
        const worldCamX = originalCamX * this.Scale.x + this.Offset.x;
        const worldCamZ = originalCamZ * this.Scale.z + this.Offset.z;
        const terrainHeightAtCamera = this.getHeight(worldCamX, worldCamZ);
        const cameraHeightAboveTerrain = offsetCamPos.y - terrainHeightAtCamera;

        let currentUnloadDistance = unloadDistance;

        if (cameraHeightAboveTerrain < this.distantChunkLoadHeightThreshold) {
            // Camera is low, reduce unload distance for distant chunks
            const heightRatio = Math.max(0, cameraHeightAboveTerrain / this.distantChunkLoadHeightThreshold);
            // Reduce unload distance, but ensure it doesn't go below load distance
            currentUnloadDistance = loadDistance + (unloadDistance - loadDistance) * heightRatio;
        }

        const queryRange: Boundary = {
            x: originalCamX - currentUnloadDistance * this.chunk_Size,
            y: originalCamZ - currentUnloadDistance * this.chunk_Size,
            width: currentUnloadDistance * this.chunk_Size * 2,
            height: currentUnloadDistance * this.chunk_Size * 2
        };

        const foundChunks = this.quadtree.query(queryRange);
        const activeKeys = new Set<string>();
        const chunkPriorities: Array<{data: ChunkData, priority: number, distanceSquared: number}> = [];
        const chunksToKeep = new Set<string>();

        this.chunksMap.forEach((data) => {
            if (data.lodGroup) {
                const distanceSquared = this.getSquaredDistanceInChunks(
                    originalCamX,
                    originalCamZ,
                    data.originalPosition.x,
                    data.originalPosition.z
                );

                if (distanceSquared <= unloadDistanceSquared) {
                    chunksToKeep.add(data.key);
                    activeKeys.add(data.key);
                }
            }
        });

        for (const point of foundChunks) {
            const data = point.data;
            if (chunksToKeep.has(data.key)) continue;

            const worldPosition = data.originalPosition.clone()
                .multiply(this.Scale)
                .add(this.Offset);

            const chunkDirection = new THREE.Vector3()
                .subVectors(worldPosition, offsetCamPos)
                .normalize();
            if (chunkDirection.dot(this.cameraDirection) < Math.cos(THREE.MathUtils.degToRad(this.backfaceCullingAngle))) {
                continue;
            }

            const distanceSquared = this.getSquaredDistanceInChunks(
                originalCamX,
                originalCamZ,
                data.originalPosition.x,
                data.originalPosition.z
            );

            // Check triangle limit before activating new chunks
            if (this.terrainTriangleCount >= this.triangleLimit) {
                //console.warn("Triangle limit reached. Not activating new chunks.");
                continue; // Skip activating this new chunk
            }

            if (distanceSquared <= loadDistanceSquared) {
                // Perform occlusion check
                if (!this.isChunkOccludedByHeightmap(offsetCamPos, worldPosition)) {
                    activeKeys.add(data.key);

                    if (!data.lodGroup || !data.lodGroup.parent) {
                        data.lodGroup = this.createChunkLODGroup(data.key, data.chunkParams, data.originalPosition);
                        this.chunksFolder!.add(data.lodGroup);
                    }

                    const priority = 1 / (distanceSquared + 0.01);
                    chunkPriorities.push({ data, priority, distanceSquared });
                }
            }
        }

        chunkPriorities.sort((a, b) => b.priority - a.priority);
        for (const {data, distanceSquared} of chunkPriorities) {
            this.activateChunk(data.lodGroup!, Math.sqrt(distanceSquared));
        }

        this.chunksMap.forEach((data) => {
            if (data.lodGroup && !activeKeys.has(data.key)) {
                this.deactivateChunk(data.lodGroup);
            }
        });

        chunksToKeep.forEach(key => {
            const data = this.chunksMap.get(key);
            if (data && data.lodGroup) {
                data.lastActive = now;
            }
        });
    }

    private createChunkLODGroup(key: string, chunkParams: { startX: number; startY: number; width: number; height: number }, originalPosition: THREE.Vector3
    ): THREE.Group {
      let lodGroup = this.lodGroups.find(g => g.name === `${key}_LOD`);

      if (!lodGroup) {
        lodGroup = new THREE.Group();
        lodGroup.name = `${key}_LOD`;
        lodGroup.receiveShadow = true;
        lodGroup.castShadow = true;
        this.chunksFolder!.castShadow = true;
        this.chunksFolder!.receiveShadow = true;
        this.lodGroups.push(lodGroup);
        if (this.chunksFolder) this.chunksFolder.add(lodGroup);
      }

      const worldPosition = originalPosition.clone()
        .multiply(this.Scale)
        .add(this.Offset);

      lodGroup.position.copy(worldPosition);
      lodGroup.scale.copy(this.Scale);
      lodGroup.userData = {
        chunkParams,
        lastActive: Date.now(),
        key,
        cacheKey: this.getCacheKey(chunkParams)
      };

      return lodGroup;
    }

    private processChunkQueue() {
  const now = performance.now();
  if (now - this.lastProcessTime >= this.next_Chunk_ms &&
    this.activeProcesses < this.Concurrent_Chunks &&
    this.processingQueue.length > 0) {

    const availableSlots = this.Concurrent_Chunks - this.activeProcesses;
    const chunksToProcess = this.processingQueue.splice(0, availableSlots);

    chunksToProcess.forEach(({ group }) => {
      this.activeProcesses++;
      // You need to determine the appropriate lodFactor here based on your LOD strategy
      const lodFactor = 2; // Example lodFactor - replace with your logic
      this.generateChunkLowDetail(group, lodFactor)
        .finally(() => this.activeProcesses--);
    });

    this.lastProcessTime = now;
  }
}

    private activateChunk(group: THREE.Group | undefined, distance: number) {
      if (!group || !group.children) {
        console.warn('Attempted to activate invalid chunk group');
        return;
      }

      // Cancel any pending removal of the *group*
      if (this.scheduledRemovals.has(group)) {
        clearTimeout(this.scheduledRemovals.get(group)!);
        this.scheduledRemovals.delete(group);
      }
      this.cancelChunkDeactivation(group); // Ensure no pending deactivation

      // Cancel any pending removal of the high-detail mesh within this group
      group.children.forEach(child => {
          if (child instanceof THREE.Mesh && this.scheduledHighDetailRemovals.has(child)) {
              this.scheduledHighDetailRemovals.delete(child);
          }
      });

      // Remove from processing queue to avoid duplicates
      this.processingQueue = this.processingQueue.filter(item => item.group !== group);

      group.visible = true;
      group.userData.lastActive = Date.now();

      // Check for existing low mesh using safe optional chaining
      const hasLowMesh = group.children.some(c => c.name === 'low');

      if (!hasLowMesh) {
        this.processingQueue.push({ group, distance });
        this.processingQueue.sort((a, b) => a.distance - b.distance);
      }

  }

    private deactivateChunk(group: THREE.Group): void {
  if (this.scheduledCleanups.has(group)) return;

  const cleanupTime = Date.now() + this.removalDelay;
  this.scheduledCleanups.set(group, cleanupTime);
  group.visible = false;

  // If a high-detail mesh exists, ensure it's not lingering for fast removal
  const highMesh = group.children.find(c => c.name === 'high') as THREE.Mesh | undefined;
  if (highMesh && this.scheduledHighDetailRemovals.has(highMesh)) {
      this.scheduledHighDetailRemovals.delete(highMesh);
      if (highMesh.parent) {
          highMesh.parent.remove(highMesh);
      }
  }
}

    private updateCameras() {
      if (this.activeCameras.length === 0) {
        RE.Runtime.scene.traverse((object) => {
          if (object instanceof THREE.Camera) {
            this.activeCameras.push(object);

          }
        });
      }
    }

    private updateChunkPositions() {
      this.chunksMap.forEach((data) => {
        if (data.lodGroup) {
          const adjustedPosition = data.originalPosition.clone()
            .multiply(this.Scale)
            .add(this.Offset);

          data.lodGroup.position.copy(adjustedPosition);
          data.lodGroup.scale.copy(this.Scale);
          data.lodGroup.updateMatrixWorld(true);
        }
      });
    }

    private scheduleChunkDeactivation(group: THREE.Group) {
  if (this.scheduledDeactivations.has(group)) return;

  // Schedule deactivation after the defined delay
  const deactivateTime = Date.now() + this.DeactivationDelay;
  this.scheduledDeactivations.set(group, deactivateTime);
}

    private cleanupChunk(group: THREE.Group) {
  const key = group.userData.key;
  const data = this.chunksMap.get(key);
  if (data) {
    data.lodGroup = undefined;
  }

  // Remove all children from the group, including any pending high-detail removals
  while (group.children.length > 0) {
    const child = group.children[0];
    if (child instanceof THREE.Mesh && this.scheduledHighDetailRemovals.has(child)) {
        this.scheduledHighDetailRemovals.delete(child);
    }
    group.remove(child);
  }

  // Remove the group from its parent (e.g., chunksFolder)
  if (group.parent) {
    group.parent.remove(group);
  }

  // Remove the group from the lodGroups tracking array
  this.lodGroups = this.lodGroups.filter(g => g !== group);
}

    private cancelChunkDeactivation(group: THREE.Group) {
  this.scheduledDeactivations.delete(group);
  this.scheduledCleanups.delete(group);
}

    private addToHighDetailQueue(group: THREE.Group, distance: number) {
      for (let i = 0; i < this.highDetailQueue.length; i++) {
        if (this.highDetailQueue[i].group === group) return;
      }

      const priority = 1 / (distance + 0.1);

      let insertIndex = 0;
      while (insertIndex < this.highDetailQueue.length &&
            this.highDetailQueue[insertIndex].priority > priority) {
        insertIndex++;
      }

      this.highDetailQueue.splice(insertIndex, 0, { group, priority });
    }

    private getSquaredDistanceInChunks(originalCamX: number, originalCamZ: number, chunkX: number, chunkZ: number): number {
      const dx = (originalCamX - chunkX) / this.chunk_Size;
      const dz = (originalCamZ - chunkZ) / this.chunk_Size;
      return dx * dx + dz * dz;
    }

    private async processDeactivationBatch() {
  const now = Date.now();
  const groupsToProcess: THREE.Group[] = [];

  // Identify groups whose deactivation time has passed
  this.scheduledDeactivations.forEach((time, group) => {
    if (now >= time) {
      groupsToProcess.push(group);
    }
  });

  // Process only a fixed number of groups at once
  const batch = groupsToProcess.slice(0, this.deletionConcurrency);
  for (const group of batch) {
    // Remove from the deactivation schedule
    this.scheduledDeactivations.delete(group);

    // Hide the group
    group.visible = false;

    // Instead of removing children immediately, rely on the faster high-detail removal
    // and the regular cleanup process for the entire group.

    // Schedule cleanup after an adjustable delay.
    const cleanupTime = Date.now() + this.deletionBatchDelay;
    this.scheduledCleanups.set(group, cleanupTime);

    // Yield after processing each group
    await this.yieldDelay();
  }
}

    private async processCleanupBatch() {
  const now = Date.now();
  const groupsToCleanup: THREE.Group[] = [];

  // Gather groups whose cleanup time has passed
  this.scheduledCleanups.forEach((time, group) => {
    if (now >= time) {
      groupsToCleanup.push(group);
    }
  });

  // Process in batches (using deletionConcurrency to limit simultaneous removals)
  const batch = groupsToCleanup.slice(0, this.deletionConcurrency);
  for (const group of batch) {
    this.scheduledCleanups.delete(group);
    this.cleanupChunk(group);
    // Yield between removals to avoid long blocks
    await this.yieldDelay();
  }
}

    private initializeQuadtree() {
      this.chunksMap = new Map<string, ChunkData>();
      // Adjust quadtree boundary to be centered
      this.quadtree = new Quadtree<ChunkData>(
        {
          x: -this.heightmapSize.width / 2,
          y: -this.heightmapSize.height / 2,
          width: this.heightmapSize.width,
          height: this.heightmapSize.height
        },
        4
      );

      for (let y = 0; y < this.heightmapSize.height; y += this.chunk_Size) {
        for (let x = 0; x < this.heightmapSize.width; x += this.chunk_Size) {
          const chunkWidth = Math.min(this.chunk_Size, this.heightmapSize.width - x);
          const chunkHeight = Math.min(this.chunk_Size, this.heightmapSize.height - y);

          const key = `${x}_${y}`;
          // Center chunk positions relative to map center
          const position = new THREE.Vector3(
            (x + chunkWidth / 2) - this.heightmapSize.width / 2,
            0,
            (y + chunkHeight / 2) - this.heightmapSize.height / 2
          );

          const chunkData: ChunkData = {
            key,
            originalPosition: position,
            chunkParams: { startX: x, startY: y, width: chunkWidth, height: chunkHeight },
            lastActive: Date.now(),
            cacheKey: this.getCacheKey({ startX: x, startY: y, width: chunkWidth, height: chunkHeight })
          };

          this.chunksMap.set(key, chunkData);
          this.quadtree!.insert({
            x: position.x,
            y: position.z, // Using Z coordinate as Y in quadtree for 2D spatial indexing
            data: chunkData
          });
        }
      }
    }

    private async yieldDelay(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


//=======================================================================================
//
// #region GEOMETRY COMPUTATION
//
//=======================================================================================

    public async generateChunkGeometry(
        startX: number,
        startY: number,
        width: number,
        height: number,
        step: number = 1,
        lodFactor: number = 1
        ): Promise<THREE.BufferGeometry> {
    // Generate cache key for this chunk configuration
    const cacheKey = this.getCacheKey({ startX, startY, width, height, step, lodFactor });

    // Check cache first
    if (this.geometryCache.has(cacheKey)) {
        const cached = this.geometryCache.get(cacheKey)!;
        cached.lastUsed = Date.now();
        return cached.geometry;
    }


    // Check height cache or generate heights
    const heightCacheKey = this.getCacheKey({ startX, startY, width, height, step });
    let heights: Float32Array;

    if (this.heightCache.has(heightCacheKey)) {
        heights = this.heightCache.get(heightCacheKey)!.heights;
        this.heightCache.get(heightCacheKey)!.lastUsed = Date.now();
    } else {
        const numRows = Math.floor(height / step) + 1;
        const numCols = Math.floor(width / step) + 1;
        const totalVertices = numRows * numCols;
        heights = new Float32Array(totalVertices);

        for (let row = 0; row < numRows; row++) {
            const y = startY + row * step;
            const rowOffset = row * numCols;
            for (let col = 0; col < numCols; col++) {
            const x = startX + col * step;
            heights[rowOffset + col] = this.getHeight(x, y);
            }
            if (row % 50 === 0) await Promise.resolve();
        }

        this.heightCache.set(heightCacheKey, {
        heights,
        lastUsed: Date.now()
        });
    }



    // Calculate LOD-adjusted parameters
    const lodVertexStep = step * Math.max(1, Math.floor(lodFactor));
    const numRows = Math.floor(height / lodVertexStep) + 1;
    const numCols = Math.floor(width / lodVertexStep) + 1;
    const totalVertices = numRows * numCols;

    // Create buffers
    const positions = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Fill position and UV buffers
    let posIndex = 0, uvIndex = 0;
    for (let row = 0; row < numRows; row++) {
        const yCoord = startY + row * lodVertexStep - (startY + halfHeight);
        const texY = (startY + row * lodVertexStep) / this.heightmapSize.height;
        for (let col = 0; col < numCols; col++) {
            const xCoord = startX + col * lodVertexStep - (startX + halfWidth);
            const worldX = startX + col * lodVertexStep;
            const worldY = startY + row * lodVertexStep;

            const avgHeight = this.getHeight(worldX, worldY, lodFactor);

            positions[posIndex] = xCoord;
            positions[posIndex + 1] = avgHeight;
            positions[posIndex + 2] = yCoord;
            posIndex += 3;

            uvs[uvIndex] = worldX / this.heightmapSize.width;
            uvs[uvIndex + 1] = texY;
            uvIndex += 2;
        }
        if (row % 50 === 0) await Promise.resolve();
    }


    // Generate indices with LOD stepping
    const numSegmentsX = Math.floor(width / lodVertexStep);
    const numSegmentsY = Math.floor(height / lodVertexStep);
    const indices = new Uint32Array(numSegmentsX * numSegmentsY * 6);
    let idx = 0;

    for (let y = 0; y < numSegmentsY; y++) {
        for (let x = 0; x < numSegmentsX; x++) {
            const a = (y * (numSegmentsX + 1)) + x;
            const b = a + 1;
            const c = ((y + 1) * (numSegmentsX + 1)) + x;
            const d = c + 1;

            indices[idx++] = a;
            indices[idx++] = c;
            indices[idx++] = b;

            indices[idx++] = b;
            indices[idx++] = c;
            indices[idx++] = d;
        }
        if (y % 50 === 0) await Promise.resolve();
    }


    // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        // Compute normals
        geometry.computeVertexNormals();

        // Update triangle count
        const chunkTriangles = indices.length / 3;
        this.terrainTriangleCount += chunkTriangles;

        // Cache the geometry
        this.geometryCache.set(cacheKey, {
            geometry,
            lastUsed: Date.now()
        });

        return geometry;
    }

    async generate() {
         try {
             if (!this.heightmapTexture) {
                 if (this.HeightmapStaticPath) {
                     const path = RE.getStaticPath(this.HeightmapStaticPath);
                     this.heightmapTexture = await new THREE.TextureLoader().loadAsync(path);
                     this.heightmapTexture.needsUpdate = true;
                 } else {
                     console.error("No heightmap provided");
                     return;
                 }
             }

             const img = this.heightmapTexture.image;
             const totalTilesX = Math.ceil(img.width / this.tile_Size);
             const totalTilesY = Math.ceil(img.height / this.tile_Size);
             RMG_LoadingBar.totalTilesToProcess = totalTilesX * totalTilesY;

             RMG_LoadingBar.createProgressBar();
             if (RMG_LoadingBar.tileIndicatorContainer) {
                 const containerWidth = 150; // Fixed width of the container
                 const containerHeight = 150; // Fixed height of the container

                 const approxColumnCount = Math.ceil(Math.sqrt(RMG_LoadingBar.totalTilesToProcess));
                 const approxRowCount = Math.ceil(RMG_LoadingBar.totalTilesToProcess / approxColumnCount);

                 RMG_LoadingBar.tileIndicatorContainer.style.gridTemplateColumns = `repeat(${approxColumnCount}, 1fr)`;
                 RMG_LoadingBar.tileIndicatorContainer.style.gridTemplateRows = `repeat(${approxRowCount}, 1fr)`;

                 // Clear existing indicators if any
                 RMG_LoadingBar.tileIndicatorContainer.innerHTML = '';
                 RMG_LoadingBar.tileIndicators = [];

                 for (let i = 0; i < RMG_LoadingBar.totalTilesToProcess; i++) {
                     const tileIndicator = document.createElement('div');
                     tileIndicator.classList.add('tile-indicator');
                     RMG_LoadingBar.tileIndicatorContainer.appendChild(tileIndicator);
                     RMG_LoadingBar.tileIndicators.push(tileIndicator);
                 }
             }
             RMG_LoadingBar.showProgressBar();

             // Cleanup existing chunks
             const existingChunks = this.object3d.getObjectByName("Chunks");
             if (existingChunks) this.object3d.remove(existingChunks);
             this.chunksFolder = new THREE.Object3D();
             this.chunksFolder.name = "Chunks";
             this.object3d.add(this.chunksFolder);

             // Initialize height data storage
             this.heightmapSize = {
                 width: img.width,
                 height: img.height
             };
             this.heightData = new Uint8ClampedArray(img.width * img.height * 4);

             // Tile processing setup
             const canvas = document.createElement('canvas');
             canvas.width = this.tile_Size;
             canvas.height = this.tile_Size;
             const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

             let currentTile = 0;
             let processedTiles = 0;

             const processNextTile = async () => {
                 try {
                     if (currentTile >= totalTilesX * totalTilesY) {
                         this.initializeQuadtree();
                         //console.log("Heightmap processing completed.");
                         RMG_LoadingBar.hideProgressBar(); // Hide when all tiles processed
                         if (this.EnableMinimap && RE.Runtime.isRunning) {
                             RMG_Navigation.createMinimap();
                         }
                         this.isMapLoaded = true;
                         this.collisionInitTimeout = setTimeout(() => {
                             if (this.RapierCollision && this.activeCameras.length > 0) {
                                 const cameraPos = new THREE.Vector3();
                                 this.activeCameras[0].getWorldPosition(cameraPos);
                                 RMG_Collision.updateCollisionChunks(cameraPos);
                             }
                         }, this.collisionGenerationDelay);
                         return;
                     }

                     processedTiles++;
                     RMG_LoadingBar.updateProgress(processedTiles);

                     const tileX = currentTile % totalTilesX;
                     const tileY = Math.floor(currentTile / totalTilesX);
                     currentTile++;

                     const x = tileX * this.tile_Size;
                     const y = tileY * this.tile_Size;
                     const tileWidth = Math.min(this.tile_Size, img.width - x);
                     const tileHeight = Math.min(this.tile_Size, img.height - y);

                     ctx.clearRect(0, 0, this.tile_Size, this.tile_Size);
                     ctx.drawImage(
                         img,
                         x, y, tileWidth, tileHeight,
                         0, 0, tileWidth, tileHeight
                     );

                     const imageData = ctx.getImageData(0, 0, tileWidth, tileHeight);
                     this.copyTileData(x, y, tileWidth, tileHeight, imageData.data);

                     await Promise.resolve();
                     setTimeout(processNextTile, 0);

                 } catch (error) {
                     console.error("Error processing tile:", error);
                     RMG_LoadingBar.hideProgressBar(); // Hide on tile processing error
                     throw error; // Re-throw to catch in outer try/catch
                 }
             };

             await processNextTile();

         } catch (error) {
             console.error("Generation failed:", error);
             RMG_LoadingBar.hideProgressBar(); // Hide on any initialization error
             throw error;
         }
     }

    private async processHighDetailQueue() {
        if (this.isProcessingHighDetail || this.highDetailQueue.length === 0) return;

        this.isProcessingHighDetail = true;
        const BATCH_SIZE = 1;
        let processed = 0;
        const now = Date.now();
        const camPos = new THREE.Vector3();
        if (this.activeCameras.length > 0) {
            this.activeCameras[0].getWorldPosition(camPos);
        }

        try {
            while (this.highDetailQueue.length > 0 && processed < BATCH_SIZE) {
                const { group } = this.highDetailQueue.shift()!;
                const chunkParams = group.userData.chunkParams;

                if (group.children.some(c => c.name === 'high')) continue;

                const estimatedTriangles = chunkParams.width * chunkParams.height * 2;

                if (this.terrainTriangleCount + estimatedTriangles > this.triangleLimit) {
                    //console.warn(`Triangle limit approaching. Considering deactivating furthest high-detail chunks.`);

                    // 1. Find all currently active high-detail chunks and their distances
                    const highDetailChunks: { group: THREE.Group; distanceSquared: number }[] = [];
                    for (const lodGroup of this.lodGroups) {
                        if (lodGroup.children.some(c => c.name === 'high')) {
                            const groupPos = new THREE.Vector3();
                            lodGroup.getWorldPosition(groupPos);
                            const distanceSquared = camPos.distanceToSquared(groupPos);
                            highDetailChunks.push({ group: lodGroup, distanceSquared });
                        }
                    }

                    // 2. Sort them by distance (furthest first)
                    highDetailChunks.sort((a, b) => b.distanceSquared - a.distanceSquared);

                    // 3. Find the closest chunk to the player
                    let closestChunkGroup: THREE.Group | null = null;
                    let minDistanceSquared = Infinity;
                    for (const lodGroup of this.lodGroups) {
                        const groupPos = new THREE.Vector3();
                        lodGroup.getWorldPosition(groupPos);
                        const distanceSquared = camPos.distanceToSquared(groupPos);
                        if (distanceSquared < minDistanceSquared) {
                            minDistanceSquared = distanceSquared;
                            closestChunkGroup = lodGroup;
                        }
                    }

                    // 4. Deactivate furthest high-detail chunks until there's enough room
                    let deactivatedCount = 0;
                    while (this.terrainTriangleCount + estimatedTriangles > this.triangleLimit && highDetailChunks.length > 0) {
                        const furthestChunk = highDetailChunks.shift()!;
                        if (furthestChunk.group !== closestChunkGroup) { // Don't deactivate the closest chunk yet
                            if (this.deactivateHighDetailMesh(furthestChunk.group)) {
                                deactivatedCount++;
                            }
                        }
                        if (highDetailChunks.length === 0 && this.terrainTriangleCount + estimatedTriangles > this.triangleLimit) {
                            //console.warn("Could not free up enough triangles by deactivating furthest chunks.");
                            break;
                        }
                    }

                    // After deactivating, re-check if there's room to generate the current chunk's high detail
                    if (this.terrainTriangleCount + estimatedTriangles > this.triangleLimit) {
                        //console.warn(`Still over triangle limit. Skipping high-detail for chunk: ${group.userData.key}`);
                        this.generateChunkLowDetail(group, 2);
                        continue;
                    }
                }

                // Generate high detail if limit allows
                const cacheKey = this.getCacheKey({
                    startX: chunkParams.startX,
                    startY: chunkParams.startY,
                    width: chunkParams.width,
                    height: chunkParams.height,
                    step: 1,
                    lodFactor: 1
                });

                const highGeometry = await this.generateChunkGeometry(
                    chunkParams.startX,
                    chunkParams.startY,
                    chunkParams.width,
                    chunkParams.height,
                    1, // Step of 1 for high detail
                    1 // lodFactor of 1 for high detail
                );

                // Foliage
                if (this.enableFoliage) {
                    this.generateFoliageInstances(group, highGeometry, this.fSeed);
                }

                const material = this.highDetailMaterial;
                const highMesh = new THREE.Mesh(highGeometry, material);
                highMesh.name = 'high';
                highMesh.userData.cacheKey = cacheKey; // Store cache key
                highMesh.castShadow = true;
                highMesh.receiveShadow = true;

                const lowMesh = group.children.find(c => c.name === 'low');
                if (lowMesh) {
                    group.remove(lowMesh);
                    (lowMesh as THREE.Mesh).geometry.dispose();
                }

                group.add(highMesh);
                this.generateChunkLowDetail(group, 2); // Example: generate low detail with lodFactor 2
                processed++;
            }
        } finally {
            this.isProcessingHighDetail = false;
            if (this.highDetailQueue.length > 0) {
                requestAnimationFrame(() => this.processHighDetailQueue());
            }
        }
    }

    private deactivateHighDetailMesh(group: THREE.Group): boolean {
        const highMesh = group.children.find(c => c.name === 'high') as THREE.Mesh;
        const lowMesh = group.children.find(c => c.name === 'low') as THREE.Mesh;

        if (highMesh && lowMesh) {
            const geometry = highMesh.geometry;
            const triangleCount = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;

            highMesh.visible = false;
            lowMesh.visible = true;
            this.terrainTriangleCount -= triangleCount;
            //console.log(`Deactivated high-detail mesh for chunk: ${group.userData.key}. Triangles reduced by: ${triangleCount}. Total triangles: ${this.terrainTriangleCount}`);
            // Optionally, you could dispose of the high-detail geometry to free up memory:
             geometry.dispose();
            group.remove(highMesh);
            return true;
        }
        return false;
    }

    private async generateChunkLowDetail(group: THREE.Group, lodFactor: number) {
    const chunkParams = group.userData.chunkParams;

    try {
        const cacheKey = this.getCacheKey({
            startX: chunkParams.startX,
            startY: chunkParams.startY,
            width: chunkParams.width,
            height: chunkParams.height,
            step: this.LOD_Quality,
            lodFactor: lodFactor
        });

        const geometry = await this.generateChunkGeometry(
            chunkParams.startX,
            chunkParams.startY,
            chunkParams.width,
            chunkParams.height,
            this.LOD_Quality,
            lodFactor
        );

        const existingLow = group.children.find(c => c.name === 'low');
        if (existingLow) {
            (existingLow as THREE.Mesh).geometry.dispose();
            group.remove(existingLow);
        }

        const material = this.lowDetailMaterial;
        const lowMesh = new THREE.Mesh(geometry, material);
        lowMesh.name = 'low';
        lowMesh.userData.cacheKey = cacheKey; // Store cache key
        lowMesh.castShadow = true;
        lowMesh.receiveShadow = true;
        group.add(lowMesh);

        const highMesh = group.children.find(c => c.name === 'high') as THREE.Mesh;
        if (highMesh) highMesh.visible = false;

    } catch (err) {
        console.error('Error generating low-detail geometry:', err);
        this.deactivateChunk(group);
    }
}

    private getHeight(x: number, y: number, lodFactor: number = 1, generalSmoothness: number = this.Terrain_Smoothness): number {
    const mapWidth = this.heightmapSize.width;
    const mapHeight = this.heightmapSize.height;

    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
        return 0;
    }

    let sampleX = Math.floor(x);
    let sampleY = Math.floor(y);

    // Get base height from heightmap with smoothing
    let baseHeight = 0;
    if (generalSmoothness > 0) {
        let sumHeight = 0;
        let count = 0;
        const radius = Math.floor(generalSmoothness / 2);
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const sx = sampleX + dx;
                const sy = sampleY + dy;
                if (sx >= 0 && sx < mapWidth && sy >= 0 && sy < mapHeight) {
                    const index = (sy * mapWidth + sx) * 4;
                    sumHeight += this.heightData![index];
                    count++;
                }
            }
        }
        if (count > 0) {
            baseHeight = sumHeight / count;
        }
    } else {
        const index = (sampleY * mapWidth + sampleX) * 4;
        baseHeight = this.heightData![index];
    }


    return baseHeight;
}

    private fractalNoise(x: number, y: number): number {
        let amplitude = 1.0;
        let frequency = 1.0;
        let noiseHeight = 0;
        let amplitudeSum = 0;

        for (let i = 0; i < this.fractalOctaves; i++) {
            const sampleX = x * frequency;
            const sampleY = y * frequency;

            const perlinValue = this.seededPerlinNoise(sampleX, sampleY, this.fractalSeed + i);
            noiseHeight += perlinValue * amplitude;

            amplitudeSum += amplitude;
            amplitude *= this.fractalPersistence;
            frequency *= this.fractalLacunarity;
        }

        // Normalize the result
        return (noiseHeight / amplitudeSum) * 255; // Scale to match heightmap range
    }

    private seededPerlinNoise(x: number, y: number, seed: number): number {
        // Generate a seeded random gradient grid
        const getRandomGradient = (ix: number, iy: number): [number, number] => {
            const random = this.seededRandom(ix + iy * 1000 + seed * 2000, 0);
            const angle = random * 2 * Math.PI;
            return [Math.cos(angle), Math.sin(angle)];
        };

        // Get grid cell coordinates
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;

        // Get gradients for each corner
        const g00 = getRandomGradient(x0, y0);
        const g10 = getRandomGradient(x1, y0);
        const g01 = getRandomGradient(x0, y1);
        const g11 = getRandomGradient(x1, y1);

        // Get vectors from corners to point
        const dx0 = x - x0;
        const dx1 = x - x1;
        const dy0 = y - y0;
        const dy1 = y - y1;

        // Calculate dot products
        const d00 = g00[0] * dx0 + g00[1] * dy0;
        const d10 = g10[0] * dx1 + g10[1] * dy0;
        const d01 = g01[0] * dx0 + g01[1] * dy1;
        const d11 = g11[0] * dx1 + g11[1] * dy1;

        // Interpolation weights with smoothing
        const sx = this.smootherstep(dx0);
        const sy = this.smootherstep(dy0);

        // Interpolate
        const nx0 = this.lerp(d00, d10, sx);
        const nx1 = this.lerp(d01, d11, sx);
        const value = this.lerp(nx0, nx1, sy);

        // Transform from [-1, 1] to [0, 1]
        return (value + 1) * 0.5;
    }

    private smootherstep(x: number): number {
        x = x * x * x * (x * (x * 6 - 15) + 10);
        return x;
    }

    private lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    // Tile load-stage
    private copyTileData(startX: number, startY: number, width: number, height: number, tileData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const heightData = this.heightData!;

        // Apply fractal noise if enabled
        if (this.enableFractal) {
            this.applyFractalNoise(startX, startY, width, height, tileData);
        } else {
            for (let y = 0; y < height; y++) {
                const srcOffset = y * width * 4;
                const destOffset = ((startY + y) * mapWidth + startX) * 4;
                heightData.set(
                    tileData.subarray(srcOffset, srcOffset + width * 4),
                    destOffset
                );
            }
        }



        // Apply coastal erosion if enabled
        if (this.enableCoastalErosion) {
            this.applyCoastalErosion(startX, startY, width, height, heightData);
        }

        // Apply ridge formation if enabled
        if (this.enableRidges) {
            this.applyRidgeFormation(startX, startY, width, height, heightData);
        }

        // Apply erosion if enabled
        if (this.enableErosion) {
            this.applyErosion(startX, startY, width, height, heightData);
        }

        // Apply plateau formation if enabled
        if (this.enablePlateaus) {
            this.applyPlateauFormation(startX, startY, width, height, heightData);
        }

        // Apply valley formation if enabled
        if (this.enableValleys) {
            this.applyValleyFormation(startX, startY, width, height, heightData);
        }

        // Apply terracing if enabled
        if (this.enableTerracing) {
            this.applyTerracing(startX, startY, width, height, heightData);
        }

        // Apply cliff modification if enabled
        if (this.enableCliff) {
            this.applyCliffModification(startX, startY, width, height, tileData);
        }

        // Apply talus formation if enabled
        //if (this.enableTalus) {
        //    this.applyTalusFormation(startX, startY, width, height, heightData);
        //}
    }

    private applyFractalNoise(startX: number, startY: number, width: number, height: number, tileData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const scaleX = this.Scale.x;
        const scaleZ = this.Scale.z;
        const offsetX = this.Offset.x;
        const offsetZ = this.Offset.z;
        const heightData = this.heightData!;
        const chunkSize = 8; // Process pixels in chunks (adjust as needed)

        for (let y = 0; y < height; y += chunkSize) {
            for (let x = 0; x < width; x += chunkSize) {
                const chunkHeight = Math.min(chunkSize, height - y);
                const chunkWidth = Math.min(chunkSize, width - x);

                for (let cy = 0; cy < chunkHeight; cy++) {
                    for (let cx = 0; cx < chunkWidth; cx++) {
                        const srcIdx = ((y + cy) * width + (x + cx)) * 4;
                        const destIdx = ((startY + y + cy) * mapWidth + (startX + x + cx)) * 4;

                        let baseHeight = tileData[srcIdx];

                        const worldX = (startX + x + cx) * scaleX + offsetX;
                        const worldZ = (startY + y + cy) * scaleZ + offsetZ;

                        const noiseValue = this.fractalNoise(worldX / this.fractalScale, worldZ / this.fractalScale) * this.fractalIntensity;

                        baseHeight = Math.min(255, Math.max(0, baseHeight + noiseValue));

                        heightData[destIdx] = baseHeight;
                        heightData[destIdx + 1] = tileData[srcIdx + 1];
                        heightData[destIdx + 2] = tileData[srcIdx + 2];
                        heightData[destIdx + 3] = 255;
                    }
                }
            }
        }
    }

    private applyTerracing(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;

                // Get the original height value
                const originalHeight = heightData[idx];

                // Skip if outside the terracing height range
                if (originalHeight < this.terracingMinHeight || originalHeight > this.terracingMaxHeight) {
                    continue;
                }

                // Normalize height to 0-1 range for the active terracing range
                const normalizedHeight = (originalHeight - this.terracingMinHeight) /
                    (this.terracingMaxHeight - this.terracingMinHeight);

                // Calculate the terrace level (0 to terracingLevels-1)
                const terraceLevel = Math.floor(normalizedHeight * this.terracingLevels);
                const nextTerraceLevel = Math.min(terraceLevel + 1, this.terracingLevels);

                // Calculate heights for current and next terrace
                const currentTerraceHeight = (terraceLevel / this.terracingLevels) *
                    (this.terracingMaxHeight - this.terracingMinHeight) + this.terracingMinHeight;
                const nextTerraceHeight = (nextTerraceLevel / this.terracingLevels) *
                    (this.terracingMaxHeight - this.terracingMinHeight) + this.terracingMinHeight;

                // Calculate position within current terrace (0-1)
                const terracePosition = (normalizedHeight * this.terracingLevels) - terraceLevel;

                // Apply sharpness curve to the transition
                let blend = Math.pow(terracePosition, 1 / (1 - this.terracingSharpness));

                // Add some noise to break up the perfect lines
                if (this.terracingNoiseAmount > 0) {
                    const noise = this.seededRandom(worldX * 1000 + worldY + this.fractalSeed, 0) * 2 - 1;
                    blend += noise * this.terracingNoiseAmount;
                    blend = Math.max(0, Math.min(1, blend));
                }

                // Interpolate between current and next terrace height
                const terracedHeight = currentTerraceHeight + (nextTerraceHeight - currentTerraceHeight) * blend;

                // Blend between terraced and original height
                const finalHeight = Math.round(
                    terracedHeight * (1 - this.terracingBlendFactor) +
                    originalHeight * this.terracingBlendFactor
                );

                // Apply the new height value
                heightData[idx] = Math.max(0, Math.min(255, finalHeight));
                heightData[idx + 1] = heightData[idx];
                heightData[idx + 2] = heightData[idx];
                heightData[idx + 3] = 255;
            }
        }
    }

    private applyCliffModification(startX: number, startY: number, width: number, height: number, tileData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const mapHeight = this.heightmapSize.height;
        const heightData = this.heightData!;
        const scaleX = this.Scale.x;
        const scaleZ = this.Scale.z;

        // Helper function to get height at a specific coordinate
        const getHeight = (x: number, y: number): number => {
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
                return heightData[(y * mapWidth + x) * 4];
            }
            return 0; // Or handle boundary conditions differently
        };

        // Iterate through the tile data to identify potential cliff areas
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const currentX = startX + x;
                const currentY = startY + y;

                // Calculate a simple forward and right slope
                const currentHeight = getHeight(currentX, currentY);
                const heightRight = getHeight(currentX + 1, currentY);
                const heightDown = getHeight(currentX, currentY + 1);

                const deltaX = scaleX;
                const deltaY = scaleZ;
                const deltaHeightRight = (heightRight - currentHeight);
                const deltaHeightDown = (heightDown - currentHeight);

                // Approximate slope magnitude (can be refined with more neighbors)
                const slopeRight = Math.abs(deltaHeightRight / deltaX);
                const slopeDown = Math.abs(deltaHeightDown / deltaY);
                const slope = Math.max(slopeRight, slopeDown); // Consider the steeper slope

                if (slope >= this.cliffSlopeStart && slope <= this.cliffSlopeEnd) {
                    // This area has a slope within the defined range, apply cliff effect

                    // Determine the direction of the cliff (e.g., based on which neighbor has the larger height difference)
                    const isSteeperRight = Math.abs(deltaHeightRight) > Math.abs(deltaHeightDown);

                    // Adjust height data to create a sharper transition
                    const intensityFactor = this.cliffIntensity;

                    if (isSteeperRight && currentX + 1 < mapWidth) {
                        const nextHeightIndex = ((currentY) * mapWidth + (currentX + 1)) * 4;
                        heightData[nextHeightIndex] = Math.max(0, Math.min(255, heightData[nextHeightIndex] + intensityFactor));
                        const currentHeightIndex = ((currentY) * mapWidth + currentX) * 4;
                        heightData[currentHeightIndex] = Math.max(0, Math.min(255, heightData[currentHeightIndex] - intensityFactor));
                    } else if (currentY + 1 < mapHeight) {
                        const nextHeightIndex = (((currentY + 1) * mapWidth) + currentX) * 4;
                        heightData[nextHeightIndex] = Math.max(0, Math.min(255, heightData[nextHeightIndex] + intensityFactor));
                        const currentHeightIndex = (currentY * mapWidth + currentX) * 4;
                        heightData[currentHeightIndex] = Math.max(0, Math.min(255, heightData[currentHeightIndex] - intensityFactor));
                    }
                    // Consider also adjusting surrounding neighbors for a more pronounced effect
                    // This is a basic implementation, more sophisticated methods could be used
                }
            }
        }
    }

    private applyRidgeFormation(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const directionRad = this.ridgeDirection * Math.PI / 180;
        const cosDir = Math.cos(directionRad);
        const sinDir = Math.sin(directionRad);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;

                // Project point onto ridge direction vector
                const projectedDist = (worldX * cosDir + worldY * sinDir) * this.ridgeFrequency;

                // Add some variation using noise
                const noiseValue = this.seededPerlinNoise(
                    worldX * this.ridgeFrequency,
                    worldY * this.ridgeFrequency,
                    this.ridgeSeed
                );

                // Calculate ridge pattern
                const ridgeValue = Math.abs(Math.sin(projectedDist * Math.PI + noiseValue));
                const sharpRidge = Math.pow(ridgeValue, 1 / (1 - this.ridgeSharpness));

                // Apply ridge height modification
                const ridgeModification = sharpRidge * this.ridgeHeight;
                heightData[idx] = Math.min(255, Math.max(0, heightData[idx] + ridgeModification));
                heightData[idx + 1] = heightData[idx];
                heightData[idx + 2] = heightData[idx];
                heightData[idx + 3] = 255;
            }
        }
    }

    private applyErosion(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const tempHeightData = new Float32Array(width * height);

        // Copy height data to temporary array
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;
                tempHeightData[y * width + x] = heightData[idx];
            }
        }

        // Apply erosion iterations
        for (let iteration = 0; iteration < this.erosionIterations; iteration++) {
            const erosionNoise = this.seededPerlinNoise(
                iteration * 1000,
                iteration * 2000,
                this.erosionSeed + iteration
            );

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const currentHeight = tempHeightData[idx];

                    // Calculate average height of neighbors
                    const neighbors = [
                        tempHeightData[idx - 1],        // left
                        tempHeightData[idx + 1],        // right
                        tempHeightData[idx - width],    // top
                        tempHeightData[idx + width],    // bottom
                    ];
                    const avgHeight = neighbors.reduce((a, b) => a + b, 0) / 4;

                    // Apply erosion based on height difference
                    const heightDiff = currentHeight - avgHeight;
                    const erosionFactor = this.erosionStrength * (1 + erosionNoise * 0.5);
                    tempHeightData[idx] = currentHeight - heightDiff * erosionFactor;
                }
            }
        }

        // Copy back to height data
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;
                const tempIdx = y * width + x;
                heightData[idx] = Math.min(255, Math.max(0, tempHeightData[tempIdx]));
                heightData[idx + 1] = heightData[idx];
                heightData[idx + 2] = heightData[idx];
                heightData[idx + 3] = 255;
            }
        }
    }

    private applyPlateauFormation(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;

                // Generate noise for plateau variation
                const noiseValue = this.seededPerlinNoise(
                    worldX / this.plateauNoiseScale,
                    worldY / this.plateauNoiseScale,
                    this.plateauSeed
                );

                const currentHeight = heightData[idx];
                const plateauTargetHeight = this.plateauHeight + (noiseValue - 0.5) * this.plateauVariation;

                // Calculate blend factor based on height difference
                const heightDiff = Math.abs(currentHeight - plateauTargetHeight);
                const blendFactor = Math.max(0, 1 - heightDiff / (this.plateauVariation * 2));
                const finalBlend = Math.pow(blendFactor, 1 / this.plateauBlending);

                // Blend between current height and plateau height
                const newHeight = currentHeight * (1 - finalBlend) + plateauTargetHeight * finalBlend;
                heightData[idx] = Math.min(255, Math.max(0, newHeight));
                heightData[idx + 1] = heightData[idx];
                heightData[idx + 2] = heightData[idx];
                heightData[idx + 3] = 255;
            }
        }
    }

    private applyValleyFormation(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;

                // Generate valley pattern using multiple noise octaves
                let valleyFactor = 0;
                let amplitude = 1;
                let frequency = this.valleyFrequency;

                for (let i = 0; i < 3; i++) {
                    const noiseValue = this.seededPerlinNoise(
                        worldX * frequency,
                        worldY * frequency,
                        this.valleySeed + i * 1000
                    );
                    valleyFactor += (noiseValue * 2 - 1) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }

                // Calculate valley depth based on pattern
                const valleyDepthFactor = Math.max(0, Math.abs(valleyFactor) - 0.3);
                const depthModification = valleyDepthFactor * this.valleyDepth;

                // Apply valley modification with width consideration
                const distanceFromValley = Math.min(
                    this.valleyWidth,
                    Math.abs(valleyFactor * this.valleyWidth)
                );
                const valleyInfluence = 1 - (distanceFromValley / this.valleyWidth);
                const finalDepth = depthModification * valleyInfluence;

                // Apply modification
                heightData[idx] = Math.min(255, Math.max(0, heightData[idx] - finalDepth));
                heightData[idx + 1] = heightData[idx];
                heightData[idx + 2] = heightData[idx];
                heightData[idx + 3] = 255;
            }
        }
    }

    private applyCoastalErosion(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const waterLevel = this.oceanLevel * 255; // Convert to height value
        const erosionRange = this.coastalErosionRange;
        const maxCliffHeight = this.coastalCliffHeight;

        // Create a temporary buffer for the modified heights
        const tempHeights = new Float32Array(width * height);

        // Helper function to get height at a specific position
        const getHeight = (x: number, y: number): number => {
            if (x >= 0 && x < mapWidth && y >= 0 && y < this.heightmapSize.height) {
                return heightData[(y * mapWidth + x) * 4];
            }
            return 0;
        };

        // First pass: Analyze the coastline and calculate erosion factors
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;
                const currentHeight = heightData[idx];

                // Calculate distance to water level
                const heightDiff = Math.abs(currentHeight - waterLevel);
                if (heightDiff > erosionRange) continue;

                // Generate coastal noise
                const noiseValue = this.seededPerlinNoise(
                    worldX / this.coastalNoiseScale,
                    worldY / this.coastalNoiseScale,
                    this.coastalErosionSeed
                );

                // Calculate wave patterns
                const wavePattern = Math.sin(worldX * 0.1 + worldY * 0.1 + noiseValue * Math.PI * 2) * 0.5 + 0.5;
                const waveInfluence = wavePattern * this.coastalWaveIntensity;

                // Calculate erosion factor
                let erosionFactor = (1 - heightDiff / erosionRange) * this.coastalErosionIntensity;
                erosionFactor *= (1 + noiseValue * this.coastalNoiseIntensity);
                erosionFactor *= (1 + waveInfluence);

                // Cliff formation logic
                const cliffNoise = this.seededPerlinNoise(
                    worldX / (this.coastalNoiseScale * 0.5),
                    worldY / (this.coastalNoiseScale * 0.5),
                    this.coastalErosionSeed + 1000
                );

                if (cliffNoise > (1 - this.coastalCliffProbability) && currentHeight > waterLevel) {
                    const cliffHeight = cliffNoise * maxCliffHeight;
                    erosionFactor *= (1 + cliffHeight / 255);
                }

                // Store the erosion result
                const localIdx = y * width + x;
                tempHeights[localIdx] = currentHeight - (erosionFactor * this.coastalErosionIntensity * 20);

                // Sediment transport and deposition
                if (currentHeight < waterLevel) {
                    const sedimentAmount = erosionFactor * this.coastalSedimentTransport * 10;
                    tempHeights[localIdx] += sedimentAmount;
                }
            }
        }

        // Second pass: Apply smoothing and update heights
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;
                const localIdx = y * width + x;

                // Apply smoothing based on neighbors
                let smoothedHeight = tempHeights[localIdx];
                if (this.coastalSmoothingFactor > 0) {
                    let neighborSum = 0;
                    let neighborCount = 0;

                    for (let ny = -1; ny <= 1; ny++) {
                        for (let nx = -1; nx <= 1; nx++) {
                            if (nx === 0 && ny === 0) continue;
                            const neighborX = x + nx;
                            const neighborY = y + ny;
                            if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height) {
                                neighborSum += tempHeights[neighborY * width + neighborX];
                                neighborCount++;
                            }
                        }
                    }

                    if (neighborCount > 0) {
                        const averageHeight = neighborSum / neighborCount;
                        smoothedHeight = smoothedHeight * (1 - this.coastalSmoothingFactor) +
                                       averageHeight * this.coastalSmoothingFactor;
                    }
                }

                // Apply the final height value
                const finalHeight = Math.max(0, Math.min(255, Math.round(smoothedHeight)));
                heightData[idx] = finalHeight;
                heightData[idx + 1] = finalHeight;
                heightData[idx + 2] = finalHeight;
                heightData[idx + 3] = 255;
            }
        }
    }

    /*
    private applyTalusFormation(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
        const mapWidth = this.heightmapSize.width;
        const tempHeights = new Float32Array(width * height);
        const talusAmount = new Float32Array(width * height);

        // Helper function to get height at a specific position
        const getHeight = (x: number, y: number): number => {
            if (x >= 0 && x < mapWidth && y >= 0 && y < this.heightmapSize.height) {
                return heightData[(y * mapWidth + x) * 4];
            }
            return 0;
        };

        // First pass: Identify steep slopes and calculate initial talus amounts
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;
                const localIdx = y * width + x;

                // Calculate slope using neighboring points
                const centerHeight = heightData[idx];
                tempHeights[localIdx] = centerHeight;

                // Calculate average slope in all directions
                let maxSlope = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighborHeight = getHeight(worldX + dx, worldY + dy);
                        const slope = Math.abs(centerHeight - neighborHeight) /
                                    Math.sqrt(dx * dx + dy * dy);
                        maxSlope = Math.max(maxSlope, slope);
                    }
                }

                // Normalize slope to 0-1 range
                const normalizedSlope = maxSlope / 255;

                // Calculate talus formation probability
                if (normalizedSlope >= this.talusMinSlope && normalizedSlope <= this.talusMaxSlope) {
                    // Generate noise for natural variation
                    const noiseValue = this.seededPerlinNoise(
                        worldX / (this.talusParticleSize * 2),
                        worldY / (this.talusParticleSize * 2),
                        this.talusSeed
                    );

                    // Calculate initial talus amount
                    const slopeFactor = (normalizedSlope - this.talusMinSlope) /
                                      (this.talusMaxSlope - this.talusMinSlope);
                    const talusFactor = slopeFactor * this.talusAccumulationFactor *
                                      (1 + noiseValue * this.talusNoiseFactor);
                    talusAmount[localIdx] = talusFactor * this.talusParticleSize;
                }
            }
        }

        // Second pass: Distribute talus material
        const spreadRadius = Math.ceil(this.talusSpreadDistance);
        const stabilityThreshold = this.talusStability * 45; // Convert to degrees
        const layeringNoise = new Float32Array(width * height);

        // Generate layering noise
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                layeringNoise[y * width + x] = this.seededPerlinNoise(
                    worldX / (this.talusParticleSize * 4),
                    worldY / (this.talusParticleSize * 4),
                    this.talusSeed + 1000
                );
            }
        }

        // Distribute talus material
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const localIdx = y * width + x;
                if (talusAmount[localIdx] <= 0) continue;

                let materialToSpread = talusAmount[localIdx];
                const sourceHeight = tempHeights[localIdx];

                // Search for lower points within spread radius
                for (let dy = -spreadRadius; dy <= spreadRadius; dy++) {
                    for (let dx = -spreadRadius; dx <= spreadRadius; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const targetX = x + dx;
                        const targetY = y + dy;
                        if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) continue;

                        const targetIdx = targetY * width + targetX;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance > spreadRadius) continue;

                        const targetHeight = tempHeights[targetIdx];
                        if (targetHeight >= sourceHeight) continue;

                        // Calculate slope to target
                        const slope = Math.atan2(sourceHeight - targetHeight, distance) * 180 / Math.PI;
                        if (slope < stabilityThreshold) continue;

                        // Calculate material amount to deposit
                        const depositFactor = (1 - distance / spreadRadius) *
                                           (1 - this.talusCompression) *
                                           (1 + layeringNoise[targetIdx] * this.talusLayering);
                        const depositAmount = materialToSpread * depositFactor;

                        // Update heights
                        tempHeights[targetIdx] += depositAmount;
                        materialToSpread -= depositAmount;

                        if (materialToSpread <= 0) break;
                    }
                    if (materialToSpread <= 0) break;
                }
            }
        }

        // Final pass: Apply the modified heights
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                const idx = (worldY * mapWidth + worldX) * 4;
                const localIdx = y * width + x;

                const finalHeight = Math.max(0, Math.min(255, Math.round(tempHeights[localIdx])));
                heightData[idx] = finalHeight;
                heightData[idx + 1] = finalHeight;
                heightData[idx + 2] = finalHeight;
                heightData[idx + 3] = 255;
            }
        }
    }


     */
    public async refreshTerrain(): Promise<void> {

        if (!RE.Runtime.isRunning) {return;}
        // Stop any ongoing processes
        this.isProcessingHighDetail = false;
        this.activeProcesses = 0;
        this.isMapLoaded = false;
        this.highDetailQueue = [];
        this.processingQueue = [];

        // Clear all timeouts and intervals
        if (this.collisionInitTimeout) {
            clearTimeout(this.collisionInitTimeout);
            this.collisionInitTimeout = null;
        }

        // Clear scheduled operations
        this.scheduledRemovals.forEach((timeout) => clearTimeout(timeout));
        this.scheduledRemovals.clear();
        this.scheduledDeactivations.clear();
        this.scheduledCleanups.clear();

        // Reset counters and states
        this.terrainTriangleCount = 0;
        this.lastLodUpdate = 0;
        this.lastProcessTime = 0;
        this.lastPriorityUpdate = 0;
        this.lastCacheCleanup = 0;
        this.lastDeletionBatchTime = 0;
        this.lastCleanupBatchTime = 0;

        // Clear all caches
        this.geometryCache.forEach((cache) => {
            if (cache.geometry) cache.geometry.dispose();
        });
        this.geometryCache.clear();
        this.colorCache.clear();
        this.heightCache.clear();

        // Clear chunk data
        this.chunksMap.clear();
        if (this.quadtree) {
            this.quadtree = null;
        }

        // Remove and cleanup all chunks
        if (this.chunksFolder) {
            // Store reference to parent before removal
            const parent = this.chunksFolder.parent;
            
            // Remove all children and dispose of their resources
            while (this.chunksFolder.children.length > 0) {
                const child = this.chunksFolder.children[0];
                if (child instanceof THREE.Group) {
                    await this.clearFoliage(child);
                }
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else if (child.material) {
                        child.material.dispose();
                    }
                }
                this.chunksFolder.remove(child);
            }

            // Remove the chunks folder itself
            if (parent) {
                parent.remove(this.chunksFolder);
            }
            this.chunksFolder = undefined;
        }

        // Clear LOD groups array
        this.lodGroups = [];

        // Clear collision data if enabled
        if (this.RapierCollision) {
            RMG_Collision.removeAllRapierObjects();
            RMG_Collision.disposeAllCollisionData();
        }

        // Hide the progress bar before regenerating
        RMG_LoadingBar.hideProgressBar();

        RMG_Navigation.disposeMapAndNavigation();

        // Regenerate the terrain
        await this.generate();
    }




//=======================================================================================
//
// #region SHADER / TEXTURING
//
//=======================================================================================


    private vertexShader = `
#include <common>
#include <shadowmap_pars_vertex>
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
uniform float uvOffsetScale;
uniform float uvRotationScale;
uniform vec2 overallUvOffset;
uniform float overallUvRotation;

// Simple pseudo-random number generator
float pseudoRand(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // Generate a random offset and rotation based on vertex position
    vec2 randomVec = vec2(pseudoRand(position.xy * 10.0), pseudoRand(position.yz * 10.0));
    float randomRotation = pseudoRand(position.xz * 10.0) * 3.14159 * uvRotationScale;

    // Cache trigonometric evaluations for random rotation
    float cosRandom = cos(randomRotation);
    float sinRandom = sin(randomRotation);

    vec2 uvOffset = randomVec * uvOffsetScale;

    // Apply random rotation (caching rotated UV)
    vec2 rotatedUVRandom = vec2(
        uv.x * cosRandom - uv.y * sinRandom,
        uv.x * sinRandom + uv.y * cosRandom
    );

    vec2 finalUV = rotatedUVRandom + uvOffset;

    // Cache overall rotation sin and cosine
    float cosOverall = cos(overallUvRotation);
    float sinOverall = sin(overallUvRotation);

    vec2 center = vec2(0.5, 0.5); // Center of the UV space
    vec2 centeredUV = finalUV - center;
    vec2 rotatedUVOverall = vec2(
        centeredUV.x * cosOverall - centeredUV.y * sinOverall,
        centeredUV.x * sinOverall + centeredUV.y * cosOverall
    ) + center;

    // Apply overall offset
    vUv = rotatedUVOverall + overallUvOffset;

    // Cache positions and matrix multiplication calculations
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    mat3 normalMatrixWorld = transpose(inverse(mat3(modelMatrix)));
    vWorldNormal = normalize(normalMatrixWorld * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
}`;

    private fragmentShader = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform sampler2D sandTexture;
uniform sampler2D grassTexture;
uniform sampler2D stoneTexture;
uniform sampler2D dirtTexture;
uniform sampler2D snowTexture;
uniform sampler2D aoTexture;
uniform sampler2D heightmapTexture;
uniform float sandRepeat;
uniform float grassRepeat;
uniform float stoneRepeat;
uniform float dirtRepeat;
uniform float snowRepeat;
uniform float maxHeight;
uniform float roughness;
uniform float metalness;
uniform vec3 ambientColor;
uniform float diffuseIntensity;
uniform float specularIntensity;
uniform float envMapIntensity;
uniform float aoIntensity;
uniform float clippingHeight;
uniform float cameraDistanceFactor;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float fogHeightMin;
uniform float fogHeightMax;
uniform float fogDensity;
uniform vec2 gradientSeed;
uniform vec2 heightmapSize;
uniform vec3 terrainScale;
uniform vec3 terrainOffset;
uniform float sandSlopeStart;
uniform float sandSlopeEnd;
uniform float beachHeight;
uniform float grassSlopeStart;
uniform float grassSlopeEnd;
uniform float stoneSlopeStart;
uniform float stoneSlopeEnd;
uniform float stoneSlopeIntensity;
uniform float dirtSlopeStart;
uniform float dirtSlopeEnd;
uniform float dirtHeightStart;
uniform float dirtHeightEnd;
uniform float snowSlopeStart;
uniform float snowSlopeEnd;
uniform float snowHeightStart;
uniform float snowHeightEnd;
uniform float snowBlendSmoothness;
uniform vec3 uSunlightDirection;
uniform vec3 uSunlightColor;
uniform float uSunlightIntensity;
uniform vec3 uSkyColor;
uniform vec3 uGroundColor;
uniform float uHemisphereIntensity;
uniform float BackcullingShader;
uniform vec2 overallUvOffset;
uniform float overallUvRotation;
uniform float grassStoneInfluenceFactor;
uniform vec2 dirtBetweenFactor;
uniform float blendFactor;
uniform float blendFrequency;
uniform float blendAmplitude;
uniform float blendSharpness;
uniform float blobInfluence;
uniform float blobDensity;
uniform float blobScale;
uniform float blobGrassOnStone;
uniform float blobDirtOnStone;
uniform float blobDirtOnGrass;
uniform float textureScaleClose;
uniform float textureScaleMid;
uniform float textureScaleCloseDistance;
uniform float textureScaleMidDistance;

// Add new uniforms for octave noise
uniform float octaveScale;
uniform float octaveIntensity;
uniform float octaveOctaves;
uniform float octavePersistence;
uniform float octaveLacunarity;
uniform float octaveSeed;

uniform float borderNoiseScale;
uniform float borderNoiseIntensity;
uniform float borderNoiseOctaves;
uniform float borderNoisePersistence;
uniform float borderNoiseLacunarity;
uniform float borderNoiseSeed;

uniform vec3 sandColorFilter;
uniform vec3 grassColorFilter;
uniform vec3 stoneColorFilter;
uniform vec3 dirtColorFilter;
uniform vec3 snowColorFilter;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

// Required utility functions
float hash3D(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.xyz, p.yzx + 19.19);
    return fract(p.x * p.y * p.z);
}

float valueNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash3D(i);
    float b = hash3D(i + vec3(1.0, 0.0, 0.0));
    float c = hash3D(i + vec3(0.0, 1.0, 0.0));
    float d = hash3D(i + vec3(1.0, 1.0, 0.0));
    float e = hash3D(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash3D(i + vec3(1.0, 0.0, 1.0));
    float g = hash3D(i + vec3(0.0, 1.0, 1.0));
    float h = hash3D(i + vec3(1.0, 1.0, 1.0));

    float k0 = a;
    float k1 = b - a;
    float k2 = c - a;
    float k3 = e - a;
    float k4 = a - b - c + d;
    float k5 = a - c - e + g;
    float k6 = a - b - e + f1;
    float k7 = -a + b + c - d + e - f1 - g + h;

    return k0 + k1 * f.x + k2 * f.y + k3 * f.z + k4 * f.x * f.y + k5 * f.y * f.z + k6 * f.z * f.x + k7 * f.x * f.y * f.z;
}

float octaveNoise(vec3 p) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;
    
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= octaveOctaves) break;
        total += valueNoise3D((p * frequency + octaveSeed)) * amplitude;
        maxValue += amplitude;
        amplitude *= octavePersistence;
        frequency *= octaveLacunarity;
    }
    
    return total / maxValue;
}

// Border noise function
float getBorderNoise(vec3 worldPos) {
    vec3 noiseInput = worldPos / borderNoiseScale;
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;
    
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= borderNoiseOctaves) break;
        total += valueNoise3D((noiseInput * frequency + borderNoiseSeed)) * amplitude;
        maxValue += amplitude;
        amplitude *= borderNoisePersistence;
        frequency *= borderNoiseLacunarity;
    }
    
    return (total / maxValue) * borderNoiseIntensity;
}

// Modified weight calculation function
float calculateTextureWeight(float baseWeight, vec3 worldPos) {
    float noiseValue = octaveNoise(worldPos / octaveScale);
    float borderNoise = getBorderNoise(worldPos);
    
    // Combine the base weight with both types of noise
    float noisyWeight = baseWeight * (1.0 + noiseValue * octaveIntensity);
    noisyWeight = noisyWeight * (1.0 + borderNoise);
    
    // Add extra noise to the transition boundaries
    float transitionNoise = borderNoise * step(0.1, baseWeight) * step(baseWeight, 0.9);
    noisyWeight += transitionNoise;
    
    return clamp(noisyWeight, 0.0, 1.0);
}

vec4 triplanarSample(sampler2D tex, vec3 pos, float repeat, float distanceFactor) {
    vec2 uvX = pos.yz * repeat;
    vec2 uvY = pos.xz * repeat;
    vec2 uvZ = pos.xy * repeat;
    float lodBias = clamp(distanceFactor * 0.5, 0.0, 4.0);
    vec3 blending = pow(abs(vWorldNormal), vec3(4.0));
    blending /= dot(blending, vec3(1.0));
    vec4 texX = textureLod(tex, uvX, lodBias);
    vec4 texY = textureLod(tex, uvY, lodBias);
    vec4 texZ = textureLod(tex, uvZ, lodBias);
    return texX * blending.x + texY * blending.y + texZ * blending.z;
}

float D_GGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = 3.14159 * denom * denom;
    return a2 / denom;
}

float G_Smith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0) + 0.0001;
    float NdotL = max(dot(N, L), 0.0) + 0.0001;
    float a = roughness;
    float a2 = a * a;
    float lambdaV = NdotL * sqrt((-NdotV * a2 + NdotV) * NdotV + a2);
    float lambdaL = NdotV * sqrt((-NdotL * a2 + NdotL) * NdotL + a2);
    return 0.5 / max(lambdaV + NdotV, lambdaL + NdotL);
}

vec3 F_Schlick(float cosTheta, vec3 F0) {
    return F0 + (vec3(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

float getBlobWeight(vec3 worldPosition) {
    vec2 noiseInput = vec2(worldPosition.x * blobDensity, worldPosition.z * blobDensity);
    float noiseValue = valueNoise3D(vec3(noiseInput, 0.0));
    float blob = smoothstep(0.0, blobScale, abs(noiseValue));
    return blob * blobInfluence;
}

void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float dotProduct = dot(vWorldNormal, viewDirection);
    float backcullingAngleRadians = BackcullingShader * 3.14159 / 180.0;
    if (dotProduct < cos(backcullingAngleRadians)) {
        discard;
    }

    float distanceToCamera = length(cameraPosition - vWorldPosition);
    float lodFactor = clamp(distanceToCamera * cameraDistanceFactor, 0.0, 8.0);
    float textureScale = distanceToCamera < textureScaleMidDistance ? textureScaleMid : 1.0;
    if (distanceToCamera < textureScaleCloseDistance) {
        textureScale = textureScaleClose;
    }
    if (vWorldPosition.y < clippingHeight) {
        discard;
    }

    float h = clamp(vPosition.y / maxHeight, 0.0, 1.0);
    float slope = 1.0 - dot(normalize(vWorldNormal), vec3(0.0, 1.0, 0.0));

    // Calculate base weights with octave noise influence
    float sandH = max(1.0 - smoothstep(0.2, 0.4, h), step(vPosition.y, beachHeight));
    float sandS = 1.0 - smoothstep(sandSlopeStart, sandSlopeEnd, slope);
    float sandWeight = calculateTextureWeight(sandH * sandS, vWorldPosition);

    float grassH = smoothstep(0.2, 0.6, h) * (1.0 - smoothstep(0.7, 0.9, h));
    float grassS = 1.0 - smoothstep(grassSlopeStart, grassSlopeEnd, slope);
    float grassWeight = calculateTextureWeight(grassH * grassS * step(beachHeight, vPosition.y), vWorldPosition);

    float slopeStoneFactor = smoothstep(stoneSlopeStart, stoneSlopeEnd, slope) * stoneSlopeIntensity;
    float stoneWeight = calculateTextureWeight(clamp(1.0 - (sandWeight + grassWeight) + slopeStoneFactor, 0.0, 1.0), vWorldPosition);

    float dirtH = smoothstep(dirtHeightStart, dirtHeightEnd, h);
    float dirtS = smoothstep(dirtSlopeStart, dirtSlopeEnd, slope);
    float grassStoneInfluence = grassWeight * stoneWeight * grassStoneInfluenceFactor;
    float dirtBetweenFactorValue = smoothstep(dirtBetweenFactor.x, dirtBetweenFactor.y, grassStoneInfluence);
    float dirtWeight = calculateTextureWeight(dirtH * dirtS * dirtBetweenFactorValue * step(beachHeight, vPosition.y), vWorldPosition);

    float snowH = smoothstep(snowHeightStart, snowHeightEnd, h);
    float snowS = smoothstep(snowSlopeStart, snowSlopeEnd, slope);
    float snowWeight = calculateTextureWeight(
        snowH * snowS * (1.0 - sandWeight * 0.3) * (1.0 - grassWeight * 0.3) * 
        (1.0 - stoneWeight * 0.2) * (1.0 - dirtWeight * 0.5),
        vWorldPosition
    );

    // Normalize weights
    float totalWeight = sandWeight + grassWeight + stoneWeight + dirtWeight + snowWeight;
    sandWeight /= totalWeight;
    grassWeight /= totalWeight;
    stoneWeight /= totalWeight;
    dirtWeight /= totalWeight;
    snowWeight /= totalWeight;

    // Sample textures with color filters
    vec4 sandColor = triplanarSample(sandTexture, vPosition, sandRepeat * textureScale, lodFactor) * vec4(sandColorFilter, 1.0);
    vec4 grassColor = triplanarSample(grassTexture, vPosition, grassRepeat * textureScale, lodFactor) * vec4(grassColorFilter, 1.0);
    vec4 stoneColor = triplanarSample(stoneTexture, vPosition, stoneRepeat * textureScale, lodFactor) * vec4(stoneColorFilter, 1.0);
    vec4 dirtColor = triplanarSample(dirtTexture, vPosition, dirtRepeat * textureScale, lodFactor) * vec4(dirtColorFilter, 1.0);
    vec4 snowColor = triplanarSample(snowTexture, vPosition, snowRepeat * textureScale, lodFactor) * vec4(snowColorFilter, 1.0);

    // Blend colors
    vec4 baseColor = sandColor * sandWeight +
                    grassColor * grassWeight +
                    stoneColor * stoneWeight +
                    dirtColor * dirtWeight +
                    snowColor * snowWeight;

    // Apply blob weights
    float blobWeight = getBlobWeight(vWorldPosition);
    float grassOnStoneWeight = blobWeight * stoneWeight * blobGrassOnStone;
    float dirtOnStoneWeight = blobWeight * stoneWeight * blobDirtOnStone;
    float dirtOnGrassWeight = blobWeight * grassWeight * blobDirtOnGrass;

    if (grassOnStoneWeight > 0.0) {
        baseColor = mix(baseColor, grassColor, grassOnStoneWeight);
    }
    if (dirtOnStoneWeight > 0.0) {
        baseColor = mix(baseColor, dirtColor, dirtOnStoneWeight);
    }
    if (dirtOnGrassWeight > 0.0) {
        baseColor = mix(baseColor, dirtColor, dirtOnGrassWeight);
    }

    vec3 albedo = baseColor.rgb;
    vec3 lightDir = normalize(uSunlightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(lightDir + viewDir);

    vec3 upDirection = vec3(0.0, 1.0, 0.0);
    float skyFactor = max(dot(vWorldNormal, upDirection), 0.0);
    vec3 hemisphereLight = mix(uGroundColor, uSkyColor, skyFactor) * uHemisphereIntensity;
    float NdotL = max(dot(vWorldNormal, lightDir), 0.0);
    vec3 directLightColor = uSunlightColor * uSunlightIntensity;
    vec3 diffuse = diffuseIntensity * directLightColor * albedo * NdotL;

    float alpha = roughness * roughness;
    vec3 F0 = mix(vec3(0.04), albedo, metalness);
    float NdotV = max(dot(vWorldNormal, viewDir), 0.0);
    float NdotH = max(dot(vWorldNormal, halfDir), 0.0);
    float VdotH = max(dot(viewDir, halfDir), 0.0);
    float D = D_GGX(vWorldNormal, halfDir, roughness);
    float G = G_Smith(vWorldNormal, viewDir, lightDir, roughness);
    vec3 F = F_Schlick(VdotH, F0);
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = specularIntensity * (numerator / denominator) * directLightColor;

    float aoFactor = textureLod(aoTexture, vUv, lodFactor).r;
    aoFactor = mix(1.0, aoFactor, aoIntensity);

    float fogFactor = 0.0;
    if (fogFar > fogNear) {
        float fogDistance = clamp((distanceToCamera - fogNear) / (fogFar - fogNear), 0.0, 1.0);
        float heightFactor = 1.0 - smoothstep(fogHeightMin, fogHeightMax, vWorldPosition.y);
        fogFactor = fogDistance * heightFactor;
        fogFactor = 1.0 - exp(-fogDensity * fogFactor * distanceToCamera);
    }
    fogFactor = clamp(fogFactor, 0.0, 1.0);

    vec3 finalColor = mix(albedo, fogColor, fogFactor);

    float shadow = 1.0;
    #ifdef USE_SHADOWMAP
        DirectionalLightShadow directionalShadow = directionalLightShadows[0];
        shadow = getShadow(
            directionalShadowMap[0],
            directionalShadow.shadowMapSize,
            directionalShadow.shadowBias,
            directionalShadow.shadowRadius,
            vDirectionalShadowCoord[0]
        );
    #endif

    finalColor = finalColor * (hemisphereLight + ambientColor * envMapIntensity + diffuse * shadow) + specular * shadow;
    finalColor *= aoFactor;
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    private async createMaterial(isHighDetail: boolean = false): Promise<THREE.ShaderMaterial> {
        if (!this.Light) {
            this.Light = new THREE.DirectionalLight(0xffffff, 1); // You can adjust color and intensity
            this.Light.name = 'Terrain_Light';
            // You might want to set its position as well, e.g.,
            this.Light.position.set(1, 1, 1);
            // If your scene exists at this point, you might also want to add it to the scene:
            // this.scene.add(this.Light);
            console.log('Terrain_Light created as no light was set.');
        }

        const textureScaleMultiplier = isHighDetail ? this.HighDetailFactor : this.LowDetailFactor;
        const sunLight = this.Light as THREE.DirectionalLight;

        // Ensure all textures are loaded
        const requiredTextures = [
            this.sandTexture,
            this.grassTexture,
            this.stoneTexture,
            this.dirtTexture,
            this.snowTexture
        ];

        // Check if any required textures are missing
        const missingTextures = requiredTextures.some(texture => !texture);
        if (missingTextures) {
            console.warn('Some textures failed to load, attempting to reload...');
            await this.loadAllTextures();
        }

        const material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: THREE.UniformsUtils.merge([
              THREE.UniformsLib.common,
              THREE.UniformsLib.specularmap,
              THREE.UniformsLib.envmap,
              THREE.UniformsLib.aomap,
              THREE.UniformsLib.lightmap,
              THREE.UniformsLib.emissivemap,
              THREE.UniformsLib.bumpmap,
              THREE.UniformsLib.normalmap,
              THREE.UniformsLib.displacementmap,
              THREE.UniformsLib.gradientmap,
              THREE.UniformsLib.fog,
              THREE.UniformsLib.lights,
                {
                    uSunlightDirection: { value: sunLight.position},
                    uSunlightColor: { value: sunLight.color },
                    uSunlightIntensity: { value: sunLight.intensity },
                    clippingHeight: { value: this.clip_Height },
                    sandTexture: { value: this.sandTexture || new THREE.Texture() },
                    grassTexture: { value: this.grassTexture || new THREE.Texture() },
                    stoneTexture: { value: this.stoneTexture || new THREE.Texture() },
                    dirtTexture: { value: this.dirtTexture || new THREE.Texture() },
                    snowTexture: { value: this.snowTexture || new THREE.Texture() },
                    aoIntensity: { value: this.AOintensity },
                    sandRepeat: { value: this.sandScale * textureScaleMultiplier },
                    grassRepeat: { value: this.grassScale * textureScaleMultiplier },
                    stoneRepeat: { value: this.stoneScale * textureScaleMultiplier },
                    dirtRepeat: { value: this.dirtScale * textureScaleMultiplier },
                    snowRepeat: { value: this.snowScale * textureScaleMultiplier },
                    maxHeight: { value: this.maxHeight },
                    roughness: { value: this.roughness },
                    metalness: { value: this.metalness },
                    ambientColor: { value: this.ambientColor },
                    diffuseIntensity: { value: this.diffuseIntensity },
                    specularIntensity: { value: this.specularIntensity },
                    envMapIntensity: { value: this.envMapIntensity },
                    fogNear: { value: this.fogNear },
                    fogFar: { value: this.fogFar },
                    fogHeightMin: { value: this.fogHeightMin },
                    fogHeightMax: { value: this.fogHeightMax },
                    fogDensity: { value: this.fogDensity },
                    gradientSeed: { value: new THREE.Vector2(Math.random(), Math.random()) },
                    blendSmoothness: { value: this.blendSmoothness },
                    uvOffsetScale: { value: 0.1 },
                    uvRotationScale: { value: 0.4 },
                    cameraDistanceFactor: { value: isHighDetail ? this.HighDetailFactor * 1000 : this.LowDetailFactor * 1000 }, // Adjust factor as needed
                    sandSlopeStart: { value: this.sandSlopeStart },
                    sandSlopeEnd: { value: this.sandSlopeEnd },
                    grassSlopeStart: { value: this.grassSlopeStart },
                    grassSlopeEnd: { value: this.grassSlopeEnd },
                    stoneSlopeStart: { value: this.stoneSlopeStart },
                    stoneSlopeEnd: { value: this.stoneSlopeEnd },
                    stoneSlopeIntensity: { value: this.stoneSlopeIntensity },
                    dirtSlopeStart: { value: this.dirtSlopeStart },
                    dirtSlopeEnd: { value: this.dirtSlopeEnd },
                    dirtHeightStart: { value: this.dirtHeightStart },
                    dirtHeightEnd: { value: this.dirtHeightEnd },
                    snowSlopeStart: { value: this.snowSlopeStart },
                    snowSlopeEnd: { value: this.snowSlopeEnd },
                    snowHeightStart: { value: this.snowHeightStart },
                    snowHeightEnd: { value: this.snowHeightEnd },
                    snowBlendSmoothness: { value: this.snowBlendSmoothness },
                    heightmapTexture: { value: this.heightmapTexture },
                    heightmapSize: { value: new THREE.Vector2(this.heightmapSize.width, this.heightmapSize.height) },
                    terrainScale: { value: this.Scale },
                    terrainOffset: { value: this.Offset },
                    uSkyColor: { value: this.skyColor },
                    uGroundColor: { value: this.groundColor },
                    uHemisphereIntensity: { value: this.HemisphereLightIntensity },
                    BackcullingShader: { value: this.BackcullingShader },
                    backfaceCullingThreshold: { value: 0.0 },
                    overallUvOffset: { value: this.overallTextureOffset },
                    overallUvRotation: { value: this.overallTextureRotation },
                    grassStoneInfluenceFactor: { value: 1.0 },
                    dirtBetweenFactor: { value: new THREE.Vector2(0.01, 0.2) },
                    fogColor: { value: this.fogColor },

                    // Shadow uniforms
                    shadowMapResolution: { value: this.shadowMapResolution },
                    shadowSoftness: { value: this.shadowSoftness },
                    shadowBias: { value: this.shadowBias },

                    // New uniforms for dynamic blending
                    blendFactor: { value: 0.5 }, // Adjust to control the overall influence
                    blendFrequency: { value: 0.1 }, // Adjust for the scale of the noise
                    blendAmplitude: { value: 0.3 }, // Adjust for the intensity of the noise effect
                    blendSharpness: { value: 5.0 }, // Adjust for sharper or smoother transitions

                    // New uniforms for blob layer
                    blobGrassTexture: { value: this.grassTexture }, // Using existing grass texture for blobs
                    blobDirtTexture: { value: this.dirtTexture },   // Using existing dirt texture for blobs
                    blobInfluence: { value: 1 },
                    blobDensity: { value: 0.05 },
                    blobScale: { value: 0.8 },
                    blobGrassOnStone: { value: 0.8 },
                    blobDirtOnStone: { value: 0.5 },
                    blobDirtOnGrass: { value: 0.1 },

                    // New uniform for close-range texture scale
                    textureScaleClose: { value: this.CloseRangeFactor },
                    textureScaleMid: { value: this.MidRangeFactor },
                    textureScaleCloseDistance: { value: this.CloseRangeFactorDistance },
                    textureScaleMidDistance: { value: this.MidRangeFactorDistance },
                    beachHeight: { value: this.beachHeight },

                    // Add new uniforms for octave noise
                    octaveScale: { value: this.octaveScale },
                    octaveIntensity: { value: this.octaveIntensity },
                    octaveOctaves: { value: this.octaveOctaves },
                    octavePersistence: { value: this.octavePersistence },
                    octaveLacunarity: { value: this.octaveLacunarity },
                    octaveSeed: { value: this.octaveSeed },

                    borderNoiseScale: { value: 100.0 },
                    borderNoiseIntensity: { value: 0.5 },
                    borderNoiseOctaves: { value: 4 },
                    borderNoisePersistence: { value: 0.5 },
                    borderNoiseLacunarity: { value: 2.0 },
                    borderNoiseSeed: { value: 12345 },
                    sandColorFilter: { value: this.sandColorFilter },
                    grassColorFilter: { value: this.grassColorFilter },
                    stoneColorFilter: { value: this.stoneColorFilter },
                    dirtColorFilter: { value: this.dirtColorFilter },
                    snowColorFilter: { value: this.snowColorFilter },
                }
            ]),
            lights: true,
            fog: true,
            shadowSide: THREE.FrontSide,
        });

        // Set receiveShadow after material creation
        material.customProgramCacheKey = () => 'terrainShader'; // Ensure unique shader compilation
        return material;
    }

    private updateShaderUniforms() {
        if (!this.Light) {
            console.warn('this.Light is undefined in updateShaderUniforms!');
            return; // Or handle this case appropriately
        }
        const sunLight = this.Light as THREE.DirectionalLight;
        const normalizedDirection = sunLight.position;
        const commonUniforms = {
            aoIntensity: this.AOintensity,
            maxHeight: this.maxHeight,
            roughness: this.roughness,
            metalness: this.metalness,
            ambientColor: this.ambientColor,
            diffuseIntensity: this.diffuseIntensity,
            specularIntensity: this.specularIntensity,
            envMapIntensity: this.envMapIntensity,
            blendSmoothness: this.blendSmoothness,
            clippingHeight: this.clip_Height,
            sandSlopeStart: this.sandSlopeStart,
            sandSlopeEnd: this.sandSlopeEnd,
            grassSlopeStart: this.grassSlopeStart,
            grassSlopeEnd: this.grassSlopeEnd,
            stoneSlopeStart: this.stoneSlopeStart,
            stoneSlopeEnd: this.stoneSlopeEnd,
            stoneSlopeIntensity: this.stoneSlopeIntensity,
            dirtSlopeStart: this.dirtSlopeStart,
            dirtSlopeEnd: this.dirtSlopeEnd,
            dirtHeightEnd: this.dirtHeightEnd,
            snowSlopeStart: this.snowSlopeStart,
            snowSlopeEnd: this.snowSlopeEnd,
            snowHeightStart: this.snowHeightStart,
            snowHeightEnd: this.snowHeightEnd,
            snowBlendSmoothness: this.snowBlendSmoothness,
            heightmapTexture: this.heightmapTexture,
            heightmapSize: new THREE.Vector2(this.heightmapSize.width, this.heightmapSize.height),
            terrainScale: this.Scale,
            terrainOffset: this.Offset,
            uSunlightDirection: normalizedDirection,
            uSunlightColor: sunLight.color,
            uSunlightIntensity: sunLight.intensity,
            uHemisphereIntensity: this.HemisphereLightIntensity,
            sandTexture: this.sandTexture,
            grassTexture: this.grassTexture,
            stoneTexture: this.stoneTexture,
            dirtTexture: this.dirtTexture,
            snowTexture: this.snowTexture,
            BackcullingShader: this.BackcullingShader,
            overallUvOffset: this.overallTextureOffset,
            overallUvRotation: this.overallTextureRotation,
            grassStoneInfluenceFactor: this.grassStoneInfluenceFactor,
            dirtBetweenFactor: this.dirtBetweenFactor,
            fogColor: this.fogColor,
            fogNear: this.fogNear,
            fogFar: this.fogFar,
            fogDensity: this.fogDensity,
            fogHeightMin: this.fogHeightMin,
            fogHeightMax: this.fogHeightMax,

            // Update shadow uniforms
            shadowMapResolution: this.shadowMapResolution,
            shadowSoftness: this.shadowSoftness,
            shadowBias: this.shadowBias,

            // Update dynamic blending uniforms
            blendFactor: this.blendFactor,
            blendFrequency: this.blendFrequency,
            blendAmplitude: this.blendAmplitude,
            blendSharpness: this.blendSharpness,

            // Update blob layer uniforms
            blobInfluence: this.blobInfluence,
            blobDensity: this.blobDensity,
            blobScale: this.blobScale,
            blobGrassOnStone: this.blobGrassOnStone,
            blobDirtOnStone: this.blobDirtOnStone,
            blobDirtOnGrass: this.blobDirtOnGrass,
            blobGrassTexture: this.grassTexture, // Ensure textures are updated if they change
            blobDirtTexture: this.dirtTexture,   // Ensure textures are updated if they change

            // Update new texture scale uniform
            textureScaleClose: this.CloseRangeFactor,
            textureScaleMid: this.MidRangeFactor,
            textureScaleCloseDistance: this.CloseRangeFactorDistance,
            textureScaleMidDistance: this.MidRangeFactorDistance,
            beachHeight: this.beachHeight,

            // Update octave noise uniforms
            octaveScale: this.octaveScale,
            octaveIntensity: this.octaveIntensity,
            octaveOctaves: this.octaveOctaves,
            octavePersistence: this.octavePersistence,
            octaveLacunarity: this.octaveLacunarity,
            octaveSeed: this.octaveSeed,

            borderNoiseScale: this.borderNoiseScale,
            borderNoiseIntensity: this.borderNoiseIntensity,
            borderNoiseOctaves: this.borderNoiseOctaves,
            borderNoisePersistence: this.borderNoisePersistence,
            borderNoiseLacunarity: this.borderNoiseLacunarity,
            borderNoiseSeed: this.borderNoiseSeed,
            sandColorFilter: this.sandColorFilter,
            grassColorFilter: this.grassColorFilter,
            stoneColorFilter: this.stoneColorFilter,
            dirtColorFilter: this.dirtColorFilter,
            snowColorFilter: this.snowColorFilter,
        };
        if (this.highDetailMaterial) {
            const textureScaleMultiplier = this.HighDetailFactor;
            this.highDetailMaterial.uniforms.sandRepeat.value = this.sandScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.grassRepeat.value = this.grassScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.stoneRepeat.value = this.stoneScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.dirtRepeat.value = this.dirtScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.snowRepeat.value = this.snowScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.cameraDistanceFactor.value = this.HighDetailFactor * 1000;
            for (const uniformName in commonUniforms) {
                if (this.highDetailMaterial.uniforms[uniformName]) {
                    this.highDetailMaterial.uniforms[uniformName].value = commonUniforms[uniformName];
                }
            }
        }
        if (this.lowDetailMaterial) {
            const textureScaleMultiplier = this.LowDetailFactor;
            this.lowDetailMaterial.uniforms.sandRepeat.value = this.sandScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.grassRepeat.value = this.grassScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.stoneRepeat.value = this.stoneScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.dirtRepeat.value = this.dirtScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.snowRepeat.value = this.snowScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.cameraDistanceFactor.value = this.LowDetailFactor * 1000;
            for (const uniformName in commonUniforms) {
                if (this.lowDetailMaterial.uniforms[uniformName]) {
                    this.lowDetailMaterial.uniforms[uniformName].value = commonUniforms[uniformName];
                }
            }
        }
    }

    private highDetailMaterial: THREE.ShaderMaterial;
    private lowDetailMaterial: THREE.ShaderMaterial;
    public BackcullingShader: number = 90;




//=======================================================================================
//
// #region Foliage
//
//=======================================================================================

    private globalInstantiatedPrefabs: { [key: string]: THREE.Group } = {};
    private foliagePrefabsFolder: THREE.Object3D | null = null;

    private getInstantiatedPrefab(prefab: RE.Prefab): THREE.Group | null {
      if (!prefab) return null;
      const prefabName = prefab.name;

      // Initialize foliage prefabs folder if not exists
      if (!this.foliagePrefabsFolder) {
        this.foliagePrefabsFolder = new THREE.Object3D();
        this.foliagePrefabsFolder.name = "FoliagePrefabs";
        this.object3d.add(this.foliagePrefabsFolder);
      }

      // If no master instance exists for this prefab, instantiate and store it
      if (!this.globalInstantiatedPrefabs[prefabName]) {
        const instance = prefab.instantiate() as THREE.Group;
        if (instance) {
          instance.name = `Master_${prefabName}`;
          this.globalInstantiatedPrefabs[prefabName] = instance;
          this.foliagePrefabsFolder!.add(instance);
          instance.visible = false; // Hide the master instance
        } else {
          console.warn(`Failed to instantiate prefab: ${prefabName}`);
          return null; // Failed instantiation
        }
      }
      // Clone the master instance rather than returning the cached instance directly
      return this.globalInstantiatedPrefabs[prefabName].clone();
    }

    private generateFoliageInstances(group: THREE.Group, geometry: THREE.BufferGeometry, seed: number) {
        // Set default values for settings arrays if not specified
        // (Default value setting logic remains the same)
        if (!this.fDensities || this.fDensities.length === 0) this.fDensities = [0.005];
        if (!this.fScaleMins || this.fScaleMins.length === 0) this.fScaleMins = [1];
        if (!this.fScaleMaxs || this.fScaleMaxs.length === 0) this.fScaleMaxs = [5];
        if (!this.fRotateWithTerrain || this.fRotateWithTerrain.length === 0) this.fRotateWithTerrain = [true];
        if (!this.fSlopeStart || this.fSlopeStart.length === 0) this.fSlopeStart = [0];
        if (!this.fSlopeEnd || this.fSlopeEnd.length === 0) this.fSlopeEnd = [0.3];
        if (!this.fHeightMin || this.fHeightMin.length === 0) this.fHeightMin = [100];
        if (!this.fHeightMax || this.fHeightMax.length === 0) this.fHeightMax = [100000];
        if (!this.fUndergroundOffsets || this.fUndergroundOffsets.length === 0) this.fUndergroundOffsets = [0];
        if (!this.fIterations || this.fIterations.length === 0) this.fIterations = [1];

        // Clear previous foliage folder if it exists
        const existingFoliage = group.getObjectByName("Foliage");
        if (existingFoliage) {
            // Use await here if clearing needs to finish before generating new foliage,
            // otherwise, let it run concurrently (potential for overlap if generation is fast).
            this.clearFoliage(group);
        }

        const foliageFolder = new THREE.Group();
        foliageFolder.name = "Foliage";

        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;

        const allFoliageMeshes: THREE.InstancedMesh[] = [];

        // Dynamically gather all prefab groups
        const prefabGroupKeys = Object.keys(this)
            .filter(key => key.startsWith("fPrefabsGroup_"))
            .sort((a, b) => {
                const numA = parseInt(a.replace("fPrefabsGroup_", ""));
                const numB = parseInt(b.replace("fPrefabsGroup_", ""));
                return numA - numB;
            });

        // Loop over each group and their respective iterations
        prefabGroupKeys.forEach((groupKey, groupIndex) => {
            const groupIterations = this.fIterations[groupIndex] ?? 1;

            for (let iteration = 0; iteration < groupIterations; iteration++) {
                // Retrieve group-specific settings
                const density = this.fDensities[groupIndex % this.fDensities.length];
                const minScale = this.fScaleMins[groupIndex % this.fScaleMins.length];
                const maxScale = this.fScaleMaxs[groupIndex % this.fScaleMaxs.length];
                const rotateWithTerrain = this.fRotateWithTerrain[groupIndex % this.fRotateWithTerrain.length];
                const slopeStart = this.fSlopeStart[groupIndex % this.fSlopeStart.length];
                const slopeEnd = this.fSlopeEnd[groupIndex % this.fSlopeEnd.length];
                const heightMin = this.fHeightMin[groupIndex % this.fHeightMin.length];
                const heightMax = this.fHeightMax[groupIndex % this.fHeightMax.length];
                const undergroundOffset = this.fUndergroundOffsets[groupIndex % this.fUndergroundOffsets.length];

                // Access the prefab group
                const prefabGroup: RE.Prefab[] = (this as any)[groupKey];
                if (!prefabGroup || prefabGroup.length === 0) continue;

                // --- Position Calculation (No Caching) ---
                const foliagePositions: { position: THREE.Vector3; normal: THREE.Vector3; baseSeed: number; originalIndex: number }[] = [];
                for (let i = 0; i < positions.length; i += 3) {
                    const randomValue = this.seededRandom(seed + groupIndex * 200000 + iteration * 1000 + i, 0);
                    if (randomValue > density) continue;

                    const localPos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                    const worldY = this.getWorldY(localPos, group); // Ensure group's world matrix is updated if needed
                    const ny = normals[i + 1];
                    const slope = 1 - ny;
                    const withinHeightRange = (heightMin === undefined || worldY >= heightMin) &&
                                            (heightMax === undefined || worldY <= heightMax);

                    if (slope >= slopeStart && slope <= slopeEnd && withinHeightRange) {
                        const baseSeedValue = seed + groupIndex * 200000 + iteration * 1000 + i;
                        foliagePositions.push({
                            position: localPos,
                            normal: new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]),
                            baseSeed: baseSeedValue,
                            originalIndex: i / 3,
                        });
                    }
                }
                // --- End Position Calculation ---

                if (foliagePositions.length === 0) continue;

                // Group instances by variant with skip chance
                const variantInstances: { [variantIndex: number]: typeof foliagePositions } = {};
                for (const instanceData of foliagePositions) {
                    const skipChance = this.seededRandom(instanceData.baseSeed, 9);
                    if (skipChance < 0.4) continue;

                    const variantRandom = this.seededRandom(instanceData.baseSeed, 8);
                    const variantIndex = Math.floor(variantRandom * prefabGroup.length);
                    if (!variantInstances[variantIndex]) {
                        variantInstances[variantIndex] = [];
                    }
                    variantInstances[variantIndex].push(instanceData);
                }

                // Create instanced meshes for each variant
                for (const variantKey in variantInstances) {
                    const variantIndex = parseInt(variantKey);
                    const instances = variantInstances[variantIndex];
                    const prefab = prefabGroup[variantIndex];
                    if (!prefab) continue;

                    // Use the cloned prefab instance from the master
                    const instantiatedPrefab = this.getInstantiatedPrefab(prefab);
                    if (!instantiatedPrefab) continue; // Already logged warning in getInstantiatedPrefab

                    const sourcePrefabMeshes: THREE.Mesh[] = [];
                    instantiatedPrefab.traverse(child => {
                        // Ensure we only get direct Mesh children, or handle nested structures appropriately
                        if (child instanceof THREE.Mesh) {
                            sourcePrefabMeshes.push(child);
                        }
                    });

                    // Important: Check if the *cloned* prefab actually contains meshes.
                    if (sourcePrefabMeshes.length === 0) {
                         console.warn(`Cloned prefab ${prefab.name} contains no Mesh children.`);
                         continue; // Skip this variant if the base prefab has no meshes
                    }

                    sourcePrefabMeshes.forEach(sourcePrefabMesh => {
                        // --- InstancedMesh Creation (No Caching) ---
                        const numInstancesNeeded = instances.length;
                        let foliageMesh: THREE.InstancedMesh;

                        // Always create a new InstancedMesh.
                        // Use the geometry and material from the cloned source prefab mesh.
                        // DO NOT clone geometry/material here if they should be shared from the cloned prefab.
                        const baseGeometry = sourcePrefabMesh.geometry;
                        const baseMaterial = sourcePrefabMesh.material;
                        foliageMesh = new THREE.InstancedMesh(
                            baseGeometry, baseMaterial, numInstancesNeeded);
                        foliageMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                        // --- End InstancedMesh Creation ---

                        const matrix = new THREE.Matrix4();
                        const quaternion = new THREE.Quaternion();
                        const scale = new THREE.Vector3();

                        // Set transformation for each instance
                        instances.forEach((instanceData, index) => {
                             const { position, normal, baseSeed, originalIndex } = instanceData;
                            const angle = this.seededRandom(baseSeed, 3) * Math.PI * 2;
                            const scaleFactor = minScale + this.seededRandom(baseSeed, 4) * (maxScale - minScale);
                            const randomScaleY = scaleFactor * (0.8 + this.seededRandom(baseSeed, 5) * 0.4);

                            if (rotateWithTerrain) {
                                quaternion.setFromUnitVectors(
                                    new THREE.Vector3(0, 1, 0), normal.normalize());
                            } else {
                                quaternion.identity();
                            }
                            const randomYRotation = new THREE.Quaternion().setFromAxisAngle(
                                new THREE.Vector3(0, 1, 0), angle);
                            quaternion.multiply(randomYRotation);

                            scale.set(scaleFactor, randomScaleY, scaleFactor);

                            // Position jitter with clustering
                            const clusterChance = this.seededRandom(baseSeed, 7);
                            const jitterMultiplier = clusterChance < 0.3 ? 0.5 : 0.8; // Example clustering effect
                            const offsetX = (this.seededRandom(seed + originalIndex * 10 + groupIndex * 100, 0) - 0.5)
                                            * jitterMultiplier * scaleFactor * (iteration * 0.1 + 1);
                            const offsetZ = (this.seededRandom(seed + originalIndex * 10 + groupIndex * 100, 1) - 0.5)
                                            * jitterMultiplier * scaleFactor * (iteration * 0.1 + 1);

                            const originalNormal = instanceData.normal;
                            const deltaY = (Math.abs(originalNormal.y) > 1e-6)
                                ? -(originalNormal.x * offsetX + originalNormal.z * offsetZ) / originalNormal.y
                                : 0;

                            const terrainY = position.y + deltaY;
                            const finalY = terrainY + undergroundOffset;

                            const finalPosition = new THREE.Vector3(
                                position.x + offsetX,
                                finalY,
                                position.z + offsetZ
                            );

                            matrix.compose(finalPosition, quaternion, scale);
                            foliageMesh.setMatrixAt(index, matrix);
                        });

                        foliageMesh.instanceMatrix.needsUpdate = true;
                        foliageMesh.frustumCulled = true;
                        allFoliageMeshes.push(foliageMesh);
                    });

                } // End loop variantKey
            } // End loop iteration
        }); // End loop groupKey

        // Spawn foliage in batches
        this.spawnFoliageBatched(foliageFolder, allFoliageMeshes, this.fBatchSize, this.fSpawnDelay);
        group.add(foliageFolder);
    }

    private async spawnFoliageBatched(group: THREE.Group, meshes: THREE.InstancedMesh[], batchSize: number, delay: number) {
      batchSize = Math.max(1, batchSize);
      for (let i = 0; i < meshes.length; i += batchSize) {
        const batch = meshes.slice(i, i + batchSize);
        batch.forEach(mesh => {
          if (mesh) {
              group.add(mesh);
          }
        });
        if (i + batchSize < meshes.length && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    private seededRandom(seed: number, index: number): number {
      const a = 1664525;
      const c = 1013904223;
      const m = 2**32;
      let currentSeed = (seed + index * 7919);
      currentSeed = (a * currentSeed + c) % m;
      const x = Math.sin(currentSeed) * 10000;
      return x - Math.floor(x);
    }

    public async clearFoliage(group: THREE.Group) {
      const foliageFolder = group.getObjectByName("Foliage");
      if (foliageFolder) {
        const meshesToRemove: THREE.Object3D[] = [];
        foliageFolder.traverse(child => {
          if (child instanceof THREE.InstancedMesh) {
            meshesToRemove.push(child);
          }
        });

        for (const mesh of meshesToRemove) {
          if (mesh instanceof THREE.InstancedMesh) {
             mesh.geometry.dispose();
             if (Array.isArray(mesh.material)) {
                 mesh.material.forEach(m => m.dispose());
             } else {
                 mesh.material.dispose();
            }
          }
          foliageFolder.remove(mesh);
          if (this.fRemoveDelay > 0) {
              await new Promise(resolve => setTimeout(resolve, this.fRemoveDelay));
          }
        }
        group.remove(foliageFolder);
      }

      // Clean up master prefabs if requested
      if (this.foliagePrefabsFolder) {
        // Only dispose if this is a complete cleanup (e.g., when stopping the component)
        const shouldDisposeMasters = !this.object3d.parent;
        if (shouldDisposeMasters) {
          // Dispose all master prefab resources
          this.foliagePrefabsFolder.traverse(child => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else if (child.material) {
                child.material.dispose();
              }
            }
          });
          // Clear the prefabs folder
          while (this.foliagePrefabsFolder.children.length > 0) {
            this.foliagePrefabsFolder.remove(this.foliagePrefabsFolder.children[0]);
          }
          this.object3d.remove(this.foliagePrefabsFolder);
          this.foliagePrefabsFolder = null;
          this.globalInstantiatedPrefabs = {};
        }
      }
    }

    private getWorldY(localPos: THREE.Vector3, parent: THREE.Object3D): number {
      const worldPos = localPos.clone();
      parent.updateMatrixWorld(true);
      worldPos.applyMatrix4(parent.matrixWorld);
      return worldPos.y;
    }






//=======================================================================================
//
// #region INPUTS
//
//=======================================================================================

    // docs
    @RE.props.text() Docs: string = "https://github/";
    @RE.props.checkbox() View_Mode: boolean = true;


            @RE.props.button() SEPcore;
            SEPcoreLabel = "🛠️⚙️ 𝗚𝗘𝗡𝗘𝗥𝗔𝗟";
      @RE.props.texture() heightmapTexture: THREE.Texture | null = null;   // Overrides StaticPath, remove image from this input for production
      @RE.props.text() HeightmapStaticPath: string = "MapGen/Maps/map.png";
      @RE.props.vector3() Scale: THREE.Vector3 = new THREE.Vector3(20, 20, 20);
      @RE.props.vector3() Offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
      @RE.props.vector3() Rotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
      @RE.props.object3d() Light: THREE.Object3D;
      @RE.props.num() Concurrent_Chunks = 1;  // Amount of processed chunks geometries at once
      @RE.props.num() next_Chunk_ms: number = 50; // Delay between chunks processing in ms (geometry/shaders/etc)
      @RE.props.text() _______________________________: string = " ";
      @RE.props.num() chunk_Size = 100; // Amount of geometry CPU-generated at once
      @RE.props.num() tile_Size = 256;  // Amount of Height Data processed/cached from Heightmap image to memory at once
      @RE.props.num() LOD_Quality = 5; // Detail of Far Chunks (1 means full quality, "5" means 5x times less detailed)
      @RE.props.num() high_RenderDistance = 3;  // Radius in chunks for high detail
      @RE.props.num() low_RenderDistance = 14;  // Radius in chunks for low detail
      @RE.props.num() Terrain_Smoothness = 2;
      @RE.props.num() clip_Height: number = 1; // GPU/Shader polygon discard below this number, wont delete mesh geometry tho
      @RE.props.text() ___________________________: string = " ";
      @RE.props.num() priority_UpdateInterval = 250; // ms between priority updates
      @RE.props.num() backfaceCullingAngle = 50; // Degree from behind camera to unload chunks
      @RE.props.num() occlusionAngleThreshold = 45; // Degrees from camera forward to consider for occlusion
      @RE.props.num() DeactivationDelay = 7000; // ms delay before deactivating chunks behind camera
      @RE.props.num() occlusionOffset = 2000; // Distance behind camera to start occlusion checks
      @RE.props.num() maxCacheSize = 2048; // Maximum number of chunks to cache
      @RE.props.num() cacheCleanupInterval = 30000; // ms between cache cleanups
      @RE.props.num() deletionConcurrency = 10;
      @RE.props.num() deletionBatchDelay = 250;



          @RE.props.button() SEPtex;
          SEPtexLabel = "🎨🏞️ 𝗧𝗘𝗫𝗧𝗨𝗥𝗘𝗦 ";
      @RE.props.text() texturesStaticPath: string = "MapGen/Textures/";
      @RE.props.text() ktx2_Transcoder: string = "Modules/basis/";
      @RE.props.texture() sandTexture: THREE.Texture | null = null;
      @RE.props.num() sandScale = 1;
      @RE.props.num() sandSlopeStart = -0.1;
      @RE.props.num() sandSlopeEnd = 0.1;
      @RE.props.num() beachHeight = 74; // Height below which sand is prioritized over grass/dirt
      @RE.props.texture() grassTexture: THREE.Texture | null = null;
      @RE.props.num() grassScale = 1;
      @RE.props.num() grassSlopeStart = 0;
      @RE.props.num() grassSlopeEnd = 0.25;
      @RE.props.texture() stoneTexture: THREE.Texture | null = null;
      @RE.props.num() stoneScale = 1;
      @RE.props.num() stoneSlopeStart = 2;
      @RE.props.num() stoneSlopeEnd = 0;
      @RE.props.num() stoneSlopeIntensity = 0.02;
      @RE.props.texture() dirtTexture: THREE.Texture | null = null;
      @RE.props.num() dirtScale = 1;
      @RE.props.num() dirtSlopeStart = -3;
      @RE.props.num() dirtSlopeEnd = 4;
      @RE.props.num() dirtHeightStart = 1;
      @RE.props.num() dirtHeightEnd = 0;
      @RE.props.texture() snowTexture: THREE.Texture | null = null;
      @RE.props.num() snowScale = 0.3;
      @RE.props.num() snowSlopeStart = 1;
      @RE.props.num() snowSlopeEnd = -1.3;
      @RE.props.num() snowHeightStart = 0.8;
      @RE.props.num() snowHeightEnd = 1.0;
      @RE.props.num() snowBlendSmoothness = 1.0;


        @RE.props.button() SEPfoliage;
        SEPfoliageLabel = "🌿🪨️🌳 𝗙𝗢𝗟𝗜𝗔𝗚𝗘";
    @RE.props.checkbox() enableFoliage: boolean = false;

    @RE.props.list.prefab() fPrefabsGroup_0: RE.Prefab[] = [];
    @RE.props.list.prefab() fPrefabsGroup_1: RE.Prefab[] = [];
    @RE.props.list.prefab() fPrefabsGroup_2: RE.Prefab[] = [];
    // When you add new groups (like fPrefabsGroup_3) they will be detected automatically

    @RE.props.text() __________________________________: string = " ";
    @RE.props.list.num(0.005, 10) fDensities: number[] = [];
    @RE.props.list.checkbox() fRotateWithTerrain: boolean[] = [];
    @RE.props.list.num(-100000, 100000) fUndergroundOffsets: number[] = [];
    @RE.props.list.num(1, 10) fIterations: number[] = [];
    @RE.props.text() _____________________________________________: string = "";
    @RE.props.list.num(-1000, 1000) fScaleMins: number[] = [];
    @RE.props.list.num(-1000, 1000) fScaleMaxs: number[] = [];
    @RE.props.text() _____________________________________: string = "";
    @RE.props.list.num(0, 1) fSlopeStart: number[] = [];
    @RE.props.list.num(0, 1) fSlopeEnd: number[] = [];
    @RE.props.text() ________________________________________: string = "";
    @RE.props.list.num(-100000, 100000) fHeightMin: number[] = [];
    @RE.props.list.num(-100000, 100000) fHeightMax: number[] = [];
    @RE.props.text() __________________________________________: string = "";

    @RE.props.num() fSeed: number = 69;
    @RE.props.num() fBatchSize: number = 20;
    @RE.props.num() fSpawnDelay: number = 250;
    @RE.props.num() fRemoveDelay: number = 50;


      @RE.props.button() SEPcoll;
      SEPcollLabel = "💥🚧 𝗖𝗢𝗟𝗟𝗜𝗦𝗜𝗢𝗡 ";
      @RE.props.checkbox() RapierCollision = false;
      @RE.props.num() collisionChunkSize = 10;
      @RE.props.num() collider_Subdivision = 10;
      @RE.props.num(1, 4) collider_TriangleSubdivisions = 2;
      //@RE.props.num() collisionChunkBuffer = 1;
      public collisionChunkBuffer = 1;
      //@RE.props.num() collisionGenerationDelay = 5000;
      public collisionGenerationDelay = 10000;
      @RE.props.checkbox() VisualizeCollision = false;

      @RE.props.button() SEPmap;
      SEPmapLabel = "🧭🗺️ 𝗠𝗜𝗡𝗜𝗠𝗔𝗣 & 𝗡𝗔𝗩𝗜𝗚𝗔𝗧𝗜𝗢𝗡 ";
      @RE.props.button() refmap = () => RMG_Navigation.refreshMapCanvas();
        refmapLabel = "[Debug] refresh map";
      @RE.props.checkbox() EnableMinimap: boolean = true;
      @RE.props.num() oceanLevel = 0.1;
      @RE.props.num() beachRange = 0.05;
      @RE.props.num() grassMin = 0.2;
      @RE.props.num() STONE_SLOPE = 0.04;
      @RE.props.num() terrainMaxHeight = 1;
      @RE.props.text()  minimapPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';

        @RE.props.button() SEPloadbar;
        SEPloadbarLabel = "⏳🧉 𝗟𝗢𝗔𝗗𝗜𝗡𝗚 𝗕𝗔𝗥";
    @RE.props.color() loaded_tiles_color = new THREE.Color(0x8BC34A);
    @RE.props.color() unloaded_tiles_color = new THREE.Color(0x555555);
    @RE.props.list.text() load_msgs: string[] = [
        "Loading Tiles",
        "Building Terrain",
        "Seeding Trees",
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "🧉 Chilling"
    ];
    @RE.props.num() msg_next_tiles: number = 100; // set to 0 to select randomly just once

          @RE.props.button() SEPtexOverall;
            SEPtexOverallLabel = "✨🌫️ 𝗔𝗠𝗕𝗜𝗘𝗡𝗖𝗘";
      // Add texture color filter properties
      @RE.props.color() sandColorFilter = new THREE.Color(0xe6e0da);
      @RE.props.color() grassColorFilter = new THREE.Color(0xebebeb);
      @RE.props.color() stoneColorFilter = new THREE.Color(0xd3d3d3);
      @RE.props.color() dirtColorFilter = new THREE.Color(0xf0f0f0);
      @RE.props.color() snowColorFilter = new THREE.Color(0xffffff);
      @RE.props.text() ___________________________________________: string = " ";
      // Add new octave weight parameters
      @RE.props.num() octaveScale = 56;  // Scale of the noise pattern
      @RE.props.num() octaveIntensity = 3;  // Overall intensity of octave influence
      @RE.props.num() octaveOctaves = 2;  // Number of octaves to use
      @RE.props.num() octavePersistence = 0.2;  // How much each octave's amplitude decreases
      @RE.props.num() octaveLacunarity = 0.6;  // How much each octave's frequency increases
      @RE.props.num() octaveSeed = 69;  // Seed for the noise generation
      @RE.props.num() borderNoiseScale = 10;
      @RE.props.num() borderNoiseIntensity = 0.5;
      @RE.props.num() borderNoiseOctaves = 1;
      @RE.props.num() borderNoisePersistence = 1;
      @RE.props.num() borderNoiseLacunarity = 1;
      @RE.props.num() borderNoiseSeed = 69;
      @RE.props.text() ______________________________________: string = " ";
      @RE.props.num() HighDetailFactor = 0.025;
      @RE.props.num() LowDetailFactor = 0.005;
      @RE.props.num() MidRangeFactorDistance = 1000;
      @RE.props.num() MidRangeFactor = 2;
      @RE.props.num() CloseRangeFactorDistance = 100;
      @RE.props.num() CloseRangeFactor = 20;
      @RE.props.text() _________________________________: string = " ";
      @RE.props.num() shadowMapResolution = 512;
      @RE.props.num() shadowSoftness = 100;
      @RE.props.num() shadowBias = 0.1;

      @RE.props.vector2() overallTextureOffset = new THREE.Vector2(1, 1);
      @RE.props.num() overallTextureRotation = 1;
      @RE.props.num() maxHeight = 255; // Controls limits of Slopes and Textures Heights (lower for more snowy, higher for more sandy)
      @RE.props.num() roughness = 0;
      @RE.props.num() metalness = 0;
      @RE.props.color() ambientColor = new THREE.Color(0xffffff);
      @RE.props.num() diffuseIntensity = 1.5;
      @RE.props.num() specularIntensity = 1;
      @RE.props.num() envMapIntensity = 1;
        @RE.props.text() ____________________________________: string = " ";
      @RE.props.num() fogNear = 10000;
      @RE.props.num() fogFar = 20000;
      @RE.props.num() fogHeightMin = 1;
      @RE.props.num() fogHeightMax = 5000;
        @RE.props.num() fogDensity: 0.0001;
      @RE.props.color() fogColor = new THREE.Color(0xb7b7b7);
      @RE.props.text() _____________________________: string = " ";
      @RE.props.num() HemisphereLightIntensity = 0.1;
    @RE.props.color() skyColor = new THREE.Color(0xbcdaff);
    @RE.props.color() groundColor = new THREE.Color(0x957c59);
    @RE.props.num() AOintensity = 1;
    @RE.props.text() _______________________________________: string = " ";
    @RE.props.num() grassStoneInfluenceFactor = 20;
    @RE.props.vector2() dirtBetweenFactor = new THREE.Vector2(-8, 40);
    @RE.props.num() blobInfluence = -0.5;
    @RE.props.num() blobDensity = 0.005;
    @RE.props.num() blobScale = 1.5;
    @RE.props.num() blobGrassOnStone = 0.5;
    @RE.props.num() blobDirtOnStone = 0.5;
    @RE.props.num() blobDirtOnGrass = 0.8;
    @RE.props.text() _______________________________________________: string = " ";
    @RE.props.num() blendFactor = 1;
    @RE.props.num() blendFrequency = 1;
    @RE.props.num() blendAmplitude = 1.8;
    @RE.props.num() blendSharpness = 1;
    @RE.props.num() blendSmoothness = 1;



          @RE.props.button() SEPexp;
        SEPexpLabel = "🧪⚡ 𝗣𝗥𝗢𝗖𝗘𝗗𝗨𝗥𝗔𝗟 𝗙𝗜𝗟𝗧𝗘𝗥";
    @RE.props.button() exportHeightmapButton = () => RMG_Export.exportHeightmapBatched();
    exportHeightmapButtonLabel = "[EXPORT] Terrain to Heightmap";

    @RE.props.button() refreshTerrainButton = () => this.refreshTerrain();
    refreshTerrainButtonLabel = "[REFRESH] Regenerate Terrain";

    // Fractal Noise Configuration (procedural terrain modification)
    @RE.props.checkbox() enableFractal: boolean = false; // Enable/disable fractal noise
    @RE.props.num() fractalIntensity: number = 0.08; // Overall strength of the fractal effect
    @RE.props.num() fractalScale: number = 300; // Scale of the noise pattern
    @RE.props.num() fractalOctaves: number = 2; // Number of noise layers
    @RE.props.num() fractalPersistence: number = 0.5; // How much each octave contributes
    @RE.props.num() fractalLacunarity: number = 0.2; // How much detail is added in each octave
    @RE.props.num() fractalSeed: number = 69;
    @RE.props.text() _______________________________________________________________: string = " ";

    // Coastal Erosion Configuration
    @RE.props.checkbox() enableCoastalErosion: boolean = false; // Enable/disable coastal erosion
    @RE.props.num() coastalErosionIntensity: number = 1.0; // Overall strength of erosion (0-2)
    @RE.props.num() coastalErosionRange: number = 50; // Range of erosion effect from water level
    @RE.props.num() coastalCliffProbability: number = 0.3; // Probability of cliff formation (0-1)
    @RE.props.num() coastalCliffHeight: number = 30; // Maximum height of coastal cliffs
    @RE.props.num() coastalSmoothingFactor: number = 0.5; // How much to smooth eroded areas (0-1)
    @RE.props.num() coastalNoiseScale: number = 100; // Scale of noise variation in erosion
    @RE.props.num() coastalNoiseIntensity: number = 0.5; // Intensity of noise variation (0-1)
    @RE.props.num() coastalSedimentTransport: number = 0.3; // How much eroded material is deposited (0-1)
    @RE.props.num() coastalWaveIntensity: number = 0.7; // Intensity of wave erosion patterns (0-1)
    @RE.props.num() coastalErosionSeed: number = 12345; // Seed for erosion noise patterns
    @RE.props.text() ________________________________________________________________: string = " ";


    // Ridge Formation
    @RE.props.checkbox() enableRidges: boolean = false;
    @RE.props.num() ridgeFrequency: number = 0.005; // Frequency of ridge occurrence
    @RE.props.num() ridgeHeight: number = 20; // Height of ridges
    @RE.props.num() ridgeSharpness: number = 0.7; // How sharp the ridges are (0-1)
    @RE.props.num() ridgeDirection: number = 0; // Direction in degrees
    @RE.props.num() ridgeSeed: number = 42;
    @RE.props.text() _______________________________________________________: string = " ";

    // Erosion Simulation
    @RE.props.checkbox() enableErosion: boolean = false;
    @RE.props.num() erosionStrength: number = 0.3; // Strength of erosion effect
    @RE.props.num() erosionScale: number = 100; // Scale of erosion patterns
    @RE.props.num() erosionIterations: number = 3; // Number of erosion iterations
    @RE.props.num() erosionSeed: number = 123;
    @RE.props.text() ________________________________________________________: string = " ";

    // Plateau Formation
    @RE.props.checkbox() enablePlateaus: boolean = false;
    @RE.props.num() plateauHeight: number = 110; // Height level for plateaus
    @RE.props.num() plateauVariation: number = 10; // Height variation in plateau
    @RE.props.num() plateauBlending: number = 10; // Blend between plateau and original terrain
    @RE.props.num() plateauNoiseScale: number = 50; // Scale of noise on plateau surface
    @RE.props.num() plateauSeed: number = 456;
    @RE.props.text() _________________________________________________________: string = " ";

    // Valley Formation
    @RE.props.checkbox() enableValleys: boolean = false;
    @RE.props.num() valleyDepth: number = 30; // Depth of valleys
    @RE.props.num() valleyWidth: number = 100; // Width of valleys
    @RE.props.num() valleyFrequency: number = 0.01; // Frequency of valley occurrence
    @RE.props.num() valleySeed: number = 789;
    @RE.props.text() ___________________________________________________________________________________: string = " ";

    // Terracing Configuration
    @RE.props.checkbox() enableTerracing: boolean = false; // Enable/disable terracing
    @RE.props.num() terracingLevels: number = 10; // Number of distinct height levels
    @RE.props.num() terracingSharpness: number = 0.7; // How sharp the terraces are (0-1)
    @RE.props.num() terracingNoiseAmount: number = 0.2; // Amount of noise to add to terraces (0-1)
    @RE.props.num() terracingMinHeight: number = 0; // Minimum height to start terracing
    @RE.props.num() terracingMaxHeight: number = 255; // Maximum height for terracing
    @RE.props.num() terracingBlendFactor: number = 0.3; // How much to blend between terraced and original height
    @RE.props.text() _______________________________________________________________________: string = " ";


    // Cliff Generation Configuration
    @RE.props.checkbox() enableCliff: boolean = false; // Enable/disable cliff generation
    @RE.props.num() cliffSlopeStart: number = 0.5; // Slope value to start cliff generation (0 to 1, approximate)
    @RE.props.num() cliffSlopeEnd: number = 0.8; // Slope value to end cliff generation
    @RE.props.num() cliffIntensity: number = 5; // Intensity of the cliff sharpening effect (adjust height difference)


    /*
    @RE.props.text() ________________________________________________________________________: string = " ";
    // Talus Formation Configuration
    @RE.props.checkbox() enableTalus: boolean = false; // Enable/disable talus formation
    @RE.props.num() talusMinSlope: number = 0.7; // Minimum slope for talus formation (0-1)
    @RE.props.num() talusMaxSlope: number = 0.9; // Maximum slope for talus formation (0-1)
    @RE.props.num() talusAccumulationFactor: number = 1.0; // How much material accumulates (0-2)
    @RE.props.num() talusSpreadDistance: number = 30; // How far talus material spreads
    @RE.props.num() talusParticleSize: number = 5; // Size of individual talus particles
    @RE.props.num() talusStability: number = 0.7; // Angle of repose (0-1)
    @RE.props.num() talusNoiseFactor: number = 0.3; // Randomness in talus distribution (0-1)
    @RE.props.num() talusCompression: number = 0.5; // How compressed the talus becomes (0-1)
    @RE.props.num() talusLayering: number = 0.4; // Strength of layered appearance (0-1)
    @RE.props.num() talusSeed: number = 54321; // Seed for talus noise patterns

     */





  //==========================
  //    variables
  //===========================

    public heightData?: Uint8ClampedArray;
    public heightmapSize = { width: 0, height: 0 };
    private chunksFolder?: THREE.Object3D;
    private lodGroups: THREE.Group[] = [];
    public activeCameras: THREE.Camera[] = [];
    private lastLodUpdate = 0;
    private lodUpdateInterval = 200; // in milliseconds

    private highDetailQueue: Array<{ group: THREE.Group, priority: number }> = [];
    private isProcessingHighDetail = false;

    private processingQueue: Array<{ group: THREE.Group, distance: number }> = [];
    private lastProcessTime = 0;
    private activeProcesses = 0;

    // Store chunk data in a map
    public chunksMap = new Map<string, ChunkData>();
    public previousScale = new THREE.Vector3(1, 1, 1);
    public previousOffset = new THREE.Vector3(0, 0, 0);
    public scheduledRemovals = new Map<THREE.Group, NodeJS.Timeout>();
    public removalDelay = 10000; // 10 seconds
    public scheduledDeactivations = new Map<THREE.Group, number>();
    public scheduledCleanups = new Map<THREE.Group, number>();
    public lastDeletionBatchTime = 0;
    public lastCleanupBatchTime = 0;

    // Quadtree to spatially index chunks for fast lookup.
    private quadtree: Quadtree<ChunkData> | null = null;
    private sharedMaterial: THREE.MeshStandardMaterial;

    private lastPriorityUpdate = 0;
    private cameraDirection = new THREE.Vector3();
    private cameraFrustum = new THREE.Frustum();
    private cameraViewProjectionMatrix = new THREE.Matrix4();

    private highRenderDistanceSquared: number;
    private lowRenderDistanceSquared: number;

    // Caching systems
    private geometryCache = new Map<string, GeometryCache>();
    private colorCache = new Map<string, ColorCache>();
    private heightCache = new Map<string, HeightCache>();
    private lastCacheCleanup = 0;

    public isGeneratingCollision = false;
    public isMapLoaded = false;
    public collisionInitTimeout: NodeJS.Timeout | null = null;

  private distantChunkLoadHeightThreshold: number = 10;
  private occlusionCheckTolerance: number = 1;

    private terrainTriangleCount: number = 0;
    private triangleLimit: number = 50000000;


    orbitControls: OrbitControls;

}
