import { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager'
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin'
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe'
import type { Scene } from '@babylonjs/core/scene'
import HavokPhysics from '@babylonjs/havok'
import { CustomLoadingScreen } from '@client/components/BabylonScene.tsx'
import { mapConfigs } from '@shared/maps/japan.ts'
import type { GameRoomState } from '@shared/schemas/GameRoomState.ts'
import type { Player } from '@shared/schemas/Player.ts'
import { type Room, getStateCallbacks } from 'colyseus.js'
import type { InteractableObject } from './InteractableObject.ts'
import { LocalCharacterController } from './LocalCharacterController'
import { MapLoader } from './MapLoader.ts'
import { RemoteCharacterController } from './RemoteCharacterController'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import { IngredientLoader } from '@client/game/IngredientLoader.ts'
import { SpatialGrid } from './SpatialGrid'
import { InputManager } from './managers/InputManager'
import { PerformanceManager } from './managers/PerformanceManager'
import { type Ingredient, InteractType } from '@shared/types/enums.ts'

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

  constructor(scene: Scene, room: any) {
    this.scene = scene
    this.room = room

    // Enable hardware scaling to improve performance
    scene.getEngine().setHardwareScalingLevel(1.0)

    // Initialize input manager to handle focus and pointer lock
    this.inputManager = new InputManager(scene)

    // Enable frustum culling for better performance
    scene.skipFrustumClipping = false
    scene.skipPointerMovePicking = true

    // Optimize shadow quality vs performance
    scene.shadowsEnabled = true
    scene.lightsEnabled = true
    scene.particlesEnabled = true
    scene.collisionsEnabled = true
    scene.fogEnabled = true

    // Set a reasonable physics timestep
    scene.getPhysicsEngine()?.setTimeStep(1 / 60)
  }

  /**
   * Disposes of all resources used by the game engine.
   */
  dispose(): void {
    this.scene.dispose()
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

    // When all assets are loaded
    this.assetsManager.onFinish = () => {
      // Create UI if needed for other elements
      AdvancedDynamicTexture.CreateFullscreenUI('UI')

      // Update loading state
      this.loadingState.assets.progress = 100
      this.loadingState.currentTask = 'Assets loaded, preparing map...'

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

    const checkLoadingComplete = () => {
      if (assetsLoaded && mapLoaded) {
        const engine = this.scene.getEngine()
        if (engine.loadingScreen instanceof CustomLoadingScreen) {
          this.loadingState.currentTask = 'Initializing game...'
          engine.loadingScreen.loadingUIText = this.loadingState.currentTask
          engine.loadingScreen.updateProgress(100)

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

    // Start asset loading.
    this.assetsManager.load()
    this.ingredientLoader.loadIngredients()

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
        checkLoadingComplete()

        const $ = getStateCallbacks(this.room)

        $(this.room.state).interactableObjects.onAdd((objState) => {
          // Listen for property changes on this object
          $(objState).onChange(() => {
            const interactable = this.interactables.find((obj) => obj.id === Number(objState.id))

            if (!interactable) return

            // Update disabled state
            interactable.setDisabled(objState.disabled)

            if (objState.isActive) {
              interactable.activate(objState.activeSince) // e.g. start fire ParticleSystem
            } else {
              interactable.deactivate() // e.g. stop the effect
            }

            // Update ingredients on chopping board if it's a chopping board
            if (interactable.interactType === InteractType.ChoppingBoard) {
              const ingredients = objState.ingredientsOnBoard.map((i) => i as Ingredient)
              interactable.updateIngredientsOnBoard(ingredients)
            }
          })

          const interactable = this.interactables.find((obj) => obj.id === Number(objState.id))
          if (!interactable) {
            return
          }

          // Set initial disabled state
          interactable.setDisabled(objState.disabled)

          if (objState.isActive) {
            interactable.activate(objState.activeSince) // e.g. start fire ParticleSystem
          } else {
            interactable.deactivate() // e.g. stop the effect
          }

          // Update ingredients on chopping board if it's a chopping board
          if (interactable.interactType === InteractType.ChoppingBoard) {
            const ingredients = objState.ingredientsOnBoard.map((i) => i as Ingredient)
            interactable.updateIngredientsOnBoard(ingredients)
          }
        })
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

      if (
        timeSinceLastUpdate >= this.MAX_NETWORK_UPDATE_INTERVAL &&
        timeSinceLastUpdate >= this.NETWORK_UPDATE_INTERVAL &&
        (positionChanged || rotationChanged)
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
      this._nearestInteractable.interact(characterController, Date.now())

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
      nearest.interact(characterController, Date.now())

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
    mesh.scaling = new Vector3(1.3, 1.3, 1.3)
    mesh.rotation = new Vector3(0, 0, 0)
    this.localController = new LocalCharacterController(this, mesh, this.ingredientLoader, localInstance.animationGroups, this.scene)
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

      remoteMesh.scaling = new Vector3(1.3, 1.3, 1.3)
      remoteMesh.rotation = new Vector3(0, 0, 0)
      const remoteController = new RemoteCharacterController(remoteMesh, this.scene, this.ingredientLoader, remoteInstance.animationGroups)
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
