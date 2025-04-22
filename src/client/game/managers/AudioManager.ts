import { AssetsManager } from '@babylonjs/core/Misc/assetsManager'
import { CreateAudioEngineAsync } from '@babylonjs/core/AudioV2/webAudio/webAudioEngine'
import { type AudioEngineV2, CreateSoundAsync } from '@babylonjs/core/AudioV2/abstractAudio/audioEngineV2'
import type { Scene } from '@babylonjs/core/scene'
import type { StaticSound } from '@babylonjs/core/AudioV2/abstractAudio/staticSound'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { settingsStore } from '@client/utils/settingsStore'

// SoundConfig interface defines sound properties and spatial audio settings
export interface SoundConfig {
  name: string
  path: string
  isMusic?: boolean // Flag to identify music tracks
  options?: {
    loop?: boolean
    autoplay?: boolean // Note: autoplay might be blocked before unlock
    volume?: number // Base volume for this sound
    spatialSound?: boolean
    maxDistance?: number
    rolloffFactor?: number
    refDistance?: number
    distanceModel?: 'linear' | 'inverse' | 'exponential'
  }
}

export class AudioManager {
  private assetsManager: AssetsManager
  private staticSounds: Map<string, StaticSound> = new Map()
  private soundsConfig: Map<string, SoundConfig> = new Map()
  private masterVolume: number = settingsStore.getMasterVolume()
  private musicVolume: number = settingsStore.getMusicVolume()
  private sfxVolume: number = settingsStore.getSfxVolume()
  private isReady: boolean = false
  private isUnlocked: boolean = false
  private audioEngine: AudioEngineV2 | null = null

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
      // Apply initial volumes loaded from settings
      this.applyVolumesToLoadedSounds()
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
      console.error('AudioManager: Cannot load sounds, Audio Engine not initialized. Call initialize() first.')
      onFinish?.() // Indicate completion (with failure)
      return
    }

    this.isReady = false
    let totalSounds = soundList.length
    let loadedSounds = 0
    if (totalSounds === 0) {
      this.isReady = true
      onFinish?.()
      return
    }

    soundList.forEach((config) => {
      // Store config immediately, regardless of loading success
      this.soundsConfig.set(config.name, config)

      const task = this.assetsManager.addBinaryFileTask(`load_sound_${config.name}`, config.path)

      task.onSuccess = async (task) => {
        try {
          const sound = await CreateSoundAsync(config.name, task.data, {
            loop: config.options?.loop ?? false,
            autoplay: config.options?.autoplay ?? false, // Autoplay might fail before unlock
            volume: config.options?.volume ?? 1.0, // Store base volume here
            spatialEnabled: config.options?.spatialSound ?? false,
            spatialMaxDistance: config.options?.maxDistance ?? 100,
            spatialRolloffFactor: config.options?.rolloffFactor ?? 1,
            spatialDistanceModel: config.options?.distanceModel ?? 'linear',
          })

          this.staticSounds.set(config.name, sound)
          // Apply category volume immediately after loading
          this.applyVolumeToSound(sound, config)
        } catch (soundError) {
          console.error(`Error creating sound ${config.name}:`, soundError)
        } finally {
          loadedSounds++
          onProgress?.(totalSounds - loadedSounds, totalSounds)
          if (loadedSounds === totalSounds) {
            this.isReady = true
            console.log('AudioManager: All sound files attempted to load.')
            onFinish?.()
          }
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
   * Applies the current category and master volume to a specific sound.
   * @param sound The StaticSound instance.
   * @param config The SoundConfig for the sound.
   */
  private applyVolumeToSound(sound: StaticSound, config: SoundConfig): void {
    const baseVolume = config.options?.volume ?? 1.0
    const categoryVolume = config.isMusic ? this.musicVolume : this.sfxVolume
    sound.volume = baseVolume * categoryVolume * this.masterVolume
  }

  /**
   * Applies the current category and master volumes to all loaded sounds.
   * Call this when master volume or category volumes change.
   */
  public applyVolumesToLoadedSounds(): void {
    // Update internal master volume state first, in case it changed
    this.masterVolume = settingsStore.getMasterVolume()

    this.staticSounds.forEach((sound, name) => {
      const config = this.soundsConfig.get(name)
      if (config) {
        this.applyVolumeToSound(sound, config)
      }
    })
  }

  /**
   * Sets the master volume level.
   * @param volume Volume level (0.0 to 1.0).
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(volume, 1))
    this.applyVolumesToLoadedSounds()
  }

  /**
   * Sets the volume for music tracks.
   * @param volume Volume level (0.0 to 1.0).
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(volume, 1)) // Clamp volume
    // Apply the new volume to all sounds marked as music
    this.staticSounds.forEach((sound, name) => {
      const config = this.soundsConfig.get(name)
      if (config?.isMusic) {
        this.applyVolumeToSound(sound, config)
      }
    })
  }

  /**
   * Sets the volume for sound effects.
   * @param volume Volume level (0.0 to 1.0).
   */
  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(volume, 1)) // Clamp volume
    // Apply the new volume to all sounds NOT marked as music
    this.staticSounds.forEach((sound, name) => {
      const config = this.soundsConfig.get(name)
      if (config && !config.isMusic) {
        this.applyVolumeToSound(sound, config)
      }
    })
  }

  /**
   * Plays a sound by its registered name. Requires engine to be unlocked.
   * Volume applied here is a multiplier on top of the base and category volume.
   * @param name The name of the sound to play.
   * @param volumeMultiplier Optional volume multiplier for this specific playback (0 to 1+). Defaults to 1.0.
   * @param loop Optional override for looping.
   * @param attachTo Optional mesh or position to attach spatial sound to.
   */
  public playSound(name: string, volumeMultiplier: number = 1.0, loop?: boolean, attachTo?: AbstractMesh): void {
    if (!this.isReady) {
      // console.warn(`AudioManager not ready (sounds not loaded), cannot play sound: ${name}`);
      return
    }
    if (!this.isUnlocked) {
      // Autoplay might handle this for music, but SFX need interaction
      // console.warn(`AudioManager: Audio Engine not unlocked, cannot play sound: ${name}. Unlock requires user interaction.`);
      return
    }

    const sound = this.staticSounds.get(name)
    const soundConfig = this.soundsConfig.get(name)
    if (!sound || !soundConfig) {
      console.warn(`Sound not found: ${name}`)
      return
    }

    // Calculate final volume: base * category * multiplier
    const baseVolume = soundConfig.options?.volume ?? 1.0
    const categoryVolume = soundConfig.isMusic ? this.musicVolume : this.sfxVolume
    const finalVolume = baseVolume * categoryVolume * this.masterVolume * volumeMultiplier
    sound.volume = finalVolume

    // Override loop setting if provided
    if (loop !== undefined) {
      sound.loop = loop
    } else {
      // Default back to config loop setting if override not provided
      sound.loop = soundConfig.options?.loop ?? false
    }

    // Handle spatial attachment
    if (soundConfig.options?.spatialSound && attachTo) {
      sound.spatial.attach(attachTo)
    }

    // Play the sound
    sound.play()
  }

  /**
   * Stops a sound by its registered name.
   * @param name The name of the sound to stop.
   */
  public stopSound(name: string): void {
    if (!this.isReady) return
    const sound = this.staticSounds.get(name)
    sound?.stop()
  }

  /**
   * Disposes all loaded sounds and cleans up resources.
   */
  public dispose(): void {
    this.staticSounds.forEach((sound) => {
      sound.stop()
      sound.dispose()
    })
    this.staticSounds.clear()
    this.soundsConfig.clear()
    this.assetsManager.reset()
    // Dispose the audio engine if it was created
    this.audioEngine?.dispose()
    this.audioEngine = null
    this.isReady = false
    this.isUnlocked = false
    console.log('AudioManager disposed.')
  }
}
