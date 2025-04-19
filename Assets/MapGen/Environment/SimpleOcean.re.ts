import * as RE from 'rogue-engine';
import * as THREE from 'three';

@RE.registerComponent
export default class SimpleOcean extends RE.Component {
  // Increased ocean dimensions
  @RE.props.num() planeWidth: number = 5000;
  @RE.props.num() planeHeight: number = 5000;
  @RE.props.num() subdivisions: number = 256;

  // Big wave settings
  @RE.props.num() waveAmplitude: number = 3.0;
  @RE.props.num() waveFrequency: number = 0.008;
  @RE.props.num() waveSpeed: number = 0.8;

  // Mid wave settings (secondary motion)
  @RE.props.num() midWaveAmplitude: number = 1.5;
  @RE.props.num() midWaveFrequency: number = 0.015;
  @RE.props.num() midWaveSpeed: number = 0.5;

  // Detail wave settings (fine ripples)
  @RE.props.num() detailWaveAmplitude: number = 0.3;
  @RE.props.num() detailWaveFrequency: number = 0.02;

  // Randomness to break up repetition (animated noise)
  @RE.props.num() noiseIntensity: number = 0.2;

  // Color settings
  @RE.props.color() deepColor: THREE.Color = new THREE.Color(0x87CEEB);
  @RE.props.color() shallowColor: THREE.Color = new THREE.Color(0xB0E0E6);
  @RE.props.color() foamColor: THREE.Color = new THREE.Color(0xffffff);

  @RE.props.num() shimmerIntensity: number = 0.5;
  @RE.props.num() oceanAlpha: number = 0.8;

  // Foam effect: highlights on wave crests
  @RE.props.num() foamThreshold: number = 0.7;
  @RE.props.num() foamIntensity: number = 0.5;

  // Glitter particle properties
  @RE.props.num() glitterDensity: number = 0.002;
  @RE.props.num() glitterSize: number = 1.5;
  @RE.props.num() sparkleSpeed: number = 2.0;
  @RE.props.num() sparkleIntensity: number = 2.0;
  @RE.props.color() glitterColor: THREE.Color = new THREE.Color(0xffffff);

  private mesh: THREE.Mesh;
  public material: THREE.ShaderMaterial;
  private startTime: number;
  private glitterParticles: THREE.Points;
  private particleMaterial: THREE.ShaderMaterial;

