import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re"; // Assuming this path is correct

@RE.registerComponent
export default class RMG_Gen extends RE.Component {
  
    /**
     * Generates a heightmap texture using Perlin noise and converts it to an HTMLImageElement.
     * This method is asynchronous and returns a Promise that resolves with the generated image.
     * The image is created directly from a canvas, making it an image-based element.
     * @returns {Promise<HTMLImageElement>} A Promise that resolves with the generated heightmap image.
     */
    static async generateHeightmapTexture(): Promise<HTMLImageElement> {
        // Get the RuntimeMapGen instance for configuration.
        // It is assumed that RuntimeMapGen.re contains all the `alg_` properties used below.
        const RMG = RuntimeMapGen.get();

        // Retrieve algorithmic parameters from the RuntimeMapGen instance
        const width = RMG.alg_Size.x;
        const height = RMG.alg_Size.y;
        const seed = RMG.alg_Seed;
        const scale = RMG.alg_Scale;
        const octaves = RMG.alg_Octaves;
        const persistence = RMG.alg_Persistence;
        const lacunarity = RMG.alg_Lacunarity;

        // Retrieve new parameters for enhanced terrain generation, with default fallbacks
        const warpStrength = RMG.alg_WarpStrength !== undefined ? RMG.alg_WarpStrength : 5;
        const mountainSharpness = RMG.alg_MountainSharpness !== undefined ? RMG.alg_MountainSharpness : 2.5;
        const mountainHeightMultiplier = RMG.alg_MountainHeight !== undefined ? RMG.alg_MountainHeight : 1.0;
        const valleyDepthMultiplier = RMG.alg_ValleyDepth !== undefined ? RMG.alg_ValleyDepth : 2.0;
        const valleyStrength = RMG.alg_ValleyStrength !== undefined ? RMG.alg_ValleyStrength : 0.5;
        const detailStrength = RMG.alg_DetailStrength !== undefined ? RMG.alg_DetailStrength : 0.2;
        const overallHeightMultiplier = RMG.alg_OverallHeightMultiplier !== undefined ? RMG.alg_OverallHeightMultiplier : 1.5;
        const heightCurvePower = RMG.alg_HeightCurvePower !== undefined ? RMG.alg_HeightCurvePower : 1.8;
        const seaLevel = RMG.alg_SeaLevel !== undefined ? RMG.alg_SeaLevel : 0.4;
        const beachHeightRange = RMG.alg_BeachHeight !== undefined ? RMG.alg_BeachHeight : 0.03;
        // Retrieve the new Y-range parameter. This now controls the normalized output range of the heightmap (0-1).
        // E.g., new THREE.Vector2(0.2, 0.8) would mean the heightmap values will span from 0.2 to 0.8.
        const yRange = RMG.alg_YRange !== undefined ? RMG.alg_YRange : new THREE.Vector2(0, 1);


        // Create a new Float32Array to hold the heightmap data (0-1 range)
        const heightmap = new Float32Array(width * height);

        // Initialize various noise functions with specific seeds and scales for distinct features
        // Base noise for large-scale continental shapes and overall terrain flow
        const baseNoise = createFractalNoise(seed, scale * 1.5, octaves + 2, persistence * 0.8, lacunarity * 0.8);
        // Ridge noise for sharp mountain peaks and defined ranges, mimicking geological uplift
        const mountainNoise = createRidgeNoise(seed + 1, scale * 0.8);
        // Fractal noise for generating depressions and valley systems
        const valleyNoise = createFractalNoise(seed + 2, scale * 1.2, octaves + 1, persistence * 0.6, lacunarity * 1.2);
        // High-frequency noise for adding fine surface details and natural roughness
        const detailNoise = createFractalNoise(seed + 3, scale * 0.2, octaves + 4, persistence * 0.5, lacunarity * 2.0);
        // Noise for domain warping offsets, creating organic, less grid-aligned shapes
        const warpX = createDomainWarpOffset(seed + 4, scale * 3);
        const warpY = createDomainWarpOffset(seed + 5, scale * 3);

        // Iterate through each pixel to calculate its elevation
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Apply domain warping to coordinates for more natural, flowing terrain contours
                const warpedX = x + warpX(x, y) * warpStrength;
                const warpedY = y + warpY(x, y) * warpStrength;

                // Start with a base elevation from the large-scale fractal noise
                let elevation = baseNoise(warpedX, warpedY); // Typically -1 to 1

                // Add distinct mountain features, exaggerating peaks with a power function
                // Ridge noise (0 to 1, with 1 at ridges) is powered to sharpen peaks
                const mountainContrib = Math.pow(mountainNoise(warpedX, warpedY), mountainSharpness) * mountainHeightMultiplier;
                elevation += mountainContrib;

                // Introduce valley features by subtracting an inverted and exaggerated noise value
                // Valley noise (-1 to 1) is normalized to 0-1, then inverted (1.0 - value) so lower noise means deeper valley.
                // This inverted value is then powered to exaggerate depth.
                const valleyContrib = Math.pow(1.0 - ((valleyNoise(warpedX, warpedY) + 1) / 2), valleyDepthMultiplier) * valleyStrength;
                elevation -= valleyContrib;

                // Add fine-grained detail to the entire terrain surface for realism
                elevation += detailNoise(warpedX, warpedY) * detailStrength;

                // Apply an overall height multiplier to stretch the range of the combined noise.
                // This is crucial for utilizing the full 0-1 range of the heightmap.
                elevation *= overallHeightMultiplier;

                // Define an assumed effective range for the combined noise.
                // These values are heuristic and might need tuning based on the specific noise parameters
                // to ensure the full 0-1 heightmap range is utilized without clipping.
                const minEffectiveHeight = -2.0; // Expected lowest combined noise value
                const maxEffectiveHeight = 2.0;  // Expected highest combined noise value

                // Remap the stretched elevation to a 0-1 range based on the effective height.
                // This ensures that the terrain spans the full heightmap range (0-255).
                let remappedElevation = (elevation - minEffectiveHeight) / (maxEffectiveHeight - minEffectiveHeight);

                // Apply the height curve power to this remapped 0-1 value.
                // If heightCurvePower > 1, it will make higher values even higher relative to lower values,
                // which helps in making mountains more distinct and less flat at the top.
                remappedElevation = Math.pow(remappedElevation, heightCurvePower);

                // Clamp to ensure values are strictly within 0 and 1 after all transformations.
                remappedElevation = Math.max(0, Math.min(1, remappedElevation));

                // Implement sea level and beach areas using the remapped and powered elevation
                let finalElevation = remappedElevation;
                if (finalElevation < seaLevel) {
                    // Ocean areas: Make the ocean floor relatively flat but with subtle depth variations
                    // Blend to create a slightly varied but mostly flat ocean, ensuring it doesn't go below 0.
                    finalElevation = seaLevel * 0.8 + finalElevation * 0.2;
                } else if (finalElevation < seaLevel + beachHeightRange) {
                    // Beach areas: Create a smooth, flatter transition zone from ocean to land.
                    // This prevents sharp cliffs directly at the waterline.
                    finalElevation = seaLevel + (finalElevation - seaLevel) * 0.5;
                }
                // Land areas above the beach will retain their calculated, detailed elevation.

                // Assign the final elevation value to the heightmap array
                // Scale the elevation to the user-defined normalized output Y range (yRange.x to yRange.y)
                let scaledElevation = yRange.x + finalElevation * (yRange.y - yRange.x);

                // Ensure the scaled elevation remains within the valid 0-1 range for the heightmap
                scaledElevation = Math.max(0, Math.min(1, scaledElevation));

                heightmap[y * width + x] = scaledElevation;
            }
        }

        // Create a new canvas element to draw the heightmap onto
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Get the 2D rendering context of the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Could not get 2D context for canvas");
            throw new Error("Failed to get 2D context for canvas.");
        }

        // Create an ImageData object from the canvas context with the specified dimensions
        const imageData = ctx.createImageData(width, height);

        // Copy the heightmap data to the ImageData object's data
        // Each elevation value (0-1) is mapped to a grayscale pixel (0-255)
        for (let i = 0; i < heightmap.length; i++) {
            const elevation = heightmap[i];
            const idx = i * 4; // Each pixel has 4 components (R, G, B, A)
            imageData.data[idx] = elevation * 255;     // Red channel
            imageData.data[idx + 1] = elevation * 255; // Green channel
            imageData.data[idx + 2] = elevation * 255; // Blue channel
            imageData.data[idx + 3] = 255;             // Alpha channel (fully opaque)
        }

        // Put the ImageData onto the canvas at position (0, 0)
        ctx.putImageData(imageData, 0, 0);

        // Convert the canvas content to a data URL (PNG format)
        const dataUrl = canvas.toDataURL('image/png');

        // Create a new HTMLImageElement to load the generated heightmap
        const img = new Image();

        // Return a promise that resolves when the image has successfully loaded
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = dataUrl; // Set the image source to the data URL
        });
    }
}

