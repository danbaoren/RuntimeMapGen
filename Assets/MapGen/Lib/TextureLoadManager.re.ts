import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

export default class TextureLoadManager {
    private static ktx2Loader: any;
    private static textureLoader: THREE.TextureLoader;
    private static initialized = false;

    public static async initialize() {
        if (!this.initialized) {
            this.ktx2Loader = new KTX2Loader().detectSupport(RE.Runtime.renderer);
            const BasisPath = RE.getStaticPath(RuntimeMapGen.get().ktx2_Transcoder);
            this.ktx2Loader.setTranscoderPath(BasisPath);
            this.textureLoader = new THREE.TextureLoader();
            this.initialized = true;
        }
    }

    private static async loadRegularTexture(basePathWithoutExtension: string): Promise<THREE.Texture | null> {
        const popularFormats = ['.png', '.jpg', '.jpeg'];
        for (const format of popularFormats) {
            try {
                const regularPath = RE.getStaticPath(basePathWithoutExtension + format);
                const texture = await this.textureLoader!.loadAsync(regularPath);
                console.log(`Successfully loaded texture: ${regularPath}`);
                return texture;
            } catch (error) {
                console.warn(`Failed to load texture: ${basePathWithoutExtension}${format}. Error: ${error}`);
            }
        }
        console.error(`Failed to load any fallback texture for: ${basePathWithoutExtension}`);
        return null;
    }

    static async loadTexture(textureProp: THREE.Texture | null, ktx2Path: string): Promise<THREE.Texture | null> {
        await this.initialize();

        if (textureProp) {
            return textureProp;
        }

        try {
            const ktx2FullPath = RE.getStaticPath(ktx2Path);
            return await this.ktx2Loader!.loadAsync(ktx2FullPath);
        } catch (error: any) {
            console.warn(
                `Failed to load KTX2 texture ${ktx2Path} due to error: ${error?.message || error}. ` +
                `Falling back to popular image formats.`
            );
            const basePathWithoutExtension = ktx2Path.replace('.ktx2', '');
            return await this.loadRegularTexture(basePathWithoutExtension);
        }
    }
}

