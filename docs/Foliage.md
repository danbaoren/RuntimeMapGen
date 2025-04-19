# 🌿🪨️🌳 Foliage

![](C:\Users\maxignff\Desktop\Runtime%20MapGen%20Project\docs\showcase\showcase2.png)

---

## General Settings

* **`enableFoliage`**
  
  * Toggles the entire foliage system on or off. Can be toggled real-time.

---

## Foliage Groups

These lists define the actual objects (prefabs) to be placed as foliage. 

It extracts all geometry from prefab and makes separate instanced mesh for each geometry, so if prefab have multiple geometries it will spawn multiple instanced meshes. 

The system supports multiple groups for different types of foliage variants (e.g., trees, rocks, grass) with distinct settings.

* **`fPrefabsGroup_0`**
  
  * Holds the prefabs belonging to the first foliage group.

* **`fPrefabsGroup_1`**
  
  * Holds the prefabs belonging to the second foliage group.

* **`fPrefabsGroup_2`**
  
  * Holds the prefabs belonging to the third foliage group.

* **Note:** The system automatically detects new groups if added following the naming convention (e.g., `fPrefabsGroup_3`, `fPrefabsGroup_4`, etc.). Each group corresponds to an index in the settings lists below.

---

## Per-Group Placement Settings

These lists control placement parameters for each group. The index in each list corresponds to the foliage group number (e.g., index `0` applies to `fPrefabsGroup_0`). Default values assigned so its not nesseserary to adjust each variable.

* **`fDensities`**
  
  * Controls the density of foliage placement. Higher values result in more instances per unit area.

* **`fRotateWithTerrain`**
  
  * Determines if foliage should align their rotation to match the slope of the terrain underneath them.

* **`fUndergroundOffsets`**
  
  * Specifies a vertical offset. Negative values can help sink the base of foliage slightly into the ground.

* **`fIterations`**
  
  * Controls the number of placement attempts for generating foliage positions for each group. More iterations might lead to better distribution but increase computation time.

* **`fScaleMins`**
  
  * Defines the minimum end of the random scale range applied to foliage instances within each group.

* **`fScaleMaxs`**
  
  * Defines the maximum end of the random scale range applied to foliage instances within each group. Scale is randomized between `fScaleMins` and `fScaleMaxs`.

* **`fSlopeStart`**
  
  * Defines the minimum terrain slope angle (normalized, 0=flat, 1=vertical) allowed for placing foliage from each group.

* **`fSlopeEnd`**
  
  * Defines the maximum terrain slope angle (normalized) allowed for placing foliage from each group. Foliage only spawns on slopes between `fSlopeStart` and `fSlopeEnd`.

* **`fHeightMin`**
  
  * Defines the minimum world altitude (Y-coordinate) allowed for placing foliage from each group.

* **`fHeightMax`**
  
  * Defines the maximum world altitude (Y-coordinate) allowed for placing foliage from each group.

---

## Global Placement Settings

These settings apply globally to the foliage generation process.

* **`fSeed`**
  
  * The seed value for the random number generator during foliage placement. Using the same seed produces the same layout.

* **`fBatchSize`**
  
  * Controls the number of foliage instances processed/spawned in a single batch, managing performance.

* **`fSpawnDelay`**
  
  * The delay in ms between processing consecutive batches during foliage spawning, spreading the performance cost.

* **`fRemoveDelay`**
  
  * The delay in ms between processing consecutive batches when removing foliage.
