import * as RE from 'rogue-engine';
import * as THREE from 'three';
import { Audio } from 'three';
import RMG_Navigation from './RMG_Navigation.re';

interface AudioData {
    event?: string[];
    loop?: string[];
    soundtrack?: string[];
}

interface BiomeData {
    displayName: string;
    foliageIndexes: number[];
    textures: string[];
    audio?: AudioData;
}

interface BiomeConfig {
    defaultBiomeName: string;
    voidBiomeName: string;
    audioBaseDirectory?: string;
    biomes: { [color: string]: BiomeData };
}

interface ScheduledEntry {
    sound: THREE.PositionalAudio;
    nextPlayTime: number;
    minInterval: number; // Currently derived from sound duration + component props
    maxInterval: number; // Currently derived from sound duration + component props
    fadeIn: number; // Currently derived from component props
    fadeOut: number; // Currently derived from component props
    // Movement parameters
    homePosition: THREE.Vector3;
    driftRadius: number;
    driftSpeed: number;
    // Volume parameters for runtime update
    randomFactor?: number; // Stores the random variation factor (-1 to 1) for loops/events
}

@RE.registerComponent
export default class RMG_Audio extends RE.Component {

    @RE.props.group("📀 Audio Settings", true)
    @RE.props.text() playerAnchorName: string = "ThirdPersonCharacter";
    @RE.props.text() biomeConfigPath: string = "MapGen/biomes.json";

    // Global volume control (0 = off, 1 = full)
    @RE.props.num(0, 1) masterVolume: number = 0.6;
    @RE.props.num(0, 1) soundtrackVolume: number = 0.4;
    @RE.props.num(0, 1) loopVolume: number = 0.8;
    @RE.props.num(0, 1) eventVolume: number = 0.5;

    // Variation settings
    @RE.props.num(0, 1) loopVariationPercentage: number = 0.1;
    @RE.props.num(0, 1) eventVariationPercentage: number = 0.2;

    // Fade settings for biome transitions
    @RE.props.num(0, 5) fadeOutDuration: number = 1.0;
    @RE.props.num(0, 5) fadeInDuration: number = 1.0;

    // New property for biome change delay
    @RE.props.num(0, 10) biomeChangeDelaySeconds: number = 5.0; // Minimum time in a new biome before audio changes

    // Spatialization settings
    @RE.props.num(1, 10000) spawnRadius: number = 50;
    @RE.props.num(0, 5) driftRadius: number = 3;
    @RE.props.num(0, 0.5) driftSpeed: number = 0.1;

    private targetObject: THREE.Object3D | null = null;
    private listener: THREE.AudioListener | null = null;
    private audioLoader: THREE.AudioLoader | null = null;

    private biomeConfig: BiomeConfig | null = null;
    private audioBaseDirectory: string = "";

    // --- Caching Properties ---
    private audioBufferCache: Map<string, AudioBuffer> = new Map();
    // --- End Caching Properties ---

    private currentBiomeName: string | null = null;
    private currentSoundtrackAudio: THREE.Audio | null = null;
    private currentScheduledLoops: ScheduledEntry[] = [];
    private currentScheduledEvents: ScheduledEntry[] = [];

    // Flag to prevent multiple biome transitions at once
    private isChangingBiome: boolean = false;

    // New properties for biome change tracking
    private lastDetectedBiomeName: string | null = null;
    private timeEnteredLastDetectedBiome: number = 0; // Time in seconds since performance.now()


