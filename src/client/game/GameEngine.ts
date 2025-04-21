import { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager'
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin'
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe'
import { Scene } from '@babylonjs/core/scene'
import HavokPhysics from '@babylonjs/havok'
import { CustomLoadingScreen } from '@client/components/BabylonScene.tsx'
import { mapConfigs } from '@shared/maps/japan.ts'
import type { GameRoomState } from '@shared/schemas/GameRoomState.ts'
import type { Player } from '@shared/schemas/Player.ts'
import { type Room, getStateCallbacks } from 'colyseus.js'
import { InteractableObject } from './InteractableObject.ts'
import { LocalCharacterController } from './LocalCharacterController'
import { MapLoader } from './MapLoader.ts'
import { RemoteCharacterController } from './RemoteCharacterController'
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import { IngredientLoader } from '@client/game/IngredientLoader.ts'
import { SpatialGrid } from './SpatialGrid'
import { InputManager } from './managers/InputManager'
import { PerformanceManager } from './managers/PerformanceManager'
import { Ingredient, InteractType } from '@shared/types/enums.ts'
import { AudioManager, type SoundConfig } from '@client/game/managers/AudioManager.ts'
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Order } from '@shared/schemas/Order.ts'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import type { AssetContainer } from '@babylonjs/core/assetContainer'
import { getRecipeDefinition } from '@shared/recipes.ts'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { getItemDefinition } from '@shared/items.ts'
import type { Observer } from '@babylonjs/core/Misc/observable'
import { Scalar } from '@babylonjs/core/Maths/math.scalar'
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate'
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import { BackEase, EasingFunction, Animation, QuadraticEase } from '@babylonjs/core/Animations'

export class GameEngine {
  public interactables: InteractableObject[] = []
  private spatialGrid: SpatialGrid = new SpatialGrid(2.5)
  private readonly scene: Scene
  private readonly room: Room<GameRoomState>
  private localController?: LocalCharacterController
  private remoteControllers = new Map<string, RemoteCharacterController>()
  private shadowGenerator!: CascadedShadowGenerator
  private assetsManager!: AssetsManager
  private ingredientLoader!: IngredientLoader
  private inputManager: InputManager
  private performanceManager?: PerformanceManager
  private loadedCharacterContainer: any
  private poufParticleTexture: Texture | null = null
  private portalParticleTexture: Texture | null = null
  private onGameOverCallback: (score: number) => void = () => {}

  private chickTemplateMesh: AbstractMesh | null = null
  private chickAssetContainer: AssetContainer | null = null
  private chickenTemplateMesh: AbstractMesh | null = null
  private chickenAssetContainer: AssetContainer | null = null
  private spawnedCustomers = new Map<number, AbstractMesh>()

  private customerOrderMeshes = new Map<number, Mesh>()
  private orderUITextures = new Map<number, DynamicTexture>()
  private orderUIMaterials = new Map<number, StandardMaterial>()
  private uiRenderObserver: Observer<Scene> | null = null
  private readonly customerUIOffset = new Vector3(0, 2.0, 0)
  private _uiUpdatePosVector = new Vector3()

  private customerOrderData = new Map<number, { timeLeft: number; totalDuration: number }>()
  private customerOrderIcons = new Map<number, HTMLImageElement>()
  private lastOrderUIUpdateTimes = new Map<number, number>()
  private readonly orderUIUpdateInterval = 250

  // Pre-allocated vector for position calculations
  private _playerPosTemp: Vector3 = new Vector3()
  private loadingState = {
    assets: { progress: 0, total: 0, current: 0 },
    map: { progress: 0, loaded: false },
    currentTask: '',
  }

  // Network optimization properties
  private lastNetworkUpdateTime: number = 0
  private readonly NETWORK_UPDATE_INTERVAL: number = 10 // Send updates every 100ms instead of every frame
  private readonly MAX_NETWORK_UPDATE_INTERVAL: number = 100 // Maximum interval for network updates
  private readonly POSITION_THRESHOLD: number = 0.01 // Only send position updates if moved more than this distance
  private readonly ROTATION_THRESHOLD: number = 0.05 // Only send rotation updates if rotated more than this angle
  private lastSentPosition: Vector3 = new Vector3()
  private lastSentRotation: number = 0
  private lastSentAnimationState: string = ''

  private readonly audioManager: AudioManager

  private boundaryWalls: Mesh[] = []

  private soundList: SoundConfig[] = [
    { name: 'pickupPlace', path: 'assets/audio/pickup_place.ogg', options: { volume: 0.3 } },
    { name: 'trash', path: 'assets/audio/trash.ogg', options: { volume: 0.2 } },
    { name: 'orderComplete', path: 'assets/audio/order_complete.ogg', options: { volume: 0.4 } },
    { name: 'error', path: 'assets/audio/error.ogg', options: { volume: 0.2 } },
    { name: 'ovenLoop', path: 'assets/audio/oven_loop.ogg', options: { volume: 0.025, spatialSound: true, loop: true } },
    { name: 'footstep_wood_01', path: 'assets/audio/footstep_wood_001.ogg', options: { volume: 0.7, spatialSound: true, distanceModel: 'linear' } },
    { name: 'footstep_wood_02', path: 'assets/audio/footstep_wood_002.ogg', options: { volume: 0.7, spatialSound: true, distanceModel: 'linear' } },
    { name: 'footstep_wood_03', path: 'assets/audio/footstep_wood_003.ogg', options: { volume: 0.7, spatialSound: true, distanceModel: 'linear' } },
    { name: 'footstep_wood_04', path: 'assets/audio/footstep_wood_004.ogg', options: { volume: 0.7, spatialSound: true, distanceModel: 'linear' } },
    { name: 'jumpLand', path: 'assets/audio/jump_land.ogg', options: { volume: 0.5, spatialSound: true, distanceModel: 'linear' } },
    { name: 'timerTick', path: 'assets/audio/timer_tick.ogg', options: { volume: 0.4 } },
  ]

  // --- state for timer sound ---
  private isTimerTickingSoundPlaying: boolean = false
  private timerTickIntervalId: number | null = null

  constructor(scene: Scene, room: any, onGameOver: (score: number) => void) {
    this.scene = scene
    this.room = room
    this.onGameOverCallback = onGameOver

    this.audioManager = new AudioManager(this.scene)
    this.inputManager = new InputManager(this.scene, this.audioManager)

    // Enable hardware scaling to improve performance
    scene.getEngine().setHardwareScalingLevel(1.0)

    // Enable frustum culling for better performance
    scene.skipFrustumClipping = false
    scene.skipPointerMovePicking = true

    // Optimize shadow quality vs performance
    scene.shadowsEnabled = true
    scene.lightsEnabled = true
    scene.particlesEnabled = true
    scene.collisionsEnabled = true
    scene.fogEnabled = true
    scene.fogStart = 15

    // Set a reasonable physics timestep
    scene.getPhysicsEngine()?.setTimeStep(1 / 60)

    this._setupUIRenderObserver()
  }

