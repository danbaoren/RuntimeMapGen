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
                                          [################---]
                                           85% feature-complete



        Yet to implement:

            [!] InstancedMesh2 -- better solution for dense foliage [lod, frustrum per inctance, etc]

            [!] Extend API for full control

            [?] Virtual/Atlas texture

            [?] Overhangs & Caves (load-stage procedural process, save 3d geometry) (transform faces, displace them, make overhangs)

            [!] Improved faces discard which hided from camera (reduce triangles visibility as much as possible)

            [!] Reduce Draw Calls (each chunks is a drawcall)


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
            import RMG_Shader from './RMG_Shader.re';
            import RMG_Foliage from './RMG_Foliage.re';
            import { Quadtree, Boundary, QuadPoint, GeometryCache, ColorCache, HeightCache, BiomeCache } from './Quadtree';
            import RMG_Gen from './RMG_Gen.re';
            
            
            
            
            
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
                
            
            

            
            
// #region LIFECYCLE
            
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
                        RMG_Shader.lowDetailMaterial = await RMG_Shader.createMaterial(false);
                        RMG_Shader.highDetailMaterial = await RMG_Shader.createMaterial(true);
            
                        this.highRenderDistanceSquared = this.high_RenderDistance * this.high_RenderDistance;
                        this.lowRenderDistanceSquared = this.low_RenderDistance * this.low_RenderDistance;
            
                        await this.generate();
                    } catch (error) {
                        console.error("Failed to initialize WorldGen:", error);
                    }
            
                    this.LogoConsole();
            
                    if (this.add_RapierConfig) { RMG_Collision.addRapierConfigToScene(); }

                      try {
                            const biomeJsonPath = RE.getStaticPath(this.BiomeJsonPath);
                            const response = await fetch(biomeJsonPath);
                            const biomeJson = await response.json();
                            this.biomesConfig = biomeJson.biomes;
                        } catch (error) {
                            console.error("Failed to load biome configuration:", error);
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
            
                   if (this.isMapLoaded && this.activeCameras.length > 0) {
                      const cameraPos = new THREE.Vector3();
                      this.activeCameras[0].getWorldPosition(cameraPos);

                      // Collision
                      if (this.RapierCollision) {RMG_Collision.updateCollisionChunks(cameraPos);}
                      // Foliage
                      if (this.enableFoliage && this.isBiomeDataProcessed) {RMG_Foliage.updateFoliageChunks(cameraPos);}
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
            
            
                  RMG_Shader.updateShaderUniforms();
            
                  this.foliageWindUpdate();
            
            
                  RuntimeMapGen.cameraExport = this.activeCameras[0];

                  if (this.BiomesMap && !this.isBiomeDataProcessed) {
                        this.processBiomeData();
                        }

                this.updateChunkBoundingBoxes();
            
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
            
                public async loadAllTextures(): Promise<void> {
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
            
                private LogoConsole() {
                    const loggingChance = 0.1;
            
                    if (Math.random() < loggingChance) {
                        RE.Debug.log('                      Runtime MapGen STARTED' +
                            '\n                      By danbaoren');
                            /*
                        RE.Debug.log(String.raw`─────▄████▀█▄
                ───▄█████████████████▄
                ─▄█████.▼.▼.▼.▼.▼.▼▼▼▼
                ▄███████▄.▲.▲▲▲▲▲▲▲▲
                ████████████████████▀▀
                `);
                */
                    }
                }

// #endregion LIFECYCLE
            
            
            
// #region LOD
            
                private highDetailRemovalDelay: number = 1;
                private scheduledHighDetailRemovals: Map<THREE.Mesh, number> = new Map();
            
                private updateLOD() {
                    if (!this.activeCameras.length) return;
            
                    const now = Date.now();
                    const transitionDelay = 1; // Delay (in ms) before switching to high-detail material
                    const highRenderDistanceSquared = this.highRenderDistanceSquared;
                    const LOD_HYSTERESIS = 1.3;
                    const highToLowThresholdSquared = highRenderDistanceSquared * LOD_HYSTERESIS * LOD_HYSTERESIS;
                    const offsetX = this.Offset.x;
                    const offsetZ = this.Offset.z;
                    const scaleX = this.Scale.x;
                    const scaleZ = this.Scale.z;
                    const invScaleX = scaleX !== 0 ? 1 / scaleX : 1;
                    const invScaleZ = scaleZ !== 0 ? 1 / scaleZ : 1;
                    const camPos = new THREE.Vector3();
                    const groupPos = new THREE.Vector3();
            
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
            
                        this.cancelChunkDeactivation(group);
                        group.visible = true;
            
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
            
                        // Use hysteresis: chunks already showing high detail stay high
                        // until the camera moves further away (highToLowThresholdSquared),
                        // while new chunks only switch to high at the tighter threshold.
                        const isCurrentlyHigh = highMesh?.visible === true;
                        const effectiveThreshold = isCurrentlyHigh ? highToLowThresholdSquared : highRenderDistanceSquared;

                        if (distanceSquared <= effectiveThreshold) {
                            chunksNeedingHighDetail.push({ group, distanceSquared });
                            if (highMesh) {
                                if (!group.userData.highTransitionStart) {
                                    group.userData.highTransitionStart = now;
                                }
                                if (now - group.userData.highTransitionStart >= transitionDelay) {
                                    highMesh.material = RMG_Shader.highDetailMaterial;
                                    highMesh.visible = true;
                                    if (lowMesh) lowMesh.visible = false;
                                } else {
                                    if (lowMesh) {
                                        lowMesh.material = RMG_Shader.lowDetailMaterial;
                                        lowMesh.visible = true;
                                    }
                                    highMesh.visible = false;
                                }
                            } else {
                                this.addToHighDetailQueue(group, Math.sqrt(distanceSquared));
                                if (lowMesh) {
                                    lowMesh.material = RMG_Shader.lowDetailMaterial;
                                    lowMesh.visible = true;
                                }
                            }
                        } else {
                            group.userData.highTransitionStart = null;
                            if (lowMesh) {
                                lowMesh.material = RMG_Shader.lowDetailMaterial;
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
                    .then(() => this.activeProcesses--, () => this.activeProcesses--);
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
                        const now = performance.now();
                        
                        // Clear array if we need to search again
                        if (this.activeCameras.length === 0 || now - this.lastCameraCheck >= this.cameraCheckInterval) {
                            this.activeCameras = [];
                            const excludedNames = this.excludedCameraNames.split(',')
                                .map(name => name.trim())
                                .filter(name => name.length > 0);
            
                            RE.Runtime.scene.traverse((object) => {
                                if (object instanceof THREE.Camera && !excludedNames.includes(object.name)) {
                                    this.activeCameras.push(object);
                                }
                            });
            
                            this.lastCameraCheck = now;
                            
                            if (this.activeCameras.length === 0 && !this.cameraSearchActive) {
                                this.cameraSearchActive = true;
                                setTimeout(() => {
                                    this.cameraSearchActive = false;
                                    this.updateCameras();
                                }, this.cameraCheckInterval);
                                
                                console.log("No valid cameras found - retrying in 500ms");
                            }
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


            private identifyCameraChunk(): THREE.Group | null {
                if (!this.activeCameras.length) return null;

                const camera = this.activeCameras[0];
                const camPos = new THREE.Vector3();
                camera.getWorldPosition(camPos);

                // Convert to original terrain space
                const invScaleX = this.Scale.x !== 0 ? 1 / this.Scale.x : 1;
                const invScaleZ = this.Scale.z !== 0 ? 1 / this.Scale.z : 1;
                const originalCamX = (camPos.x - this.Offset.x) * invScaleX;
                const originalCamZ = (camPos.z - this.Offset.z) * invScaleZ;

                // Find chunk containing camera
                let closestChunk: ChunkData | null = null;
                let minDistanceSquared = Infinity;

                for (const data of this.chunksMap.values()) {
                    if (!data.lodGroup) continue;
                    
                    const dx = originalCamX - data.originalPosition.x;
                    const dz = originalCamZ - data.originalPosition.z;
                    const distanceSquared = dx * dx + dz * dz;
                    
                    if (distanceSquared < minDistanceSquared) {
                        minDistanceSquared = distanceSquared;
                        closestChunk = data;
                    }
                }

                return closestChunk?.lodGroup || null;
            }

// #endregion LOD
            
            
// #region GEOMETRY COMPUTATION
            
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
            
                    // Compute normals from heightmap gradient for slope-accurate biome blending
                    {
                        const normals = new Float32Array(totalVertices * 3);
                        let nIdx = 0;
                        for (let row = 0; row < numRows; row++) {
                            for (let col = 0; col < numCols; col++) {
                                const wx = startX + col * lodVertexStep;
                                const wy = startY + row * lodVertexStep;
                                const hL = this.getHeight(Math.max(0, wx - 1), wy);
                                const hR = this.getHeight(wx + 1, wy);
                                const hD = this.getHeight(wx, Math.max(0, wy - 1));
                                const hU = this.getHeight(wx, wy + 1);
                                const nx = hL - hR;
                                const ny = 2.0;
                                const nz = hD - hU;
                                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                                normals[nIdx] = nx / len;
                                normals[nIdx + 1] = ny / len;
                                normals[nIdx + 2] = nz / len;
                                nIdx += 3;
                            }
                        }
                        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
                    }

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
                        let loadedOrGeneratedTexture: THREE.Texture | null = null;
                
                        if (this.useAlgorithmicTerrain) {
                            // RMG_Gen.generateHeightmapTexture() now returns an HTMLImageElement
                            const generatedImage: HTMLImageElement = await RMG_Gen.generateHeightmapTexture();
                            console.log("Generated algorithmic terrain image:");
                
                            // Check if the image was successfully generated (e.g., has dimensions)
                            if (!generatedImage || generatedImage.width === 0 || generatedImage.height === 0) {
                                throw new Error("Failed to generate algorithmic terrain image.");
                            }
                
                            // Create a THREE.Texture from the HTMLImageElement
                            loadedOrGeneratedTexture = new THREE.Texture(generatedImage);
                            loadedOrGeneratedTexture.needsUpdate = true; // Mark for update on the GPU
                            
                            // Assuming RuntimeMapGen.get().heightmapTexture also expects a THREE.Texture
                            RuntimeMapGen.get().heightmapTexture = loadedOrGeneratedTexture;
                
                        } else {
                            // This branch loads a static texture, which is already a THREE.Texture
                            if (!this.heightmapTexture) { // Only load if not already loaded
                                if (this.HeightmapStaticPath) {
                                    const path = RE.getStaticPath(this.HeightmapStaticPath);
                                    loadedOrGeneratedTexture = await new THREE.TextureLoader().loadAsync(path);
                                    loadedOrGeneratedTexture.needsUpdate = true;
                                } else {
                                    console.error("No heightmap provided and algorithmic terrain is not used.");
                                    return; // Exit if no heightmap path and no algorithmic generation
                                }
                            } else {
                                // If this.heightmapTexture already exists from a previous load, use it
                                loadedOrGeneratedTexture = this.heightmapTexture;
                            }
                        }
                
                        // Ensure we have a texture before proceeding
                        if (!loadedOrGeneratedTexture) {
                            throw new Error("Heightmap texture could not be loaded or generated.");
                        }
                
                        // Assign the final, consistent THREE.Texture to the class property
                        this.heightmapTexture = loadedOrGeneratedTexture;
                
                        // Now, this.heightmapTexture is guaranteed to be a THREE.Texture,
                        // and its .image property will be the underlying HTMLImageElement or HTMLCanvasElement.
                        const img = this.heightmapTexture.image;
                
                        // Add a runtime check for the type of img, as Three.js textures can have different image sources
                        if (!(img instanceof HTMLImageElement) && !(img instanceof HTMLCanvasElement)) {
                            console.error("The texture's image source is not an HTMLImageElement or HTMLCanvasElement.", img);
                            throw new Error("Invalid image source type for heightmap texture.");
                        }
                
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
                
                        // To get pixel data from an HTMLImageElement, we need to draw it onto a temporary canvas
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = img.width;
                        tempCanvas.height = img.height;
                        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
                        tempCtx.drawImage(img, 0, 0);
                        this.heightData = tempCtx.getImageData(0, 0, img.width, img.height).data;
                
                
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
                                    RMG_LoadingBar.hideProgressBar();
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
                
                                // Use requestAnimationFrame for better performance and to yield to the event loop
                                // This prevents the UI from freezing during heavy processing
                                requestAnimationFrame(processNextTile);
                
                            } catch (error) {
                                console.error("Error processing tile:", error);
                                RMG_LoadingBar.hideProgressBar();
                                throw error;
                            }
                        };
                
                        // Start processing tiles
                        requestAnimationFrame(processNextTile);
                
                    } catch (error) {
                        console.error("Generation failed:", error);
                        RMG_LoadingBar.hideProgressBar();
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
                            //if (this.enableFoliage) {
                            //    this.generateFoliageInstances(group, highGeometry, this.fSeed);
                            //}
            
                            const material = RMG_Shader.highDetailMaterial;
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
            
                    const material = RMG_Shader.lowDetailMaterial;
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

                    if (this.enableSlopeSharpening) {
                        this.applySlopeSharpening(startX, startY, width, height, heightData);
                    }
            
                    // Apply valley formation if enabled
                    if (this.enableValleys) {
                        this.applyValleyFormation(startX, startY, width, height, heightData);
                    }

                    // Apply RTS Shapes if enabled 
                    if (this.enableRtsShapes) {
                        this.applyRtsShapes(startX, startY, width, height, heightData);
                    }
            
                    // Apply terracing if enabled
                    if (this.enableTerracing) {
                        this.applyTerracing(startX, startY, width, height, heightData);
                    }
            
                    // Apply cliff modification if enabled
                    if (this.enableCliff) {
                        this.applyCliffModification(startX, startY, width, height, tileData);
                    }
            
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

                private applySlopeSharpening(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
    const mapWidth = this.heightmapSize.width;
    const mapHeight = this.heightmapSize.height;

    // Use two buffers to prevent artifacts from in-place modification during an iteration.
    // currentIterationHeightBuffer holds the terrain state at the start of an iteration.
    let currentIterationHeightBuffer = new Uint8ClampedArray(heightData);
    // nextIterationHeightBuffer stores the modified terrain state for the end of an iteration.
    let nextIterationHeightBuffer = new Uint8ClampedArray(heightData);

    // Helper to get height from a specified buffer safely
    const getBufferHeight = (buffer: Uint8ClampedArray, x: number, y: number) => {
        if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
            return buffer[((y * mapWidth + x) * 4)];
        }
        return -Infinity; // Treat out-of-bounds as very low for downhill checks
    };

    // Helper to set height in a specified buffer safely
    const setBufferHeight = (buffer: Uint8ClampedArray, x: number, y: number, value: number) => {
        if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
            const idx = ((y * mapWidth + x) * 4);
            const clampedValue = Math.max(0, Math.min(255, value)); // Clamp height to 0-255 range
            buffer[idx] = clampedValue;
            buffer[idx + 1] = clampedValue; // Keep R, G, B the same for grayscale heightmap
            buffer[idx + 2] = clampedValue;
            buffer[idx + 3] = 255; // Alpha channel
        }
    };

    // Iterate multiple times to compound the sharpening effect
    for (let iter = 0; iter < this.slopeSharpeningIterations; iter++) {
        // Before each iteration, ensure nextIterationHeightBuffer is a copy of the current state.
        // This makes sure untouched pixels carry over their height correctly.
        currentIterationHeightBuffer.forEach((val, i) => nextIterationHeightBuffer[i] = val);

        // Iterate over the portion of the map being processed (current tile)
        for (let y = startY; y < startY + height; y++) {
            for (let x = startX; x < startX + width; x++) {
                const currentHeight = getBufferHeight(currentIterationHeightBuffer, x, y);

                let steepestDescentHeight = currentHeight;
                let steepestDescentX = x; // Initialize with current point's coordinates
                let steepestDescentY = y;

                // Find the steepest downhill neighbor within the defined radius
                for (let dy = -this.slopeSharpeningRadius; dy <= this.slopeSharpeningRadius; dy++) {
                    for (let dx = -this.slopeSharpeningRadius; dx <= this.slopeSharpeningRadius; dx++) {
                        if (dx === 0 && dy === 0) continue; // Skip the current pixel itself

                        const neighborX = x + dx;
                        const neighborY = y + dy;

                        const neighborHeight = getBufferHeight(currentIterationHeightBuffer, neighborX, neighborY);

                        // If this neighbor is lower and forms a steeper descent
                        if (neighborHeight < steepestDescentHeight) {
                            steepestDescentHeight = neighborHeight;
                            steepestDescentX = neighborX;
                            steepestDescentY = neighborY;
                        }
                    }
                }

                // If a discernible downhill slope was found (i.e., not a flat area or peak)
                if (steepestDescentHeight < currentHeight) {
                    const slope = currentHeight - steepestDescentHeight; // Calculate the height difference

                    // Apply sharpening only if the slope is within the user-defined range
                    if (slope >= this.slopeSharpeningMinSlope && slope <= this.slopeSharpeningMaxSlope) {
                        const amountToSharpen = slope * this.slopeSharpeningIntensity;

                        // To "sharpen" or "move inward", we push the lower point further down
                        // and optionally slightly raise the higher point.
                        const newCurrentHeight = currentHeight + (amountToSharpen * 0.1); // Small raise to emphasize the top
                        const newDescentHeight = steepestDescentHeight - amountToSharpen; // Significant lowering of the downhill point

                        // Apply the calculated new heights to the nextIterationHeightBuffer
                        // This avoids "reading your own writes" within the same iteration.
                        setBufferHeight(nextIterationHeightBuffer, x, y, newCurrentHeight);
                        setBufferHeight(nextIterationHeightBuffer, steepestDescentX, steepestDescentY, newDescentHeight);
                    }
                }
            }
        }
        // After an entire iteration, the nextIterationHeightBuffer becomes the input for the next pass.
        // Swap references for efficiency instead of deep copying.
        let tempSwap = currentIterationHeightBuffer;
        currentIterationHeightBuffer = nextIterationHeightBuffer;
        nextIterationHeightBuffer = tempSwap;
    }

    // After all iterations are complete, copy the final result from the working buffer
    // back to the original heightData array.
    currentIterationHeightBuffer.forEach((val, i) => heightData[i] = val);
                }

                private applyRtsShapes(startX: number, startY: number, width: number, height: number, heightData: Uint8ClampedArray) {
    const mapWidth = this.heightmapSize.width;
    const shapeScale = this.rtsShapeScale;
    const heightQuantization = this.rtsShapeHeightQuantization;
    const blendFactor = this.rtsShapeBlendFactor;
    const numCorners = this.rtsShapeCorners; // Used conceptually for influence, not strict polygon drawing

    // For hexagonal grid calculations
    const h = shapeScale; // height of a hexagon
    const w = h * Math.sqrt(3) / 2; // half-width of a hexagon (distance from center to edge)
    const rowHeight = h * 0.75; // Distance between centers of adjacent rows

    const cornersInfluenceFactor = 1 / Math.max(3, numCorners); // Smaller for more 'pointy' shapes, larger for rounder

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const worldX = startX + x;
            const worldY = startY + y;
            const idx = (worldY * mapWidth + worldX) * 4;
            const originalHeight = heightData[idx];

            // Determine which hexagonal cell this pixel belongs to
            // This is a simplified axial coordinate system for hex grids
            let q = worldX / w - worldY / (2 * h);
            let r = worldY / h;

            // Convert to cube coordinates for rounding
            let cubeX = q;
            let cubeZ = r - (q - (q % 2)) / 2; // Simplified adjustment for staggered rows
            let cubeY = -cubeX - cubeZ;

            let rx = Math.round(cubeX);
            let ry = Math.round(cubeY);
            let rz = Math.round(cubeZ);

            let x_diff = Math.abs(rx - cubeX);
            let y_diff = Math.abs(ry - cubeY);
            let z_diff = Math.abs(rz - cubeZ);

            if (x_diff > y_diff && x_diff > z_diff) {
                rx = -ry - rz;
            } else if (y_diff > z_diff) {
                ry = -rx - rz;
            } else {
                rz = -rx - ry;
            }

            // Convert back to axial for cell center calculation
            const cellQ = rx;
            const cellR = rz + (rx - (rx % 2)) / 2;

            // Calculate the center of the hexagonal cell in world coordinates
            const cellCenterX = (cellQ * w) + (cellR * w * 0.5); // Approximate x
            const cellCenterY = cellR * rowHeight; // Approximate y

            // Seed for the cell's "fixed" height, derived from its coordinates
            const cellSeed = (cellQ * 10000 + cellR) + this.rtsShapeSeed;

            // Calculate a representative height for this cell
            // For simplicity, we'll use the height at the cell's center for now,
            // or you could average heights within a small radius around the center.
            // Ensure cellCenterX and cellCenterY are within map bounds.
            const sampleX = Math.round(cellCenterX);
            const sampleY = Math.round(cellCenterY);

            let representativeHeight: number;
            if (sampleX >= 0 && sampleX < mapWidth && sampleY >= 0 && sampleY < this.heightmapSize.height) {
                 const sampleIdx = (sampleY * mapWidth + sampleX) * 4;
                 representativeHeight = heightData[sampleIdx];
            } else {
                 // Fallback if cell center is out of bounds (shouldn't happen with proper grid alignment)
                 representativeHeight = originalHeight;
            }


            // Quantize the representative height
            const quantizedHeight = Math.round(
                Math.floor(representativeHeight / (256 / heightQuantization)) * (256 / heightQuantization)
            );

            // Calculate distance from pixel to cell center (squared for performance)
            const distSq = (worldX - cellCenterX) * (worldX - cellCenterX) + (worldY - cellCenterY) * (worldY - cellCenterY);

            // Create a falloff near the edges of the conceptual shape within the cell
            // This is where `numCorners` can conceptually influence the shape, by adjusting the falloff curve.
            // A simpler approach for general "rounding" is to use a normalized distance.
            const normalizedDist = Math.sqrt(distSq) / (shapeScale / 2); // Normalize distance to 0-1 within half cell size
            let falloff = Math.pow(normalizedDist, cornersInfluenceFactor); // Adjust falloff with corners factor

            // Blend the quantized height with the original height based on falloff and blendFactor
            // Pixels closer to the center are more quantized, further away blend more with original
            const finalHeight = Math.round(
                originalHeight * (blendFactor + falloff * (1 - blendFactor)) +
                quantizedHeight * (1 - blendFactor - falloff * (1 - blendFactor))
            );

            heightData[idx] = Math.max(0, Math.min(255, finalHeight));
            heightData[idx + 1] = heightData[idx];
            heightData[idx + 2] = heightData[idx];
            heightData[idx + 3] = 255;
        }
    }
                }
            
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
            // #endregion GEOMETRY COMPUTATION
            
            
            
            
            
            // #region Foliage
            
            
                private globalInstantiatedPrefabs: { [key: string]: THREE.Group } = {};
                private foliagePrefabsFolder: THREE.Object3D | null = null;
                private perlinNoise: SeededPerlinNoise | null = null;
                private availableFoliagePrefabsByGroup: Map<number, RE.Prefab[]> | null = null;
                private lastFoliagePrefabBasePath: string | null = null;
                public foliagePositionCache = new Map<string, Map<number, {positions: THREE.Vector3[], normals: THREE.Vector3[], seeds: number[]}>>();

             private getFoliageIndexesForBiome(worldX: number, worldZ: number): number[] {
                const biomeColor = this.getBiomeAtWorldPosition(worldX, worldZ);
                const biomeConfig = this.biomesConfig[biomeColor];
                return biomeConfig?.foliageIndexes || [];
            }
            
                private getInstantiatedPrefab(prefab: RE.Prefab): THREE.Group | null {
                    if (!prefab) return null;
                    const prefabName = prefab.name; // Note: prefab.name is usually the full path
                    // Use the full path from the prefab for the internal map key
                    const mapKey = prefab.name;
            
                    if (!this.foliagePrefabsFolder) {
                        this.foliagePrefabsFolder = new THREE.Object3D();
                        this.foliagePrefabsFolder.name = "FoliagePrefabs";
                        this.object3d.add(this.foliagePrefabsFolder);
                    }
            
                    // instantiate master if needed using the full path as the key
                    if (!this.globalInstantiatedPrefabs[mapKey]) {
                        const instance = prefab.instantiate() as THREE.Group;
                        if (!instance) {
                            console.warn(`Failed to instantiate prefab: ${prefabName}`); // Use prefab.name for console
                            return null;
                        }
                        // Use prefab.name (full path) for the instance name as well, or a derived name
                        instance.name = `Master_${prefabName.replace(/[/.]/g, '_')}`; // Simple sanitization for object name
                        this.globalInstantiatedPrefabs[mapKey] = instance;
                        this.foliagePrefabsFolder.add(instance);
                        instance.visible = false;
                        instance.updateMatrixWorld(true);
                    }
            
                    // Clone using the full path key
                    const clone = this.globalInstantiatedPrefabs[mapKey].clone();
                    clone.updateMatrixWorld(true);
                    return clone;
                }
            
            
public async generateFoliageInstances(group: THREE.Group, geometry: THREE.BufferGeometry, globalSeed: number) {
    // --- Vector, Quaternion, and Matrix4 Pooling ---
    const vector3Pool: THREE.Vector3[] = [];
    let vector3PoolIndex = 0;
    const getVector3 = () => {
        if (vector3PoolIndex < vector3Pool.length) {
            return vector3Pool[vector3PoolIndex++].set(0, 0, 0);
        } else {
            const v = new THREE.Vector3();
            vector3Pool.push(v);
            vector3PoolIndex++;
            return v;
        }
    };

    const quaternionPool: THREE.Quaternion[] = [];
    let quaternionPoolIndex = 0;
    const getQuaternion = () => {
        if (quaternionPoolIndex < quaternionPool.length) {
            return quaternionPool[quaternionPoolIndex++].set(0, 0, 0, 1);
        } else {
            const q = new THREE.Quaternion();
            quaternionPool.push(q);
            quaternionPoolIndex++;
            return q;
        }
    };

    const matrix4Pool: THREE.Matrix4[] = [];
    let matrix4PoolIndex = 0;
    const getMatrix4 = () => {
        if (matrix4PoolIndex < matrix4Pool.length) {
            return matrix4Pool[matrix4PoolIndex++].identity();
        } else {
            const m = new THREE.Matrix4();
            matrix4Pool.push(m);
            matrix4PoolIndex++;
            return m;
        }
    };

    // Reset pools at the start of each generation
    vector3PoolIndex = 0;
    quaternionPoolIndex = 0;
    matrix4PoolIndex = 0;

    // Configure foliage parameters
    // Moderate density - not too dense, not too sparse
    if (!this.fDensities?.length) this.fDensities = [0.003];
    if (!this.fScales?.length) this.fScales = [new THREE.Vector2(0.5, 2)];
    if (!this.fRotateWithTerrain?.length) this.fRotateWithTerrain = [true];
    if (!this.fSlopes?.length) this.fSlopes = [new THREE.Vector2(0, 0.3)];
    if (!this.fHeights?.length) this.fHeights = [new THREE.Vector2(0, 100000)];
    if (!this.fUndergroundOffsets?.length) this.fUndergroundOffsets = [0.05];
    if (!this.fIterations?.length) this.fIterations = [1];
    if (!this.fWindEnabled?.length) this.fWindEnabled = [true];


    const foliageFolder = new THREE.Group();
    foliageFolder.name = "Foliage";
    foliageFolder.castShadow = true;
    foliageFolder.receiveShadow = true;

    const allMeshes: THREE.InstancedMesh[] = [];


    // --- Caching Logic: Build or use the cache of available prefabs ---
    const basePath = this.foliagePrefabBasePath;
    const groupsMap = new Map<number, RE.Prefab[]>(); // Local map for this generation pass

    // Check if we need to rebuild the cache of available prefabs
    if (!this.availableFoliagePrefabsByGroup || this.lastFoliagePrefabBasePath !== basePath) {
        this.availableFoliagePrefabsByGroup = new Map<number, RE.Prefab[]>();
        this.lastFoliagePrefabBasePath = basePath;

        const namedUUIDs = RE.Prefab.namedPrefabUUIDs; // Assuming RE.Prefab is accessible

        for (const fullName in namedUUIDs) {
            // Check if the prefab path starts with the defined base path
            if (fullName.startsWith(basePath)) {
                const prefabFileName = fullName.substring(fullName.lastIndexOf('/') + 1);

                // Skip prefabs with "-" prefix during cache building
                if (prefabFileName.startsWith('-')) {
                    continue; // Skip this prefab and don't add it to the cache
                }

                // Get the part of the path after the base path
                const relativePath = fullName.substring(basePath.length);
                // Split by the first slash to get the group folder name (e.g., "0_trees/pine_01" -> "0_trees")
                const parts = relativePath.split('/');
                if (parts.length < 2) continue; // Expecting at least "group_folder/prefab_name" format

                const groupFolder = parts[0];
                const m = /^(\d+)_/.exec(groupFolder); // Extract index from the group folder name
                if (!m) continue;

                const idx = parseInt(m[1], 10);

                try {
                    // Try to fetch (or get if already loaded) using the full original name
                    const prefab = await RE.Prefab.fetch(fullName);
                    if (!this.availableFoliagePrefabsByGroup.has(idx)) {
                        this.availableFoliagePrefabsByGroup.set(idx, []);
                    }
                    // Add the loaded prefab to the cache for its group
                    this.availableFoliagePrefabsByGroup.get(idx)!.push(prefab);
                } catch (e) {
                    console.warn(`Could not load prefab "${fullName}" within base path "${basePath}" during cache build:`, e);
                }
            }
        }
    }

    // Populate the local groupsMap for this generation pass using the cached prefabs
    if (this.availableFoliagePrefabsByGroup) {
        for (const [groupIndex, prefabs] of this.availableFoliagePrefabsByGroup.entries()) {
            // Use the prefabs already fetched and filtered during the cache build
            groupsMap.set(groupIndex, prefabs);
        }
    }
    // --- End Caching Logic ---

    // Get chunk's world position
    const chunkWorldPos = new THREE.Vector3();
    group.getWorldPosition(chunkWorldPos);

    // Add biome foliage index check
    const allowedFoliageIndexes = this.getFoliageIndexesForBiome(
        group.position.x,
        group.position.z
    );

    // Collect spawn data organized by biome group
    const spawnDataByGroup = new Map<number, Array<{
        pos: THREE.Vector3;
        norm: THREE.Vector3;
        combinedSeed: number; // Renamed to combinedSeed
        sampleIdx: number;
    }>>();

    // Use pooled vectors for triangle vertices and normals
    const vA = getVector3();
    const vB = getVector3();
    const vC = getVector3();
    const faceNormal = getVector3();

    // Get position data from geometry
    const positions = geometry.attributes.position.array as Float32Array;
    const normals = geometry.attributes.normal.array as Float32Array;
    const indices = geometry.index ? geometry.index.array as Uint16Array | Uint32Array : null;
    const numFaces = indices ? indices.length / 3 : positions.length / 9;

    // Function to process a single face and determine potential foliage positions
    const processFace = (i: number) => {
        // Determine the indices for the current face
        let idxA, idxB, idxC;
        if (indices) {
            idxA = indices[i * 3] * 3;
            idxB = indices[i * 3 + 1] * 3;
            idxC = indices[i * 3 + 2] * 3;
        } else {
            idxA = i * 9;
            idxB = i * 9 + 3;
            idxC = i * 9 + 6;
        }

        // Get vertex positions for the face
        vA.fromArray(positions, idxA);
        vB.fromArray(positions, idxB);
        vC.fromArray(positions, idxC);

        // Calculate face normal (or get vertex normals for interpolation later) - reuse vector3 objects
        faceNormal.set(normals[idxA], normals[idxA + 1], normals[idxA + 2]);
        const normB = getVector3().set(normals[idxB], normals[idxB + 1], normals[idxB + 2]);
        const normC = getVector3().set(normals[idxC], normals[idxC + 1], normals[idxC + 2]);
        faceNormal.add(normB).add(normC).normalize();

        // Calculate a unique seed component based on the global seed and chunk position
        // This creates a "global" pattern that still varies per chunk
        const uniqueChunkSeedComponent = Math.floor(chunkWorldPos.x * 1000 + chunkWorldPos.z * 10000 + globalSeed);

        // Generate a random point on the triangle using barycentric coordinates
        const r1 = this.seededRandom(uniqueChunkSeedComponent + i, 1);
        const r2 = this.seededRandom(uniqueChunkSeedComponent + i, 2);
        const sqrt_r1 = Math.sqrt(r1);

        const u = 1 - sqrt_r1;
        const v = sqrt_r1 * (1 - r2);
        const w = 1 - u - v; // Correct calculation for w

        // Calculate sample position (reuse objects to avoid GC)
        const samplePos = getVector3()
            .copy(vA).multiplyScalar(u)
            .addScaledVector(vB, v)
            .addScaledVector(vC, w);

        // Use the calculated face normal (create a new one only when needed)
        const sampleNorm = getVector3().copy(faceNormal);

        const worldY = this.getWorldY(samplePos, group);
        const slope = 1 - Math.abs(sampleNorm.y); // Use absolute y for slope calculation

        // Get world position of the sample point
        const worldPos = getVector3().copy(samplePos)
            .multiply(this.Scale)
            .add(this.Offset)
            .add(chunkWorldPos);

        // Get biome using world coordinates
        const biomeColor = this.getBiomeAtWorldPosition(worldPos.x, worldPos.z);
        const biomeConfig = this.biomesConfig[biomeColor];

        // Skip if no biome config exists for this position
        if (!biomeConfig) return;

        // Skip if biome doesn't have specified foliage indexes
        if (!biomeConfig.foliageIndexes || !biomeConfig.foliageIndexes.length) return;

        // Process each foliage group index that is allowed in this biome
        // Only use foliage types specified in the biome's foliageIndexes array
        if (!biomeConfig.foliageIndexes || !biomeConfig.foliageIndexes.length) return;

        // Loop through all foliage groups but only process those allowed for this biome
        groupsMap.forEach((prefabs, groupIndex) => {
            // Skip this group if it's not allowed in this biome
            if (!allowedFoliageIndexes.includes(groupIndex)) {
                return;
            }

            // Skip if this foliage group is not allowed in this biome
            if (!biomeConfig.foliageIndexes.includes(groupIndex)) return;

            // Skip if this foliage type isn't available
            if (!prefabs.length) return;

            // Get parameters for this foliage group
            // Apply a biome-specific density multiplier to make distribution differences more visible
            let D = this.fDensities[groupIndex % this.fDensities.length];
            D *= 1.0; // Normal density


            const slopes = this.fSlopes[groupIndex % this.fSlopes.length] || new THREE.Vector2(0, 0.3);
            const heights = this.fHeights[groupIndex % this.fHeights.length] || new THREE.Vector2(100, 100000);

            // Fast first-pass filtering to avoid unnecessary calculations
            // Use the combined seed here
            if (this.seededRandom(uniqueChunkSeedComponent + groupIndex * 300000 + i, 0) > D) return;
            if (worldY < heights.x || worldY > heights.y) return;
            if (slope < slopes.x || slope > slopes.y) return;

            // Add to spawn data for this group
            if (!spawnDataByGroup.has(groupIndex)) {
                spawnDataByGroup.set(groupIndex, []);
            }

            // Store this valid position
            const spawnItem = {
                pos: samplePos.clone(), // For persistent storage, use clone (not pooled)
                norm: sampleNorm.clone(),
                combinedSeed: uniqueChunkSeedComponent + groupIndex * 300000 + i, // Use the combined seed
                sampleIdx: i
            };

            spawnDataByGroup.get(groupIndex)!.push(spawnItem);
        });
    };

    // Calculate positions normally (no caching logic)
    for (let i = 0; i < numFaces; ++i) {
        processFace(i);
    }

    // Process each foliage group with valid spawn data
    spawnDataByGroup.forEach((spawnData, groupIndex) => {
        const prefabGroup = groupsMap.get(groupIndex);
        if (!prefabGroup || !prefabGroup.length) {
            return;
        }

        const iterations = this.fIterations[groupIndex % this.fIterations.length] ?? 1; // Use modulo for array access
        // Get per-group settings, using modulo for array access
        const windEnabledForGroup = this.fWindEnabled[groupIndex % this.fWindEnabled.length];
        const scales = this.fScales[groupIndex % this.fScales.length] || new THREE.Vector2(1, 5);
        const rotT = this.fRotateWithTerrain[groupIndex % this.fRotateWithTerrain.length];
        const ug = this.fUndergroundOffsets[groupIndex % this.fUndergroundOffsets.length];

        for (let iter = 0; iter < iterations; iter++) {
            // 6) Bucket by variant - Now using the prefabGroup from the local groupsMap
            const byVariant: Record<number, typeof spawnData> = {};
            for (const d of spawnData) {
                // Use combinedSeed here
                if (this.seededRandom(d.combinedSeed + iter * 1000, 9) < 0.4) continue;
                const v = Math.floor(this.seededRandom(d.combinedSeed + iter * 1000, 8) * prefabGroup.length);
                (byVariant[v] ||= []).push(d);
            }

            // 7) Build InstancedMesh for each variant - Using prefabs from the groupsMap
            for (const key in byVariant) {
                const vi = +key;
                const instances = byVariant[vi];
                const prefab = prefabGroup[vi];
                const master = this.getInstantiatedPrefab(prefab);
                if (!master) continue;

                const meshes: THREE.Mesh[] = [];
                master.traverse(c => c instanceof THREE.Mesh && meshes.push(c));
                if (!meshes.length) {
                    console.warn(`Prefab ${prefab.name} has no Mesh children.`);
                    continue;
                }

                for (const src of meshes) {
                    // Handle material array
                    const originalMaterials = Array.isArray(src.material) ? src.material : [src.material];
                    const materialsToUse: THREE.Material[] = [];

                    originalMaterials.forEach(originalMaterial => {
                        if (windEnabledForGroup === true) {
                            const windMaterial = this.applyWindShader(originalMaterial);
                            materialsToUse.push(windMaterial);
                        } else {
                            materialsToUse.push(originalMaterial);
                        }
                    });

                    const inst = new THREE.InstancedMesh(src.geometry, materialsToUse.length === 1 ? materialsToUse[0] : materialsToUse, instances.length);
                    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                    inst.receiveShadow = true;
                    inst.castShadow = true;

                    // Get a Matrix4 from the pool instead of a Vector3
                    const tempMatrix = getMatrix4();
                    const q = getQuaternion();
                    const s3 = getVector3();
                    const up = new THREE.Vector3(0, 1, 0);

                    instances.forEach((d, i) => {
                        // Use combinedSeed for all random calculations
                        const ang = this.seededRandom(d.combinedSeed, 3) * Math.PI * 2;
                        const scaleV = scales.x + this.seededRandom(d.combinedSeed, 4) * (scales.y - scales.x);
                        const scaleY = scaleV * (0.8 + this.seededRandom(d.combinedSeed, 5) * 0.4);

                        if (rotT) {
                            // Align object's up vector with the terrain normal
                            q.setFromUnitVectors(up, getVector3().copy(d.norm).normalize());
                        } else {
                            q.identity();
                        }
                        // Apply random yaw rotation around the terrain normal if rotated with terrain,
                        // or around global Y if not.
                        const rotationAxis = rotT ? getVector3().copy(d.norm).normalize() : up;
                        q.multiply(getQuaternion().setFromAxisAngle(rotationAxis, ang));

                        s3.set(scaleV * src.scale.x, scaleY * src.scale.y, scaleV * src.scale.z);

                        // Use combinedSeed for clustering randomness
                        const cluster = this.seededRandom(d.combinedSeed + groupIndex * 100, 0) < 0.3 ? 0.5 : 0.8;
                        const offX = (this.seededRandom(d.combinedSeed + groupIndex * 100, 0) - 0.5) * cluster * scaleV * (iter * 0.1 + 1);
                        const offZ = (this.seededRandom(d.combinedSeed + groupIndex * 100, 1) - 0.5) * cluster * scaleV * (iter * 0.1 + 1);

                        // Create an offset in the xz plane first
                        const offsetDirection = getVector3().set(offX, 0, offZ);

                        // Use the proper y-value from the terrain
                        // This ensures foliage sits exactly on the terrain surface
                        const finalPos = getVector3().copy(d.pos).add(offsetDirection);

                        // Apply a slight underground offset to ensure foliage roots are slightly embedded
                        finalPos.y -= ug;

                        // Use the Matrix4 object for composition
                        tempMatrix.compose(finalPos, q, s3);
                        inst.setMatrixAt(i, tempMatrix);
                    });

                    inst.instanceMatrix.needsUpdate = true;
                    inst.frustumCulled = true;
                    allMeshes.push(inst);
                }
            }
        }
    });

    // 8) Spawn in batches
    await this.spawnFoliageBatched(foliageFolder, allMeshes, this.fBatchSize, this.fSpawnDelay);
    group.add(foliageFolder);
}

            
                private async spawnFoliageBatched(group: THREE.Group, meshes: THREE.InstancedMesh[], batchSize: number, delay: number) {
                    // Optimize the batching process to reduce lag
                    batchSize = Math.max(1, batchSize);
                    
                    // Process meshes in larger batches when possible
                    // This reduces the number of frames blocked by foliage generation
                    if (meshes.length <= 20) {
                        // For small numbers of meshes, just add them all at once
                        meshes.forEach(mesh => {
                            if (mesh) {
                                group.add(mesh);
                            }
                        });
                    } else {
                        // For larger numbers of meshes, use batching with minimal delays
                        for (let i = 0; i < meshes.length; i += batchSize) {
                            const batch = meshes.slice(i, i + batchSize);
                            
                            // Add all meshes in this batch at once (reduces Three.js overhead)
                            batch.forEach(mesh => {
                                if (mesh) {
                                    // Set to frustum culled to improve performance
                                    mesh.frustumCulled = true;
                                    group.add(mesh);
                                }
                            });
                            
                            // Only add a delay between larger batches
                            // This gives the main thread time to process other tasks
                            if (i + batchSize < meshes.length && delay > 0) {
                                await new Promise(resolve => setTimeout(resolve, Math.min(delay, 100))); // Cap maximum delay to 5ms
                            }
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
            
      
            
            
                public getWorldY(localPos: THREE.Vector3, parent: THREE.Object3D): number {
                    const worldPos = localPos.clone();
                    parent.updateMatrixWorld(true); // Ensure world matrix is up to date
                    worldPos.applyMatrix4(parent.matrixWorld);
                    return worldPos.y;
                }
            
             // #endregion Foliage
            
            
            // #region Wind
            
            
            private windClock: THREE.Clock = new THREE.Clock();
            private windMaterials: Set<THREE.Material> = new Set();
            
            /**
             * Applies a wind bending shader to a given Three.js material.
             * Clones the material to avoid modifying the original.
             * @param originalMaterial The material to apply the shader to.
             * @returns The new material with the wind shader applied, or the original material if already applied or an error occurs.
             */
            public applyWindShader(originalMaterial: THREE.Material): THREE.Material {
                // Check if the material is valid and hasn't already had the wind shader applied
                if (!originalMaterial || originalMaterial.userData?.isWindMaterial) {
                    return originalMaterial;
                }
            
                try {
                    // Clone the material to avoid affecting other objects using the same material
                    const materialToUse = originalMaterial.clone();
                    materialToUse.userData.isWindMaterial = true; // Mark as wind material
            
                    // Hook into the shader compilation process
                    materialToUse.onBeforeCompile = (shader) => {
                        // Define and add uniforms to the shader
                        shader.uniforms.uTime = { value: this.windClock.getElapsedTime() };
                        shader.uniforms.uGlobalBendIntensity = { value: this.globalBendIntensity };
                        shader.uniforms.uGlobalBendSpeed = { value: this.globalBendSpeed };
                        shader.uniforms.uGlobalBendFrequency = { value: this.globalBendFrequency };
                        shader.uniforms.uGlobalBendGroundLevel = { value: this.globalBendGroundLevel };
                        shader.uniforms.uGlobalBendHeightInfluence = { value: this.globalBendHeightInfluence };
                        shader.uniforms.uGustStrength = { value: this.gustStrength };
                        shader.uniforms.uGustFrequency = { value: this.gustFrequency };
            
                        // New uniforms for FBM and vertical sway control
                        shader.uniforms.uFbmPersistence = { value: this.fbmPersistence };
                        shader.uniforms.uFbmLacunarity = { value: this.fbmLacunarity };
                        shader.uniforms.uVerticalSwayAmplitude = { value: this.verticalSwayAmplitude };
                        shader.uniforms.uVerticalSwayFrequency = { value: this.verticalSwayFrequency };
                        shader.uniforms.uGustPower = { value: this.gustPower };
            
            
                        // Inject GLSL code into the vertex shader
                        // We replace the standard 'void main() {' with our custom code before it
                        shader.vertexShader = shader.vertexShader.replace(
                            'void main() {',
                            `
                            uniform float uTime;
                            uniform float uGlobalBendIntensity;
                            uniform float uGlobalBendSpeed;
                            uniform float uGlobalBendFrequency;
                            uniform float uGlobalBendGroundLevel;
                            uniform float uGlobalBendHeightInfluence;
                            uniform float uGustStrength;
                            uniform float uGustFrequency;
            
                            // New uniforms for tuning FBM and vertical sway smoothness
                            uniform float uFbmPersistence; // Controls how much each octave contributes (lower = smoother)
                            uniform float uFbmLacunarity; // Controls the frequency multiplier for each octave (lower = smoother)
                            uniform float uVerticalSwayAmplitude; // Amplitude of vertical movement
                            uniform float uVerticalSwayFrequency; // Frequency of vertical movement
                            uniform float uGustPower; // Shapes the gust curve (lower = smoother peaks)
            
                            // Hash and noise functions (standard implementations)
                            vec3 hash3(vec3 p) {
                                p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                                         dot(p, vec3(269.5, 183.3, 246.1)),
                                         dot(p, vec3(113.5, 271.9, 124.6)));
                                return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
                            }
            
                            float noise2D(vec2 p) {
                                vec2 i = floor(p);
                                vec2 f = fract(p);
                                vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep-like interpolation curve
                                float a = dot(hash3(vec3(i, 0.0)).xy, f - vec2(0.0, 0.0));
                                float b = dot(hash3(vec3(i + vec2(1.0, 0.0), 0.0)).xy, f - vec2(1.0, 0.0));
                                float c = dot(hash3(vec3(i + vec2(0.0, 1.0), 0.0)).xy, f - vec2(0.0, 1.0));
                                float d = dot(hash3(vec3(i + vec2(1.0, 1.0), 0.0)).xy, f - vec2(1.0, 1.0));
                                return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
                            }
            
                            // Fractal Brownian Motion for richer detail
                            // Tunable persistence and lacunarity allow for smoother or rougher noise
                            float fbm(vec2 uv) {
                                float v = 0.0;
                                float amp = 1.0;
                                float freq = 1.0;
                                // Using 4 octaves - adjust the loop count for more/less detail
                                for (int i = 0; i < 4; i++) {
                                    v += amp * noise2D(uv * freq);
                                    // Scale frequency and amplitude for the next octave
                                    freq *= uFbmLacunarity;
                                    amp *= uFbmPersistence;
                                }
                                return v;
                            }
            
                            // Calculates the wind displacement for a given position
                            vec3 getBendDisplacement(vec3 pos) {
                                // Calculate height above the ground level
                                float height = max(0.0, pos.y - uGlobalBendGroundLevel);
                                // Apply height influence: higher values for uGlobalBendHeightInfluence
                                // make the effect stronger at the top, creating a smoother bend curve.
                                float hInfluence = pow(height, uGlobalBendHeightInfluence);
            
                                // Calculate coordinates for noise sampling, incorporating time and frequency
                                vec2 coord = pos.xz * uGlobalBendFrequency + uTime * uGlobalBendSpeed;
            
                                // Base wind using FBM for complex, natural-looking motion
                                float baseWind = fbm(coord);
            
                                // Gust component: uses a smooth sine wave shaped by gustPower
                                // Lower uGustPower results in smoother, broader gusts
                                float gust = sin(uTime * uGustFrequency + length(coord)) * 0.5 + 0.5;
                                gust = pow(gust, uGustPower) * uGustStrength;
            
                                // Determine wind direction based on noise
                                float nx = noise2D(coord + baseWind);
                                float nz = noise2D(coord - baseWind);
                                // Normalize the direction vector, adding a small value to prevent division by zero
                                vec2 wind2D = normalize(vec2(nx, nz) + 0.0001);
                                vec3 windDir = vec3(wind2D.x, 0.0, wind2D.y);
            
                                // Vertical sway for added realism, influenced by height
                                // Adjust uVerticalSwayAmplitude and uVerticalSwayFrequency for desired vertical motion
                                float vert = sin((pos.y * uVerticalSwayFrequency + uTime) * uVerticalSwayFrequency) * uVerticalSwayAmplitude;
            
            
                                // Final displacement calculation
                                // Combine base wind, gust, direction, and height influence
                                vec3 disp = windDir * (baseWind + gust) * hInfluence * uGlobalBendIntensity;
                                // Add vertical sway, also influenced by height
                                disp.y += vert * hInfluence;
            
                                return disp;
                            }
            
                            void main() {` // Original main function starts here
                        );
            
                        // Inject our calculated displacement into the vertex position calculation
                        // This replaces the default transformation with our wind-bent position
                        shader.vertexShader = shader.vertexShader.replace(
                            '#include <begin_vertex>',
                            `#include <begin_vertex>
                            vec3 bend = getBendDisplacement(position);
                            transformed = position + bend; // Apply the calculated bend displacement
                            `
                        );
            
                        // Keep the default normal calculation - bending vertices doesn't necessarily
                        // mean the normals should be recalculated in this simple shader.
                        shader.vertexShader = shader.vertexShader.replace(
                            '#include <beginnormal_vertex>',
                            `#include <beginnormal_vertex>
                            // Normal remains from default calculation
                            `
                        );
            
                        // Store uniforms in userData for easy access during updates
                        materialToUse.userData.shaderUniforms = shader.uniforms;
                        // Mark the material for update after modifying its shader
                        materialToUse.needsUpdate = true;
                    };
            
                    // Also mark the initial cloned material for update
                    materialToUse.needsUpdate = true;
                    // Add the new material to our set for easy updating
                    this.windMaterials.add(materialToUse);
                    return materialToUse;
            
                } catch (e) {
                    // Log any errors during shader application and return the original material
                    console.error("Failed to apply bending shader:", e);
                    return originalMaterial;
                }
            }
            
            /**
             * Updates the uniforms of all materials with the wind shader applied.
             * Should be called in the animation loop.
             */
            public foliageWindUpdate() {
                // Get the elapsed time from the wind clock
                const t = this.windClock.getElapsedTime();
                // Iterate over all materials with the wind shader
                this.windMaterials.forEach(mat => {
                    // Access the stored uniforms
                    const u = mat.userData.shaderUniforms;
                    if (u) {
                        // Update all uniform values
                        u.uTime.value = t;
                        u.uGlobalBendIntensity.value = this.globalBendIntensity;
                        u.uGlobalBendSpeed.value = this.globalBendSpeed;
                        u.uGlobalBendFrequency.value = this.globalBendFrequency;
                        u.uGlobalBendGroundLevel.value = this.globalBendGroundLevel;
                        u.uGlobalBendHeightInfluence.value = this.globalBendHeightInfluence;
                        u.uGustStrength.value = this.gustStrength;
                        u.uGustFrequency.value = this.gustFrequency;
            
                        // Update new uniforms for FBM and vertical sway
                        u.uFbmPersistence.value = this.fbmPersistence;
                        u.uFbmLacunarity.value = this.fbmLacunarity;
                        u.uVerticalSwayAmplitude.value = this.verticalSwayAmplitude;
                        u.uVerticalSwayFrequency.value = this.verticalSwayFrequency;
                        u.uGustPower.value = this.gustPower;
                    }
                });
            }
            
            // #endregion Wind
            
            
    // #region Biomes
public biomeData: Uint8Array | null = null;
public biomesConfig: { [key: string]: { foliageIndexes: number[] } } = {};
private isBiomeDataProcessed = false;
public biomeCache: BiomeCache | null = null;
private biomeCacheCleanupInterval = 60000; // 60 seconds
private lastBiomeCacheCleanup = 0;
private biomeCacheResolution = 5;


            
private processBiomeData() {
    const image = this.BiomesMap!.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    this.biomeData = new Uint8Array(imageData.data.buffer);
    this.isBiomeDataProcessed = true;

    // Process biome config to ensure foliageIndexes exist
    for (const color in this.biomesConfig) {
        const biome = this.biomesConfig[color];
        if (!biome.foliageIndexes) {
            biome.foliageIndexes = [];
        }
    }

    // Initialize the cache
    const terrainDims = this.getTerrainDimensions();
    this.biomeCache = new BiomeCache(
        this.biomeCacheResolution,
        terrainDims.width,
        terrainDims.height,
        this.Offset
    );
    this.biomeCache.startCleanupInterval(60000);
}

private getTerrainDimensions() {
  return {
    width: this.heightmapSize.width * this.Scale.x,
    height: this.heightmapSize.height * this.Scale.z
  };
}

public getBiomeAtWorldPosition(worldX: number, worldZ: number): string {
    if (!this.biomeData) return this.biomesConfig.voidBiomeName[0] || "Void";
    if (!this.biomeCache) return this.lookupBiomeDirectly(worldX, worldZ);
    
    return this.biomeCache.getBiome(worldX, worldZ, (x, z) => this.lookupBiomeDirectly(x, z));
  }
  
private lookupBiomeDirectly(worldX: number, worldZ: number): string {
    const image = this.BiomesMap?.image as HTMLImageElement | undefined;
    if (!this.biomeData || !image || 
        image.width <= 0 || image.height <= 0) {
        return this.biomesConfig.voidBiomeName?.[0] || "Void";
    }

    const terrainSize = this.getTerrainDimensions();
    const u = ((worldX - this.Offset.x) / terrainSize.width) + 0.5;
    const v = ((worldZ - this.Offset.z) / terrainSize.height) + 0.5;

    // Clamp UV coordinates
    const clampedU = Math.max(0, Math.min(1, u));
    const clampedV = Math.max(0, Math.min(1, v));

    // Get pixel coordinates
    const px = Math.floor(clampedU * image.width);
    const py = Math.floor(clampedV * image.height);

    // Check array bounds
    if (px < 0 || px >= image.width || 
        py < 0 || py >= image.height) {
        return this.biomesConfig.voidBiomeName?.[0] || "Void";
    }

    const idx = (py * image.width + px) * 4;
    const r = this.biomeData[idx];
    const g = this.biomeData[idx + 1];
    const b = this.biomeData[idx + 2];

    // Ensure valid color values
    if (r === undefined || g === undefined || b === undefined) {
        return this.biomesConfig.voidBiomeName?.[0] || "Void";
    }

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
// #endregion Biomes



// #region Debug

        private debugFolder: THREE.Group | null = null;
        private chunkBoundingBoxes: Map<THREE.Group, THREE.BoxHelper> = new Map();

        private updateChunkBoundingBoxes() {
        if (!this.showChunkBoundingBoxes) {
            this.removeAllBoundingBoxes();
            return;
        }

        if (!this.debugFolder) {
            this.debugFolder = new THREE.Group();
            this.debugFolder.name = "DebugBoundingBoxes";
            this.object3d.add(this.debugFolder);
        }

        for (const group of this.lodGroups) {
            if (group.visible) {
            if (!this.chunkBoundingBoxes.has(group)) {
                const boxHelper = new THREE.BoxHelper(group, 0xffff00);
                this.debugFolder.add(boxHelper);
                this.chunkBoundingBoxes.set(group, boxHelper);
            }
            const boxHelper = this.chunkBoundingBoxes.get(group);
            if (boxHelper) {
                boxHelper.update(); // Update the bounding box
            }
            } else {
            this.removeBoundingBoxForGroup(group);
            }
        }

        // Remove boxes for groups that no longer exist
        this.chunkBoundingBoxes.forEach((boxHelper, group) => {
            if (!this.lodGroups.includes(group)) {
            this.removeBoundingBoxForGroup(group);
            }
        });
        }

        private removeBoundingBoxForGroup(group: THREE.Group) {
        const boxHelper = this.chunkBoundingBoxes.get(group);
        if (boxHelper) {
            if (this.debugFolder) {
            this.debugFolder.remove(boxHelper);
            }
            boxHelper.geometry.dispose();
            boxHelper.material.dispose();
            this.chunkBoundingBoxes.delete(group);
        }
        }

        private removeAllBoundingBoxes() {
        this.chunkBoundingBoxes.forEach((boxHelper, group) => {
            this.removeBoundingBoxForGroup(group);
        });
        
        if (this.debugFolder) {
            this.object3d.remove(this.debugFolder);
            this.debugFolder = null;
        }
        }

// #endregion Debug
            
            



// #region INPUTS
            
                // docs
                @RE.props.group("", false)
                @RE.props.text() Docs: string = "https://github.com/danbaoren/RuntimeMapGen";
                @RE.props.checkbox() View_Mode: boolean = true;
            
            
            @RE.props.group("🛠️ General", true)
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
                  @RE.props.num() backfaceCullingAngle = 135; // Degree from camera forward beyond which chunks get culled
                  @RE.props.num() occlusionAngleThreshold = 45; // Degrees from camera forward to consider for occlusion
                  @RE.props.num() DeactivationDelay = 7000; // ms delay before deactivating chunks behind camera
                  @RE.props.num() occlusionOffset = 2000; // Distance behind camera to start occlusion checks
                  @RE.props.num() maxCacheSize = 2048; // Maximum number of chunks to cache
                  @RE.props.num() cacheCleanupInterval = 30000; // ms between cache cleanups
                  @RE.props.num() deletionConcurrency = 10;
                  @RE.props.num() deletionBatchDelay = 250;
                  @RE.props.text() excludedCameraNames: string = "LoginCamera, LandscapeCamera"; // Comma-separated list of cameras to ignore
            
            
            
            @RE.props.group("🎨 Textures", true)
                  @RE.props.text() texturesStaticPath: string = "MapGen/Textures/";
                  @RE.props.text() ktx2_Transcoder: string = "Modules/basis/";
                   @RE.props.text() __________________________________________________________________________: string = " ";
                  @RE.props.texture() sandTexture: THREE.Texture | null = null;
                  @RE.props.num() sandScale = 1;
                  @RE.props.vector2() Sand_Slopes: THREE.Vector2 = new THREE.Vector2(-0.1, 0.1);
                  @RE.props.num() beachHeight = 64.9; 
                  @RE.props.text() ___________________________________________________________________________: string = " ";
                  @RE.props.texture() grassTexture: THREE.Texture | null = null;
                  @RE.props.num() grassScale = 1;
                  @RE.props.vector2() Grass_Slopes: THREE.Vector2 = new THREE.Vector2(0, 0.25);
                  @RE.props.text() ____________________________________________________________________________: string = " ";
                  @RE.props.texture() stoneTexture: THREE.Texture | null = null;
                  @RE.props.num() stoneScale = 1;
                  @RE.props.vector2() Stone_Slopes: THREE.Vector2 = new THREE.Vector2(2, 0);
                  @RE.props.num() stoneSlopeIntensity = 0.02;
                  @RE.props.text() ________________________________________________________________________________: string = " ";
                  @RE.props.texture() dirtTexture: THREE.Texture | null = null;
                  @RE.props.num() dirtScale = 1;
                  @RE.props.vector2() Dirt_Slopes: THREE.Vector2 = new THREE.Vector2(-3, 4);
                  @RE.props.num() dirtHeightStart = 1;
                  @RE.props.num() dirtHeightEnd = 0;
                  @RE.props.text() _____________________________________________________________________________: string = " ";
                  @RE.props.texture() snowTexture: THREE.Texture | null = null;
                  @RE.props.num() snowScale = 0.3;
                  @RE.props.vector2() Snow_Slopes: THREE.Vector2 = new THREE.Vector2(1, -1.3);
                  @RE.props.num() snowHeightStart = 0.8;
                  @RE.props.num() snowHeightEnd = 1.0;
                  @RE.props.num() snowBlendSmoothness = 1.0;
                  @RE.props.text() _________________________________________________________________________________________: string = " ";
                    @RE.props.color() sandColorFilter = new THREE.Color(0xe6e0da);
                  @RE.props.color() grassColorFilter = new THREE.Color(0xebebeb);
                  @RE.props.color() stoneColorFilter = new THREE.Color(0xd3d3d3);
                  @RE.props.color() dirtColorFilter = new THREE.Color(0xf0f0f0);
                  @RE.props.color() snowColorFilter = new THREE.Color(0xffffff);

            
            
            @RE.props.group("🌿 Foliage", true)
                    @RE.props.checkbox() enableFoliage: boolean = false;
                    @RE.props.text() foliagePrefabBasePath: string = "Foliage/";
            
                    @RE.props.text() __________________________________: string = " ";
                    @RE.props.list.num(0.001, 1) fDensities: number[] = [];
                    @RE.props.list.checkbox() fRotateWithTerrain: boolean[] = [];
                    @RE.props.list.num(-100, 100) fUndergroundOffsets: number[] = [];
                    @RE.props.list.num(1, 10) fIterations: number[] = [];
                    @RE.props.list.checkbox() fWindEnabled: boolean[] = [];  
                    @RE.props.text() _____________________________________________: string = "";
                    @RE.props.list.vector2() fScales: THREE.Vector2[] = [new THREE.Vector2(0.1, 5)];
                    @RE.props.list.vector2() fSlopes: THREE.Vector2[] = [new THREE.Vector2(0, 0.3)];
                    @RE.props.list.vector2() fHeights: THREE.Vector2[] = [new THREE.Vector2(100, 100000)];
                    @RE.props.text() __________________________________________: string = "";
            
                    @RE.props.num() fChunksRender: number = 1;            
                    @RE.props.num() fSeed: number = 69;
                    @RE.props.num() fBatchSize: number = 20;
                    @RE.props.num() fSpawnDelay: number = 250;
            
            @RE.props.group("🍃 Wind", true)
                    @RE.props.num() globalBendIntensity = 0.2;       // Controls the maximum amount of bending
                    @RE.props.num() globalBendSpeed = 0.3;           // Controls the speed of the bending motion
                    @RE.props.num() globalBendFrequency = 0.25;       // Controls the spatial frequency of the bending waves
                    @RE.props.num() globalBendGroundLevel = 0.3;     // Y-coordinate in object space below which bending is reduced
                    @RE.props.num() globalBendHeightInfluence = 0.5; // How strongly height influences bending
                    @RE.props.num() gustStrength = 0;              // Strength of occasional gusts
                    @RE.props.num() gustFrequency = 1.1;               // How often gusts occur
            
                    // New properties for finer control
                    @RE.props.num() fbmPersistence = 0.2;            // How much influence each octave of FBM has (usually 0.5)
                    @RE.props.num() fbmLacunarity = 1.0;             // How much the frequency increases per octave of FBM (usually 2.0)
                    @RE.props.num() verticalSwayAmplitude = 0;     // Amplitude of the vertical swaying motion
                    @RE.props.num() verticalSwayFrequency = 0.4;     // Frequency of the vertical swaying motion
                    @RE.props.num() gustPower = 0;                 // Exponent to shape the gust curve (higher = sharper gusts)
            
            
            @RE.props.group("💥 Collision", true)
                  @RE.props.checkbox() RapierCollision = false;
                  @RE.props.num() collisionChunkSize = 10;
                  @RE.props.num() collider_Subdivision = 10;
                  @RE.props.num(1, 4) collider_TriangleSubdivisions = 2;
                  //@RE.props.num() collisionChunkBuffer = 1;
                  public collisionChunkBuffer = 1;
                  //@RE.props.num() collisionGenerationDelay = 5000;
                  public collisionGenerationDelay = 10000;
                  @RE.props.checkbox() VisualizeCollision = false;
                  @RE.props.checkbox() add_RapierConfig = true;
                  @RE.props.vector3() RapierConfig_gravity: THREE.Vector3 = new THREE.Vector3(0, -100, 0);
            
            @RE.props.group("🧭 Navigation", true)
                  @RE.props.button() refmap = () => RMG_Navigation.refreshMapCanvas();
                    refmapLabel = "[Debug] refresh map";
                    @RE.props.button() exportGrayscale = () => RMG_Navigation.exportGrayscale();
                    exportGrayscaleLabel = "[Export] Grayscale Reference";
                    @RE.props.button() exportColored = () => RMG_Navigation.exportColored();
                    exportColoredLabel = "[Export] Colored Reference";
                    @RE.props.checkbox() EnableMinimap: boolean = true;
                    @RE.props.texture() customMinimap: THREE.Texture | null = null;
                    @RE.props.num() minimap_Resolution = 1600;
                    @RE.props.num() oceanLevel = 0.1;
                    @RE.props.num() beachRange = 0.05;
                    @RE.props.num() grassMin = 0.2;
                    @RE.props.num() STONE_SLOPE = 0.04;
                    @RE.props.num() terrainMaxHeight = 1;
                    @RE.props.text()  minimapPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';
                    @RE.props.text() ___________________________________________________________: string = " ";
                    @RE.props.texture() playerArrow: THREE.Texture | null = null; 
                    @RE.props.num() arrowSize = 0.5;
                    @RE.props.texture() minimapBorder: THREE.Texture | null = null;
                    @RE.props.vector2() borderOffset = new THREE.Vector2(0, 0);
                    @RE.props.num() borderSize = 1.0;
            
            
            @RE.props.group("🌿 Biomes", true)
                @RE.props.button() generateBiomes = () => RMG_Navigation.generateAndExportBiomes();
                generateBiomesLabel = "[Generate] Biomes Map & Config";
                @RE.props.texture() BiomesMap: THREE.Texture | null = null;
                @RE.props.text() BiomeJsonPath: string = "MapGen/biomes.json";
                @RE.props.num() biomeSeed: number = 69; // Input for biome seed
                @RE.props.num() biomeScale: number = 2000; // Scale of biome regions (larger value = larger biomes)
                @RE.props.num() noiseOctaves: number = 6; // Number of noise layers for fBM
                @RE.props.num() noiseLacunarity: number = 2.0; // Frequency multiplier per octave
                @RE.props.num() noisePersistence: number = 0.5; // Amplitude multiplier per octave
            
                // Biome height thresholds (normalized 0 to 1, relative to terrainMaxHeight)
                @RE.props.num() mountainHeightThreshold: number = 0.7;
                @RE.props.num() forestHeightThreshold: number = 0.4;
                @RE.props.num() valleyHeightThreshold: number = 0.2; // Below forest, above beach
            
                // Biome noise thresholds (normalized 0 to 1, from fBM output)
                @RE.props.num() tempThresholdTaiga: number = 0.3; // Lower temp -> Taiga
                @RE.props.num() moistureThresholdDesert: number = 0.4; // Lower moisture -> Desert
                @RE.props.num() tempThresholdDesert: number = 0.6; // Higher temp -> Desert
            
            
            @RE.props.group("⏳ Loading Bar", true)
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
            
            @RE.props.group("✨ Ambience [Shader]", true)
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
                  @RE.props.num() shadowDarkeningFactor = 1;
            
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
                @RE.props.text() _______________________________________: string = " ";
                @RE.props.num() grassStoneInfluenceFactor = 20;
                @RE.props.vector2() dirtBetweenFactor = new THREE.Vector2(-8, 40);
                @RE.props.num() blobInfluence = -0.5;
                @RE.props.num() blobDensity = 0.005;
                @RE.props.num() blobScale = 1.5;
                @RE.props.num() blobGrassOnStone = 0.5;
                @RE.props.num() blobDirtOnStone = 0.5;
                @RE.props.num() blobDirtOnGrass = 0.8;
                
  
            
            
            
            @RE.props.group("🧪 Procedural Filters", true)
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

                @RE.props.checkbox() enableSlopeSharpening: boolean = false;
                @RE.props.num() slopeSharpeningIntensity: number = 0.5; // How aggressively to sharpen (0-1, 1 is very strong)
                @RE.props.num() slopeSharpeningMinSlope: number = 5; // Minimum height difference (slope) to consider for sharpening
                @RE.props.num() slopeSharpeningMaxSlope: number = 40; // Maximum height difference (slope); avoid already vertical cliffs
                @RE.props.num() slopeSharpeningIterations: number = 3; // How many times to apply the sharpening pass (compounds effect)
                @RE.props.num() slopeSharpeningRadius: number = 1; // How far out from the central point to look for the steepest descent
                @RE.props.text() ______________________________________________________________________: string = " ";

                // RTS Shape Grid Configuration
                @RE.props.checkbox() enableRtsShapes: boolean = false; // Enable/disable RTS shape grid
                @RE.props.num() rtsShapeCorners: number = 5; // Number of corners for the shapes (e.g., 3 for triangles, 4 for squares, 5 for pentagons, 6 for hexagons)
                @RE.props.num() rtsShapeScale: number = 50; // Controls the size of each shape on the map
                @RE.props.num() rtsShapeHeightQuantization: number = 32; // How many distinct height levels within each shape (e.g., 8, 16, 32, 64)
                @RE.props.num() rtsShapeBlendFactor: number = 0.5; // How much to blend the new shape height with the original (0 for pure shapes, 1 for original)
                @RE.props.num() rtsShapeSeed: number = 42; // Seed for any internal random variations within shapes
                @RE.props.text() ____________________________________________________________________________________: string = " ";
            
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
            
            
            @RE.props.group("🧩 Algorithmic Terrain", true)
                @RE.props.checkbox() useAlgorithmicTerrain: boolean = false;
                @RE.props.vector2() alg_Size = new THREE.Vector2(1024, 1024);
                @RE.props.num(1, 9999999) alg_Seed = 696969;
                @RE.props.num() alg_Scale = 100;
                @RE.props.num() alg_Octaves = 6;
                @RE.props.num() alg_Persistence = 0.5;
                @RE.props.num() alg_Lacunarity = 2;
                @RE.props.num(0, 10) alg_WarpStrength = 5; // Strength of domain warping
                @RE.props.num(0.1, 5) alg_MountainSharpness = 2.5; // Exaggerates mountain peaks (power function exponent)
                @RE.props.num(0, 2) alg_MountainHeight = 1.0; // Overall height contribution of mountains
                @RE.props.num(0.1, 5) alg_ValleyDepth = 2.0; // Exaggerates valley depth (power function exponent)
                @RE.props.num(0, 2) alg_ValleyStrength = 0.5; // Overall depth contribution of valleys
                @RE.props.num(0, 1) alg_DetailStrength = 0.2; // Strength of fine detail noise
                @RE.props.num(0.1, 5) alg_OverallHeightMultiplier = 1.5; // Multiplies overall height before final curve
                @RE.props.num(0.1, 5) alg_HeightCurvePower = 1.8; // Power curve for final height distribution (exaggerates highs/lows)
                @RE.props.num(0, 1) alg_SeaLevel = 0.4; // Normalized sea level (0-1 range)
                @RE.props.num(0, 0.1) alg_BeachHeight = 0.03; // Height range for beaches above sea level
                @RE.props.vector2() alg_YRange = new THREE.Vector2(0, 1); // Scene Y range for terrain (min, max)

                @RE.props.button() exportHeightmapButton2 = () => RMG_Export.exportHeightmapBatched();
                exportHeightmapButton2Label = "[EXPORT] Terrain to Heightmap";



            @RE.props.group("🐞 Debug", true)
                @RE.props.checkbox() showChunkBoundingBoxes: boolean = false; // New debug checkbox



            
            
// #endregion INPUTS
            


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
                public scheduledRemovals = new Map<THREE.Group, ReturnType<typeof setTimeout>>();
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
            
                public highRenderDistanceSquared: number;
                public lowRenderDistanceSquared: number;
            
                // Caching systems
                private geometryCache = new Map<string, GeometryCache>();
                private colorCache = new Map<string, ColorCache>();
                private heightCache = new Map<string, HeightCache>();
                private lastCacheCleanup = 0;
            
                public isGeneratingCollision = false;
                public isMapLoaded = false;
                public collisionInitTimeout: ReturnType<typeof setTimeout> | null = null;
            
              private distantChunkLoadHeightThreshold: number = 10;
              private occlusionCheckTolerance: number = 1;
            
                private terrainTriangleCount: number = 0;
                private triangleLimit: number = 50000000;
            
                private cameraSearchActive = false;
                private lastCameraCheck = 0;
                private cameraCheckInterval = 500; // Check every 500ms
            
                public static cameraExport: THREE.Object3D;
            
            
                orbitControls: OrbitControls;



}

            
    
            
            // Basic seeded 2D Perlin Noise implementation
            // Based on Ken Perlin's simplified algorithm
            class SeededPerlinNoise {
                private p: number[] = [];
                private seed: number;
            
                constructor(seed: number) {
                    this.seed = seed;
                    this.initPermutation();
                }
            
                private initPermutation() {
                    this.p = Array.from({ length: 256 }, (_, i) => i);
            
                    // Use a seeded random number generator for shuffling
                    const seededShuffle = (array: number[], currentSeed: number) => {
                        let m = array.length, t, i;
                        while (m) {
                            currentSeed = (1664525 * currentSeed + 1013904223) % Math.pow(2, 32);
                            i = Math.floor((currentSeed / Math.pow(2, 32)) * m--);
                            t = array[m];
                            array[m] = array[i];
                            array[i] = t;
                        }
                        return array;
                    };
            
                    this.p = seededShuffle(this.p, this.seed);
                    this.p = this.p.concat(this.p); // Duplicate for easier wrapping
                }
            
                private fade(t: number): number {
                    return t * t * t * (t * (t * 6 - 15) + 10);
                }
            
                private lerp(a: number, b: number, t: number): number {
                    return (1 - t) * a + t * b;
                }
            
                private grad(hash: number, x: number, y: number): number {
                    const h = hash & 15;
                    const u = h < 8 ? x : y;
                    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
                    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
                }
            
                noise(x: number, y: number): number {
                    let X = Math.floor(x) & 255;
                    let Y = Math.floor(y) & 255;
            
                    x -= Math.floor(x);
                    y -= Math.floor(y);
            
                    let u = this.fade(x);
                    let v = this.fade(y);
            
                    let A = this.p[X] + Y;
                    let B = this.p[X + 1] + Y;
            
                    return this.lerp(
                        this.lerp(this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y), u),
                        this.lerp(this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1), u),
                        v
                    );
                }
            }