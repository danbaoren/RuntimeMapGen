import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";
import RapierTrimesh from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierTrimesh.re';
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';


    type ChunkData = {
      key: string;
      originalPosition: THREE.Vector3;
      chunkParams: { startX: number; startY: number; width: number; height: number };
      lodGroup?: THREE.Group;
      lastActive: number;
      cacheKey: string;
      clippingHeight?: number;
    };


export default class RMG_Collision {

//  #region COLLISION

    static terrainColliderFolder?: THREE.Group;
    static collisionChunkPool: THREE.Mesh[] = [];
    static activeCollisionChunks: Map<string, THREE.Mesh> = new Map();


    static subdivideTriangles(geometry: THREE.BufferGeometry, iterations: number): THREE.BufferGeometry {

        if (!RE.Runtime.isRunning) {geometry.dispose();}

        // Clone the geometry to avoid modifying the original.
        let currentGeometry = geometry.clone();

        for (let iter = 0; iter < iterations; iter++) {
            // Retrieve current positions and indices
            const posAttr = currentGeometry.getAttribute('position') as THREE.BufferAttribute;
            const oldPositions = Array.from(posAttr.array); // flattened array [x0, y0, z0, x1, y1, z1, ...]
            const oldIndices = currentGeometry.index ? Array.from(currentGeometry.index.array) : undefined;

            if (!oldIndices) {
                console.warn("Geometry subdivision requires an indexed BufferGeometry");
                break;
            }

            const newPositions: number[] = [];
            const newIndices: number[] = [];

            // Use a map to store the computed midpoints for shared edges
            const midpointCache = new Map<string, number>();

            // Helper function to get a vertex from oldPositions
            const getVertex = (index: number): THREE.Vector3 => {
                const i3 = index * 3;
                return new THREE.Vector3(
                    oldPositions[i3],
                    oldPositions[i3 + 1],
                    oldPositions[i3 + 2]
                );
            };

            // Helper function to add a new vertex and return its index.
            const addVertex = (v: THREE.Vector3): number => {
                newPositions.push(v.x, v.y, v.z);
                return (newPositions.length / 3) - 1;
            };

            // Helper function to find or create a midpoint vertex on edge i0-i1
            const getMidpoint = (i0: number, i1: number): number => {
                // Order indices to enforce uniqueness.
                const key = i0 < i1 ? `${i0}_${i1}` : `${i1}_${i0}`;
                if (midpointCache.has(key)) {
                    return midpointCache.get(key)!;
                }
                const v0 = getVertex(i0);
                const v1 = getVertex(i1);
                const mid = new THREE.Vector3().addVectors(v0, v1).multiplyScalar(0.5);
                const midIndex = addVertex(mid);
                midpointCache.set(key, midIndex);
                return midIndex;
            };

            // Copy all old vertices to newPositions first.
            const vertexMap: number[] = [];
            for (let i = 0; i < posAttr.count; i++) {
                const v = getVertex(i);
                const newIndex = addVertex(v);
                vertexMap.push(newIndex);
            }

            // Process each triangle.
            for (let i = 0; i < oldIndices.length; i += 3) {
                const i0 = oldIndices[i];
                const i1 = oldIndices[i + 1];
                const i2 = oldIndices[i + 2];

                // Get or compute midpoints for each edge.
                const m0 = getMidpoint(i0, i1);
                const m1 = getMidpoint(i1, i2);
                const m2 = getMidpoint(i2, i0);

                // Create four new triangles:
                // Triangle 1: (i0, m0, m2)
                newIndices.push(i0, m0, m2);
                // Triangle 2: (m0, i1, m1)
                newIndices.push(m0, i1, m1);
                // Triangle 3: (m0, m1, m2)
                newIndices.push(m0, m1, m2);
                // Triangle 4: (m2, m1, i2)
                newIndices.push(m2, m1, i2);
            }

            // Create new BufferGeometry with subdivided data.
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
            newGeometry.setIndex(newIndices);
            newGeometry.computeVertexNormals();
            newGeometry.computeBoundingBox();
            newGeometry.computeBoundingSphere();

            // Prepare for next iteration if needed.
            currentGeometry = newGeometry;
        }
        return currentGeometry;
    }

