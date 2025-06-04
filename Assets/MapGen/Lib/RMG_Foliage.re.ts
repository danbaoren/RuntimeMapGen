import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";

type ChunkData = {
  key: string;
  originalPosition: THREE.Vector3;
  chunkParams: { startX: number; startY: number; width: number; height: number };
  lodGroup?: THREE.Group;
  lastActive: number;
  cacheKey: string;
  clippingHeight?: number;
};

type CachedFoliageGeometry = {
  geometry: THREE.BufferGeometry;
  lastUsed: number;
};

type CachedFoliageChunk = {
  container: THREE.Group;
  lastUsed: number;
  key: string;
};

// Helper for frustum culling
const _frustum = new THREE.Frustum();
const _projScreenMatrix = new THREE.Matrix4();
const _chunkBox = new THREE.Box3();
const _tempVec3 = new THREE.Vector3();

export default class RMG_Foliage extends RE.Component {

  static foliageContainer?: THREE.Group;
  static activeFoliageChunks: Map<string, THREE.Group> = new Map();
  static pendingFoliageChunks: string[] = [];
  static isProcessingChunks: boolean = false;
  
  // Cache for geometry to avoid recalculating the same chunks
  static geometryCache: Map<string, CachedFoliageGeometry> = new Map();
  static cachedChunks: Map<string, CachedFoliageChunk> = new Map();
  
  // LRU cache configuration
  static readonly CACHE_EXPIRY_MS: number = 60000; // 60 seconds
  static lastCacheCleanup: number = 0;
  static readonly CLEANUP_INTERVAL_MS: number = 30000;
  
  // Throttle chunk processing to avoid overwhelming the main thread
  static readonly CHUNK_PROCESSING_INTERVAL_MS: number = 100; // Process one chunk every 50ms