    async start() {
        // --- Find the target object by name ---
        if (!this.playerAnchorName) {
             // console.warn('RMG_BiomeAudio: No playerAnchorName provided.'); // Removed logs per request
             return;
        }
        this.targetObject = RE.Runtime.scene.getObjectByName(this.playerAnchorName) ?? null;

        if (!this.targetObject) {
            // console.warn(`RMG_BiomeAudio: Target object with name "${this.playerAnchorName}" not found in the scene.`); // Removed logs per request
            return;
        }
        // ---------------------------------------

        this.listener = new THREE.AudioListener();
        this.targetObject.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();

        // --- Load Biome Configuration ---
        if (!this.biomeConfigPath || this.biomeConfigPath === "path/to/your/biome_config.json") {
             // console.error('RMG_BiomeAudio: Biome config path is not set or is the default placeholder.'); // Removed logs per request
             return;
        }
        try {
            const configUrl = RE.getStaticPath(this.biomeConfigPath);
            const response = await fetch(configUrl);
            if (!response.ok) {
                throw new Error(`Failed to load biome config: ${response.statusText} (Status: ${response.status})`);
            }
            this.biomeConfig = await response.json();

            this.audioBaseDirectory = this.biomeConfig!.audioBaseDirectory || "";
             if (this.audioBaseDirectory && !this.audioBaseDirectory.endsWith('/')) {
                 this.audioBaseDirectory += '/';
             }

        } catch (error) {
             // console.error('RMG_BiomeAudio: Error loading biome config:', error); // Removed logs per request
            return;
        }

        // --- Pre-load and Cache Audio Buffers ---
        await this.preloadAudioBuffers();
        // --- End Pre-loading ---

        // Initial biome setup
        const initialBiome = RMG_Navigation.currentRegion;
        this.currentBiomeName = initialBiome;
        this.lastDetectedBiomeName = initialBiome;
        this.timeEnteredLastDetectedBiome = performance.now() / 1000; // Initialize time entered

        // Load and play initial biome audio without delay or fade out
        await this.activateBiomeAudio(this.currentBiomeName);

        RE.Runtime.onStop(() => this.onDestroy());
    }

    private async preloadAudioBuffers() {
        if (!this.biomeConfig || !this.audioLoader) {
            // console.warn("Preload failed: missing config or audio loader."); // Removed logs per request
            return;
        }

        const uniqueAudioPaths = new Set<string>();

        // Collect all unique audio file paths from the config
        for (const biomeData of Object.values(this.biomeConfig.biomes)) {
            if (biomeData.audio) {
                if (biomeData.audio.soundtrack) {
                    biomeData.audio.soundtrack.forEach(path => uniqueAudioPaths.add(this.audioBaseDirectory + path));
                }
                if (biomeData.audio.loop) {
                    biomeData.audio.loop.forEach(path => uniqueAudioPaths.add(this.audioBaseDirectory + path));
                }
                if (biomeData.audio.event) {
                    biomeData.audio.event.forEach(path => uniqueAudioPaths.add(this.audioBaseDirectory + path));
                }
            }
        }

        // Load each unique audio file and store its buffer
        const loadPromises: Promise<void>[] = [];
        for (const relativePath of uniqueAudioPaths) {
            const fullPath = RE.getStaticPath(relativePath);
            // Check if already cached (shouldn't happen with a Set, but good practice)
            if (!this.audioBufferCache.has(fullPath)) {
                loadPromises.push(
                    this.audioLoader.loadAsync(fullPath)
                        .then(buffer => {
                            this.audioBufferCache.set(fullPath, buffer);
                            // console.log(`Cached audio buffer: ${fullPath}`); // Removed logs per request
                        })
                        .catch(error => {
                             // console.error(`Error preloading audio: ${fullPath}`, error); // Removed logs per request
                            // Don't add to cache if loading failed
                        })
                );
            }
        }

        // Wait for all unique audio files to be preloaded
        await Promise.all(loadPromises);
        // console.log(`Preloaded ${this.audioBufferCache.size} unique audio buffers.`); // Removed logs per request
    }

