import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RuntimeMapGen from "./RuntimeMapGen.re";


// #region Shader


export default class RMG_Shader {


    static vertexShader = `
#include <common>
#include <shadowmap_pars_vertex>
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
uniform float uvOffsetScale;
uniform float uvRotationScale;
uniform vec2 overallUvOffset;
uniform float overallUvRotation;

// Simple pseudo-random number generator
float pseudoRand(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // Generate a random offset and rotation based on vertex position
    vec2 randomVec = vec2(pseudoRand(position.xy * 10.0), pseudoRand(position.yz * 10.0));
    float randomRotation = pseudoRand(position.xz * 10.0) * 3.14159 * uvRotationScale;

    // Cache trigonometric evaluations for random rotation
    float cosRandom = cos(randomRotation);
    float sinRandom = sin(randomRotation);

    vec2 uvOffset = randomVec * uvOffsetScale;

    // Apply random rotation (caching rotated UV)
    vec2 rotatedUVRandom = vec2(
        uv.x * cosRandom - uv.y * sinRandom,
        uv.x * sinRandom + uv.y * cosRandom
    );

    vec2 finalUV = rotatedUVRandom + uvOffset;

    // Cache overall rotation sin and cosine
    float cosOverall = cos(overallUvRotation);
    float sinOverall = sin(overallUvRotation);

    vec2 center = vec2(0.5, 0.5); // Center of the UV space
    vec2 centeredUV = finalUV - center;
    vec2 rotatedUVOverall = vec2(
        centeredUV.x * cosOverall - centeredUV.y * sinOverall,
        centeredUV.x * sinOverall + centeredUV.y * cosOverall
    ) + center;

    // Apply overall offset
    vUv = rotatedUVOverall + overallUvOffset;

    // Cache positions and matrix multiplication calculations
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    mat3 normalMatrixWorld = transpose(inverse(mat3(modelMatrix)));
    vWorldNormal = normalize(normalMatrixWorld * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
}`;

    static fragmentShader = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform sampler2D sandTexture;
uniform sampler2D grassTexture;
uniform sampler2D stoneTexture;
uniform sampler2D dirtTexture;
uniform sampler2D snowTexture;
uniform sampler2D aoTexture;
uniform sampler2D heightmapTexture;
uniform float sandRepeat;
uniform float grassRepeat;
uniform float stoneRepeat;
uniform float dirtRepeat;
uniform float snowRepeat;
uniform float maxHeight;
uniform float roughness;
uniform float metalness;
uniform vec3 ambientColor;
uniform float diffuseIntensity;
uniform float specularIntensity;
uniform float envMapIntensity;
uniform float aoIntensity;
uniform float clippingHeight;
uniform float cameraDistanceFactor;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float fogHeightMin;
uniform float fogHeightMax;
uniform float fogDensity;
uniform vec2 gradientSeed;
uniform vec2 heightmapSize;
uniform vec3 terrainScale;
uniform vec3 terrainOffset;
uniform float sandSlopeStart;
uniform float sandSlopeEnd;
uniform float beachHeight;
uniform float grassSlopeStart;
uniform float grassSlopeEnd;
uniform float stoneSlopeStart;
uniform float stoneSlopeEnd;
uniform float stoneSlopeIntensity;
uniform float dirtSlopeStart;
uniform float dirtSlopeEnd;
uniform float dirtHeightStart;
uniform float dirtHeightEnd;
uniform float snowSlopeStart;
uniform float snowSlopeEnd;
uniform float snowHeightStart;
uniform float snowHeightEnd;
uniform float snowBlendSmoothness;
uniform vec3 uSunlightDirection;
uniform vec3 uSunlightColor;
uniform float uSunlightIntensity;
uniform vec3 uSkyColor;
uniform vec3 uGroundColor;
uniform float uHemisphereIntensity;
uniform float BackcullingShader;
uniform vec2 overallUvOffset;
uniform float overallUvRotation;
uniform float grassStoneInfluenceFactor;
uniform vec2 dirtBetweenFactor;
uniform float blendFactor;
uniform float blendFrequency;
uniform float blendAmplitude;
uniform float blendSharpness;
uniform float blobInfluence;
uniform float blobDensity;
uniform float blobScale;
uniform float blobGrassOnStone;
uniform float blobDirtOnStone;
uniform float blobDirtOnGrass;
uniform float textureScaleClose;
uniform float textureScaleMid;
uniform float textureScaleCloseDistance;
uniform float textureScaleMidDistance;

// Add new uniforms for octave noise
uniform float octaveScale;
uniform float octaveIntensity;
uniform float octaveOctaves;
uniform float octavePersistence;
uniform float octaveLacunarity;
uniform float octaveSeed;

uniform float borderNoiseScale;
uniform float borderNoiseIntensity;
uniform float borderNoiseOctaves;
uniform float borderNoisePersistence;
uniform float borderNoiseLacunarity;
uniform float borderNoiseSeed;

uniform vec3 sandColorFilter;
uniform vec3 grassColorFilter;
uniform vec3 stoneColorFilter;
uniform vec3 dirtColorFilter;
uniform vec3 snowColorFilter;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

// Required utility functions
float hash3D(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.xyz, p.yzx + 19.19);
    return fract(p.x * p.y * p.z);
}

float valueNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash3D(i);
    float b = hash3D(i + vec3(1.0, 0.0, 0.0));
    float c = hash3D(i + vec3(0.0, 1.0, 0.0));
    float d = hash3D(i + vec3(1.0, 1.0, 0.0));
    float e = hash3D(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash3D(i + vec3(1.0, 0.0, 1.0));
    float g = hash3D(i + vec3(0.0, 1.0, 1.0));
    float h = hash3D(i + vec3(1.0, 1.0, 1.0));

    float k0 = a;
    float k1 = b - a;
    float k2 = c - a;
    float k3 = e - a;
    float k4 = a - b - c + d;
    float k5 = a - c - e + g;
    float k6 = a - b - e + f1;
    float k7 = -a + b + c - d + e - f1 - g + h;

    return k0 + k1 * f.x + k2 * f.y + k3 * f.z + k4 * f.x * f.y + k5 * f.y * f.z + k6 * f.z * f.x + k7 * f.x * f.y * f.z;
}

float octaveNoise(vec3 p) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;
    
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= octaveOctaves) break;
        total += valueNoise3D((p * frequency + octaveSeed)) * amplitude;
        maxValue += amplitude;
        amplitude *= octavePersistence;
        frequency *= octaveLacunarity;
    }
    
    return total / maxValue;
}

// Border noise function
float getBorderNoise(vec3 worldPos) {
    vec3 noiseInput = worldPos / borderNoiseScale;
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;
    
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= borderNoiseOctaves) break;
        total += valueNoise3D((noiseInput * frequency + borderNoiseSeed)) * amplitude;
        maxValue += amplitude;
        amplitude *= borderNoisePersistence;
        frequency *= borderNoiseLacunarity;
    }
    
    return (total / maxValue) * borderNoiseIntensity;
}

// Modified weight calculation function
float calculateTextureWeight(float baseWeight, vec3 worldPos) {
    float noiseValue = octaveNoise(worldPos / octaveScale);
    float borderNoise = getBorderNoise(worldPos);
    
    // Combine the base weight with both types of noise
    float noisyWeight = baseWeight * (1.0 + noiseValue * octaveIntensity);
    noisyWeight = noisyWeight * (1.0 + borderNoise);
    
    // Add extra noise to the transition boundaries
    float transitionNoise = borderNoise * step(0.1, baseWeight) * step(baseWeight, 0.9);
    noisyWeight += transitionNoise;
    
    return clamp(noisyWeight, 0.0, 1.0);
}

vec4 triplanarSample(sampler2D tex, vec3 pos, float repeat, float distanceFactor) {
    vec2 uvX = pos.yz * repeat;
    vec2 uvY = pos.xz * repeat;
    vec2 uvZ = pos.xy * repeat;
    float lodBias = clamp(distanceFactor * 0.5, 0.0, 4.0);
    vec3 blending = pow(abs(vWorldNormal), vec3(4.0));
    blending /= dot(blending, vec3(1.0));
    vec4 texX = textureLod(tex, uvX, lodBias);
    vec4 texY = textureLod(tex, uvY, lodBias);
    vec4 texZ = textureLod(tex, uvZ, lodBias);
    return texX * blending.x + texY * blending.y + texZ * blending.z;
}

float D_GGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = 3.14159 * denom * denom;
    return a2 / denom;
}

float G_Smith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0) + 0.0001;
    float NdotL = max(dot(N, L), 0.0) + 0.0001;
    float a = roughness;
    float a2 = a * a;
    float lambdaV = NdotL * sqrt((-NdotV * a2 + NdotV) * NdotV + a2);
    float lambdaL = NdotV * sqrt((-NdotL * a2 + NdotL) * NdotL + a2);
    return 0.5 / max(lambdaV + NdotV, lambdaL + NdotL);
}

vec3 F_Schlick(float cosTheta, vec3 F0) {
    return F0 + (vec3(1.0) - F0) * pow(1.0 - cosTheta, 5.0);
}

