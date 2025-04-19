# ⚔️🧱 Collision

---

## Collision Coverage

Automatically generates collision meshes in a 3×3 grid around the camera. As the camera moves, old collision chunks are removed and new ones are generated ahead in the direction of movement. Ensures seamless coverage without overlap.

---

## Collision Generation

- **`RapierCollision`**
  
  - **Physics Engine Toggle:** Enables or disables collision generation using the Rapier physics engine. Turn off to remove all active collision meshes.

- **`collisionChunkSize`**
  
  - **Chunk Dimensions (World Units):** Defines the size of each collision chunk. Larger chunks increase generation time. Smaller chunks spawn faster but may lag behind rapid movement (e.g., flying).

- **`collider_Subdivision`**
  
  - **Mesh Grid Density:** Controls how finely the terrain mesh is subdivided before collision mesh creation. Higher values create smoother, more accurate collision surfaces. Should generally match `collisionChunkSize` for consistency.

- **`collider_TriangleSubdivisions`**
  
  - **Triangle Refinement Factor:** Further subdivides each terrain triangle to improve collision accuracy. A value of `1` creates a quad per triangle; `2` splits each into four smaller quads. Use higher values to reduce stretching and prevent physics artifacts (e.g., falling through gaps).

- **`VisualizeCollision`**
  
  - **Debug Rendering Toggle:** Enables visual display of the collision geometry. Useful for debugging and verifying collider alignment with visible terrain.

---