  /**
   * Disposes of all resources used by the game engine.
   */
  dispose(): void {
    this.chickAssetContainer?.dispose()
    this.chickAssetContainer = null
    this.chickenAssetContainer?.dispose()
    this.chickenAssetContainer = null
    this.chickTemplateMesh = null

    if (this.poufParticleTexture) {
      this.poufParticleTexture.dispose()
      this.poufParticleTexture = null
    }

    this.spawnedCustomers.forEach((chickMesh) => {
      chickMesh.dispose()
    })
    this.spawnedCustomers.clear()

    this.localController?.dispose()
    this.remoteControllers.forEach((controller) => controller.dispose())
    this.remoteControllers.clear()
    this.audioManager.dispose()
    this.inputManager.dispose()
    this.performanceManager?.dispose()
    InteractableObject.reset()
    this.ingredientLoader?.dispose() // Dispose ingredient loader
    this.scene.dispose()

    if (this.uiRenderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.uiRenderObserver)
      this.uiRenderObserver = null
    }
    this.customerOrderMeshes.forEach((mesh) => mesh.dispose())
    this.customerOrderMeshes.clear()
    this.orderUITextures.forEach((texture) => texture.dispose())
    this.orderUITextures.clear()
    this.orderUIMaterials.forEach((material) => material.dispose())
    this.orderUIMaterials.clear()

    this.customerOrderData.clear()
    this.customerOrderIcons.clear()
    this.lastOrderUIUpdateTimes.clear()

    this.boundaryWalls.forEach((wall) => {
      // It's good practice to dispose the physics body before the mesh if possible
      wall.getPhysicsBody()?.dispose() // Dispose physics body
      wall.dispose() // Dispose mesh
    })
    this.boundaryWalls = [] // Clear the array

