import * as RE from 'rogue-engine';
import * as THREE from 'three';

@RE.registerComponent
export default class SimpleClouds extends RE.Component {
  // Cloud geometry dimensions
  @RE.props.num() cloudWidth: number = 5000;
  @RE.props.num() cloudHeight: number = 5000;
  @RE.props.num() subdivisions: number = 256;

  // Noise settings for overall cloud shape and movement
  @RE.props.num() noiseScale: number = 0.001; // scale for large noise features
  @RE.props.num() noiseSpeed: number = 0.05;    // movement speed of the noise pattern
  @RE.props.num() noiseIntensity: number = 1.0; // intensity multiplier for base noise
  @RE.props.num() detailNoiseScale: number = 0.005; // scale for finer detail noise
  @RE.props.num() detailNoiseIntensity: number = 0.5; // intensity for detail noise

  // Cloud shape and volume settings
  @RE.props.num() cloudThreshold: number = 0.0; // threshold noise value for cloud “density”
  @RE.props.num() cloudSoftness: number = 0.2;  // softness around the threshold for smooth edges
  @RE.props.num() cloudHeightScale: number = 10.0; // how much the noise displaces vertices in Y

  // Cloud color settings (allows an anime-inspired palette)
  @RE.props.color() cloudColor: THREE.Color = new THREE.Color(0xffffff);
  @RE.props.color() shadowColor: THREE.Color = new THREE.Color(0xaaaaaa);
  @RE.props.num() cloudAlpha: number = 0.8;

  private mesh: THREE.Mesh;
  public material: THREE.ShaderMaterial;
  private startTime: number;

  awake() {
    this.startTime = RE.Runtime.clock.getElapsedTime();

    const geometry = new THREE.PlaneGeometry(
      this.cloudWidth,
      this.cloudHeight,
      this.subdivisions,
      this.subdivisions
    );
    geometry.rotateX(-Math.PI / 2);


    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uNoiseScale: { value: this.noiseScale },
        uNoiseSpeed: { value: this.noiseSpeed },
        uNoiseIntensity: { value: this.noiseIntensity },
        uDetailNoiseScale: { value: this.detailNoiseScale },
        uDetailNoiseIntensity: { value: this.detailNoiseIntensity },
        uCloudThreshold: { value: this.cloudThreshold },
        uCloudSoftness: { value: this.cloudSoftness },
        uCloudHeightScale: { value: this.cloudHeightScale },
        uCloudColor: { value: this.cloudColor },
        uShadowColor: { value: this.shadowColor },
        uAlpha: { value: this.cloudAlpha }
      },
      vertexShader: `
        vec3 mod289(vec3 x) { 
          return x - floor(x * (1.0 / 289.0)) * 289.0; 
        }
        vec2 mod289(vec2 x) { 
          return x - floor(x * (1.0 / 289.0)) * 289.0; 
        }
        vec3 permute(vec3 x) { 
          return mod289(((x * 34.0) + 1.0) * x); 
        }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, vec2(C.y, C.y)));
          vec2 x0 = v - i + dot(i, vec2(C.x, C.x));
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + vec4(C.x, C.x, C.z, C.z);
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                  + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
          m = m * m;
          m = m * m;
          vec3 x = 2.0 * fract(p * C.w) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        uniform float uTime;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uNoiseIntensity;
        uniform float uDetailNoiseScale;
        uniform float uDetailNoiseIntensity;
        uniform float uCloudHeightScale;
        uniform float uCloudThreshold;
        uniform float uCloudSoftness;
        varying vec2 vUv;
        varying float vCloudValue;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float time = uTime * uNoiseSpeed;
          // Base noise for large cloud formations
          float baseNoise = snoise(pos.xz * uNoiseScale + vec2(time));
          // Detail noise adds fine structure to the cloud texture
          float detailNoise = snoise(pos.xz * uDetailNoiseScale + vec2(time * 2.0));
          // Combine noises for a complex, evolving cloud shape
          float combinedNoise = baseNoise * uNoiseIntensity + detailNoise * uDetailNoiseIntensity;
          // Displace vertices vertically to simulate cloud volume
          pos.y += combinedNoise * uCloudHeightScale;
          vCloudValue = combinedNoise;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCloudColor;
        uniform vec3 uShadowColor;
        uniform float uCloudThreshold;
        uniform float uCloudSoftness;
        uniform float uAlpha;
        varying vec2 vUv;
        varying float vCloudValue;

        void main() {
          // Create soft transitions at the cloud edges using smoothstep
          float alpha = smoothstep(uCloudThreshold - uCloudSoftness, uCloudThreshold + uCloudSoftness, vCloudValue);
          // Blend between a shadow color and the main cloud color based on the noise value
          vec3 color = mix(uShadowColor, uCloudColor, alpha);
          gl_FragColor = vec4(color, alpha * uAlpha);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true,
      blending: THREE.NormalBlending,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.object3d.add(this.mesh);
  }

  update() {
    if (!this.material) return;
    const elapsed = RE.Runtime.clock.getElapsedTime() - this.startTime;
    this.material.uniforms.uTime.value = elapsed;
  }
}