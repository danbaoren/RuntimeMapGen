# Procedural Terrain Filters

Imported heightmaps can sometimes lack close-range detail, appearing flat and unrealistic. Procedural filters address this by simulating natural effects like erosion, ridges, valleys, and plateaus, or by adding custom fractal noise.

## Performance Considerations

- **Load Time:** Enabling filters increases the initial map loading time as geometry is generated upfront. However, once loaded, there should be no performance lag during runtime.
- **Exporting:** To mitigate slow load times in production, you can export the generated terrain to a new heightmap image using the dedicated export button. This process supports large dimensions (tested up to 15,000 x 10,000 pixels) and typically takes less than a minute.
- **Production Workflow:** Remember to disable all procedural filters in your final build after exporting the heightmap to avoid unnecessary load time increases.

## Workflow & Customization

- **Combining Filters:** Multiple filters can be active simultaneously to achieve complex results.
- **Iterating Filters:** Applying filters multiple times can create unique and interesting variations on the original heightmap. To do this:
  1. Apply the desired filter(s).
  2. Export the resulting terrain to a heightmap image.
  3. Import this new heightmap.
  4. Apply further filters as needed.

## Filter Render Priority

Filters are applied in the following order:

1. Fractal
2. Coastal Erosion
3. Ridges
4. Erosion
5. Plateaus
6. Valleys
7. Terracing
8. Cliff

## Utility Functions

- **[EXPORT] Terrain to Heightmap:** Exports the currently loaded terrain geometry into an image heightmap. The process is batched/tiled for efficiency and supports large-scale terrains.
- **[REFRESH] Regenerate Terrain:** Completely removes the current terrain from the scene and regenerates it based on the current settings. This is useful for quickly experimenting with different filter combinations.

---

# Fractal

Adds fractal noise for detail.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/fractalb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/fractala.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Coastal Erosion

Simulates erosion effects typically found along coastlines.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/coastalb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/coastala.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Ridges

Creates ridges across the terrain.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/ridgesb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/ridgesa.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Erosion

Smooths the terrain overall. Useful for blending results after multiple filter iterations.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/erosionb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/erosiona.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Plateaus

Creates flat-topped elevated areas. Iterate a few times at different heights to create classic Caribbean-style terrain.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/plateausb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/plateausa.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Valleys

Carves valleys into the terrain.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/valleysb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/valleysa.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Terracing

Creates step-like terraces, similar to mesas.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/terracingb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/terracinga.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>

# Cliff

Generates steep cliff faces.

<div style="display: flex; gap: 40px; justify-content: center; flex-wrap: wrap; text-align: center;">
  <div>
    <h6>Before</h6>
    <img src="./pf/cliffb.png" alt="Before" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
  <div>
    <h6>After</h6>
    <img src="./pf/cliffa.png" alt="After" style="width:100%; max-width:700px; height:auto; display:block; margin:0 auto;">
  </div>
</div>