    update() {
        if (!this.targetObject || !this.listener || !this.biomeConfig) {
            return;
        }

        const now = performance.now() / 1000;
        const ctx = this.listener.context;

        // --- Check for Region Change with Delay ---
        const newBiomeName = RMG_Navigation.currentRegion;

        if (newBiomeName !== this.lastDetectedBiomeName) {
            // Player entered a new biome
            // console.log(`Detected new biome: ${newBiomeName}. Previous was: ${this.lastDetectedBiomeName}.`); // Removed logs per request
            this.lastDetectedBiomeName = newBiomeName;
            this.timeEnteredLastDetectedBiome = now; // Record the time they entered this new biome
        }

        // Check if enough time has passed in the current 'lastDetectedBiomeName' AND
        // if this 'lastDetectedBiomeName' is different from the 'currentBiomeName' (the one with active audio)
        if (newBiomeName !== this.currentBiomeName && !this.isChangingBiome) {
            const timeInNewBiome = now - this.timeEnteredLastDetectedBiome;

            if (timeInNewBiome >= this.biomeChangeDelaySeconds) {
                 // console.log(`Staying in biome "${newBiomeName}" for ${timeInNewBiome.toFixed(2)}s (>= ${this.biomeChangeDelaySeconds}s delay). Initiating biome change.`); // Removed logs per request
                this.handleChangeBiome(newBiomeName);
            } else {
                 // console.log(`Currently in biome "${newBiomeName}" for ${timeInNewBiome.toFixed(2)}s (< ${this.biomeChangeDelaySeconds}s delay). Waiting.`); // Removed logs per request
                // Audio will continue playing the previous biome's sounds during this delay
            }
        }
        // -------------------------------------------


        // Update soundtrack volume (only for the current biome's soundtrack if it exists)
        if (this.currentSoundtrackAudio && this.currentSoundtrackAudio.isPlaying) {
            const targetVol = this.masterVolume * this.soundtrackVolume;
            this.currentSoundtrackAudio.gain.gain.setValueAtTime(targetVol, ctx.currentTime);
        }

        // Update loop volumes (only for the current biome's loops)
        this.currentScheduledLoops.forEach(entry => {
            if (entry.sound.isPlaying && entry.randomFactor !== undefined) {
                const targetBaseVolume = this.masterVolume * this.loopVolume;
                const maxVariation = targetBaseVolume * this.loopVariationPercentage;
                const actualVariation = maxVariation * entry.randomFactor;
                const currentCalculatedVolume = THREE.MathUtils.clamp(targetBaseVolume + actualVariation, 0, 1);

                // Using setValueAtTime is better than setVolume in update loop
                entry.sound.gain.gain.setValueAtTime(currentCalculatedVolume, ctx.currentTime);
            }
        });

        // Drift all *current* scheduled sources
        const driftSources = [...this.currentScheduledLoops, ...this.currentScheduledEvents];
        driftSources.forEach(entry => {
            // Ensure sound is still parented before updating position
            if (entry.sound.parent === this.targetObject) {
                const t = now * entry.driftSpeed;
                const dx = Math.cos(t) * entry.driftRadius;
                const dz = Math.sin(t * 1.3) * entry.driftRadius;
                entry.sound.position.set(
                    entry.homePosition.x + dx,
                    entry.homePosition.y,
                    entry.homePosition.z + dz
                );
            }
        });

        // Trigger *current* events
        this.currentScheduledEvents.forEach(entry => {
            if (entry.sound.isPlaying) return;
            if (now < entry.nextPlayTime) return;

            // Get the buffer duration from the cached buffer
            const dur = entry.sound.buffer ? entry.sound.buffer.duration : 0;
            if (dur === 0) {
                // Cannot play event without a valid buffer duration
                return;
            }

            // Random volume & pitch for events
            const randomFactor = (Math.random() * 2 - 1);
            const targetBaseVolume = this.masterVolume * this.eventVolume;
            const maxVariation = targetBaseVolume * this.eventVariationPercentage;
            const actualVariation = maxVariation * randomFactor;
            const vol = THREE.MathUtils.clamp(targetBaseVolume + actualVariation, 0, 1);

            entry.sound.setPlaybackRate(
                THREE.MathUtils.clamp(0.8 + Math.random() * 0.4, 0.5, 1.5)
            );

            const gainParam = entry.sound.gain.gain;

            gainParam.setValueAtTime(0, ctx.currentTime);
            gainParam.linearRampToValueAtTime(vol, ctx.currentTime + entry.fadeIn);

            // Stop before playing to reset playback position if it was somehow left playing
            entry.sound.stop();
            entry.sound.play();

            const fadeOutStartTime = ctx.currentTime + dur - entry.fadeOut;

            if (dur > 0 && entry.fadeOut > 0 && fadeOutStartTime > ctx.currentTime + entry.fadeIn) {
                 gainParam.setValueAtTime(vol, fadeOutStartTime);
                 gainParam.linearRampToValueAtTime(0, ctx.currentTime + dur);
             } else if (dur > 0 && entry.fadeOut > 0) {
                 // If fadeOut starts before or at the same time as fadeIn ends, just ramp to 0 over duration
                 gainParam.linearRampToValueAtTime(0, ctx.currentTime + dur);
             }

            // Schedule next play time relative to *now* + duration + delay
            const minDelay = dur + 5; // Minimum delay after sound finishes
            const maxDelay = dur + 20; // Maximum delay after sound finishes
            const delay = Math.random() * (maxDelay - minDelay) + minDelay;

            entry.nextPlayTime = now + delay; // Schedule based on current time + calculated delay

            // Recalculate a new random position for the event source
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * this.spawnRadius;
            entry.homePosition.set(Math.cos(theta) * r, 0, Math.sin(theta) * r);
            entry.sound.position.copy(entry.homePosition);
        });
    }


