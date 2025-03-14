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
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock'
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture'
import { Control } from '@babylonjs/gui/2D/controls/control'
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import { IngredientLoader } from '@client/game/IngredientLoader.ts'

export class GameEngine {
  public interactables: InteractableObject[] = []
  private readonly scene: Scene
  private room: Room<GameRoomState>
  private localController?: LocalCharacterController
  private remoteControllers = new Map<string, RemoteCharacterController>()
  private shadowGenerator!: CascadedShadowGenerator
  private assetsManager!: AssetsManager
  private ingredientLoader!: IngredientLoader
  private fpsText?: TextBlock
  private lastPerformanceUpdate: number = 0
  private readonly PERFORMANCE_UPDATE_INTERVAL: number = 1000 // Update every second
  private loadedCharacterContainer: any
  private loadingState = {
    assets: { progress: 0, total: 0, current: 0 },
    map: { progress: 0, loaded: false },
    currentTask: '',
  }

  constructor(scene: Scene, room: any) {
    this.scene = scene
    this.room = room

    // Enable hardware scaling to improve performance
    scene.getEngine().setHardwareScalingLevel(1.0)

    // Handle visibility and focus changes
    const canvas = scene.getEngine().getRenderingCanvas()
    if (canvas) {
      // Handle visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.requestFocusAndPointerLock()
        }
      })

      // Handle window focus
      window.addEventListener('focus', () => {
        this.requestFocusAndPointerLock()
      })

      // Handle canvas focus
      canvas.addEventListener('click', () => {
        this.requestFocusAndPointerLock()
      })
    }

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

    // Create a shadow generator
    this.shadowGenerator = new CascadedShadowGenerator(1024, sun)
    this.shadowGenerator.blurKernel = 32
    this.shadowGenerator.useKernelBlur = true
    this.shadowGenerator.usePercentageCloserFiltering = true
    this.shadowGenerator.shadowMaxZ = 30

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

    const $ = getStateCallbacks(this.room)

    $(this.room.state).interactableObjects.onAdd((objState, key) => {
      // Listen for property changes on this object
      $(objState).onChange(() => {
        const interactable = this.interactables.find((obj) => obj.id === Number(key))

        if (!interactable) return

        if (objState.isActive) {
          interactable.activate(objState.activeSince) // e.g. start fire ParticleSystem
        } else {
          interactable.deactivate() // e.g. stop the effect
        }
      })

      const interactable = this.interactables.find((obj) => obj.id === Number(key))
      if (!interactable) return

      if (objState.isActive) {
        interactable.activate(objState.activeSince) // e.g. start fire ParticleSystem
      } else {
        interactable.deactivate() // e.g. stop the effect
      }
    })

    this.assetsManager.onProgress = (remainingCount, totalCount, _) => {
      const percentage = (totalCount - remainingCount) / totalCount

      // If we’re using our CustomLoadingScreen instance
      const engine = this.scene.getEngine()
      if (engine.loadingScreen instanceof CustomLoadingScreen) {
        engine.loadingScreen.updateProgress(percentage * 100)
      }
    }

    // When all assets are loaded, create a simple full‐screen GUI (e.g. an FPS counter)
    this.assetsManager.onFinish = () => {
      const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI')

      // Initialize FPS counter
      this.fpsText = new TextBlock()
      this.fpsText.text = 'FPS: 0'
      this.fpsText.color = 'white'
      this.fpsText.fontSize = 16
      this.fpsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
      this.fpsText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
      this.fpsText.paddingRight = '10px'
      this.fpsText.paddingTop = '10px'
      advancedTexture.addControl(this.fpsText)

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
    const kitchenLoader = new MapLoader(this.scene, this.shadowGenerator)

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
    )

    // Request initial pointer lock and focus
    this.requestFocusAndPointerLock()
  }

  /**
   * Called every frame.
   * Updates the local player, sends movement messages, updates remote players, and updates GUI.
   */
  update(deltaTime: number): void {
    const deltaSeconds = deltaTime / 1000

    this.localController?.update(deltaSeconds)

    if (this.localController) {
      const playerPos = this.localController.position
      let nearest: InteractableObject | null = null
      let nearestDist = Infinity

      // 1. Find the nearest interactable within range
      for (const obj of this.interactables) {
        const dist = Vector3.Distance(obj.mesh.position, playerPos)
        if (dist < obj.interactionDistance && dist < nearestDist) {
          nearestDist = dist
          nearest = obj
        }
      }

      // 2. Hide all billboards
      for (const obj of this.interactables) {
        obj.showPrompt(false)
      }

      // 3. If we found a valid nearest object, show it
      if (nearest) {
        nearest.showPrompt(true)
      }
    }

    if (this.room && this.localController) {
      const transform = this.localController.getTransform()
      const animationState = this.localController.getTargetAnim.name
      this.room.send('move', {
        position: {
          x: transform.position.x,
          y: transform.position.y,
          z: transform.position.z,
        },
        rotation: { y: transform.rotationQuaternion?.toEulerAngles().y },
        animationState,
        timestamp: Date.now(),
      })
    }

    // Update all remote controllers.
    this.remoteControllers.forEach((controller) => {
      controller.update(deltaSeconds)
    })

    // Update performance metrics
    const currentTime = Date.now()
    if (currentTime - this.lastPerformanceUpdate > this.PERFORMANCE_UPDATE_INTERVAL) {
      const engine = this.scene.getEngine()
      const fps = engine.getFps().toFixed()

      if (this.fpsText) {
        this.fpsText.text = `FPS: ${fps}`
      }

      this.lastPerformanceUpdate = currentTime

      // Auto-adjust quality if FPS drops too low
      if (Number(fps) < 30) {
        engine.setHardwareScalingLevel(engine.getHardwareScalingLevel() * 1.1)
      } else if (Number(fps) > 60 && engine.getHardwareScalingLevel() > 1.0) {
        engine.setHardwareScalingLevel(Math.max(1.0, engine.getHardwareScalingLevel() * 0.9))
      }
    }
  }

  public tryInteract(characterController: LocalCharacterController): void {
    let nearest: InteractableObject | null = null
    let nearestDist = Infinity

    // 1. Find the nearest interactable within range
    for (const obj of this.interactables) {
      const dist = Vector3.Distance(obj.mesh.position, characterController.position)
      if (dist < obj.interactionDistance && dist < nearestDist) {
        nearestDist = dist
        nearest = obj
      }
    }

    if (nearest) {
      // Trigger interaction
      nearest.interact(characterController, Date.now())

      this.room.send('interact', {
        objectId: nearest.id,
        timestamp: Date.now(),
      })
    }
  }

  public setRoom(room: Room<GameRoomState>): void {
    this.room = room
  }

  private initializePlayers(): void {
    if (!this.loadedCharacterContainer) {
      console.error('Character container not loaded!')
      return
    }

    // Instantiate the local player from the loaded container
    const localInstance = this.loadedCharacterContainer.instantiateModelsToScene((name: string) => name)
    const mesh = localInstance.rootNodes[0] as Mesh
    mesh.scaling = new Vector3(1, 1, 1)
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
        return
      }

      // Instantiate a remote player model
      const remoteInstance = this.loadedCharacterContainer.instantiateModelsToScene((name: string) => name)
      const remoteMesh = remoteInstance.rootNodes[0] as Mesh
      remoteMesh.scaling = new Vector3(1, 1, 1)
      remoteMesh.rotation = new Vector3(0, 0, 0)
      const remoteController = new RemoteCharacterController(remoteMesh, this.scene, this.ingredientLoader, remoteInstance.animationGroups)
      remoteController.setPosition(new Vector3(player.x, player.y, player.z))
      remoteController.setRotationY(player.rot)
      remoteMesh.receiveShadows = true
      this.shadowGenerator.addShadowCaster(remoteMesh)
      this.remoteControllers.set(sessionId, remoteController)

      remoteController.receiveState(player)

      $(player).onChange(() => remoteController.receiveState(player))
    })

    $(this.room.state).players.onRemove((_, sessionId: string) => {
      const controller = this.remoteControllers.get(sessionId)
      if (controller) {
        controller.dispose()
        this.remoteControllers.delete(sessionId)
      }
    })
  }

  /**
   * Requests focus and pointer lock for the game canvas.
   * This is called when:
   * - The game initializes
   * - The window regains focus
   * - The document becomes visible
   * - The canvas is clicked
   */
  private requestFocusAndPointerLock(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas()
    if (!canvas) return

    // First focus the canvas
    canvas.focus()

    // Then request pointer lock after a small delay to ensure focus is processed
    setTimeout(() => {
      // Only request pointer lock if document is visible and window has focus
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        canvas.requestPointerLock().catch((error) => {
          console.warn('Failed to acquire pointer lock:', error)
        })
      }
    }, 100)
  }
}
