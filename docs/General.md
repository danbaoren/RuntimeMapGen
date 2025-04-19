# 🛠️⚙️ General

---

## Heightmap Settings

* **`heightmapTexture`**
  
  * **Override Path (Testing Only):** Allows overriding the default `StaticPath` with a custom heightmap image for development/testing. Remove this override in production.

* **`HeightmapStaticPath`**
  
  * **Static Folder Source:** Loads the heightmap directly from the project's Static folder. Best for production builds where the map is fixed.

---

## Terrain Transformations

* **`Scale, Offset, Rotation`**
  * Apply real-time adjustments to the terrain’s size (`Scale`), position (`Offset`), and orientation (`Rotation`).

---

## Lighting

* **`Light`**
  * **Lighting Reference:** Assign a light source (e.g., SUNLIGHT) so terrain shading reacts correctly to time-of-day changes.

---

## Chunk Processing

* **`Concurrent_Chunks`**
  
  * **Chunk Processing Batch Size:** Number of chunk geometries processed in parallel. Higher values increase speed but may spike resource usage.

* **`next_Chunk_ms`**
  
  * **Chunk Processing Delay:** Milliseconds to wait between processing batches of chunks. Helps spread computation to avoid frame drops.

---

## Chunk and Tile Configuration

* **`chunk_Size`**
  
  * **Geometry Generation Area:** Side length (world units) of each chunk. Larger chunks take longer to generate; smaller chunks increase scene' object count.

* **`tile_Size`**
  
  * **Heightmap Sampling Block:** Number of heightmap pixels fetched per operation. Larger tiles mean fewer, slower fetches; smaller tiles mean more, faster fetches with higher overhead.

---

## Level of Detail (LOD) and Rendering

* **`LOD_Quality`**
  
  * **Level-of-Detail Factor:** Controls distant terrain simplification (e.g., 1 = full detail, 5 = five times fewer vertices).

* **`high_RenderDistance`**
  
  * **High-Detail Radius:** Distance (in chunks) from the camera within which terrain renders at full detail.

* **`low_RenderDistance`**
  
  * **Low-Detail Radius:** Distance (in chunks) from the camera within which terrain renders at reduced detail.

* **`Terrain_Smoothness`**
  
  * **Height Sampling Precision:** Controls how heightmap pixels are sampled (0 = reads every pixel, higher values skip/average for smoother results).

* **`clip_Height`**
  
  * **Shader Clipping Plane:** World-space height below which the GPU discards terrain polygons (geometry remains but isn't rendered).

---

## Camera and Occlusion Settings

* **`priority_UpdateInterval`**
  
  * **Focus Chunk Refresh:** Milliseconds between updates for chunks infront of the camera. 

* **`backfaceCullingAngle`**
  
  * **Behind-Camera Unload Angle:** Angle (degrees) behind the camera's view frustum at which chunks are unloaded.

* **`occlusionAngleThreshold`**
  
  * **Frustum Occlusion Angle:** Angle from the camera’s forward direction within which chunks are checked for occlusion (being hidden by other terrain).

* **`DeactivationDelay`**
  
  * **Behind-Camera Delay:** Milliseconds to wait before deactivating (hiding) chunks that move behind the camera.

* **`occlusionOffset`**
  
  * **Occlusion Start Distance:** Distance behind the camera at which occlusion calculations begin.

---

## Cache Management

* **`maxCacheSize`**
  
  * **Maximum Cached Chunks:** The maximum number of chunk meshes kept in memory. Least-recently-used chunks are removed first when the limit is reached.

* **`cacheCleanupInterval`**
  
  * **Cache Sweep Delay:** Milliseconds between automatic cleanups of unused cached chunks.

* **`deletionConcurrency`**
  
  * **Concurrent Deletions:** Number of chunks removed from the scene simultaneously during cleanup.

* **`deletionBatchDelay`**
  
  * **Deletion Batch Interval:** Milliseconds between batches of chunk removals during cleanup to avoid performance spikes.