  /**
   * Updates the foliage chunks around the camera's position.
   * @param cameraPos The current position of the camera.
   */
  public static async updateFoliageChunks(cameraPos: THREE.Vector3) {
    if (!RE.Runtime.isRunning || !RuntimeMapGen.get().isMapLoaded) {
      return;
    }
    
    // Check if we should clean up the cache
    const currentTime = Date.now();
    if (currentTime - this.lastCacheCleanup > this.CLEANUP_INTERVAL_MS) {
      this.cleanupCache();
      this.lastCacheCleanup = currentTime;
    }

    // Parent group for all foliage
    if (!this.foliageContainer) {
      this.foliageContainer = new THREE.Group();
      this.foliageContainer.name = "FoliageChunks";
      RuntimeMapGen.get().object3d.add(this.foliageContainer);
    }

    const terrainX = ((cameraPos.x - RuntimeMapGen.get().Offset.x) / RuntimeMapGen.get().Scale.x) + (RuntimeMapGen.get().heightmapSize.width / 2);
    const terrainY = ((cameraPos.z - RuntimeMapGen.get().Offset.z) / RuntimeMapGen.get().Scale.z) + (RuntimeMapGen.get().heightmapSize.height / 2);
    const chunkSize = RuntimeMapGen.get().chunk_Size; // Using regular chunkSize for foliage
    const currentChunkX = Math.floor(terrainX / chunkSize);
    const currentChunkY = Math.floor(terrainY / chunkSize);

    const neededChunks = new Set<string>();
    const foliageBuffer = RuntimeMapGen.get().fChunksRender; 
    
    // Store chunks with their distance from the camera and frustum visibility for sorting
    const chunksToOrder: { key: string; distance: number; isInFrustum: boolean }[] = [];
    const uniqueChunksInSpiral = new Set<string>(); // To prevent adding duplicates from spiral

    // Get the camera and update the frustum for culling
    const camera = RE.Runtime.camera as THREE.PerspectiveCamera;
    if (camera) {
      _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      _frustum.setFromProjectionMatrix(_projScreenMatrix);
    }

    // --- Spiral Pattern Generation ---
    let x = 0, y = 0;
    let dx = 0, dy = -1; // Start by moving up (relative to the grid)
    let segment_length = 1;
    let segment_passed = 0;
    let direction_change_count = 0;

    // Iterate enough times to cover the entire square buffer
    for (let i = 0; i < (2 * foliageBuffer + 1) * (2 * foliageBuffer + 1); i++) {
        const chunkGridX = currentChunkX + x;
        const chunkGridY = currentChunkY + y;
        const chunkKey = `${chunkGridX}_${chunkGridY}`;

        // Ensure we only process chunks within the buffer and not already added
        if (Math.abs(x) <= foliageBuffer && Math.abs(y) <= foliageBuffer && !uniqueChunksInSpiral.has(chunkKey)) {
            uniqueChunksInSpiral.add(chunkKey);
            neededChunks.add(chunkKey); // Add to the set of all needed chunks

            const distance = Math.sqrt(x * x + y * y); // Distance from the center chunk (0,0) in chunk units

            let isInFrustum = false;
            if (camera) {
                // Calculate world-space bounding box for the current chunk
                const chunkWorldMinX = (chunkGridX * chunkSize - RuntimeMapGen.get().heightmapSize.width / 2) * RuntimeMapGen.get().Scale.x + RuntimeMapGen.get().Offset.x;
                const chunkWorldMinZ = (chunkGridY * chunkSize - RuntimeMapGen.get().heightmapSize.height / 2) * RuntimeMapGen.get().Scale.z + RuntimeMapGen.get().Offset.z;
                
                const chunkWorldMaxX = ((chunkGridX + 1) * chunkSize - RuntimeMapGen.get().heightmapSize.width / 2) * RuntimeMapGen.get().Scale.x + RuntimeMapGen.get().Offset.x;
                const chunkWorldMaxZ = ((chunkGridY + 1) * chunkSize - RuntimeMapGen.get().heightmapSize.height / 2) * RuntimeMapGen.get().Scale.z + RuntimeMapGen.get().Offset.z;

                // Assuming terrain height is mostly around Offset.y for foliage placement,
                // or you might need to query actual terrain height range for accurate Y bounds.
                // For simplicity, let's assume a reasonable height range around the offset.
                const minHeight = RuntimeMapGen.get().Offset.y; // Assuming foliage starts at the terrain offset height
                const maxHeight = RuntimeMapGen.get().Offset.y;

                _chunkBox.min.set(chunkWorldMinX, minHeight, chunkWorldMinZ);
                _chunkBox.max.set(chunkWorldMaxX, maxHeight, chunkWorldMaxZ);

                isInFrustum = _frustum.intersectsBox(_chunkBox);
            }

            chunksToOrder.push({ key: chunkKey, distance: distance, isInFrustum: isInFrustum });
        }

        x += dx;
        y += dy;
        segment_passed++;

        if (segment_passed === segment_length) {
            segment_passed = 0;
            direction_change_count++;
            // Rotate direction 90 degrees clockwise (dx, dy) -> (-dy, dx)
            const tempDx = dx;
            dx = -dy;
            dy = tempDx;

            if (direction_change_count % 2 === 0) {
                segment_length++;
            }
        }
    }

    // Sort chunks: first by frustum visibility (true first), then by distance (closest first)
    chunksToOrder.sort((a, b) => {
      if (a.isInFrustum && !b.isInFrustum) return -1; // a is in frustum, b is not -> a comes first
      if (!a.isInFrustum && b.isInFrustum) return 1;  // b is in frustum, a is not -> b comes first
      return a.distance - b.distance; // If both are in/out of frustum, sort by distance
    });

    // Remove chunks we no longer need
    this.activeFoliageChunks.forEach((chunkContainer, key) => {
      if (!neededChunks.has(key)) {
        // Instead of disposing, move to cache
        this.moveChunkToCache(key, chunkContainer);
        
        // Remove from active list and scene
        this.foliageContainer?.remove(chunkContainer);
        this.activeFoliageChunks.delete(key);
      } else {
        // Update the last used time for the chunk that's still needed
        if (this.cachedChunks.has(key)) {
          const cachedData = this.cachedChunks.get(key)!;
          cachedData.lastUsed = Date.now();
          this.cachedChunks.set(key, cachedData);
        }
      }
    });

    // Create a queue of chunks that need to be generated, sorted by frustum and distance
    for (const { key: chunkKey } of chunksToOrder) {
      if (this.activeFoliageChunks.has(chunkKey) || this.pendingFoliageChunks.includes(chunkKey)) {
        continue;
      }
      // Add to pending queue if not already being processed
      this.pendingFoliageChunks.push(chunkKey);
    }

    // Start processing the queue if not already processing
    if (!this.isProcessingChunks) {
      this.processNextFoliageChunk();
    }
  }