  awake() {
    this.startTime = RE.Runtime.clock.getElapsedTime();

    // Create ocean geometry
    const geometry = new THREE.PlaneGeometry(
      this.planeWidth,
      this.planeHeight,
      this.subdivisions,
      this.subdivisions
    );
    geometry.rotateX(-Math.PI / 2);

    // Ocean shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uWaveAmplitude: { value: this.waveAmplitude },
        uWaveFrequency: { value: this.waveFrequency },
        uWaveSpeed: { value: this.waveSpeed },
        uMidWaveAmplitude: { value: this.midWaveAmplitude },
        uMidWaveFrequency: { value: this.midWaveFrequency },
        uMidWaveSpeed: { value: this.midWaveSpeed },
        uDetailWaveAmplitude: { value: this.detailWaveAmplitude },
        uDetailWaveFrequency: { value: this.detailWaveFrequency },
        uNoiseIntensity: { value: this.noiseIntensity },
        uDeepColor: { value: this.deepColor },
        uShallowColor: { value: this.shallowColor },
        uFoamColor: { value: this.foamColor },
        uShimmerIntensity: { value: this.shimmerIntensity },
        uAlpha: { value: this.oceanAlpha },
        uFoamThreshold: { value: this.foamThreshold },
        uFoamIntensity: { value: this.foamIntensity },
      },
      vertexShader: `
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, vec2(C.y, C.y)));
          vec2 x0 = v - i + dot(i, vec2(C.x, C.x));
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + vec4(C.x, C.x, C.z, C.z);
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
          m = m * m; m = m * m;
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
        uniform float uWaveAmplitude;
        uniform float uWaveFrequency;
        uniform float uWaveSpeed;
        uniform float uMidWaveAmplitude;
        uniform float uMidWaveFrequency;
        uniform float uMidWaveSpeed;
        uniform float uDetailWaveAmplitude;
        uniform float uDetailWaveFrequency;
        uniform float uNoiseIntensity;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          float time = uTime;
          
          float bigX = pos.x * uWaveFrequency + time * uWaveSpeed;
          float bigZ = pos.z * uWaveFrequency + time * uWaveSpeed;
          float bigWave = sin(bigX) * cos(bigZ);
          
          float midX = pos.x * uMidWaveFrequency + time * uMidWaveSpeed;
          float midZ = pos.z * uMidWaveFrequency + time * uMidWaveSpeed;
          float midWave = sin(midX) * cos(midZ);
          
          float detailX = pos.x * uDetailWaveFrequency + time * uWaveSpeed;
          float detailZ = pos.z * uDetailWaveFrequency + time * uWaveSpeed;
          float detailWave = sin(detailX) * cos(detailZ);
          
          float noiseValue = snoise(uv * 10.0 + vec2(uTime * 0.1));
          float randomWave = noiseValue * uNoiseIntensity;
          
          float combinedWave = (bigWave * 0.6 + midWave * 0.3 + detailWave * 0.1) * uWaveAmplitude + randomWave;
          pos.y += combinedWave;
          vWave = combinedWave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform float uShimmerIntensity;
        uniform float uAlpha;
        uniform float uFoamThreshold;
        uniform float uFoamIntensity;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          float mixFactor = smoothstep(-1.0, 1.0, vWave);
          vec3 baseColor = mix(uDeepColor, uShallowColor, mixFactor);
          
          float shimmer = sin(vUv.x * 100.0 + vWave * 10.0) * 0.05 * uShimmerIntensity;
          baseColor += vec3(shimmer);
          
          float foamFactor = smoothstep(uFoamThreshold, uFoamThreshold + 0.1, vWave);
          baseColor = mix(baseColor, uFoamColor, foamFactor * uFoamIntensity);
          
          gl_FragColor = vec4(baseColor, uAlpha);
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.object3d.add(this.mesh);

    // Create glitter particle system
    this.createGlitterParticles();
  }

  private createGlitterParticles() {
    const particleCount = Math.floor(this.planeWidth * this.planeHeight * this.glitterDensity);
    const positions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 2);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * this.planeWidth;
      const z = (Math.random() - 0.5) * this.planeHeight;
      positions[i * 3] = x;
      positions[i * 3 + 1] = 0.1;
      positions[i * 3 + 2] = z;

      randoms[i * 2] = Math.random() * 100;
      randoms[i * 2 + 1] = 0.5 + Math.random() * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 2));

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: this.glitterSize },
        uSpeed: { value: this.sparkleSpeed },
        uIntensity: { value: this.sparkleIntensity },
        uColor: { value: this.glitterColor }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uSpeed;
        varying float vAlpha;
        attribute vec2 aRandom;
        
        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          float speed = uSpeed * aRandom.y;
          vAlpha = sin(uTime * speed + aRandom.x) * 0.5 + 0.5;
          vec4 viewPosition = viewMatrix * modelPosition;
          gl_PointSize = uSize * (300.0 / -viewPosition.z);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying float vAlpha;
        
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float len = length(coord);
          if (len > 0.5) discard;
          float intensity = uIntensity * (1.0 - len * 2.0);
          gl_FragColor = vec4(uColor, vAlpha) * intensity;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.glitterParticles = new THREE.Points(geometry, this.particleMaterial);
    this.object3d.add(this.glitterParticles);
  }

  update() {
    if (!this.material) return;
    const elapsed = RE.Runtime.clock.getElapsedTime() - this.startTime;
    this.material.uniforms.uTime.value = elapsed;

    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime.value = elapsed;
    }
  }
}