import {AssetsManager} from '@babylonjs/core/Misc/assetsManager'
import {CreateAudioEngineAsync,} from '@babylonjs/core/AudioV2/webAudio/webAudioEngine'
import {AudioEngineV2, CreateSoundAsync} from '@babylonjs/core/AudioV2/abstractAudio/audioEngineV2'
import {Scene} from "@babylonjs/core/scene";
import { StaticSound } from '@babylonjs/core/AudioV2/abstractAudio/staticSound';
import {AbstractMesh} from "@babylonjs/core/Meshes/abstractMesh";

// SoundConfig interface remains the same
export interface SoundConfig {
    name: string
    path: string
    options?: {
        loop?: boolean
        autoplay?: boolean // Note: autoplay might be blocked before unlock
        volume?: number
        spatialSound?: boolean
        maxDistance?: number
        rolloffFactor?: number
        refDistance?: number
        distanceModel?: "linear" | "inverse" | "exponential"
    }
}

export class AudioManager {
    private assetsManager: AssetsManager
    private staticSounds: Map<string, StaticSound> = new Map()
    private soundsConfig: Map<string, SoundConfig> = new Map()
    private globalVolume: number = 0.7
    private sfxVolume: number = 1.0
    private isReady: boolean = false // Indicates sounds are loaded
    private isUnlocked: boolean = false // Indicates engine is ready to play
    private audioEngine: AudioEngineV2 | null = null // Store the AudioEngine instance

    constructor(scene: Scene) {
        this.assetsManager = new AssetsManager(scene)
        this.assetsManager.useDefaultLoadingScreen = false
    }

    /**
     * Asynchronously creates and initializes the BabylonJS Audio Engine.
     * Must be called before loading or playing sounds.
     */
    public async initialize(): Promise<void> {
        try {
            this.audioEngine = await CreateAudioEngineAsync()
        } catch (error) {
            console.error('AudioManager: Failed to create Audio Engine.', error)
            // Handle the error appropriately - perhaps disable audio?
            this.audioEngine = null // Ensure it's null if creation failed
        }
    }

    /**
     * Attempts to unlock the audio engine after user interaction.
     * Should be called after the first user interaction (e.g., click).
     */
    public async unlock(): Promise<void> {
        if (!this.audioEngine) {
            console.warn('AudioManager: Cannot unlock, Audio Engine not initialized.')
            return
        }
        if (this.isUnlocked) {
            return
        }

        try {
            await this.audioEngine.unlockAsync()
            this.isUnlocked = true
        } catch (error) {
            console.error('AudioManager: Failed to unlock Audio Engine.', error)
            this.isUnlocked = false
        }
    }

    /**
     * Loads a list of sounds using the AssetsManager.
     * Requires initialize() to have been called successfully.
     * @param soundList Array of SoundConfig objects.
     * @param onProgress Optional callback for loading progress.
     * @param onFinish Optional callback for when all sounds are loaded.
     */
    public loadSounds(soundList: SoundConfig[], onProgress?: (remaining: number, total: number) => void, onFinish?: () => void): void {
        if (!this.audioEngine) {
            console.error("AudioManager: Cannot load sounds, Audio Engine not initialized. Call initialize() first.")
            onFinish?.() // Indicate completion (with failure)
            return
        }

        this.isReady = false
        let totalSounds = soundList.length
        let loadedSounds = 0
        if (totalSounds === 0) {
            this.isReady = true;
            onFinish?.();
            return;
        }

        soundList.forEach((config) => {
            const task = this.assetsManager.addBinaryFileTask(`load_sound_${config.name}`, config.path)

            task.onSuccess = async (task) => {
                const sound = await CreateSoundAsync(
                    config.name,
                    task.data,
                    {
                        loop: config.options?.loop ?? false,
                        autoplay: config.options?.autoplay ?? false,
                        volume: config.options?.volume ?? 1.0,
                        spatialEnabled: config.options?.spatialSound ?? false,
                        spatialMaxDistance: config.options?.maxDistance ?? 100,
                        spatialRolloffFactor: config.options?.rolloffFactor ?? 1,
                        spatialDistanceModel: config.options?.distanceModel ?? 'linear',
                    },
                )

                this.staticSounds.set(config.name, sound)
                this.soundsConfig.set(config.name, config)
                loadedSounds++
                onProgress?.(totalSounds - loadedSounds, totalSounds)
                if (loadedSounds === totalSounds) {
                    this.isReady = true
                    console.log('AudioManager: All sound files loaded.')
                    onFinish?.()
                }
            }

            task.onError = (_task, message, exception) => {
                console.error(`Error loading sound file ${config.path} for ${config.name}:`, message, exception)
                loadedSounds++
                onProgress?.(totalSounds - loadedSounds, totalSounds)
                if (loadedSounds === totalSounds) {
                    this.isReady = true
                    console.warn('AudioManager: Finished loading sounds, but some failed.')
                    onFinish?.()
                }
            }
        })

        this.assetsManager.load()
    }

    /**
     * Plays a sound by its registered name. Requires engine to be unlocked.
     * @param name The name of the sound to play.
     * @param volume Optional volume multiplier for this specific playback (0 to 1).
     * @param loop Optional override for looping.
     * @param attachTo Optional mesh or position to attach spatial sound to.
     */
    public playSound(name: string, volume: number = 1.0, loop?: boolean, attachTo?: AbstractMesh): void {
        if (!this.isReady) {
            // console.warn(`AudioManager not ready (sounds not loaded), cannot play sound: ${name}`);
            return
        }
        if (!this.isUnlocked) {
            console.warn(`AudioManager: Audio Engine not unlocked, cannot play sound: ${name}. Unlock requires user interaction.`);
            // Optionally queue the sound to play after unlock? For now, just warn.
            return;
        }

        const sound = this.staticSounds.get(name)
        const soundConfig = this.soundsConfig.get(name)
        if (!sound || !soundConfig) {
            console.warn(`Sound not found: ${name}`)
            return
        }

        // Apply volume controls
        sound.volume = volume * this.sfxVolume * this.globalVolume * (soundConfig.options?.volume ?? 1.0)

        // Override loop setting if provided
        if (loop !== undefined) {
            sound.loop = loop
        }

        // Attach for spatial audio if needed
        if (soundConfig.options?.spatialSound && attachTo) {
            sound.spatial.attach(attachTo)
            sound.play()
        } else {
            // Play non-spatially or if already attached correctly
            sound.play()
        }
    }

    /**
     * Stops a sound by its registered name.
     * @param name The name of the sound to stop.
     */
    public stopSound(name: string): void {
        if (!this.isReady) return;
        const sound = this.staticSounds.get(name)
        sound?.stop()
    }

    // setGlobalVolume, setSfxVolume remain the same

    /**
     * Disposes all loaded sounds and cleans up resources.
     */
    public dispose(): void {
        this.staticSounds.forEach((sound) => {
            sound.stop()
            sound.dispose()
        })
        this.staticSounds.clear()
        this.assetsManager.reset()
        // Dispose the audio engine if it was created
        this.audioEngine?.dispose()
        this.audioEngine = null
        this.isReady = false;
        this.isUnlocked = false;
        console.log('AudioManager disposed.');
    }
}