    async handleChangeBiome(newBiomeName: string | null) {
        if (this.isChangingBiome) {
             // console.warn("Biome change already in progress. Ignoring."); // Removed logs per request
             return;
        }

        this.isChangingBiome = true;
        // console.log(`Initiating biome change from "${this.currentBiomeName}" to "${newBiomeName}"`); // Removed logs per request

        // Stop existing audio with fade out
        this.stopAllAudio(this.fadeOutDuration);

        // Wait for the fade-out duration
        await new Promise(resolve => setTimeout(resolve, this.fadeOutDuration * 1000));

        this.currentBiomeName = newBiomeName;
        // Activate new audio (buffers are already loaded) with fade in
        await this.activateBiomeAudio(this.currentBiomeName);

        this.isChangingBiome = false;
        // console.log(`Biome change to "${this.currentBiomeName}" complete.`); // Removed logs per request
    }


    // This function now CREATES and ACTIVATES audio nodes using CACHED buffers
    async activateBiomeAudio(biomeName: string | null) {
        if (!this.biomeConfig || !this.targetObject || !this.listener) {
             // console.warn("Cannot activate biome audio: missing config, target, or listener."); // Removed logs per request
             return;
        }

        let audioToPlay: AudioData | undefined;
        let determinedBiomeDisplayName: string;

        const initialBiomeName = biomeName;

        const biomeEntry = Object.values(this.biomeConfig.biomes).find(
            biome => biome.displayName === initialBiomeName
        );

        if (biomeEntry && biomeEntry.audio) {
            audioToPlay = biomeEntry.audio;
            determinedBiomeDisplayName = biomeEntry.displayName;
             // console.log(`Found audio data for biome: "${determinedBiomeDisplayName}"`); // Removed logs per request
        } else {
             // console.warn(`No audio data found for biome "${initialBiomeName}". Attempting to use default biome audio ("${this.biomeConfig.defaultBiomeName}").`); // Removed logs per request

            const defaultBiomeEntry = Object.values(this.biomeConfig.biomes).find(
                biome => biome.displayName === this.biomeConfig!.defaultBiomeName
            );

            if (!defaultBiomeEntry || !defaultBiomeEntry.audio) {
                // console.error(`Default biome "${this.biomeConfig.defaultBiomeName}" not found or has no audio data.`); // Removed logs per request
                return;
            }

             // console.log(`Using audio for default biome: "${this.biomeConfig.defaultBiomeName}"`); // Removed logs per request
            audioToPlay = defaultBiomeEntry.audio;
            determinedBiomeDisplayName = defaultBiomeEntry.displayName;
        }

         // console.log(`Activating audio sources for biome: "${determinedBiomeDisplayName}"`); // Removed logs per request

        const baseDir = this.audioBaseDirectory;
        const ctx = this.listener.context;
        const now = ctx.currentTime;
        const fadeInEndTime = now + this.fadeInDuration;

        // Activate soundtrack
        if (audioToPlay.soundtrack && audioToPlay.soundtrack.length > 0) {
             try {
                 const randomIndex = Math.floor(Math.random() * audioToPlay.soundtrack.length);
                 const soundtrackRelativePath = baseDir + audioToPlay.soundtrack[randomIndex];
                 const soundtrackFullPath = RE.getStaticPath(soundtrackRelativePath);
                 const buffer = this.audioBufferCache.get(soundtrackFullPath);

                 if (buffer) {
                     this.currentSoundtrackAudio = new THREE.Audio(this.listener);
                     this.currentSoundtrackAudio.setBuffer(buffer);
                     this.currentSoundtrackAudio.setLoop(true);

                     const targetVol = this.masterVolume * this.soundtrackVolume;
                     this.currentSoundtrackAudio.setVolume(0); // Start at 0 for fade-in
                     this.currentSoundtrackAudio.gain.gain.linearRampToValueAtTime(targetVol, fadeInEndTime);

                     this.targetObject.add(this.currentSoundtrackAudio);
                     this.currentSoundtrackAudio.play();
                      // console.log(`Playing soundtrack with fade-in: ${soundtrackFullPath}`); // Removed logs per request
                 } else {
                      // console.warn(`Soundtrack buffer not found in cache: ${soundtrackFullPath}`); // Removed logs per request
                     this.currentSoundtrackAudio = null;
                 }
             } catch (error) {
                  // console.error(`Error setting up or playing soundtrack:`, error); // Removed logs per request
                 this.currentSoundtrackAudio = null;
             }
        } else {
             this.currentSoundtrackAudio = null; // Ensure it's null if no soundtrack for this biome
        }

        // Activate loops
        this.currentScheduledLoops = []; // Clear previous loops
        if (audioToPlay.loop && audioToPlay.loop.length > 0) {
             for (const loopFileName of audioToPlay.loop) {
                 try {
                     const loopRelativePath = baseDir + loopFileName;
                     const loopFullPath = RE.getStaticPath(loopRelativePath);
                     const buffer = this.audioBufferCache.get(loopFullPath);

                     if (buffer) {
                         const pa = new THREE.PositionalAudio(this.listener);
                         pa.setBuffer(buffer);
                         pa.setLoop(true);
                         pa.setRefDistance(this.spawnRadius);
                         pa.setRolloffFactor(1); // Standard rolloff

                         const randomFactor = (Math.random() * 2 - 1); // Calculate random factor per instance
                         const targetBaseVolume = this.masterVolume * this.loopVolume;
                         const maxVariation = targetBaseVolume * this.loopVariationPercentage;
                         const actualVariation = maxVariation * randomFactor;
                         const targetVol = THREE.MathUtils.clamp(targetBaseVolume + actualVariation, 0, 1);

                         pa.setVolume(0); // Start at 0 for fade-in
                         pa.gain.gain.linearRampToValueAtTime(targetVol, fadeInEndTime);

                         const theta = Math.random() * Math.PI * 2;
                         const r = Math.random() * this.spawnRadius;
                         const homePos = new THREE.Vector3(
                             Math.cos(theta) * r,
                             0, // Assuming sounds spawn around the player's height
                             Math.sin(theta) * r
                         );
                         this.targetObject.add(pa);
                         pa.position.copy(homePos);
                         pa.play();
                          // console.log(`Playing loop with fade-in: ${loopFullPath}`); // Removed logs per request

                         this.currentScheduledLoops.push({
                             sound: pa,
                             nextPlayTime: performance.now() / 1000, // Not used for loops, but keeps interface consistent
                             minInterval: 0, maxInterval: 0, // Not used for loops
                             fadeIn: this.fadeInDuration, // Store instance fade for consistency, though set on creation
                             fadeOut: this.fadeOutDuration, // Store instance fade for consistency
                             homePosition: homePos,
                             driftRadius: this.driftRadius,
                             driftSpeed: this.driftSpeed,
                             randomFactor: randomFactor, // Store per instance
                         });
                     } else {
                          // console.warn(`Loop buffer not found in cache: ${loopFullPath}`); // Removed logs per request
                     }
                 } catch (error) {
                      // console.error(`Error setting up or playing loop:`, error); // Removed logs per request
                 }
             }
        } else {
             this.currentScheduledLoops = []; // Ensure array is empty if no loops for this biome
        }

        // Activate events (setup for scheduling)
        this.currentScheduledEvents = []; // Clear previous events
        if (audioToPlay.event && audioToPlay.event.length > 0) {
             for (const eventFileName of audioToPlay.event) {
                 try {
                     const eventRelativePath = baseDir + eventFileName;
                     const eventFullPath = RE.getStaticPath(eventRelativePath);
                     const buffer = this.audioBufferCache.get(eventFullPath);

                     if (buffer) {
                         const pa = new THREE.PositionalAudio(this.listener);
                         pa.setBuffer(buffer);
                         pa.setLoop(false);
                         pa.setRefDistance(this.spawnRadius * 0.5); // Events might be perceived closer
                         pa.setRolloffFactor(1);
                         this.targetObject.add(pa); // Add now, play later

                         const dur = buffer.duration;
                         const minDelay = dur + 5; // Minimum delay after sound finishes
                         const maxDelay = dur + 20; // Maximum delay after sound finishes
                         const theta = Math.random() * Math.PI * 2;
                         const r = Math.random() * this.spawnRadius;
                         const homePos = new THREE.Vector3(
                             Math.cos(theta) * r,
                             0, // Assuming sounds spawn around the player's height
                             Math.sin(theta) * r
                         );
                         pa.position.copy(homePos);

                         // Schedule the first play time
                         const firstPlayTime = (performance.now() / 1000) + Math.random() * (maxDelay - minDelay) + minDelay;

                          // console.log(`Loaded and scheduled event: ${eventFullPath}. Next play in ${firstPlayTime - (performance.now()/1000)}s`); // Removed logs per request

                         this.currentScheduledEvents.push({
                             sound: pa,
                             nextPlayTime: firstPlayTime,
                             minInterval: minDelay, // Store for recalculating nextPlayTime
                             maxInterval: maxDelay, // Store for recalculating nextPlayTime
                             fadeIn: 0.5, // Use component props or specific event fade? Using hardcoded 0.5 from original
                             fadeOut: 0.5, // Using hardcoded 0.5 from original
                             homePosition: homePos,
                             driftRadius: this.driftRadius * 0.5, // Events might drift less or more
                             driftSpeed: this.driftSpeed * 2, // Events might drift faster
                             // randomFactor not stored here, calculated on trigger
                         });
                     } else {
                          // console.warn(`Event buffer not found in cache: ${eventFullPath}`); // Removed logs per request
                     }
                 } catch (error) {
                      // console.error(`Error setting up event:`, error); // Removed logs per request
                 }
             }
        } else {
             this.currentScheduledEvents = []; // Ensure array is empty if no events
        }

         // console.log(`Finished activating audio sources for biome: "${determinedBiomeDisplayName}".`); // Removed logs per request
    }