    public static async updateCollisionChunks(cameraPos: THREE.Vector3) {

        if (!RE.Runtime.isRunning) {return;}

      if (!RuntimeMapGen.get().RapierCollision || !RuntimeMapGen.get().isMapLoaded || RuntimeMapGen.get().isGeneratingCollision) {
        return;
      }

      // Parent group for all terrain colliders
      if (!this.terrainColliderFolder) {
        this.terrainColliderFolder = new THREE.Group();
        this.terrainColliderFolder.name = "TerrainCollider";
        RuntimeMapGen.get().object3d.add(this.terrainColliderFolder);
      }

      // Figure out which heightmap chunks we need around the camera
      const terrainX = ((cameraPos.x - RuntimeMapGen.get().Offset.x) / RuntimeMapGen.get().Scale.x) + (RuntimeMapGen.get().heightmapSize.width / 2);
      const terrainY = ((cameraPos.z - RuntimeMapGen.get().Offset.z) / RuntimeMapGen.get().Scale.z) + (RuntimeMapGen.get().heightmapSize.height / 2);
      const chunkSize = RuntimeMapGen.get().collisionChunkSize;
      const currentChunkX = Math.floor(terrainX / chunkSize);
      const currentChunkY = Math.floor(terrainY / chunkSize);

      const neededChunks = new Set<string>();
      for (let dx = -RuntimeMapGen.get().collisionChunkBuffer; dx <= RuntimeMapGen.get().collisionChunkBuffer; dx++) {
        for (let dy = -RuntimeMapGen.get().collisionChunkBuffer; dy <= RuntimeMapGen.get().collisionChunkBuffer; dy++) {
          neededChunks.add(`${currentChunkX + dx}_${currentChunkY + dy}`);
        }
      }

    // Remove chunks we no longer need
    this.activeCollisionChunks.forEach((chunkMesh, key) => {
      if (!neededChunks.has(key)) {
        const bodyComp = RE.getComponent(RapierBody, chunkMesh);
        const triComp  = RE.getComponent(RapierTrimesh, chunkMesh);
        if (triComp)  RE.removeComponent(triComp);
        if (bodyComp) RE.removeComponent(bodyComp);

        this.terrainColliderFolder?.remove(chunkMesh);

        if (chunkMesh.geometry) {
          chunkMesh.geometry.dispose();
        }
        if (!RuntimeMapGen.get().VisualizeCollision) {
          const mats = Array.isArray(chunkMesh.material)
            ? chunkMesh.material
            : [chunkMesh.material];
          mats.forEach(m => m.dispose());
        }

        this.collisionChunkPool.push(chunkMesh);
        this.activeCollisionChunks.delete(key);
         chunkMesh.remove();
      }
    });


      RuntimeMapGen.get().isGeneratingCollision = true;

      // Generate or reuse each needed chunk
      for (const chunkKey of neededChunks) {
        if (this.activeCollisionChunks.has(chunkKey)) {
          continue;
        }

        const [chunkX, chunkY] = chunkKey.split("_").map(Number);
        const startX = chunkX * chunkSize;
        const startY = chunkY * chunkSize;

        try {
          // 1) Generate raw geometry for this chunk
          const effectiveLODStep = chunkSize / RuntimeMapGen.get().collider_Subdivision;
          let rawGeometry = await RuntimeMapGen.get().generateChunkGeometry(
            startX,
            startY,
            chunkSize,
            chunkSize,
            effectiveLODStep,
            1
          );

          // 2) Scale it into world space
          const scaledGeometry = rawGeometry.clone();
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

          // 3) Optionally subdivide for finer collision
          if (RuntimeMapGen.get().collider_TriangleSubdivisions > 1) {
            rawGeometry = this.subdivideTriangles(scaledGeometry, RuntimeMapGen.get().collider_TriangleSubdivisions - 1);
          }

          // 4) Pull from pool or create brand-new mesh
          let collisionMesh = this.collisionChunkPool.pop() as THREE.Mesh | undefined;
          if (!collisionMesh) {
            collisionMesh = new THREE.Mesh(
              rawGeometry,
              new THREE.MeshBasicMaterial({
                visible: RuntimeMapGen.get().VisualizeCollision,
                wireframe: true,
                color: 0x212121,
                depthWrite: false,
                depthTest: false
              })
            );
            collisionMesh.name = "TerrainCollider";
            collisionMesh.userData.tag = "TerrainCollider";
          } else {
            collisionMesh.geometry = rawGeometry;
            (collisionMesh.material as THREE.Material).visible = RuntimeMapGen.get().VisualizeCollision;
          }

          // 5) Always attach fresh Rapier components
          const rapierBody = new RapierBody("RapierBody", collisionMesh);
          rapierBody.type = 1;        // static
          rapierBody.gravityScale = 0;
          rapierBody.mass = 0;
          RE.addComponent(rapierBody);

          const rapierTrimesh = new RapierTrimesh("RapierTrimesh", collisionMesh);
          RE.addComponent(rapierTrimesh);

          // 6) Position the mesh correctly in world space
          const centerX = (startX + chunkSize / 2) - (RuntimeMapGen.get().heightmapSize.width / 2);
          const centerY = (startY + chunkSize / 2) - (RuntimeMapGen.get().heightmapSize.height / 2);
          const worldX = centerX * RuntimeMapGen.get().Scale.x + RuntimeMapGen.get().Offset.x;
          const worldZ = centerY * RuntimeMapGen.get().Scale.z + RuntimeMapGen.get().Offset.z;
          collisionMesh.position.set(worldX, RuntimeMapGen.get().Offset.y, worldZ);
          collisionMesh.scale.set(1, 1, 1);

          // 7) Add to scene graph and mark active
          this.terrainColliderFolder.add(collisionMesh);
          this.activeCollisionChunks.set(chunkKey, collisionMesh);

        } catch (err) {
          console.error("Collision chunk error:", err);
        }
      }

      RuntimeMapGen.get().isGeneratingCollision = false;
    }