  /**
   * Process the next chunk in the pending queue with a delay between chunks.
   * This ensures chunks are generated one at a time.
   */
  private static async processNextFoliageChunk() {
    // Set flag to indicate we're processing chunks
    this.isProcessingChunks = true;

    // If we have pending chunks, process the next one
    if (this.pendingFoliageChunks.length > 0) {
      const chunkKey = this.pendingFoliageChunks.shift()!;
      
      // Skip if this chunk has been generated while in the queue
      if (this.activeFoliageChunks.has(chunkKey)) {
        // Use a tiny timeout to yield to the event loop, then process next immediately
        setTimeout(() => this.processNextFoliageChunk(), 0); 
        return;
      }

      try {
        await this.generateFoliageForChunk(chunkKey);
        // Introduce a delay to yield to the main thread, allowing rendering and other updates
        setTimeout(() => this.processNextFoliageChunk(), this.CHUNK_PROCESSING_INTERVAL_MS); 
      } catch (err) {
        //console.error("Error processing foliage chunk:", err);
        // Still introduce a delay on error to prevent tight loops
        setTimeout(() => this.processNextFoliageChunk(), this.CHUNK_PROCESSING_INTERVAL_MS); 
      }
    } else {
      // No more chunks to process
      this.isProcessingChunks = false;
    }
  }

  /**
   * Generate foliage for a specific chunk.
   * @param chunkKey The key of the chunk to generate foliage for.
   */
  private static async generateFoliageForChunk(chunkKey: string) {
    if (!this.foliageContainer || this.activeFoliageChunks.has(chunkKey)) {
      return;
    }
    
    // Check if we have this chunk in cache and reuse it if available
    if (this.cachedChunks.has(chunkKey)) {
      return this.restoreChunkFromCache(chunkKey);
    }

    const chunkSize = RuntimeMapGen.get().chunk_Size;
    const [chunkX, chunkY] = chunkKey.split("_").map(Number);
    const startX = chunkX * chunkSize;
    const startY = chunkY * chunkSize;

    try {
      // Create a cache key for this geometry
      const geometryCacheKey = `geo_${startX}_${startY}_${chunkSize}_${chunkSize}`;
      let scaledGeometry: THREE.BufferGeometry;

      // Check if geometry is in cache
      if (this.geometryCache.has(geometryCacheKey)) {
        // Use cached geometry
        const cachedGeometry = this.geometryCache.get(geometryCacheKey)!;
        scaledGeometry = cachedGeometry.geometry;
        // Update last used time
        cachedGeometry.lastUsed = Date.now();
        this.geometryCache.set(geometryCacheKey, cachedGeometry);
        //RE.Debug.log(`Using cached geometry for ${chunkKey}`);
      } else {
        // Yield before a potentially heavy computation
        await new Promise(resolve => setTimeout(resolve, 0)); 
        // Generate raw geometry for this chunk
        const rawGeometry = await RuntimeMapGen.get().generateChunkGeometry(
          startX,
          startY,
          chunkSize,
          chunkSize,
          1, // LOD step, keeping as 1 for foliage
          1 // Heightmap resolution, keep as 1 for now
        );

        // Scale it into world space
        scaledGeometry = rawGeometry.clone();
        const posAttr = scaledGeometry.attributes.position as THREE.BufferAttribute;
        const scaleVec = RuntimeMapGen.get().Scale.clone();
        for (let i = 0; i < posAttr.count; i++) {
          posAttr.setXYZ(
            i,
            posAttr.getX(i) * scaleVec.x,
            posAttr.getY(i) * scaleVec.y,
            posAttr.getZ(i) * scaleVec.z
          );
        }
        posAttr.needsUpdate = true;
        scaledGeometry.computeBoundingBox();
        scaledGeometry.computeBoundingSphere();
        
        // Cache the scaled geometry
        this.geometryCache.set(geometryCacheKey, {
          geometry: scaledGeometry,
          lastUsed: Date.now()
        });
      }

      // Create a container for this specific chunk's foliage
      // Following the structure: FoliageChunks => FoliageChunk_x_z => Mesh1, Mesh2, Mesh3
      const chunkContainer = new THREE.Group();
      chunkContainer.name = `FoliageChunk_${chunkKey}`;
      chunkContainer.userData.chunkKey = chunkKey;
      
      // Position the container correctly in world space
      const centerX = (startX + chunkSize / 2) - (RuntimeMapGen.get().heightmapSize.width / 2);
      const centerY = (startY + chunkSize / 2) - (RuntimeMapGen.get().heightmapSize.height / 2);
      const worldX = centerX * RuntimeMapGen.get().Scale.x + RuntimeMapGen.get().Offset.x;
      const worldZ = centerY * RuntimeMapGen.get().Scale.z + RuntimeMapGen.get().Offset.z;
      chunkContainer.position.set(worldX, RuntimeMapGen.get().Offset.y, worldZ); // Assuming foliage is placed around Offset.y
      
      // Add to scene graph and mark active
      this.foliageContainer.add(chunkContainer);
      this.activeFoliageChunks.set(chunkKey, chunkContainer);
      
      // Also store in cached chunks with timestamp
      this.cachedChunks.set(chunkKey, {
        container: chunkContainer,
        lastUsed: Date.now(),
        key: chunkKey
      });

      try {
        // Yield before another potentially heavy computation
        await new Promise(resolve => setTimeout(resolve, 0)); 
        // Generate foliage directly into the chunk container
        // Pass the geometry directly - no need for an intermediate mesh
        await RuntimeMapGen.get().generateFoliageInstances(
          chunkContainer, 
          scaledGeometry, 
          RuntimeMapGen.get().fSeed
        );
        
        // We don't dispose the scaled geometry anymore since it's in cache
        // Raw geometry is only created in the non-cached path and should be disposed there
      } catch (err) {
        //console.error("Foliage chunk error:", err);
      }
    } catch (err) {
      //console.error("Foliage chunk error:", err);
    }
  }