    stopAllAudio(duration: number = 0) {
        // console.log(`Stopping all current biome audio with fade out duration: ${duration}s`); // Removed logs per request

        if (!this.listener || !this.targetObject) {
              // console.warn("Cannot stop audio: listener or targetObject is null."); // Removed logs per request
              return;
        }

        const ctx = this.listener.context;
        const now = ctx.currentTime;
        const fadeOutEndTime = now + duration;

        const soundsToCleanUp: (THREE.Audio | THREE.PositionalAudio)[] = [];

        // Stop and fade out soundtrack
        if (this.currentSoundtrackAudio) {
             if (this.currentSoundtrackAudio.isPlaying) {
                 this.currentSoundtrackAudio.gain.gain.linearRampToValueAtTime(0, fadeOutEndTime);
                 soundsToCleanUp.push(this.currentSoundtrackAudio);
             } else {
                  // If not playing, clean up immediately
                  this.currentSoundtrackAudio.disconnect();
                  if (this.currentSoundtrackAudio.parent === this.targetObject) {
                       this.targetObject.remove(this.currentSoundtrackAudio);
                  }
             }
        }
        this.currentSoundtrackAudio = null; // Remove reference immediately

        // Stop and fade out scheduled loops
        this.currentScheduledLoops.forEach(entry => {
             if (entry.sound.isPlaying) {
                 entry.sound.gain.gain.linearRampToValueAtTime(0, fadeOutEndTime);
                 soundsToCleanUp.push(entry.sound);
             } else {
                  // If not playing, clean up immediately
                  entry.sound.disconnect();
                  if (entry.sound.parent === this.targetObject) {
                       this.targetObject!.remove(entry.sound);
                  }
             }
        });
        this.currentScheduledLoops = []; // Clear array immediately

        // Stop and fade out scheduled events
        this.currentScheduledEvents.forEach(entry => {
             // Events might be in the scheduled list but not currently playing
             if (entry.sound.isPlaying) {
                  entry.sound.gain.gain.linearRampToValueAtTime(0, fadeOutEndTime);
                  soundsToCleanUp.push(entry.sound);
             } else {
                 // If not playing, clean up immediately
                 entry.sound.disconnect();
                 if (entry.sound.parent === this.targetObject) {
                      this.targetObject!.remove(entry.sound);
                 }
             }
        });
        this.currentScheduledEvents = []; // Clear array immediately

        // Schedule the actual cleanup (disconnect and remove from scene)
        if (soundsToCleanUp.length > 0 && duration > 0) {
            const cleanupDelay = duration * 1000;
            setTimeout(() => {
                 // console.log(`Performing cleanup after fade-out (${duration}s delay). ${soundsToCleanUp.length} sounds to process.`); // Removed logs per request
                if (!this.targetObject) {
                      // console.warn("Cleanup aborted: targetObject is null."); // Removed logs per request
                      return;
                }
                soundsToCleanUp.forEach(sound => {
                    try {
                        // Check again if the sound is still parented to the target object
                        // This prevents trying to remove something already removed
                        if (sound.parent === this.targetObject) {
                            // Ensure sound is stopped in case fade finished but sound didn't
                            if (sound.isPlaying) {
                                sound.stop();
                            }
                            sound.disconnect(); // Disconnect from Web Audio API
                            this.targetObject!.remove(sound); // Remove from Three.js scene graph
                        } else {
                             // Handle sounds that might have been removed by other means or were orphaned
                             try {
                                 sound.disconnect();
                             } catch (e) {
                                 // Ignore errors if node is already disconnected/invalid
                                  // console.warn("Error disconnecting orphaned audio node during cleanup:", e); // Removed logs per request
                             }
                        }
                    } catch (e) {
                         // console.error("Error during audio cleanup after fade:", e); // Removed logs per request
                    }
                });
                 // console.log("Audio cleanup after fade-out complete."); // Removed logs per request
            }, cleanupDelay + 50); // Add a small buffer just in case
        } else {
             // If duration is 0 or no sounds, clean up immediately without timeout
             soundsToCleanUp.forEach(sound => {
                try {
                    if (sound.parent === this.targetObject) {
                        if (sound.isPlaying) {
                           sound.stop();
                        }
                       sound.disconnect();
                       this.targetObject!.remove(sound);
                    } else {
                         try {
                             sound.disconnect();
                         } catch (e) {} // Ignore disconnect errors
                    }
                } catch (e) {} // Ignore general cleanup errors
             });
             // console.log("No fade or no sounds, cleanup complete."); // Removed logs per request
        }
         // console.log("Stop all current biome audio initiated."); // Removed logs per request
    }


    onDestroy() {
        // console.log("RMG_BiomeAudio component destroying."); // Removed logs per request
        if (!this.targetObject || !this.listener) {
          return;
        }

        // Stop all audio immediately on destroy
        this.stopAllAudio(0);

        // Clean up the listener
        if (this.listener.parent === this.targetObject) {
          this.targetObject.remove(this.listener);
        }
        // The listener's context is typically tied to the browser window and doesn't need explicit closing here unless managing multiple contexts.

        // Clear references
        this.listener = null;
        this.audioLoader = null;
        this.targetObject = null;
        this.biomeConfig = null;
        this.audioBaseDirectory = "";

        // Clear audio data references
        this.currentSoundtrackAudio = null;
        this.currentScheduledLoops = [];
        this.currentScheduledEvents = [];

        // Clear buffer cache (allows garbage collection)
        this.audioBufferCache.clear();
         // console.log("RMG_BiomeAudio component destroyed, audio stopped and cache cleared."); // Removed logs per request

        // Clear biome tracking properties
        this.currentBiomeName = null;
        this.lastDetectedBiomeName = null;
        this.timeEnteredLastDetectedBiome = 0;
    }


}