    // disposing

    public static disposeAllCollisionData(): void {
      const scene = RE.Runtime.scene as THREE.Scene;

      RE.traverseComponents((component: any, objectUUID: string) => {
        const componentName = component?.constructor?.name;
        if (componentName && componentName.toLowerCase().includes('rapier')) {
          RE.removeComponent(component);
        }
      });

      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;

        if (obj.geometry) {
          obj.geometry.dispose();
        }

        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((m) => {
          m.dispose();
        });
      });


      // Remove objects tagged as 'TerrainCollider'
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.tag === 'TerrainCollider') {
          if (obj.parent) {
            obj.parent.remove(obj);
          }
        }
      });

      // Clear other collision-related data structures
      this.activeCollisionChunks.forEach((mesh) => {
        if (mesh.parent) mesh.parent.remove(mesh);
      });
      this.activeCollisionChunks.clear();
      this.collisionChunkPool.length = 0;

      // Remove terrain collider folder if it exists
      if (this.terrainColliderFolder) {
        scene.remove(this.terrainColliderFolder);
        this.terrainColliderFolder = undefined;
      }

    }

    public static removeAllRapierObjects(): void {
      const scene = RE.Runtime.scene as THREE.Scene;
      const removedObjects = new Set<string>();

      RE.traverseComponents((component: any, objectUUID: string) => {
        const componentName = component?.constructor?.name;
        if (componentName && componentName.toLowerCase().includes('rapiertrimesh')) {
          // Check if the object has already been processed
          if (removedObjects.has(objectUUID)) {
            return;
          }

          const objectToRemove = scene.getObjectByProperty('uuid', objectUUID);
          if (objectToRemove && objectToRemove.parent) {
            objectToRemove.parent.remove(objectToRemove);
            removedObjects.add(objectUUID);
            //RE.Debug.log(`Removed object with UUID: ${objectUUID} due to Rapier component: ${componentName}`);
          } else if (objectToRemove && !objectToRemove.parent) {
            //RE.Debug.log(`Object with UUID: ${objectUUID} has a Rapier component (${componentName}) but no parent to remove from.`);
          } else {
            //RE.Debug.log(`Could not find object with UUID: ${objectUUID} associated with Rapier component: ${componentName}`);
          }
        }
      });
        //RE.Debug.log(`Finished scanning and removing objects with Rapier components. Total objects removed: ${removedObjects.size}`);
    }



    // API

    public async addCollisionAt(worldPos: THREE.Vector3): Promise<void> {
    // Convert world position to original coordinates
    const originalPos = RuntimeMapGen.get().worldToOriginalPosition(worldPos);
    const chunkKey = RuntimeMapGen.get().getChunkKeyFromOriginalPos(originalPos.x, originalPos.z);

    // Check if chunk exists
    const chunkData = RuntimeMapGen.get().chunksMap.get(chunkKey);
    if (!chunkData) {
        console.warn(`Chunk at ${chunkKey} not found.`);
        return;
    }

    // Check if collision is already active
    if (RMG_Collision.activeCollisionChunks.has(chunkKey)) {
        console.log(`Collision for chunk ${chunkKey} is already active.`);
        return;
    }

    // Generate collision mesh
    const collisionMesh = await this.generateCollisionMesh(chunkData);

    // Add to scene and activeCollisionChunks
    if (RMG_Collision.terrainColliderFolder) {
        RMG_Collision.terrainColliderFolder.add(collisionMesh);
        RMG_Collision.activeCollisionChunks.set(chunkKey, collisionMesh);
    }
}

    public async removeCollisionAt(worldPos: THREE.Vector3): Promise<void> {
        const originalPos = RuntimeMapGen.get().worldToOriginalPosition(worldPos);
        const chunkKey = RuntimeMapGen.get().getChunkKeyFromOriginalPos(originalPos.x, originalPos.z);

        if (!RMG_Collision.activeCollisionChunks.has(chunkKey)) {
            console.warn(`Collision for chunk ${chunkKey} is not active.`);
            return;
        }

        const collisionMesh = RMG_Collision.activeCollisionChunks.get(chunkKey)!;
        if (RMG_Collision.terrainColliderFolder) {
            RMG_Collision.terrainColliderFolder.remove(collisionMesh);
            RMG_Collision.collisionChunkPool.push(collisionMesh);
            RMG_Collision.activeCollisionChunks.delete(chunkKey);
        }
    }

    private async generateCollisionMesh(chunkData: ChunkData): Promise<THREE.Mesh> {
        let collisionMesh = RMG_Collision.collisionChunkPool.pop() as THREE.Mesh | undefined;
        const chunkParams = chunkData.chunkParams;

        // Generate the geometry
        const rawGeometry = await RuntimeMapGen.get().generateChunkGeometry(
            chunkParams.startX,
            chunkParams.startY,
            chunkParams.width,
            chunkParams.height,
            1,
            1
        );

        // Scale the geometry
        let scaledGeometry = rawGeometry.clone();
        const posAttr = scaledGeometry.attributes.position;
        const scaleVec = new THREE.Vector3().copy(RuntimeMapGen.get().Scale);

        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i) * scaleVec.x;
            const y = posAttr.getY(i) * scaleVec.y;
            const z = posAttr.getZ(i) * scaleVec.z;
            posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;
        scaledGeometry.computeBoundingBox();
        scaledGeometry.computeBoundingSphere();

        // Create or reuse mesh
        const visualizecoll = RuntimeMapGen.get().VisualizeCollision;
        if (!collisionMesh) {
            collisionMesh = new THREE.Mesh(
                scaledGeometry,
                new THREE.MeshBasicMaterial({
                    visible: visualizecoll,
                    wireframe: true,
                    color: 0xff0000,
                    depthWrite: false,
                    depthTest: false
                })
            );
            collisionMesh.name = "TerrainCollider";
            collisionMesh.userData.tag = "TerrainCollider";

            // Add physics components
            const rapierBody = new RapierBody('RapierBody', collisionMesh);
            rapierBody.type = 1; // Static
            rapierBody.gravityScale = 0;
            rapierBody.mass = 0;
            RE.addComponent(rapierBody);

            const rapierTrimesh = new RapierTrimesh('RapierTrimesh', collisionMesh);
            RE.addComponent(rapierTrimesh);
        } else {
            (collisionMesh as THREE.Mesh).geometry = scaledGeometry;
        }

        // Calculate world position
        const chunkCenterX = (chunkParams.startX + chunkParams.width / 2) - (RuntimeMapGen.get().heightmapSize.width / 2);
        const chunkCenterY = (chunkParams.startY + chunkParams.height / 2) - (RuntimeMapGen.get().heightmapSize.height / 2);
        const worldX = chunkCenterX * RuntimeMapGen.get().Scale.x + RuntimeMapGen.get().Offset.x;
        const worldZ = chunkCenterY * RuntimeMapGen.get().Scale.z + RuntimeMapGen.get().Offset.z;

        collisionMesh.position.set(worldX, RuntimeMapGen.get().Offset.y, worldZ);
        collisionMesh.scale.set(1, 1, 1);

        return collisionMesh;
    }




}