    console.log('GameEngine disposed')
  }

  /**
   * Plays a sound effect. Convenience method.
   * @param name Name of the sound defined in soundList.
   * @param volume Optional volume multiplier.
   * @param loop Optional loop override.
   * @param attachTo Optional mesh to attach the sound to.
   */
  public playSfx(name: string, volume: number = 1.0, loop?: boolean, attachTo?: AbstractMesh): void {
    this.audioManager.playSound(name, volume, loop, attachTo)
  }

  /**
   * Stops a sound effect. Convenience method.
   * @param name Name of the sound defined in soundList.
   */
  public stopSfx(name: string): void {
    this.audioManager.stopSound(name)
  }

  /**
   * Initializes the game:
   * – Sets up keyboard shortcuts (e.g. toggle the inspector)
   * – Creates lights, physics, and shadow generators
   * – Loads assets (including the player character model)
   * – Creates the environment (skybox, ground, etc.)
   */
  async init(): Promise<void> {
    // Make sure loading screen is shown
    const engine = this.scene.getEngine()
    engine.displayLoadingUI()

    await this.audioManager.initialize()

    // Toggle the Babylon Inspector with Ctrl+Alt+Shift+I (if in development mode)
    if (import.meta.env.DEV) {
      this.scene.onKeyboardObservable.add(async (kbInfo) => {
        if (kbInfo.event.ctrlKey && kbInfo.event.altKey && kbInfo.event.shiftKey && kbInfo.event.key === 'I') {
          const inspector = await import('@babylonjs/inspector')
          if (inspector.Inspector.IsVisible) {
            inspector.Inspector.Hide()
          } else {
            inspector.Inspector.Show(this.scene, {})
          }
        }
      })
    }

    // Create an AssetsManager to load assets
    this.assetsManager = new AssetsManager(this.scene)
    this.assetsManager.useDefaultLoadingScreen = false
    this.assetsManager.autoHideLoadingUI = false

    // Create an IngredientLoader to load ingredients
    this.ingredientLoader = new IngredientLoader(this.scene)

    // Load the character model (using a container task)
    const characterTask = this.assetsManager.addContainerTask('characterTask', '', 'assets/characters/', 'character.glb')

    // Enable physics with Havok (using the latest async initialization)
    const hk = new HavokPlugin(true, await HavokPhysics())
    this.scene.enablePhysics(new Vector3(0, -20, 0), hk)

    // Create basic lights
    const hemi = new HemisphericLight('hemilight', new Vector3(0, 1, 0), this.scene)
    hemi.intensity = 0.3

    const sun = new DirectionalLight('sun', new Vector3(-5, -10, 5).normalize(), this.scene)
    sun.position = sun.direction.negate().scaleInPlace(40)

    // Create a shadow generator with cartoonish style and optimized for performance
    this.shadowGenerator = new CascadedShadowGenerator(256, sun) // Further reduced shadow map size for performance
    this.shadowGenerator.useKernelBlur = true
    this.shadowGenerator.depthClamp = true // Optimize depth calculations
    this.shadowGenerator.autoCalcDepthBounds = true // Optimize depth bounds

    // The PerformanceManager will apply the cartoonish shadow settings

    // Initialize performance manager to handle FPS monitoring and shadow quality adjustments
    this.performanceManager = new PerformanceManager(this.scene, this.shadowGenerator)

    // Additional lights (if needed)
    const extraHemi = new HemisphericLight('extraHemi', Vector3.Up(), this.scene)
    extraHemi.intensity = 0.4

    const skybox = MeshBuilder.CreateBox('skyBox', { size: 150 }, this.scene)
    const skyboxMaterial = new StandardMaterial('skyBox', this.scene)
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.reflectionTexture = new CubeTexture('assets/skybox/skybox', this.scene)
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0)
    skyboxMaterial.specularColor = new Color3(0, 0, 0)
    skybox.material = skyboxMaterial

    // Create a reflection probe and set the environment texture
    const rp = new ReflectionProbe('ref', 512, this.scene)
    rp.renderList?.push(skybox)
    this.scene.environmentTexture = rp.cubeTexture

    // --- AJOUT DU BROUILLARD (Version Ajustée) ---
    this.scene.fogMode = Scene.FOGMODE_EXP2
    this.scene.fogColor = Color3.Lerp(Color3.FromHexString('#FBCFE8'), Color3.White(), 0.2)
    this.scene.fogDensity = 0.015 // Ajuste pour + ou - de brouillard
    this.scene.fogEnabled = true
    // --- FIN AJOUT BROUILLARD ---

    // When the character model is loaded, store it for later use
    characterTask.onSuccess = (task) => {
      this.loadedCharacterContainer = task.loadedContainer
    }

    this.assetsManager.onProgress = (remainingCount, totalCount, _) => {
      const percentage = (totalCount - remainingCount) / totalCount

      // If we’re using our CustomLoadingScreen instance
      const engine = this.scene.getEngine()
      if (engine.loadingScreen instanceof CustomLoadingScreen) {
        engine.loadingScreen.updateProgress(percentage * 100)
      }
    }

    const chickTask = this.assetsManager.addContainerTask('chickTask', '', 'assets/map/japan/', 'Chick.glb') // Adjust path if needed
    chickTask.onSuccess = (task) => {
      this.chickAssetContainer = task.loadedContainer
      // Find the main mesh within the container (usually the first root node)
      const rootNode = task.loadedContainer.rootNodes[0]
      if (rootNode instanceof AbstractMesh) {
        this.chickTemplateMesh = rootNode
        // Hide and disable the template itself
        this.chickTemplateMesh.setEnabled(false)
        this.chickTemplateMesh.isVisible = false
        this.chickTemplateMesh.isPickable = false
        this.chickTemplateMesh.getChildMeshes().forEach((child) => {
          child.setEnabled(false)
          child.isVisible = false
          child.isPickable = false
        })
      } else {
        console.error('Chick GLB loaded, but root node is not a mesh.')
      }
    }
    chickTask.onError = (_task, message, exception) => {
      console.error('Error loading Chick.glb:', message, exception)
    }

    const chickenTask = this.assetsManager.addContainerTask('chickenTask', '', 'assets/map/japan/', 'Chicken.glb')
    chickenTask.onSuccess = (task) => {
      this.chickenAssetContainer = task.loadedContainer
      // Find the main mesh within the container (usually the first root node)
      const rootNode = task.loadedContainer.rootNodes[0]
      if (rootNode instanceof AbstractMesh) {
        this.chickenTemplateMesh = rootNode
        // Hide and disable the template itself
        this.chickenTemplateMesh.setEnabled(false)
        this.chickenTemplateMesh.isVisible = false
        this.chickenTemplateMesh.isPickable = false
        this.chickenTemplateMesh.getChildMeshes().forEach((child) => {
          child.setEnabled(false)
          child.isVisible = false
          child.isPickable = false
        })
      } else {
        console.error('Chick GLB loaded, but root node is not a mesh.')
      }
    }
    chickenTask.onError = (_task, message, exception) => {
      console.error('Error loading Chick.glb:', message, exception)
    }

    const poufTexturePath = 'assets/particles/Star-Texture.png'
    try {
      this.poufParticleTexture = new Texture(poufTexturePath, this.scene)
      this.poufParticleTexture.hasAlpha = true
    } catch (error) {
      console.error('Failed to load pouf particle texture:', error)
    }

    const portalTexturePath = 'assets/particles/Runes1.png'
    try {
      this.portalParticleTexture = new Texture(portalTexturePath, this.scene)
      this.portalParticleTexture.hasAlpha = true
      console.log('Portal particle texture loaded successfully.')
    } catch (error) {
      console.error('Failed to load portal particle texture, falling back to pouf:', error)
      // Fallback to the old texture if flare.png doesn't exist
      const fallbackTexturePath = 'assets/particles/Star-Texture.png'
      try {
        this.poufParticleTexture = new Texture(fallbackTexturePath, this.scene)
        this.poufParticleTexture.hasAlpha = true
      } catch (fallbackError) {
        console.error('Failed to load fallback pouf texture:', fallbackError)
      }
    }

    // When all assets are loaded
    this.assetsManager.onFinish = () => {
      // Update loading state
      this.loadingState.assets.progress = 100
      this.loadingState.currentTask = 'Assets loaded, preparing map and sounds...'

      const engine = this.scene.getEngine()
      if (engine.loadingScreen instanceof CustomLoadingScreen) {
        engine.loadingScreen.loadingUIText = this.loadingState.currentTask
      }

      assetsLoaded = true
      checkLoadingComplete()
    }

    const kitchenFolder = 'assets/map/'
    const kitchenLoader = new MapLoader(this.scene, this.shadowGenerator, this.ingredientLoader)

    // Wait for both assets and map to load before hiding loading screen
    let assetsLoaded = false
    let mapLoaded = false
    let soundsLoaded = false
    let ingredientModelsLoaded = false

    const checkLoadingComplete = () => {
      if (assetsLoaded && mapLoaded && soundsLoaded && ingredientModelsLoaded) {
        const engine = this.scene.getEngine()
        if (engine.loadingScreen instanceof CustomLoadingScreen) {
          this.loadingState.currentTask = 'Initializing game...'
          engine.loadingScreen.loadingUIText = this.loadingState.currentTask
          engine.loadingScreen.updateProgress(100)

          this.createBoundaryWalls()

          // Initialize players now that everything is loaded
          this.initializePlayers()

          // Give a moment to show 100% before hiding
          setTimeout(() => {
            this.loadingState.currentTask = 'Ready!'
            if (engine.loadingScreen instanceof CustomLoadingScreen) {
              engine.loadingScreen.loadingUIText = this.loadingState.currentTask
              engine.loadingScreen.updateProgress(100)
            }
            setTimeout(() => engine.hideLoadingUI(), 500)
          }, 500)
        }
      }
    }

    this.audioManager.loadSounds(this.soundList, undefined, () => {
      soundsLoaded = true
      checkLoadingComplete()
    })

    this.ingredientLoader
      .loadIngredientModels()
      .then(() => {
        ingredientModelsLoaded = true
        checkLoadingComplete()
      })
      .catch((error) => {
        console.error('Error loading ingredient models:', error)
      })

    // Start asset loading.
    this.assetsManager.load()

    kitchenLoader.loadAndPlaceModels(
      kitchenFolder,
      mapConfigs,
      () => {
        this.interactables = kitchenLoader.interactables

        mapLoaded = true
        this.loadingState.map.loaded = true
        this.loadingState.map.progress = 100
        this.loadingState.currentTask = 'Map loading complete'
        if (engine.loadingScreen instanceof CustomLoadingScreen) {
          const totalProgress = (this.loadingState.assets.progress + this.loadingState.map.progress) / 2
          engine.loadingScreen.updateProgress(totalProgress)
          engine.loadingScreen.loadingUIText = this.loadingState.currentTask
        }

        const $ = getStateCallbacks(this.room)

        $(this.room.state).interactableObjects.onAdd((objState, key) => {
          const interactable = this.interactables.find((obj) => obj.id === Number(key))
          if (!interactable) {
            console.warn(`Interactable ${key} added to state but not found in client list.`)
            return
          }

          // Handle initial state and changes
          const updateInteractable = (state: typeof objState) => {
            interactable.setDisabled(state.disabled)

            // Handle activation/deactivation, passing timing info for ovens
            if (state.isActive) {
              interactable.activate(state.isActive)
            } else {
              interactable.deactivate()
            }

            interactable.updateProcessingProgress(state.processingTimeLeft, state.totalProcessingDuration)

            // Update ingredients on board (visuals)
            const ingredients = state.ingredientsOnBoard.map((i) => i as Ingredient)
            interactable.updateIngredientsOnBoard(ingredients)

            // Handle cooking visual separately if needed (e.g., showing item inside oven)
            if (interactable.interactType === InteractType.Oven) {
              const isCookingRecipe = state.isActive && state.processingRecipeId && state.processingEndTime > 0
              const recipe = isCookingRecipe ? getRecipeDefinition(state.processingRecipeId!) : null
              // Show the *input* ingredient visual if cooking started
              if (isCookingRecipe && recipe && recipe.requiredIngredients.length > 0) {
                interactable.showCookingVisual(recipe.requiredIngredients[0].ingredient) // Assuming first ingredient
              } else {
                interactable.hideCookingVisual()
              }
            }

            if (interactable.interactType === InteractType.ServingOrder) {
              interactable.showDirtyPlateVisual(state.hasDirtyPlate)
            } else {
              interactable.showDirtyPlateVisual(false)
            }
          }

          // Initial update
          updateInteractable(objState)

          // Listen for subsequent changes
          $(objState).onChange(() => {
            // Refetch interactable in case it was recreated (though unlikely here)
            const currentInteractable = this.interactables.find((obj) => obj.id === Number(key))
            if (currentInteractable) {
              updateInteractable(objState)
            }
          })

          // --- Specific Sound Handling (can remain mostly as is) ---
          if (interactable.interactType === InteractType.Oven) {
            // Oven loop sound tied to isActive state
            $(objState).listen('isActive', (currentValue, previousValue) => {
              if (currentValue && !previousValue) {
                this.audioManager.playSound('ovenLoop', 0.6, true, interactable.mesh)
              } else if (!currentValue && previousValue) {
                this.audioManager.stopSound('ovenLoop')
              }
            })
            // Initial check
            if (objState.isActive) {
              this.audioManager.playSound('ovenLoop', 0.6, true, interactable.mesh)
            }
          }

          if (interactable.interactType === InteractType.ChoppingBoard) {
            let previousIngredientsLength = objState.ingredientsOnBoard.length
            $(objState).listen('ingredientsOnBoard', (currentIngredients) => {
              if (currentIngredients.length !== previousIngredientsLength) {
                this.playSfx('pickupPlace')
                previousIngredientsLength = currentIngredients.length
              }
            })
          }
        })

        this.setupGameEventListeners()

        checkLoadingComplete()
      },
      (progress) => {
        this.loadingState.map.progress = progress
        this.loadingState.currentTask = `Loading map: ${progress.toFixed(0)}%`

        // Update loading screen with combined progress
        const engine = this.scene.getEngine()
        if (engine.loadingScreen instanceof CustomLoadingScreen) {
          const totalProgress = (this.loadingState.assets.progress + this.loadingState.map.progress) / 2
          engine.loadingScreen.updateProgress(totalProgress)
          engine.loadingScreen.loadingUIText = this.loadingState.currentTask
        }
      },
      this.room.state.mapHash, // Pass the server's map hash for verification
    )

    // Request initial pointer lock and focus
    this.inputManager.requestFocusAndPointerLock()
  }

  private _setupUIRenderObserver(): void {
    if (this.uiRenderObserver) {
      this.scene.onBeforeRenderObservable.remove(this.uiRenderObserver) // Remove old one if exists
    }
    this.uiRenderObserver = this.scene.onBeforeRenderObservable.add(() => {
      const now = Date.now()

      this.customerOrderMeshes.forEach((uiMesh, chairId) => {
        const customerMesh = this.spawnedCustomers.get(chairId)

        if (customerMesh && customerMesh.isEnabled()) {
          // --- Update Position (as before) ---
          customerMesh.getAbsolutePosition().addToRef(this.customerUIOffset, this._uiUpdatePosVector)
          uiMesh.setAbsolutePosition(this._uiUpdatePosVector)
          if (!uiMesh.isEnabled()) uiMesh.setEnabled(true)

          // --- Update Texture (Throttled) ---
          const lastUpdate = this.lastOrderUIUpdateTimes.get(chairId) ?? 0
          if (now - lastUpdate > this.orderUIUpdateInterval) {
            const texture = this.orderUITextures.get(chairId)
            const orderData = this.customerOrderData.get(chairId)
            const iconImage = this.customerOrderIcons.get(chairId) // Get preloaded image

            if (texture && orderData && iconImage && iconImage.complete) {
              // Ensure image is loaded
              this.drawOrderUIWithTimer(texture, orderData, iconImage)
              this.lastOrderUIUpdateTimes.set(chairId, now)
            }
          }
        } else {
          // Hide UI if customer doesn't exist or is disabled
          if (uiMesh.isEnabled()) uiMesh.setEnabled(false)
          // Also clear the update timer tracker if the customer disappears
          if (this.lastOrderUIUpdateTimes.has(chairId)) {
            this.lastOrderUIUpdateTimes.delete(chairId)
          }
        }
      })
    })
  }

  /**
   * Creates invisible boundary walls around the map.
   */
  private createBoundaryWalls(): void {
    // Define map boundaries (adjust these based on your actual map size)
    const minX = -9
    const maxX = 9
    const minZ = -9
    const maxZ = 9
    const wallHeight = 20 // Make walls tall enough
    const wallThickness = 0.5 // Relatively thin walls

    const createWall = (name: string, position: Vector3, size: Vector3) => {
      const wall = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene)
      wall.position = position
      wall.visibility = 0 // Make the wall invisible
      wall.isPickable = false // Not interactable

      // Add static physics body
      new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0, friction: 0.5, restitution: 0.1 }, this.scene)
      // wallAggregate.body.setMotionType(PhysicsMotionType.STATIC); // Mass 0 usually implies static

      this.boundaryWalls.push(wall) // Keep track for disposal
    }

    // Calculate lengths based on boundaries
    const wallLengthX = maxX - minX + wallThickness // Add thickness to span correctly
    const wallLengthZ = maxZ - minZ + wallThickness

    // Wall positions (centered vertically)
    const wallY = wallHeight / 2

    // Back wall (negative Z)
    createWall(
      'BoundaryWall_Back',
      new Vector3((minX + maxX) / 2, wallY, minZ - wallThickness / 2),
      new Vector3(wallLengthX, wallHeight, wallThickness),
    )

    // Front wall (positive Z)
    createWall(
      'BoundaryWall_Front',
      new Vector3((minX + maxX) / 2, wallY, maxZ + wallThickness / 2),
      new Vector3(wallLengthX, wallHeight, wallThickness),
    )

    // Left wall (negative X)
    createWall(
      'BoundaryWall_Left',
      new Vector3(minX - wallThickness / 2, wallY, (minZ + maxZ) / 2),
      new Vector3(wallThickness, wallHeight, wallLengthZ),
    )

    // Right wall (positive X)
    createWall(
      'BoundaryWall_Right',
      new Vector3(maxX + wallThickness / 2, wallY, (minZ + maxZ) / 2),
      new Vector3(wallThickness, wallHeight, wallLengthZ),
    )

    console.log(`Created ${this.boundaryWalls.length} invisible boundary walls.`)
  }

  private setupGameEventListeners(): void {
    const $ = getStateCallbacks(this.room)

    // Listen for interactable object changes (e.g., oven state)
    $(this.room.state).interactableObjects.onAdd((objState, key) => {
      // Find the corresponding client-side interactable object
      const interactable = this.interactables.find((obj) => obj.id === Number(key))
      if (!interactable) return

      // --- Oven Sound ---
      if (interactable.interactType === InteractType.Oven) {
        const isCookingRiceInitially = objState.isActive && objState.processingRecipeId === 'cooked_rice_recipe'
        if (isCookingRiceInitially) {
          interactable.showCookingVisual(Ingredient.Rice)
        } else {
          interactable.hideCookingVisual()
        }

        $(objState).onChange(() => {
          const isCookingRiceNow = objState.isActive && objState.processingRecipeId === 'cooked_rice_recipe'
          if (isCookingRiceNow) {
            interactable.showCookingVisual(Ingredient.Rice)
          } else {
            interactable.hideCookingVisual()
          }

          // Update ingredients on top AFTER cooking is finished
          if (!objState.isActive && objState.ingredientsOnBoard.length > 0) {
            const ingredients = objState.ingredientsOnBoard.map((i) => i as Ingredient)
            interactable.updateIngredientsOnBoard(ingredients)
          } else if (!objState.isActive) {
            // Clear if cooking is finished and there are no ingredients
            interactable.clearIngredientsOnBoard()
          }
        })

        $(objState).listen('isActive', (currentValue, previousValue) => {
          if (currentValue && !previousValue) {
            this.audioManager.playSound('ovenLoop', 0.6, true, interactable.mesh)
          } else if (!currentValue && previousValue) {
            this.audioManager.stopSound('ovenLoop')
          }
        })

        // Initial state check for oven
        if (objState.isActive) {
          this.audioManager.playSound('ovenLoop', 0.6, true, interactable.mesh)
        }
      }

      // --- Chopping Board Sounds ---
      if (interactable.interactType === InteractType.ChoppingBoard) {
        let previousIngredients = [...objState.ingredientsOnBoard.values()]

        $(objState).onChange(() => {
          const currentIngredients = objState.ingredientsOnBoard

          const currentArray = [...currentIngredients.values()]

          if (currentArray.length !== previousIngredients.length) {
            this.playSfx('pickupPlace')
          }

          previousIngredients = currentArray
        })
      }

      $(objState).onChange(() => {
        const interactable = this.interactables.find((obj) => obj.id === Number(objState.id))
        if (!interactable) return
        interactable.setDisabled(objState.disabled)
        if (objState.isActive && interactable.interactType !== InteractType.Oven) {
          interactable.activate(objState.isActive)
        } else if (!objState.isActive && interactable.interactType !== InteractType.Oven) {
          interactable.deactivate()
        }

        const ingredients = objState.ingredientsOnBoard.map((i) => i as Ingredient)
        interactable.updateIngredientsOnBoard(ingredients)
      })
      // Initial state check (existing logic)
      const initialInteractable = this.interactables.find((obj) => obj.id === Number(objState.id))
      if (initialInteractable) {
        initialInteractable.setDisabled(objState.disabled)
        const ingredients = objState.ingredientsOnBoard.map((i) => i as Ingredient)
        initialInteractable.updateIngredientsOnBoard(ingredients)

        // Activate non-oven items initially if needed
        if (objState.isActive && initialInteractable.interactType !== InteractType.Oven) {
          initialInteractable.activate(objState.isActive)
        }
      }
    })

    const handleTimeLeftChange = (newTimeLeft: number) => {
      const isUrgent = newTimeLeft <= 10000 && newTimeLeft > 0 // Check if time is 10s or less, but not zero

      if (isUrgent && !this.isTimerTickingSoundPlaying) {
        // Start Ticking Sound (repeatedly)
        this.isTimerTickingSoundPlaying = true
        // Clear any previous interval just in case
        if (this.timerTickIntervalId !== null) {
          clearInterval(this.timerTickIntervalId)
        }
        // Play immediately once
        this.playSfx('timerTick')
        // Then play every second
        this.timerTickIntervalId = window.setInterval(() => {
          // Check again inside interval in case state changed rapidly
          if (this.room.state.timeLeft <= 10000 && this.room.state.timeLeft > 0) {
            this.playSfx('timerTick')
          } else {
            // Stop if time went up or reached zero during the interval
            this.stopTimerTickingSound()
          }
        }, 1000)
      } else if (!isUrgent && this.isTimerTickingSoundPlaying) {
        this.stopTimerTickingSound()
      }
    }

    $(this.room.state).orders.onAdd((order: Order) => {
      if (order.chairId !== -1) {
        this.handleSpawnChick(order.chairId, order.customerType)
        // Store data needed for the timer
        this.customerOrderData.set(order.chairId, {
          timeLeft: order.timeLeft,
          totalDuration: order.totalDuration,
        })
        this.createCustomerOrderUI_3D(order.chairId, order.recipeId)
      }

      $(order).listen('timeLeft', (newTimeLeft) => {
        if (this.customerOrderData.has(order.chairId)) {
          // Update stored data
          this.customerOrderData.set(order.chairId, {
            timeLeft: newTimeLeft,
            totalDuration: order.totalDuration, // Keep total duration
          })
          // Force UI update by resetting last update time
          this.lastOrderUIUpdateTimes.set(order.chairId, 0)
        }
      })
    })

    $(this.room.state).orders.onRemove((order: Order) => {
      if (order.chairId !== -1) {
        this.handleRemoveChick(order.chairId)
        this.removeCustomerOrderUI_3D(order.chairId)
        this.customerOrderData.delete(order.chairId)
        this.lastOrderUIUpdateTimes.delete(order.chairId)
      }
    })

    // Listen for changes
    $(this.room.state).listen('timeLeft', handleTimeLeftChange)

    // --- Listen for Server Messages (Errors, etc.) ---
    this.room.onMessage('alreadyCarrying', () => this.playSfx('error'))
    this.room.onMessage('noIngredient', () => this.playSfx('error'))
    this.room.onMessage('invalidIngredient', () => this.playSfx('error'))
    this.room.onMessage('noMatchingOrder', () => this.playSfx('error'))
    this.room.onMessage('needPlate', () => this.playSfx('error'))
    this.room.onMessage('wrongIngredient', () => this.playSfx('error'))
    this.room.onMessage('wrongOrder', () => this.playSfx('error'))
    this.room.onMessage('orderCompleted', () => this.playSfx('orderComplete'))

    this.room.onMessage('invalidServe', () => this.playSfx('error'))
    this.room.onMessage('stationBusy', () => this.playSfx('error'))
    this.room.onMessage('cannotPickup', () => this.playSfx('error'))
    this.room.onMessage('invalidPickup', () => this.playSfx('error'))
    this.room.onMessage('boardFull', () => this.playSfx('error'))
    this.room.onMessage('invalidCombination', () => this.playSfx('error'))
    this.room.onMessage('boardNotEmpty', () => this.playSfx('error'))
    this.room.onMessage('boardEmpty', () => this.playSfx('error'))
    this.room.onMessage('cannotPlaceRaw', () => this.playSfx('error'))
    this.room.onMessage('error', (payload) => {
      // Generic error handler
      console.warn('Received error from server:', payload?.message || 'Unknown error')
      this.playSfx('error')
    })

    this.room.onMessage('orderCompleted', () => this.playSfx('orderComplete'))

    this.room.onMessage('gameOver', (payload: { finalScore: number }) => {
      console.log('Game Over! Final Score:', payload.finalScore)

      // Call the callback provided by the React component
      this.onGameOverCallback(payload.finalScore)

      // Stop game actions
      this.localController?.inputMap.clear() // Disable local player input
      this.audioManager.stopSound('ovenLoop') // Stop oven sound if playing
      this.stopTimerTickingSound() // Stop timer tick sound if playing

      // Unlock pointer if locked
      if (this.scene.getEngine().isPointerLock) {
        document.exitPointerLock()
      }

      this.dispose()
    })
  }

  private createCustomerOrderUI_3D(chairId: number, recipeId: string): void {
    if (this.customerOrderMeshes.has(chairId)) {
      this.removeCustomerOrderUI_3D(chairId)
    }
    const customerMesh = this.spawnedCustomers.get(chairId)
    if (!customerMesh) return
    const recipe = getRecipeDefinition(recipeId)
    if (!recipe) return
    const finalItem = getItemDefinition(recipe.result.ingredient)
    if (!finalItem || !finalItem.icon) return

    const iconUrl = `/ingredients/${finalItem.icon}.png`
    const planeSize = 0.6
    const textureWidth = 128
    const textureHeight = 128

    const plane = MeshBuilder.CreatePlane(`orderPlane_${chairId}`, { size: planeSize }, this.scene)
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL
    plane.isPickable = false
    plane.renderingGroupId = 1
    plane.position = customerMesh.getAbsolutePosition().add(this.customerUIOffset)
    plane.setEnabled(true)

    const dynamicTexture = new DynamicTexture(
      `orderTex_${chairId}`,
      { width: textureWidth, height: textureHeight },
      this.scene,
      false,
      Texture.TRILINEAR_SAMPLINGMODE,
    )
    dynamicTexture.hasAlpha = true

    const img = new Image()
    img.src = iconUrl
    img.onload = () => {
      this.customerOrderIcons.set(chairId, img)
      const orderData = this.customerOrderData.get(chairId) // Fetch the already stored {timeLeft, totalDuration}
      if (orderData) {
        this.drawOrderUIWithTimer(dynamicTexture, orderData, img) // Initial draw with correct data
      }
    }
    img.onerror = () => {
      console.error(`[UI 3D] Failed to load icon: ${iconUrl}`)
      const placeholderImg = new Image()
      placeholderImg.width = 1
      placeholderImg.height = 1
      this.customerOrderIcons.set(chairId, placeholderImg)
      const orderData = this.customerOrderData.get(chairId)
      if (orderData) {
        this.drawOrderUIWithTimer(dynamicTexture, orderData, placeholderImg, true)
      }
    }

    const material = new StandardMaterial(`orderMat_${chairId}`, this.scene)
    material.diffuseTexture = dynamicTexture
    material.opacityTexture = dynamicTexture
    material.useAlphaFromDiffuseTexture = false
    material.specularColor = new Color3(0, 0, 0)
    material.emissiveColor = Color3.White()
    material.disableLighting = true
    material.backFaceCulling = false
    plane.material = material

    this.customerOrderMeshes.set(chairId, plane)
    this.orderUITextures.set(chairId, dynamicTexture)
    this.orderUIMaterials.set(chairId, material)
    this.lastOrderUIUpdateTimes.set(chairId, 0) // Force initial draw via observer
  }

  private drawOrderUIWithTimer(
    texture: DynamicTexture,
    orderData: { timeLeft: number; totalDuration: number }, // MODIFIED signature
    iconImage: HTMLImageElement,
    loadError: boolean = false,
  ): void {
    const textureWidth = texture.getSize().width
    const textureHeight = texture.getSize().height
    const ctx = texture.getContext() as CanvasRenderingContext2D
    if (!ctx) return

    // --- Calculate Time Percentage using timeLeft and totalDuration ---
    let percentage = 1.0
    if (orderData.totalDuration > 0) {
      // Check totalDuration first
      percentage = Scalar.Clamp(orderData.timeLeft / orderData.totalDuration, 0, 1)
    } else if (orderData.timeLeft <= 0) {
      // Handle edge case where duration might be 0 but time is up
      percentage = 0
    }
    // --- End Percentage Calculation ---

    const padding = 16
    const progressBarHeight = 18
    const iconAreaHeight = textureHeight - progressBarHeight - padding * 3
    const iconAreaY = padding
    const progressBarY = iconAreaY + iconAreaHeight + padding

    ctx.clearRect(0, 0, textureWidth, textureHeight)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.beginPath()
    ctx.roundRect(padding / 2, padding / 2, textureWidth - padding, textureHeight - padding, 15)
    ctx.fill()

    if (!loadError && iconImage.complete && iconImage.naturalWidth > 0) {
      const iconSize = Math.min(textureWidth - padding * 2, iconAreaHeight) * 0.9
      const iconX = (textureWidth - iconSize) / 2
      const iconY = iconAreaY + (iconAreaHeight - iconSize) / 2
      ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize)
    } else if (loadError) {
      ctx.fillStyle = 'white'
      ctx.font = 'bold 30px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', textureWidth / 2, iconAreaY + iconAreaHeight / 2)
    }

    // --- Draw Progress Bar (Only if totalDuration exists) ---
    if (orderData.totalDuration > 0) {
      const barX = padding
      const barWidth = textureWidth - padding * 2
      const fillWidth = barWidth * percentage

      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'
      ctx.fillRect(barX, progressBarY, barWidth, progressBarHeight)

      let fillColor = '#4ade80' // Green
      if (percentage < 0.25)
        fillColor = '#f87171' // Red
      else if (percentage < 0.6) fillColor = '#facc15' // Yellow
      ctx.fillStyle = fillColor
      ctx.fillRect(barX, progressBarY, fillWidth, progressBarHeight)

      ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, progressBarY, barWidth, progressBarHeight)
    }
    // --- End Progress Bar Drawing ---

    texture.update(true)
  }

  private removeCustomerOrderUI_3D(chairId: number): void {
    const mesh = this.customerOrderMeshes.get(chairId)
    if (mesh) {
      mesh.dispose()
      this.customerOrderMeshes.delete(chairId)
    }
    const texture = this.orderUITextures.get(chairId)
    if (texture) {
      texture.dispose()
      this.orderUITextures.delete(chairId)
    }
    const material = this.orderUIMaterials.get(chairId)
    if (material) {
      material.dispose()
      this.orderUIMaterials.delete(chairId)
    }
    this.customerOrderData.delete(chairId) // Ensure data is cleaned up too
    this.customerOrderIcons.delete(chairId)
    this.lastOrderUIUpdateTimes.delete(chairId)
  }

  private handleSpawnChick(chairId: number, customerType: string): void {
    if (this.spawnedCustomers.has(chairId)) return

    const templateMesh = customerType === 'chick' ? this.chickTemplateMesh : this.chickenTemplateMesh
    const templateContainer = customerType === 'chick' ? this.chickAssetContainer : this.chickenAssetContainer

    if (!templateMesh || !templateContainer) {
      console.error(`${customerType === 'chick' ? 'Chick' : 'Chicken'} template mesh or container is not loaded or available. Cannot spawn.`)
      return
    }

    const chairObject = this.interactables.find((obj) => obj.id === chairId && obj.interactType === InteractType.ServingOrder)
    if (!chairObject) {
      console.error(`Could not find chair object with ID ${chairId} to spawn customer.`)
      return
    }

    const instance = templateContainer.instantiateModelsToScene((name) => `${name}_${chairId}`, false, { doNotInstantiate: true })
    const newCustomer = instance.rootNodes[0] as AbstractMesh

    if (!newCustomer) {
      console.error(`Failed to clone customer template mesh for chair ${chairId}.`)
      return
    }

    newCustomer.setEnabled(true)
    newCustomer.isVisible = true
    newCustomer.isPickable = false

    newCustomer.getChildMeshes().forEach((child) => {
      child.setEnabled(true)
      child.isVisible = true
      child.isPickable = false
      if (child.material) {
        child.material = child.material.clone(`${child.material.name}_${chairId}`)
      }
    })

    const finalScale = new Vector3(0.075, 0.075, 0.075)
    newCustomer.scaling = Vector3.Zero()

    const chairMesh = chairObject.mesh
    const chairPosition = chairMesh.getAbsolutePosition()
    const customerPosition = chairPosition.add(new Vector3(0, 0.05, 0))
    newCustomer.position = customerPosition
    newCustomer.rotation = chairMesh.rotation ? chairMesh.rotation.clone() : Vector3.Zero()

    this.spawnedCustomers.set(chairId, newCustomer)

    const animationDurationSeconds = 0.4
    const frameRate = 60
    const totalFrames = animationDurationSeconds * frameRate

    const scaleAnimation = new Animation(
      `customerSpawnScale_${chairId}`,
      'scaling',
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
    )

    const keys = []
    keys.push({
      frame: 0,
      value: Vector3.Zero(),
    })
    keys.push({
      frame: totalFrames,
      value: finalScale,
    })
    scaleAnimation.setKeys(keys)

    const easingFunction = new BackEase(0.6)
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
    scaleAnimation.setEasingFunction(easingFunction)

    newCustomer.animations = newCustomer.animations || []
    newCustomer.animations.push(scaleAnimation)

    this.scene.beginAnimation(newCustomer, 0, totalFrames, false, 1.0, () => {
      newCustomer.scaling.copyFrom(finalScale)
    })

    this.createPortalSpawnEffect(customerPosition)
  }

  private handleRemoveChick(chairId: number): void {
    const customerMesh = this.spawnedCustomers.get(chairId)
    if (customerMesh) {
      // 1. Define and start the scale-down animation
      const animationDurationSeconds = 0.3
      const frameRate = 60
      const totalFrames = animationDurationSeconds * frameRate

      const scaleAnimation = new Animation(
        `customerDespawnScale_${chairId}`,
        'scaling',
        frameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      )

      // Keys: From current scale to zero
      const keys = []
      keys.push({
        frame: 0,
        value: customerMesh.scaling.clone(),
      })
      keys.push({
        frame: totalFrames,
        value: Vector3.Zero(), // End at zero scale
      })
      scaleAnimation.setKeys(keys)

      // Optional: Add easing for a smoother start
      const easingFunction = new QuadraticEase()
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEIN)
      scaleAnimation.setEasingFunction(easingFunction)

      // Ensure previous animations on scaling are stopped if any
      this.scene.stopAnimation(customerMesh, `customerSpawnScale_${chairId}`)

      // Attach animation
      customerMesh.animations = customerMesh.animations || []
      customerMesh.animations.push(scaleAnimation)

      // 2. Begin the animation and schedule disposal in the callback
      this.scene.beginAnimation(customerMesh, 0, totalFrames, false, 1.0, () => {
        if (customerMesh && !customerMesh.isDisposed()) {
          customerMesh.dispose()
        }
        this.spawnedCustomers.delete(chairId)
      })
    } else {
      this.spawnedCustomers.delete(chairId)
    }

    this.removeCustomerOrderUI_3D(chairId)
    this.customerOrderData.delete(chairId)
  }

  private createPortalSpawnEffect(position: Vector3): void {
    const capacity = 150 // Slightly more particles for a denser effect
    const ps = new ParticleSystem(`portalSpawn_${position.x}_${position.z}`, capacity, this.scene)

    // Use the loaded portal texture, or the fallback
    if (this.portalParticleTexture) {
      ps.particleTexture = this.portalParticleTexture
    } else if (this.poufParticleTexture) {
      console.warn('Using fallback pouf texture for portal effect.')
      ps.particleTexture = this.poufParticleTexture
    } else {
      console.error('No particle texture available for portal effect.')
      return // Don't create the system if no texture is available
    }

    // Emit from a small sphere slightly above the target position for a rising effect
    ps.emitter = position.clone().addInPlace(new Vector3(0, 0.1, 0)) // Slightly elevated
    // Emit from the surface of a sphere to give an initial shape
    ps.particleEmitterType = ps.createSphereEmitter(0.15) // Radius of the emission sphere

    // Colors - Magical Blue/Cyan/Purple theme
    ps.color1 = new Color4(0.5, 0.8, 1.0, 1.0) // Light Cyan
    ps.color2 = new Color4(0.7, 0.5, 1.0, 1.0) // Light Purple
    ps.colorDead = new Color4(0.1, 0.1, 0.2, 0.0) // Fade to dark transparent

    // Color gradient for a more dynamic effect
    ps.addColorGradient(0.0, new Color4(0.8, 0.9, 1.0, 1.0)) // Almost white/cyan at start
    ps.addColorGradient(0.6, new Color4(0.6, 0.5, 1.0, 0.7)) // Transition to purple, reduced alpha
    ps.addColorGradient(1.0, ps.colorDead.clone()) // Transparent end

    // Size - Start small, grow, then shrink
    ps.minSize = 0.03
    ps.maxSize = 0.15
    ps.addSizeGradient(0, 0.02) // Start very small
    ps.addSizeGradient(0.4, 0.15) // Grow quickly
    ps.addSizeGradient(1.0, 0.01) // Shrink at the end

    // Short lifetime for a quick effect
    ps.minLifeTime = 0.4
    ps.maxLifeTime = 0.8

    // Emit in a quick burst
    ps.emitRate = capacity / ps.minLifeTime // Emit all particles during the minimum lifetime
    ps.manualEmitCount = capacity // Ensure all are emitted

    // Emission Speed/Power
    ps.minEmitPower = 1.5
    ps.maxEmitPower = 3.0 // Faster than the pouf
    ps.updateSpeed = 0.008 // Update speed

    // Gravity - Slight initial rise then gentle fall
    ps.gravity = new Vector3(0, -1.5, 0) // Slight downward gravity

    // Direction - Outward expansion with a slight upward component
    ps.direction1 = new Vector3(-0.8, 0.5, -0.8) // Horizontal expansion and a bit upwards
    ps.direction2 = new Vector3(0.8, 1.0, 0.8)

    // Rotation/Swirl - Key element for the portal effect
    ps.minAngularSpeed = -Math.PI * 3
    ps.maxAngularSpeed = Math.PI * 3 // High rotation speed

    // Additive blending for a bright/magical effect
    ps.blendMode = ParticleSystem.BLENDMODE_ADD

    ps.disposeOnStop = true // Clean up after stopping

    // Start the effect and schedule stop
    ps.start()
    setTimeout(
      () => {
        ps.stop()
      },
      ps.maxLifeTime * 1000 + 100,
    ) // Stop slightly after max lifetime
  }

  private stopTimerTickingSound(): void {
    if (this.timerTickIntervalId !== null) {
      clearInterval(this.timerTickIntervalId)
      this.timerTickIntervalId = null
    }
    this.isTimerTickingSoundPlaying = false
  }

  /**
   * Called every frame.
   * Updates the local player, sends movement messages, updates remote players, and updates GUI.
   */
  // Maximum distance to check for interactable objects
  private readonly MAX_INTERACTION_DISTANCE: number = 5
  // Track the nearest interactable for optimization
  private _nearestInteractable: InteractableObject | null = null

  update(deltaTime: number): void {
    const deltaSeconds = deltaTime / 1000

    // Update local player
    this.localController?.update(deltaSeconds)

    if (this.localController) {
      // Get player position using pre-allocated vector
      this._playerPosTemp.copyFrom(this.localController.position)

      // Only rebuild spatial grid occasionally or when needed
      // In a real implementation, you might want to rebuild only when objects move
      if (this.scene.getFrameId() % 60 === 0) {
        // Rebuild every 60 frames
        this.spatialGrid.rebuild(this.interactables)
      }

      // Find nearby interactable objects using spatial grid
      const maxDist = this.MAX_INTERACTION_DISTANCE / 2
      const nearbyObjects = this.spatialGrid.getNearbyObjects(this._playerPosTemp, maxDist)

      // Find the nearest interactable within range
      let nearest: InteractableObject | null = null
      let nearestDist = Infinity

      for (const obj of nearbyObjects) {
        const dist = Vector3.Distance(obj.mesh.position, this._playerPosTemp)
        if (dist < obj.interactionDistance && dist < nearestDist) {
          nearestDist = dist
          nearest = obj
        }
      }

      // Only update prompts if the nearest object has changed
      if (nearest !== this._nearestInteractable) {
        // Hide previous nearest if it exists
        if (this._nearestInteractable) {
          this._nearestInteractable.showPrompt(false)
        }

        // Show new nearest if it exists
        if (nearest) {
          nearest.showPrompt(true)
        }

        // Update cached nearest
        this._nearestInteractable = nearest
      }
    }

    // Send player position to server with throttling
    if (this.room && this.localController) {
      const currentTime = Date.now()
      const transform = this.localController.getTransform()
      const currentPosition = transform.position
      const currentRotation = transform.rotationQuaternion?.toEulerAngles().y || 0
      const animationState = this.localController.getTargetAnim.name

      // Check if we should send an update based on time interval or significant movement
      const timeSinceLastUpdate = currentTime - this.lastNetworkUpdateTime
      const positionChanged = Vector3.Distance(currentPosition, this.lastSentPosition) > this.POSITION_THRESHOLD
      const rotationChanged = Math.abs(currentRotation - this.lastSentRotation) > this.ROTATION_THRESHOLD
      const animationStateChanged = this.lastSentAnimationState !== animationState

      if (
        timeSinceLastUpdate >= this.MAX_NETWORK_UPDATE_INTERVAL ||
        (timeSinceLastUpdate >= this.NETWORK_UPDATE_INTERVAL && (positionChanged || rotationChanged || animationStateChanged))
      ) {
        // Send position update to server
        this.room.send('move', {
          position: {
            x: currentPosition.x,
            y: currentPosition.y,
            z: currentPosition.z,
          },
          rotation: { y: currentRotation },
          animationState,
          timestamp: currentTime,
        })

        // Update last sent values
        this.lastSentPosition.copyFrom(currentPosition)
        this.lastSentRotation = currentRotation
        this.lastSentAnimationState = animationState
        this.lastNetworkUpdateTime = currentTime
      }
    }

    this.remoteControllers.forEach((controller) => {
      controller.update(deltaSeconds)
    })

    // Update performance metrics and optimizations
    this.performanceManager?.update()
  }

  public tryInteract(characterController: LocalCharacterController): void {
    // Use the cached nearest interactable if available and in range
    if (
      this._nearestInteractable &&
      Vector3.Distance(this._nearestInteractable.mesh.position, characterController.position) <= this._nearestInteractable.interactionDistance
    ) {
      // Trigger interaction with the cached nearest
      this._nearestInteractable.interact()

      this.room.send('interact', {
        objectId: this._nearestInteractable.id,
        timestamp: Date.now(),
      })
      return
    }

    // If no cached nearest or it's out of range, find the nearest using spatial grid
    this._playerPosTemp.copyFrom(characterController.position)
    const nearbyObjects = this.spatialGrid.getNearbyObjects(this._playerPosTemp, this.MAX_INTERACTION_DISTANCE)

    let nearest: InteractableObject | null = null
    let nearestDist = Infinity

    for (const obj of nearbyObjects) {
      const dist = Vector3.Distance(obj.mesh.position, this._playerPosTemp)
      if (dist < obj.interactionDistance && dist < nearestDist) {
        nearestDist = dist
        nearest = obj
      }
    }

    if (nearest) {
      // Update cached nearest
      this._nearestInteractable = nearest

      // Trigger interaction
      nearest.interact()

      this.room.send('interact', {
        objectId: nearest.id,
        timestamp: Date.now(),
      })
    }
  }

  private initializePlayers(): void {
    if (!this.loadedCharacterContainer) {
      console.error('Character container not loaded!')
      return
    }

    // Instantiate the local player from the loaded container
    const localInstance = this.loadedCharacterContainer.instantiateModelsToScene((name: string) => name)
    const mesh = localInstance.rootNodes[0] as Mesh
    mesh.scaling = new Vector3(0.9, 0.9, 0.9)
    mesh.rotation = new Vector3(0, 0, 0)
    this.localController = new LocalCharacterController(
      this,
      mesh,
      this.ingredientLoader,
      localInstance.animationGroups,
      this.scene,
      this.audioManager,
    )
    this.localController.model.receiveShadows = true
    this.shadowGenerator.addShadowCaster(this.localController.model)

    const $ = getStateCallbacks(this.room)

    // Listen for new remote players joining via the Colyseus room state
    $(this.room.state).players.onAdd(async (player: Player, sessionId: string) => {
      if (sessionId === this.room.sessionId) {
        // Local player state handling
        this.localController?.setPosition(new Vector3(player.x, player.y, player.z))
        this.localController?.setRotationY(player.rot)

        $(player).listen('holdingPlate', (value: boolean) => {
          if (!this.localController) return

          if (value && !this.localController.isHoldingPlate) {
            this.localController.forcePickupPlate()
          } else if (!value && this.localController.isHoldingPlate) {
            this.localController.dropPlate()
          }
        })

        $(player).listen('holdedIngredient', (value: Ingredient) => {
          if (!this.localController) return

          this.localController.forceSetIngredient(value)
        })

        return
      }

      // Instantiate a remote player model
      const remoteInstance = this.loadedCharacterContainer.instantiateModelsToScene((name: string) => name)
      const remoteMesh = remoteInstance.rootNodes[0] as Mesh

      remoteMesh.scaling = new Vector3(0.9, 0.9, 0.9)
      remoteMesh.rotation = new Vector3(0, 0, 0)
      const remoteController = new RemoteCharacterController(
        remoteMesh,
        this.scene,
        this.ingredientLoader,
        remoteInstance.animationGroups,
        this.audioManager,
      )
      remoteController.setPosition(new Vector3(player.x, player.y, player.z))
      remoteController.setRotationY(player.rot)

      remoteMesh.receiveShadows = true
      this.shadowGenerator.addShadowCaster(remoteMesh)

      this.remoteControllers.set(sessionId, remoteController)
      remoteController.receiveFirstState(player)

      // Optimize network updates by using a throttled state change handler
      let lastStateUpdateTime = 0
      const STATE_UPDATE_THROTTLE = 50 // ms

      $(player).onChange(() => {
        const now = Date.now()
        if (now - lastStateUpdateTime > STATE_UPDATE_THROTTLE) {
          remoteController.receiveState(player)
          lastStateUpdateTime = now
        }
      })
    })

    $(this.room.state).players.onRemove((_, sessionId: string) => {
      const controller = this.remoteControllers.get(sessionId)
      if (controller) {
        controller.dispose()
        this.remoteControllers.delete(sessionId)
      }
    })
  }
}
