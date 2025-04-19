# 🧭🗺️ Navigation & Minimap

---

## Map Display

- **`EnableMinimap`**
  
  - **Overlay and Fullscreen Toggle:** Enables or disables the rendering of both the minimap overlay and the full-screen map (accessible via **M** key).

- **`minimapPosition`**
  
  - **UI Anchor Point:** Defines the screen corner where the minimap appears. Options include:
    - `top-left`
    - `top-right`
    - `bottom-left`
    - `bottom-right`

---

## Terrain Visualization

- **`oceanLevel`**
  
  - **Water Height Threshold:** Normalized height (0 to 1) at which ocean or water surfaces are rendered.

- **`beachRange`**
  
  - **Beach Gradient Thickness:** Range (starting from `oceanLevel`) in which beach textures appear. Controls transition from water to land.

- **`grassMin`**
  
  - **Grass Start Height:** Normalized elevation above `beachRange` where grass textures begin.

- **`STONE_SLOPE`**
  
  - **Slope Texture Threshold:** Steepness angle beyond which terrain is textured as stone. Prevents grass/sand on vertical or steep inclines.

- **`terrainMaxHeight`**
  
  - **Heightmap Gradient Cap:** Sets the maximum normalized height used for remapping terrain colors. Affects how elevation-based gradients stretch across the map.

---

## Map Interaction

- **`[Debug]_refresh_map`**
  
  - **Manual Minimap Regeneration:** Regenerates the minimap image using current parameters. Useful for testing terrain color or texture settings in-editor.

- **Minimap Movement**
  
  - **Draggable UI:** Click and drag the minimap to reposition it freely on the screen (does not affect full-screen map behavior).

- **Fullscreen Map**
  
  - **Access Key:** Press **M** to toggle the full-screen map. Hovering shows location previews (note: world and map coordinates may differ due to different centering).

---