  /**
   * Disposes of all foliage-related data and removes objects from the scene.
   */
  public static disposeAllFoliageData(): void {
    const scene = RE.Runtime.scene as THREE.Scene;

    // Clear any pending chunks
    this.pendingFoliageChunks = [];
    this.isProcessingChunks = false;

    // Dispose geometries and materials of active chunks
    this.activeFoliageChunks.forEach((container) => {
      // Traverse and dispose all meshes inside the container
      container.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(m => m.dispose());
          }
        }
      });
      
      if (container.parent) {
        container.parent.remove(container);
      }
    });
    this.activeFoliageChunks.clear();
    
    // Clear geometry cache
    this.geometryCache.forEach(cachedGeometry => {
      cachedGeometry.geometry.dispose();
    });
    this.geometryCache.clear();
    
    // Clear chunk cache
    this.cachedChunks.forEach(cachedChunk => {
      cachedChunk.container.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(m => m.dispose());
          }
        }
      });
    });
    this.cachedChunks.clear();

    // Remove foliage container if it exists
    if (this.foliageContainer) {
      scene.remove(this.foliageContainer);
      this.foliageContainer = undefined;
    }
    //RE.Debug.log("All foliage data disposed.");
  }

  public getBiomeAtWorldPosition(worldX: number, worldZ: number): string {
    return RuntimeMapGen.get().getBiomeAtWorldPosition(worldX, worldZ);
  }


  /**
   * Move a chunk from active to cache when it's no longer needed
   * @param chunkKey The key of the chunk to cache
   * @param chunkContainer The container to cache
   */
  private static moveChunkToCache(chunkKey: string, chunkContainer: THREE.Group): void {
    // Add/update in cache with current timestamp
    this.cachedChunks.set(chunkKey, {
      container: chunkContainer,
      lastUsed: Date.now(),
      key: chunkKey
    });
    
    //RE.Debug.log(`Moved chunk ${chunkKey} to cache`);
  }
  
  /**
   * Restore a chunk from cache to active use
   * @param chunkKey The key of the chunk to restore
   */
  private static restoreChunkFromCache(chunkKey: string): void {
    if (!this.cachedChunks.has(chunkKey) || !this.foliageContainer) {
      return;
    }
    
    const cachedChunk = this.cachedChunks.get(chunkKey)!;
    
    // Update last used time
    cachedChunk.lastUsed = Date.now();
    this.cachedChunks.set(chunkKey, cachedChunk);
    
    // Add back to the scene
    this.foliageContainer.add(cachedChunk.container);
    this.activeFoliageChunks.set(chunkKey, cachedChunk.container);
    
    //RE.Debug.log(`Restored chunk ${chunkKey} from cache`);
  }
  
  /**
   * Clean up expired cache entries
   */
  private static cleanupCache(): void {
    const currentTime = Date.now();
    const expiredTime = currentTime - this.CACHE_EXPIRY_MS;
    
    // Clean up geometry cache
    this.geometryCache.forEach((cachedGeometry, key) => {
      if (cachedGeometry.lastUsed < expiredTime) {
        cachedGeometry.geometry.dispose();
        this.geometryCache.delete(key);
        //RE.Debug.log(`Cleaned up cached geometry ${key}`);
      }
    });
    
    // Clean up chunk cache
    this.cachedChunks.forEach((cachedChunk, key) => {
      if (cachedChunk.lastUsed < expiredTime && !this.activeFoliageChunks.has(key)) {
        // Only dispose if this chunk is not currently active
        cachedChunk.container.traverse(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(m => m.dispose());
            }
          }
        });
        this.cachedChunks.delete(key);
        //RE.Debug.log(`Cleaned up cached chunk ${key}`);
      }
    });
  }
}