/**
 * Helper function to create fractal (FBM - Fractal Brownian Motion) noise.
 * This combines multiple octaves of Perlin noise to create complex, natural-looking patterns.
 * @param seed The seed for the Perlin noise generator.
 * @param scale The overall scale of the noise.
 * @param octaves The number of noise layers to combine.
 * @param persistence How much each successive octave contributes to the overall shape (amplitude decay).
 * @param lacunarity How much the frequency increases for each successive octave.
 * @returns A function that takes x, y coordinates and returns a normalized noise value.
 */
function createFractalNoise(seed: number, scale: number, octaves: number, persistence: number, lacunarity: number) {
    const noiseGen = new SeededPerlinNoise(seed);
    return (x: number, y: number) => {
        let amplitude = 1;
        let frequency = 1;
        let noiseHeight = 0;
        let totalAmplitude = 0; // Used for normalizing the final output

        for (let i = 0; i < octaves; i++) {
            const sampleX = x / scale * frequency;
            const sampleY = y / scale * frequency;
            const perlinValue = noiseGen.noise(sampleX, sampleY);
            noiseHeight += perlinValue * amplitude;

            totalAmplitude += amplitude; // Accumulate amplitude for normalization
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        // Normalize the noise height to roughly -1 to 1 based on total accumulated amplitude
        return noiseHeight / totalAmplitude;
    };
}

/**
 * Helper function to create ridge noise.
 * This type of noise is good for generating sharp, mountainous ridges.
 * It works by taking the absolute value of Perlin noise and inverting it,
 * pushing values towards higher peaks.
 * @param seed The seed for the Perlin noise generator.
 * @param scale The scale of the noise.
 * @returns A function that takes x, y coordinates and returns a noise value.
 */
function createRidgeNoise(seed: number, scale: number) {
    const noiseGen = new SeededPerlinNoise(seed);
    return (x: number, y: number) => {
        const sampleX = x / scale;
        const sampleY = y / scale;
        // Take the absolute value of Perlin noise (creates "ridges"), then invert (1.0 - abs)
        // to make the ridges positive and more pronounced.
        return 1.0 - Math.abs(noiseGen.noise(sampleX, sampleY));
    };
}

/**
 * Helper function to create domain warp offsets.
 * These offsets are used to distort the sampling coordinates of other noise functions,
 * leading to more organic, flowing, and less grid-aligned terrain features.
 * @param seed The seed for the Perlin noise generator.
 * @param scale The scale of the noise used for warping.
 * @returns A function that takes x, y coordinates and returns a noise value between -1 and 1.
 */
function createDomainWarpOffset(seed: number, scale: number) {
    const noiseGen = new SeededPerlinNoise(seed);
    return (x: number, y: number) => {
        const sampleX = x / scale;
        const sampleY = y / scale;
        return noiseGen.noise(sampleX, sampleY); // Returns a value between -1 and 1
    };
}

/**
 * A simple Perlin noise generator with a configurable seed.
 * This class provides 2D Perlin noise values, ensuring repeatable patterns
 * for a given seed, which is crucial for consistent terrain generation.
 */
class SeededPerlinNoise {
    private p: number[] = []; // Permutation table, used for hashing coordinates
    private seed: number;     // Seed for random number generation, ensures determinism

    /**
     * Initializes the Perlin noise generator with a given seed.
     * @param seed The seed value for the noise generator.
     */
    constructor(seed: number) {
        this.seed = seed;
        this.initPermutation();
    }

    /**
     * Initializes the permutation table using a seeded shuffle algorithm.
     * This ensures repeatable noise patterns for a given seed, making the terrain
     * generation deterministic.
     */
    private initPermutation() {
        // Initialize p with values from 0 to 255
        this.p = Array.from({ length: 256 }, (_, i) => i);

        // Use a custom seeded random number generator for shuffling the array
        const seededShuffle = (array: number[], currentSeed: number) => {
            let m = array.length, t, i;
            // While there remain elements to shuffle...
            while (m) {
                // Update the seed using a linear congruential generator (LCG)
                // This provides a pseudo-random number based on the current seed.
                currentSeed = (1664525 * currentSeed + 1013904223) % Math.pow(2, 32);
                // Pick a remaining element based on the new seed
                i = Math.floor((currentSeed / Math.pow(2, 32)) * m--);
                // And swap it with the current element.
                t = array[m];
                array[m] = array[i];
                array[i] = t;
            }
            return array;
        };

        this.p = seededShuffle(this.p, this.seed);
        // Duplicate the array for easier wrapping (p[256] == p[0], etc.)
        // This avoids modulo operations within the noise function for performance.
        this.p = this.p.concat(this.p);
    }

    /**
     * Applies a fade function to smooth interpolation.
     * This is the 6t^5 - 15t^4 + 10t^3 curve, which provides a smoother
     * interpolation than linear interpolation, reducing visual artifacts.
     * @param t The input value (0-1).
     * @returns The faded value.
     */
    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Linear interpolation function.
     * @param a The start value.
     * @param b The end value.
     * @param t The interpolation factor (0-1).
     * @returns The interpolated value.
     */
    private lerp(a: number, b: number, t: number): number {
        return (1 - t) * a + t * b;
    }

    /**
     * Calculates the gradient vector for a given hash and coordinates.
     * This maps a hash value from the permutation table to a 2D vector
     * used in Perlin noise to determine the influence of grid points.
     * @param hash The hash value from the permutation table.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     * @returns The dot product of the gradient vector and the distance vector.
     */
    private grad(hash: number, x: number, y: number): number {
        const h = hash & 15; // Get the last 4 bits of the hash to select a gradient direction
        // Select a gradient vector based on 'h'
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        // Calculate the dot product with appropriate signs based on 'h'
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * Generates a 2D Perlin noise value for given coordinates.
     * The output is typically between -1 and 1.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     * @returns The Perlin noise value.
     */
    noise(x: number, y: number): number {
        // Determine unit cube coordinates and wrap them to 0-255 using bitwise AND
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;

        // Determine fractions within unit cube
        x -= Math.floor(x);
        y -= Math.floor(y);

        // Apply fade function to coordinates to smooth interpolation
        let u = this.fade(x);
        let v = this.fade(y);

        // Hash coordinates of the 4 corners of the unit square
        let A = this.p[X] + Y;
        let B = this.p[X + 1] + Y;

        // Interpolate between the 4 gradient values at the corners
        // The `grad` function calculates the dot product of the gradient vector
        // and the distance vector from the corner.
        return this.lerp(
            this.lerp(this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y), u),
            this.lerp(this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1), u),
            v
        );
    }
}