float getBlobWeight(vec3 worldPosition) {
    vec2 noiseInput = vec2(worldPosition.x * blobDensity, worldPosition.z * blobDensity);
    float noiseValue = valueNoise3D(vec3(noiseInput, 0.0));
    float blob = smoothstep(0.0, blobScale, abs(noiseValue));
    return blob * blobInfluence;
}

void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float dotProduct = dot(vWorldNormal, viewDirection);
    float backcullingAngleRadians = BackcullingShader * 3.14159 / 180.0;
    if (dotProduct < cos(backcullingAngleRadians)) {
        discard;
    }

    float distanceToCamera = length(cameraPosition - vWorldPosition);
    float lodFactor = clamp(distanceToCamera * cameraDistanceFactor, 0.0, 8.0);
    float textureScale = distanceToCamera < textureScaleMidDistance ? textureScaleMid : 1.0;
    if (distanceToCamera < textureScaleCloseDistance) {
        textureScale = textureScaleClose;
    }
    if (vWorldPosition.y < clippingHeight) {
        discard;
    }

    float h = clamp(vPosition.y / maxHeight, 0.0, 1.0);
    float slope = 1.0 - dot(normalize(vWorldNormal), vec3(0.0, 1.0, 0.0));

    // Calculate base weights with octave noise influence
    float sandH = max(1.0 - smoothstep(0.2, 0.4, h), step(vPosition.y, beachHeight));
    float sandS = 1.0 - smoothstep(sandSlopeStart, sandSlopeEnd, slope);
    float sandWeight = calculateTextureWeight(sandH * sandS, vWorldPosition);

    float grassH = smoothstep(0.2, 0.6, h) * (1.0 - smoothstep(0.7, 0.9, h));
    float grassS = 1.0 - smoothstep(grassSlopeStart, grassSlopeEnd, slope);
    float grassWeight = calculateTextureWeight(grassH * grassS * step(beachHeight, vPosition.y), vWorldPosition);

    float slopeStoneFactor = smoothstep(stoneSlopeStart, stoneSlopeEnd, slope) * stoneSlopeIntensity;
    float stoneWeight = calculateTextureWeight(clamp(1.0 - (sandWeight + grassWeight) + slopeStoneFactor, 0.0, 1.0), vWorldPosition);

    float dirtH = smoothstep(dirtHeightStart, dirtHeightEnd, h);
    float dirtS = smoothstep(dirtSlopeStart, dirtSlopeEnd, slope);
    float grassStoneInfluence = grassWeight * stoneWeight * grassStoneInfluenceFactor;
    float dirtBetweenFactorValue = smoothstep(dirtBetweenFactor.x, dirtBetweenFactor.y, grassStoneInfluence);
    float dirtWeight = calculateTextureWeight(dirtH * dirtS * dirtBetweenFactorValue * step(beachHeight, vPosition.y), vWorldPosition);

    float snowH = smoothstep(snowHeightStart, snowHeightEnd, h);
    float snowS = smoothstep(snowSlopeStart, snowSlopeEnd, slope);
    float snowWeight = calculateTextureWeight(
        snowH * snowS * (1.0 - sandWeight * 0.3) * (1.0 - grassWeight * 0.3) * 
        (1.0 - stoneWeight * 0.2) * (1.0 - dirtWeight * 0.5),
        vWorldPosition
    );

    // Normalize weights
    float totalWeight = sandWeight + grassWeight + stoneWeight + dirtWeight + snowWeight;
    sandWeight /= totalWeight;
    grassWeight /= totalWeight;
    stoneWeight /= totalWeight;
    dirtWeight /= totalWeight;
    snowWeight /= totalWeight;

    // Sample textures with color filters
    vec4 sandColor = triplanarSample(sandTexture, vPosition, sandRepeat * textureScale, lodFactor) * vec4(sandColorFilter, 1.0);
    vec4 grassColor = triplanarSample(grassTexture, vPosition, grassRepeat * textureScale, lodFactor) * vec4(grassColorFilter, 1.0);
    vec4 stoneColor = triplanarSample(stoneTexture, vPosition, stoneRepeat * textureScale, lodFactor) * vec4(stoneColorFilter, 1.0);
    vec4 dirtColor = triplanarSample(dirtTexture, vPosition, dirtRepeat * textureScale, lodFactor) * vec4(dirtColorFilter, 1.0);
    vec4 snowColor = triplanarSample(snowTexture, vPosition, snowRepeat * textureScale, lodFactor) * vec4(snowColorFilter, 1.0);

    // Blend colors
    vec4 baseColor = sandColor * sandWeight +
                    grassColor * grassWeight +
                    stoneColor * stoneWeight +
                    dirtColor * dirtWeight +
                    snowColor * snowWeight;

    // Apply blob weights
    float blobWeight = getBlobWeight(vWorldPosition);
    float grassOnStoneWeight = blobWeight * stoneWeight * blobGrassOnStone;
    float dirtOnStoneWeight = blobWeight * stoneWeight * blobDirtOnStone;
    float dirtOnGrassWeight = blobWeight * grassWeight * blobDirtOnGrass;

    if (grassOnStoneWeight > 0.0) {
        baseColor = mix(baseColor, grassColor, grassOnStoneWeight);
    }
    if (dirtOnStoneWeight > 0.0) {
        baseColor = mix(baseColor, dirtColor, dirtOnStoneWeight);
    }
    if (dirtOnGrassWeight > 0.0) {
        baseColor = mix(baseColor, dirtColor, dirtOnGrassWeight);
    }

    vec3 albedo = baseColor.rgb;
    vec3 lightDir = normalize(uSunlightDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(lightDir + viewDir);

    vec3 upDirection = vec3(0.0, 1.0, 0.0);
    float skyFactor = max(dot(vWorldNormal, upDirection), 0.0);
    vec3 hemisphereLight = mix(uGroundColor, uSkyColor, skyFactor) * uHemisphereIntensity;
    float NdotL = max(dot(vWorldNormal, lightDir), 0.0);
    vec3 directLightColor = uSunlightColor * uSunlightIntensity;
    vec3 diffuse = diffuseIntensity * directLightColor * albedo * NdotL;

    float alpha = roughness * roughness;
    vec3 F0 = mix(vec3(0.04), albedo, metalness);
    float NdotV = max(dot(vWorldNormal, viewDir), 0.0);
    float NdotH = max(dot(vWorldNormal, halfDir), 0.0);
    float VdotH = max(dot(viewDir, halfDir), 0.0);
    float D = D_GGX(vWorldNormal, halfDir, roughness);
    float G = G_Smith(vWorldNormal, viewDir, lightDir, roughness);
    vec3 F = F_Schlick(VdotH, F0);
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = specularIntensity * (numerator / denominator) * directLightColor;

    float aoFactor = textureLod(aoTexture, vUv, lodFactor).r;
    aoFactor = mix(1.0, aoFactor, aoIntensity);

    float fogFactor = 0.0;
    if (fogFar > fogNear) {
        float fogDistance = clamp((distanceToCamera - fogNear) / (fogFar - fogNear), 0.0, 1.0);
        float heightFactor = 1.0 - smoothstep(fogHeightMin, fogHeightMax, vWorldPosition.y);
        fogFactor = fogDistance * heightFactor;
        fogFactor = 1.0 - exp(-fogDensity * fogFactor * distanceToCamera);
    }
    fogFactor = clamp(fogFactor, 0.0, 1.0);

    vec3 finalColor = mix(albedo, fogColor, fogFactor);

    float shadow = 1.0;
    #ifdef USE_SHADOWMAP
        DirectionalLightShadow directionalShadow = directionalLightShadows[0];
        shadow = getShadow(
            directionalShadowMap[0],
            directionalShadow.shadowMapSize,
            directionalShadow.shadowBias,
            directionalShadow.shadowRadius,
            vDirectionalShadowCoord[0]
        );
    #endif

    finalColor = finalColor * (hemisphereLight + ambientColor * envMapIntensity + diffuse * shadow) + specular * shadow;
    finalColor *= aoFactor;
    gl_FragColor = vec4(finalColor, 1.0);
}`;

    static async createMaterial(isHighDetail: boolean = false): Promise<THREE.ShaderMaterial> {
        if (!RuntimeMapGen.get().Light) {
            RuntimeMapGen.get().Light = new THREE.DirectionalLight(0xffffff, 1); // You can adjust color and intensity
            RuntimeMapGen.get().Light.name = 'Terrain_Light';
            // You might want to set its position as well, e.g.,
            RuntimeMapGen.get().Light.position.set(1, 1, 1);
            // If your scene exists at this point, you might also want to add it to the scene:
            // RuntimeMapGen.get().scene.add(RuntimeMapGen.get().Light);
            console.log('Terrain_Light created as no light was set.');
        }

        const textureScaleMultiplier = isHighDetail ? RuntimeMapGen.get().HighDetailFactor : RuntimeMapGen.get().LowDetailFactor;
        const sunLight = RuntimeMapGen.get().Light as THREE.DirectionalLight;

        // Ensure all textures are loaded
        const requiredTextures = [
            RuntimeMapGen.get().sandTexture,
            RuntimeMapGen.get().grassTexture,
            RuntimeMapGen.get().stoneTexture,
            RuntimeMapGen.get().dirtTexture,
            RuntimeMapGen.get().snowTexture
        ];

        // Check if any required textures are missing
        const missingTextures = requiredTextures.some(texture => !texture);
        if (missingTextures) {
            console.warn('Some textures failed to load, attempting to reload...');
            await RuntimeMapGen.get().loadAllTextures();
        }

        const material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: THREE.UniformsUtils.merge([
              THREE.UniformsLib.common,
              THREE.UniformsLib.specularmap,
              THREE.UniformsLib.envmap,
              THREE.UniformsLib.aomap,
              THREE.UniformsLib.lightmap,
              THREE.UniformsLib.emissivemap,
              THREE.UniformsLib.bumpmap,
              THREE.UniformsLib.normalmap,
              THREE.UniformsLib.displacementmap,
              THREE.UniformsLib.gradientmap,
              THREE.UniformsLib.fog,
              THREE.UniformsLib.lights,
                {
                    uSunlightDirection: { value: sunLight.position},
                    uSunlightColor: { value: sunLight.color },
                    uSunlightIntensity: { value: sunLight.intensity },
                    clippingHeight: { value: RuntimeMapGen.get().clip_Height },
                    sandTexture: { value: RuntimeMapGen.get().sandTexture || new THREE.Texture() },
                    grassTexture: { value: RuntimeMapGen.get().grassTexture || new THREE.Texture() },
                    stoneTexture: { value: RuntimeMapGen.get().stoneTexture || new THREE.Texture() },
                    dirtTexture: { value: RuntimeMapGen.get().dirtTexture || new THREE.Texture() },
                    snowTexture: { value: RuntimeMapGen.get().snowTexture || new THREE.Texture() },
                    aoIntensity: { value: RuntimeMapGen.get().AOintensity },
                    sandRepeat: { value: RuntimeMapGen.get().sandScale * textureScaleMultiplier },
                    grassRepeat: { value: RuntimeMapGen.get().grassScale * textureScaleMultiplier },
                    stoneRepeat: { value: RuntimeMapGen.get().stoneScale * textureScaleMultiplier },
                    dirtRepeat: { value: RuntimeMapGen.get().dirtScale * textureScaleMultiplier },
                    snowRepeat: { value: RuntimeMapGen.get().snowScale * textureScaleMultiplier },
                    maxHeight: { value: RuntimeMapGen.get().maxHeight },
                    roughness: { value: RuntimeMapGen.get().roughness },
                    metalness: { value: RuntimeMapGen.get().metalness },
                    ambientColor: { value: RuntimeMapGen.get().ambientColor },
                    diffuseIntensity: { value: RuntimeMapGen.get().diffuseIntensity },
                    specularIntensity: { value: RuntimeMapGen.get().specularIntensity },
                    envMapIntensity: { value: RuntimeMapGen.get().envMapIntensity },
                    fogNear: { value: RuntimeMapGen.get().fogNear },
                    fogFar: { value: RuntimeMapGen.get().fogFar },
                    fogHeightMin: { value: RuntimeMapGen.get().fogHeightMin },
                    fogHeightMax: { value: RuntimeMapGen.get().fogHeightMax },
                    fogDensity: { value: RuntimeMapGen.get().fogDensity },
                    gradientSeed: { value: new THREE.Vector2(Math.random(), Math.random()) },
                    blendSmoothness: { value: RuntimeMapGen.get().blendSmoothness },
                    uvOffsetScale: { value: 0.1 },
                    uvRotationScale: { value: 0.4 },
                    cameraDistanceFactor: { value: isHighDetail ? RuntimeMapGen.get().HighDetailFactor * 1000 : RuntimeMapGen.get().LowDetailFactor * 1000 }, // Adjust factor as needed
                    sandSlopeStart: { value: RuntimeMapGen.get().sandSlopeStart },
                    sandSlopeEnd: { value: RuntimeMapGen.get().sandSlopeEnd },
                    grassSlopeStart: { value: RuntimeMapGen.get().grassSlopeStart },
                    grassSlopeEnd: { value: RuntimeMapGen.get().grassSlopeEnd },
                    stoneSlopeStart: { value: RuntimeMapGen.get().stoneSlopeStart },
                    stoneSlopeEnd: { value: RuntimeMapGen.get().stoneSlopeEnd },
                    stoneSlopeIntensity: { value: RuntimeMapGen.get().stoneSlopeIntensity },
                    dirtSlopeStart: { value: RuntimeMapGen.get().dirtSlopeStart },
                    dirtSlopeEnd: { value: RuntimeMapGen.get().dirtSlopeEnd },
                    dirtHeightStart: { value: RuntimeMapGen.get().dirtHeightStart },
                    dirtHeightEnd: { value: RuntimeMapGen.get().dirtHeightEnd },
                    snowSlopeStart: { value: RuntimeMapGen.get().snowSlopeStart },
                    snowSlopeEnd: { value: RuntimeMapGen.get().snowSlopeEnd },
                    snowHeightStart: { value: RuntimeMapGen.get().snowHeightStart },
                    snowHeightEnd: { value: RuntimeMapGen.get().snowHeightEnd },
                    snowBlendSmoothness: { value: RuntimeMapGen.get().snowBlendSmoothness },
                    heightmapTexture: { value: RuntimeMapGen.get().heightmapTexture },
                    heightmapSize: { value: new THREE.Vector2(RuntimeMapGen.get().heightmapSize.width, RuntimeMapGen.get().heightmapSize.height) },
                    terrainScale: { value: RuntimeMapGen.get().Scale },
                    terrainOffset: { value: RuntimeMapGen.get().Offset },
                    uSkyColor: { value: RuntimeMapGen.get().skyColor },
                    uGroundColor: { value: RuntimeMapGen.get().groundColor },
                    uHemisphereIntensity: { value: RuntimeMapGen.get().HemisphereLightIntensity },
                    BackcullingShader: { value: this.BackcullingShader },
                    backfaceCullingThreshold: { value: 0.0 },
                    overallUvOffset: { value: RuntimeMapGen.get().overallTextureOffset },
                    overallUvRotation: { value: RuntimeMapGen.get().overallTextureRotation },
                    grassStoneInfluenceFactor: { value: 1.0 },
                    dirtBetweenFactor: { value: new THREE.Vector2(0.01, 0.2) },
                    fogColor: { value: RuntimeMapGen.get().fogColor },

                    // Shadow uniforms
                    shadowMapResolution: { value: RuntimeMapGen.get().shadowMapResolution },
                    shadowSoftness: { value: RuntimeMapGen.get().shadowSoftness },
                    shadowBias: { value: RuntimeMapGen.get().shadowBias },

                    // New uniforms for dynamic blending
                    blendFactor: { value: 0.5 }, // Adjust to control the overall influence
                    blendFrequency: { value: 0.1 }, // Adjust for the scale of the noise
                    blendAmplitude: { value: 0.3 }, // Adjust for the intensity of the noise effect
                    blendSharpness: { value: 5.0 }, // Adjust for sharper or smoother transitions

                    // New uniforms for blob layer
                    blobGrassTexture: { value: RuntimeMapGen.get().grassTexture }, // Using existing grass texture for blobs
                    blobDirtTexture: { value: RuntimeMapGen.get().dirtTexture },   // Using existing dirt texture for blobs
                    blobInfluence: { value: 1 },
                    blobDensity: { value: 0.05 },
                    blobScale: { value: 0.8 },
                    blobGrassOnStone: { value: 0.8 },
                    blobDirtOnStone: { value: 0.5 },
                    blobDirtOnGrass: { value: 0.1 },

                    // New uniform for close-range texture scale
                    textureScaleClose: { value: RuntimeMapGen.get().CloseRangeFactor },
                    textureScaleMid: { value: RuntimeMapGen.get().MidRangeFactor },
                    textureScaleCloseDistance: { value: RuntimeMapGen.get().CloseRangeFactorDistance },
                    textureScaleMidDistance: { value: RuntimeMapGen.get().MidRangeFactorDistance },
                    beachHeight: { value: RuntimeMapGen.get().beachHeight },

                    // Add new uniforms for octave noise
                    octaveScale: { value: RuntimeMapGen.get().octaveScale },
                    octaveIntensity: { value: RuntimeMapGen.get().octaveIntensity },
                    octaveOctaves: { value: RuntimeMapGen.get().octaveOctaves },
                    octavePersistence: { value: RuntimeMapGen.get().octavePersistence },
                    octaveLacunarity: { value: RuntimeMapGen.get().octaveLacunarity },
                    octaveSeed: { value: RuntimeMapGen.get().octaveSeed },

                    borderNoiseScale: { value: 100.0 },
                    borderNoiseIntensity: { value: 0.5 },
                    borderNoiseOctaves: { value: 4 },
                    borderNoisePersistence: { value: 0.5 },
                    borderNoiseLacunarity: { value: 2.0 },
                    borderNoiseSeed: { value: 12345 },
                    sandColorFilter: { value: RuntimeMapGen.get().sandColorFilter },
                    grassColorFilter: { value: RuntimeMapGen.get().grassColorFilter },
                    stoneColorFilter: { value: RuntimeMapGen.get().stoneColorFilter },
                    dirtColorFilter: { value: RuntimeMapGen.get().dirtColorFilter },
                    snowColorFilter: { value: RuntimeMapGen.get().snowColorFilter },
                }
            ]),
            lights: true,
            fog: true,
            shadowSide: THREE.FrontSide,
        });

        // Set receiveShadow after material creation
        material.customProgramCacheKey = () => 'terrainShader'; // Ensure unique shader compilation
        return material;
    }

    static updateShaderUniforms() {
        if (!RuntimeMapGen.get().Light) {
            console.warn('RuntimeMapGen.get().Light is undefined in updateShaderUniforms!');
            return; // Or handle this case appropriately
        }
        const sunLight = RuntimeMapGen.get().Light as THREE.DirectionalLight;
        const normalizedDirection = sunLight.position;
        const commonUniforms = {
            aoIntensity: RuntimeMapGen.get().AOintensity,
            maxHeight: RuntimeMapGen.get().maxHeight,
            roughness: RuntimeMapGen.get().roughness,
            metalness: RuntimeMapGen.get().metalness,
            ambientColor: RuntimeMapGen.get().ambientColor,
            diffuseIntensity: RuntimeMapGen.get().diffuseIntensity,
            specularIntensity: RuntimeMapGen.get().specularIntensity,
            envMapIntensity: RuntimeMapGen.get().envMapIntensity,
            blendSmoothness: RuntimeMapGen.get().blendSmoothness,
            clippingHeight: RuntimeMapGen.get().clip_Height,
            sandSlopeStart: RuntimeMapGen.get().sandSlopeStart,
            sandSlopeEnd: RuntimeMapGen.get().sandSlopeEnd,
            grassSlopeStart: RuntimeMapGen.get().grassSlopeStart,
            grassSlopeEnd: RuntimeMapGen.get().grassSlopeEnd,
            stoneSlopeStart: RuntimeMapGen.get().stoneSlopeStart,
            stoneSlopeEnd: RuntimeMapGen.get().stoneSlopeEnd,
            stoneSlopeIntensity: RuntimeMapGen.get().stoneSlopeIntensity,
            dirtSlopeStart: RuntimeMapGen.get().dirtSlopeStart,
            dirtSlopeEnd: RuntimeMapGen.get().dirtSlopeEnd,
            dirtHeightEnd: RuntimeMapGen.get().dirtHeightEnd,
            snowSlopeStart: RuntimeMapGen.get().snowSlopeStart,
            snowSlopeEnd: RuntimeMapGen.get().snowSlopeEnd,
            snowHeightStart: RuntimeMapGen.get().snowHeightStart,
            snowHeightEnd: RuntimeMapGen.get().snowHeightEnd,
            snowBlendSmoothness: RuntimeMapGen.get().snowBlendSmoothness,
            heightmapTexture: RuntimeMapGen.get().heightmapTexture,
            heightmapSize: new THREE.Vector2(RuntimeMapGen.get().heightmapSize.width, RuntimeMapGen.get().heightmapSize.height),
            terrainScale: RuntimeMapGen.get().Scale,
            terrainOffset: RuntimeMapGen.get().Offset,
            uSunlightDirection: normalizedDirection,
            uSunlightColor: sunLight.color,
            uSunlightIntensity: sunLight.intensity,
            uHemisphereIntensity: RuntimeMapGen.get().HemisphereLightIntensity,
            sandTexture: RuntimeMapGen.get().sandTexture,
            grassTexture: RuntimeMapGen.get().grassTexture,
            stoneTexture: RuntimeMapGen.get().stoneTexture,
            dirtTexture: RuntimeMapGen.get().dirtTexture,
            snowTexture: RuntimeMapGen.get().snowTexture,
            BackcullingShader: this.BackcullingShader,
            overallUvOffset: RuntimeMapGen.get().overallTextureOffset,
            overallUvRotation: RuntimeMapGen.get().overallTextureRotation,
            grassStoneInfluenceFactor: RuntimeMapGen.get().grassStoneInfluenceFactor,
            dirtBetweenFactor: RuntimeMapGen.get().dirtBetweenFactor,
            fogColor: RuntimeMapGen.get().fogColor,
            fogNear: RuntimeMapGen.get().fogNear,
            fogFar: RuntimeMapGen.get().fogFar,
            fogDensity: RuntimeMapGen.get().fogDensity,
            fogHeightMin: RuntimeMapGen.get().fogHeightMin,
            fogHeightMax: RuntimeMapGen.get().fogHeightMax,

            // Update shadow uniforms
            shadowMapResolution: RuntimeMapGen.get().shadowMapResolution,
            shadowSoftness: RuntimeMapGen.get().shadowSoftness,
            shadowBias: RuntimeMapGen.get().shadowBias,

            // Update dynamic blending uniforms
            blendFactor: RuntimeMapGen.get().blendFactor,
            blendFrequency: RuntimeMapGen.get().blendFrequency,
            blendAmplitude: RuntimeMapGen.get().blendAmplitude,
            blendSharpness: RuntimeMapGen.get().blendSharpness,

            // Update blob layer uniforms
            blobInfluence: RuntimeMapGen.get().blobInfluence,
            blobDensity: RuntimeMapGen.get().blobDensity,
            blobScale: RuntimeMapGen.get().blobScale,
            blobGrassOnStone: RuntimeMapGen.get().blobGrassOnStone,
            blobDirtOnStone: RuntimeMapGen.get().blobDirtOnStone,
            blobDirtOnGrass: RuntimeMapGen.get().blobDirtOnGrass,
            blobGrassTexture: RuntimeMapGen.get().grassTexture, // Ensure textures are updated if they change
            blobDirtTexture: RuntimeMapGen.get().dirtTexture,   // Ensure textures are updated if they change

            // Update new texture scale uniform
            textureScaleClose: RuntimeMapGen.get().CloseRangeFactor,
            textureScaleMid: RuntimeMapGen.get().MidRangeFactor,
            textureScaleCloseDistance: RuntimeMapGen.get().CloseRangeFactorDistance,
            textureScaleMidDistance: RuntimeMapGen.get().MidRangeFactorDistance,
            beachHeight: RuntimeMapGen.get().beachHeight,

            // Update octave noise uniforms
            octaveScale: RuntimeMapGen.get().octaveScale,
            octaveIntensity: RuntimeMapGen.get().octaveIntensity,
            octaveOctaves: RuntimeMapGen.get().octaveOctaves,
            octavePersistence: RuntimeMapGen.get().octavePersistence,
            octaveLacunarity: RuntimeMapGen.get().octaveLacunarity,
            octaveSeed: RuntimeMapGen.get().octaveSeed,

            borderNoiseScale: RuntimeMapGen.get().borderNoiseScale,
            borderNoiseIntensity: RuntimeMapGen.get().borderNoiseIntensity,
            borderNoiseOctaves: RuntimeMapGen.get().borderNoiseOctaves,
            borderNoisePersistence: RuntimeMapGen.get().borderNoisePersistence,
            borderNoiseLacunarity: RuntimeMapGen.get().borderNoiseLacunarity,
            borderNoiseSeed: RuntimeMapGen.get().borderNoiseSeed,
            sandColorFilter: RuntimeMapGen.get().sandColorFilter,
            grassColorFilter: RuntimeMapGen.get().grassColorFilter,
            stoneColorFilter: RuntimeMapGen.get().stoneColorFilter,
            dirtColorFilter: RuntimeMapGen.get().dirtColorFilter,
            snowColorFilter: RuntimeMapGen.get().snowColorFilter,
        };
        if (this.highDetailMaterial) {
            const textureScaleMultiplier = RuntimeMapGen.get().HighDetailFactor;
            this.highDetailMaterial.uniforms.sandRepeat.value = RuntimeMapGen.get().sandScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.grassRepeat.value = RuntimeMapGen.get().grassScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.stoneRepeat.value = RuntimeMapGen.get().stoneScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.dirtRepeat.value = RuntimeMapGen.get().dirtScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.snowRepeat.value = RuntimeMapGen.get().snowScale * textureScaleMultiplier;
            this.highDetailMaterial.uniforms.cameraDistanceFactor.value = RuntimeMapGen.get().HighDetailFactor * 1000;
            for (const uniformName in commonUniforms) {
                if (this.highDetailMaterial.uniforms[uniformName]) {
                    this.highDetailMaterial.uniforms[uniformName].value = commonUniforms[uniformName];
                }
            }
        }
        if (this.lowDetailMaterial) {
            const textureScaleMultiplier = RuntimeMapGen.get().LowDetailFactor;
            this.lowDetailMaterial.uniforms.sandRepeat.value = RuntimeMapGen.get().sandScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.grassRepeat.value = RuntimeMapGen.get().grassScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.stoneRepeat.value = RuntimeMapGen.get().stoneScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.dirtRepeat.value = RuntimeMapGen.get().dirtScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.snowRepeat.value = RuntimeMapGen.get().snowScale * textureScaleMultiplier;
            this.lowDetailMaterial.uniforms.cameraDistanceFactor.value = RuntimeMapGen.get().LowDetailFactor * 1000;
            for (const uniformName in commonUniforms) {
                if (this.lowDetailMaterial.uniforms[uniformName]) {
                    this.lowDetailMaterial.uniforms[uniformName].value = commonUniforms[uniformName];
                }
            }
        }
    }

    public static highDetailMaterial: THREE.ShaderMaterial;
    public static lowDetailMaterial: THREE.ShaderMaterial;
    public static BackcullingShader: number = 90;


}
