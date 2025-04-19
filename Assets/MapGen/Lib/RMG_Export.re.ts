import * as RE from 'rogue-engine';
//import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";


export default class RMG_Export {


//  #region Terrain to Heightmap

  public static exportHeightmapBatched() {

        const heightData = RuntimeMapGen.get().heightData;
        const heightmapSize = RuntimeMapGen.get().heightmapSize;
        const tileSize = RuntimeMapGen.get().tile_Size;

        if (!heightData || !heightmapSize.width || !heightmapSize.height) {
            RE.Debug.log("Heightmap data not available.");
            return;
        }

        const width = heightmapSize.width;
        const height = heightmapSize.height;
        const numTilesX = Math.ceil(width / tileSize);
        const numTilesY = Math.ceil(height / tileSize);
        const tileCanvases: HTMLCanvasElement[] = [];

        // Process heightmap in tiles
        for (let tileY = 0; tileY < numTilesY; tileY++) {
            for (let tileX = 0; tileX < numTilesX; tileX++) {
                const tileWidth = Math.min(tileSize, width - tileX * tileSize);
                const tileHeight = Math.min(tileSize, height - tileY * tileSize);

                const tileCanvas = document.createElement('canvas');
                tileCanvas.width = tileWidth;
                tileCanvas.height = tileHeight;
                const tileCtx = tileCanvas.getContext('2d');

                if (!tileCtx) {
                    RE.Debug.log(`Failed to get canvas context for tile (${tileX}, ${tileY}).`);
                    return;
                }

                const tileImageData = tileCtx.createImageData(tileWidth, tileHeight);
                const tileData = tileImageData.data;

                for (let y = 0; y < tileHeight; y++) {
                    for (let x = 0; x < tileWidth; x++) {
                        const globalX = tileX * tileSize + x;
                        const globalY = tileY * tileSize + y;

                        if (globalY < height && globalX < width) {
                            const index = (globalY * width + globalX) * 4;
                            if (index < heightData.length) {
                                const heightValue = heightData[index]; // Get R channel (height)
                                const tileIndex = (y * tileWidth + x) * 4;
                                tileData[tileIndex] = heightValue;     // R
                                tileData[tileIndex + 1] = heightValue; // G
                                tileData[tileIndex + 2] = heightValue; // B
                                tileData[tileIndex + 3] = 255;         // A
                            }
                        }
                    }
                }

                tileCtx.putImageData(tileImageData, 0, 0);
                tileCanvases.push(tileCanvas);
            }
        }

        // Merge tiles
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext('2d');

        if (!finalCtx) {
            RE.Debug.log("Failed to get final canvas context.");
            // Free resources before exiting
            tileCanvases.forEach(canvas => {
                canvas.width = 0; // Clear content
                canvas.height = 0;
            });
            tileCanvases.length = 0; // Release array reference
            return;
        }

        let tileIndex = 0;
        for (let tileY = 0; tileY < numTilesY; tileY++) {
            for (let tileX = 0; tileX < numTilesX; tileX++) {
                const tileCanvas = tileCanvases[tileIndex++];
                const drawX = tileX * tileSize;
                const drawY = tileY * tileSize;
                finalCtx.drawImage(tileCanvas, drawX, drawY);
                // Free tile canvas resource immediately after use
                tileCanvas.width = 0;
                tileCanvas.height = 0;
            }
        }
        tileCanvases.length = 0; // Release the array holding tile canvases

        // Create downloadable PNG
        finalCanvas.toBlob((blob) => {
            if (!blob) {
                RE.Debug.log("Failed to create PNG blob from merged tiles.");
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `heightmap_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            // Free final canvas resource
            finalCanvas.width = 0;
            finalCanvas.height = 0;
        }, 'image/png');
    }



}
