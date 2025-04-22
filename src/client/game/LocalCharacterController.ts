import { ActionManager } from '@babylonjs/core/Actions/actionManager'
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Ray } from '@babylonjs/core/Culling/ray.core'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import type { Scene } from '@babylonjs/core/scene'
import { KBCode } from '../utils/keys.ts'
import { CharacterController } from './CharacterController'
import { CharacterState } from './CharacterState'
import type { GameEngine } from './GameEngine.ts'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'
import type { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin'
import type { Contact } from './physics/Contact'
import { CharacterSupportedState } from './physics/CharacterSupportedState'
import type { AudioManager } from '@client/game/managers/AudioManager.ts'
import { Scalar } from '@babylonjs/core'
import { settingsStore } from '@client/utils/settingsStore.ts'

export class LocalCharacterController extends CharacterController {
  // Reference Key Bindings (read from settingsStore dynamically)
  private keyBindings: Record<string, string> = {} // Store current bindings

  readonly inputMap: Map<string, boolean>
  private isJumping = false
  private previousJumpKeyState = false
  private previousInteractKeyState = false

  private readonly cameraAttachPoint: TransformNode
  private readonly gameEngine: GameEngine
  readonly thirdPersonCamera: ArcRotateCamera

  // Properties
  protected isGrounded: boolean = false
  protected groundCheckDistance: number = 0.1

  private readonly _startCollector: any
  private readonly _castCollector: any
  public keepDistance: number = 0.05 // Minimum distance to maintain from surfaces
  public keepContactTolerance: number = 0.1 // Max distance to keep contacts
  private manifold: Contact[] = []
  public maxSlopeCosine: number = Math.cos(Math.PI * (60 / 180))

  // --- Footstep Sound Properties ---
  private isPlayingFootsteps: boolean = false
  private timeSinceLastStep: number = 0
  private readonly stepInterval: number = 0.45
  private readonly footstepSoundNames: string[] = ['footstep_wood_01', 'footstep_wood_02', 'footstep_wood_03', 'footstep_wood_04']
  private lastFootstepIndex: number = -1

  private readonly visibilityThresholdPadding = 1.5 // Padding for smooth start/end of fade
  private currentVisibility: number = 1.0 // Current visibility level (0.0 to 1.0)
  private targetVisibility: number = 1.0 // Target visibility level (1 = visible, 0 = invisible)
  private readonly fadeSpeed: number = 20.0 // Speed of the fade effect
  private readonly invisibleVisibilityValue: number = 0.0 // Visibility value when fully faded out (usually 0)

  private isLandingAnimationActive: boolean = false

  constructor(
    gameEngine: GameEngine,
    characterMesh: AbstractMesh,
    ingredientLoader: IngredientLoader,
    animationGroups: AnimationGroup[],
    scene: Scene,
    audioManager: AudioManager,
  ) {
    super(characterMesh, scene, ingredientLoader, animationGroups, audioManager)

    this.gameEngine = gameEngine
    this.inputMap = new Map()
    this.loadKeyBindings() // Load initial bindings

    // Setup keyboard events
    scene.actionManager = new ActionManager(scene)
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (e) => {
        const key = (e.sourceEvent as KeyboardEvent).code
        this.inputMap.set(key, true)
      }),
    )
    scene.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
        const key = (e.sourceEvent as KeyboardEvent).code
        this.inputMap.set(key, false)
      }),
    )

    // Create a transform for the camera to follow
    this.cameraAttachPoint = new TransformNode('cameraAttachPoint', scene)
    this.cameraAttachPoint.parent = this.getTransform()
    this.cameraAttachPoint.position = new Vector3(0, 0.4, 0)

    // Create the ArcRotateCamera
    const camera = new ArcRotateCamera('thirdPersonCamera', -Math.PI / 2, Math.PI / 3, 5, this.cameraAttachPoint.getAbsolutePosition(), scene)
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true)

    // Configure camera angles/zoom
    camera.lowerRadiusLimit = 0.1
    camera.upperRadiusLimit = 10
    camera.lowerBetaLimit = 0.1
    camera.upperBetaLimit = Math.PI / 2 + 0.2
    camera.minZ = 0.02
    camera.maxZ = 1000

    camera.setTarget(this.cameraAttachPoint)
    this.thirdPersonCamera = camera

    // Apply saved settings initially
    this.applySensitivitySettings()

    // Initialize collectors for shape casting
    const hk = scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin
    const hknp = hk._hknp
    this._startCollector = hknp.HP_QueryCollector_Create(16)[1]
    this._castCollector = hknp.HP_QueryCollector_Create(16)[1]
  }

  // Method to load key bindings from settingsStore
  public loadKeyBindings(): void {
    this.keyBindings = settingsStore.getKeyBindings()
  }

  // Method to apply sensitivity settings from settingsStore
  public applySensitivitySettings(): void {
    const savedSensX = settingsStore.getSensitivityX()
    const savedSensY = settingsStore.getSensitivityY()
    const savedWheelPrec = settingsStore.getWheelPrecision()

    // Camera might not be initialized yet when constructor calls this first time
    if (this.thirdPersonCamera) {
      this.thirdPersonCamera.angularSensibilityX = savedSensX * 1000
      this.thirdPersonCamera.angularSensibilityY = savedSensY * 1000
      this.thirdPersonCamera.wheelPrecision = savedWheelPrec
    }
  }

  // Pre-allocated vectors for update method
  private _startPosTemp: Vector3 = new Vector3()
  private _endPosTemp: Vector3 = new Vector3()
  private _velocityTemp: Vector3 = new Vector3()

  public update(deltaSeconds: number): void {
    // Reuse existing vectors instead of creating new ones
    this._startPosTemp.copyFrom(this.getTransform().position)
    this._velocityTemp.copyFrom(this.physicsAggregate.body.getLinearVelocity())
    this._velocityTemp.scaleInPlace(deltaSeconds)
    this._startPosTemp.addToRef(this._velocityTemp, this._endPosTemp)

    this._castWithCollectors(this._startPosTemp, this._endPosTemp)
    this._updateManifold()

    this.isGrounded = this.checkGrounded()

    this.handleInput() // Handle input before updating state/movement
    this.updateState()
    this.updateMovement()
    this.updateAnimations(deltaSeconds)
    this.updateCameraCollision()
    this.updateFootstepSounds(deltaSeconds)
    this.updateCharacterVisibilityFade(deltaSeconds)
  }

  private updateFootstepSounds(deltaSeconds: number): void {
    if (this.currentState === CharacterState.WALKING && this.isGrounded) {
      this.timeSinceLastStep += deltaSeconds

      if (this.timeSinceLastStep >= this.stepInterval) {
        // Play a footstep sound
        let randomIndex
        // Simple way to avoid direct repetition
        do {
          randomIndex = Math.floor(Math.random() * this.footstepSoundNames.length)
        } while (this.footstepSoundNames.length > 1 && randomIndex === this.lastFootstepIndex)

        const soundName = this.footstepSoundNames[randomIndex]
        this.lastFootstepIndex = randomIndex

        // Play the sound spatially attached to the character's transform node
        this.audioManager.playSound(soundName, 0.55, false, this.getTransform()) // Play attached to player position

        // Reset timer (subtract interval to account for potential frame drops)
        this.timeSinceLastStep -= this.stepInterval
      }
      this.isPlayingFootsteps = true
    } else {
      // If not walking or not grounded, reset state
      if (this.isPlayingFootsteps) {
        this.isPlayingFootsteps = false
        this.timeSinceLastStep = 0 // Reset timer
        this.lastFootstepIndex = -1 // Reset last played index
        // No need to explicitly stop one-shot sounds
      }
    }
  }

  private handleInput(): void {
    // Read keys from the dynamically loaded keyBindings
    const jumpKey = this.keyBindings['jump'] ?? KBCode.Space
    const interactKey = this.keyBindings['interact'] ?? KBCode.KeyE

    // Handle jump (once on key press)
    const currentJumpKeyState = this.inputMap.get(jumpKey) || false
    if (currentJumpKeyState && !this.previousJumpKeyState && this.isGrounded && !this.isJumping) {
      this.isJumping = true
      this.jumpAnim.reset()
      this.jumpAnim.play(false)
      this.physicsAggregate.body.applyImpulse(new Vector3(0, 7000, 0), new Vector3(0, 0, 0))
    }
    this.previousJumpKeyState = currentJumpKeyState

    // Handle interact (once on key press)
    const currentInteractKeyState = this.inputMap.get(interactKey) || false
    if (currentInteractKeyState && !this.previousInteractKeyState) {
      this.gameEngine.tryInteract(this)
    }
    this.previousInteractKeyState = currentInteractKeyState
  }

  private updateState(): void {
    const supportState = this.checkSupport()
    const verticalVelocity = this.physicsAggregate.body.getLinearVelocity().y
    const isMovingHorizontally = this.isAnyMovementKeyDown()
    const danceKey = this.keyBindings['dance'] ?? KBCode.KeyB

    let nextState: CharacterState

    // --- Check if Landing Animation is Still Active ---
    // Use weight as primary indicator for blending completion.
    // Reset the flag when the animation is no longer visually dominant.
    if (this.isLandingAnimationActive && this.landingAnim.weight < 0.1) {
      this.isLandingAnimationActive = false
      // Ensure the animation is reset if it was paused mid-way
      if (!this.landingAnim.isPlaying) {
        this.landingAnim.goToFrame(0)
      }
    }

    // --- State Determination Logic ---
    if (this.inputMap.get(danceKey)) {
      nextState = CharacterState.DANCING
      this.isJumping = false
      this.isLandingAnimationActive = false // Stop landing if dancing
    } else if (supportState === CharacterSupportedState.SUPPORTED) {
      // Grounded Logic

      // Just landed? (Transitioned from aerial state)
      if (this.currentState === CharacterState.FALLING || this.currentState === CharacterState.JUMPING) {
        nextState = CharacterState.LANDING
        this.isJumping = false
        this.isLandingAnimationActive = true // Start landing animation phase
        // Play landing sound using GameEngine helper to ensure correct volume
        this.gameEngine.playSfx('jumpLand', 0.65, false, this.getTransform())
      }
      // Currently in landing animation phase?
      else if (this.isLandingAnimationActive) {
        // If moving, immediately break out to walking
        if (isMovingHorizontally) {
          nextState = CharacterState.WALKING
          this.isLandingAnimationActive = false // Exit landing phase
        } else {
          // Stay in LANDING state visually, let animation blend out
          nextState = CharacterState.LANDING
        }
      }
      // Already grounded and landing animation phase is finished
      else {
        nextState = isMovingHorizontally ? CharacterState.WALKING : CharacterState.IDLE
        this.isJumping = false // Ensure reset
      }
    } else if (supportState === CharacterSupportedState.SLIDING) {
      // Sliding Logic
      nextState = CharacterState.FALLING
      this.isJumping = false
      this.isLandingAnimationActive = false // Stop landing if sliding
    } else {
      // Aerial Logic
      if (this.isJumping && verticalVelocity > 0.05) {
        nextState = CharacterState.JUMPING
      } else {
        nextState = CharacterState.FALLING
        if (this.isJumping) {
          this.isJumping = false
        }
      }
      this.isLandingAnimationActive = false // Not landing if aerial
    }

    // Set the final state for this frame
    this.currentState = nextState
  }

  // Pre-allocated vectors for movement calculations
  private _cameraForwardTemp: Vector3 = new Vector3()
  private _forwardTemp: Vector3 = new Vector3()
  private _rightTemp: Vector3 = new Vector3()
  private _moveDirectionTemp: Vector3 = new Vector3()
  private _desiredVelocityTemp: Vector3 = new Vector3()
  private _adjustedVelocityTemp: Vector3 = new Vector3()
  private _currentVelocityTemp: Vector3 = new Vector3()
  private _newVelocityTemp: Vector3 = new Vector3()
  private _projectionTemp: Vector3 = new Vector3()
  private _desiredRotationTemp: Quaternion = new Quaternion()

  private updateMovement(): void {
    // Get camera forward direction and calculate movement vectors
    this._cameraForwardTemp.copyFrom(this.thirdPersonCamera.getForwardRay().direction)
    this._forwardTemp.set(this._cameraForwardTemp.x, 0, this._cameraForwardTemp.z)
    this._forwardTemp.normalize()
    this._rightTemp.set(this._forwardTemp.z, 0, -this._forwardTemp.x)
    this._rightTemp.normalize()

    // Calculate move direction based on input and dynamic key bindings
    this._moveDirectionTemp.setAll(0)
    if (this.inputMap.get(this.keyBindings['forward'])) this._moveDirectionTemp.addInPlace(this._forwardTemp)
    if (this.inputMap.get(this.keyBindings['backward'])) this._moveDirectionTemp.subtractInPlace(this._forwardTemp)
    if (this.inputMap.get(this.keyBindings['left'])) this._moveDirectionTemp.subtractInPlace(this._rightTemp)
    if (this.inputMap.get(this.keyBindings['right'])) this._moveDirectionTemp.addInPlace(this._rightTemp)
    this._moveDirectionTemp.normalize()

    // Handle rotation
    const currentQuaternion = this.getTransform().rotationQuaternion
    if (!currentQuaternion) throw new Error('Character rotation quaternion is null')

    if (this._moveDirectionTemp.lengthSquared() > 0.01) {
      // Only calculate new rotation if we're actually moving
      Quaternion.FromLookDirectionLHToRef(this._moveDirectionTemp, Vector3.UpReadOnly, this._desiredRotationTemp)
      this.applySmoothRotation(currentQuaternion, this._desiredRotationTemp)
    } else {
      // Use current rotation if not moving
      this._desiredRotationTemp.copyFrom(currentQuaternion)
      this.applySmoothRotation(currentQuaternion, this._desiredRotationTemp)
    }

    // Calculate velocity
    this._moveDirectionTemp.scaleToRef(this.moveSpeed, this._desiredVelocityTemp)
    this._adjustedVelocityTemp.copyFrom(this._desiredVelocityTemp)

    // Adjust velocity based on collisions
    for (const contact of this.manifold) {
      const normal = contact.normal
      const velDotNormal = this._adjustedVelocityTemp.dot(normal)
      if (velDotNormal < 0) {
        // Moving into the surface
        normal.scaleToRef(velDotNormal, this._projectionTemp)
        this._adjustedVelocityTemp.subtractInPlace(this._projectionTemp) // Slide along the surface
      }
    }

    // Apply final velocity
    this._currentVelocityTemp.copyFrom(this.physicsAggregate.body.getLinearVelocity())
    this._newVelocityTemp.set(this._adjustedVelocityTemp.x, this._currentVelocityTemp.y, this._adjustedVelocityTemp.z)
    this.physicsAggregate.body.setLinearVelocity(this._newVelocityTemp)
  }

  // Pre-allocated objects for rotation calculations
  private _rotationDeltaTemp: Quaternion = new Quaternion()
  private _rotationDeltaEulerTemp: Vector3 = new Vector3()
  private _angularVelocityTemp: Vector3 = new Vector3()

  private applySmoothRotation(currentQuaternion: Quaternion, desiredQuaternion: Quaternion): void {
    if (!desiredQuaternion.equals(currentQuaternion)) {
      // Calculate rotation delta using pre-allocated objects
      Quaternion.InverseToRef(currentQuaternion, this._rotationDeltaTemp)
      this._rotationDeltaTemp.multiplyInPlace(desiredQuaternion)
      this._rotationDeltaTemp.toEulerAnglesToRef(this._rotationDeltaEulerTemp)

      // Set angular velocity using pre-allocated vector
      const desiredAngularVelocityY = this._rotationDeltaEulerTemp.y * this.rotationSpeed
      this._angularVelocityTemp.set(0, desiredAngularVelocityY, 0)
      this.physicsAggregate.body.setAngularVelocity(this._angularVelocityTemp)
    } else {
      // Use zero vector for no rotation
      this._angularVelocityTemp.setAll(0)
      this.physicsAggregate.body.setAngularVelocity(this._angularVelocityTemp)
    }
  }

  // Pre-allocated objects for ground check
  private _groundCheckStartPos: Vector3 = new Vector3()
  private _groundCheckEndPos: Vector3 = new Vector3()
  private _groundNormalTemp: Vector3 = new Vector3()

  private checkGroundWithShapeCast(distance: number): { isGrounded: boolean; groundNormal: Vector3 | null } {
    const hk = this.scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin
    const hknp = hk._hknp

    // Use pre-allocated vectors
    this._groundCheckStartPos.copyFrom(this.getTransform().position)
    this._groundCheckEndPos.copyFrom(this._groundCheckStartPos)
    this._groundCheckEndPos.y -= distance

    const orientation = [0, 0, 0, 1]

    const queryCast = [
      this.physicsAggregate.shape._pluginData,
      orientation,
      [this._groundCheckStartPos.x, this._groundCheckStartPos.y, this._groundCheckStartPos.z],
      [this._groundCheckEndPos.x, this._groundCheckEndPos.y, this._groundCheckEndPos.z],
      false,
      [BigInt(0)],
    ]
    hknp.HP_World_ShapeCastWithCollector(hk.world, this._castCollector, queryCast)

    const numCastHits = hknp.HP_QueryCollector_GetNumHits(this._castCollector)[1]
    if (numCastHits > 0) {
      const [fraction, , hitWorld] = hknp.HP_QueryCollector_GetShapeCastResult(this._castCollector, 0)[1]
      if (fraction < 1.0) {
        // Use pre-allocated vector for normal
        Vector3.FromArrayToRef(hitWorld[4], 0, this._groundNormalTemp)
        return { isGrounded: true, groundNormal: this._groundNormalTemp }
      }
    }
    return { isGrounded: false, groundNormal: null }
  }

  protected checkGrounded(): boolean {
    const result = this.checkGroundWithShapeCast(this.groundCheckDistance)
    return result.isGrounded
  }

  private _castWithCollectors(startPos: Vector3, endPos: Vector3): void {
    const hk = this.scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin
    const hknp = hk._hknp

    const startNative = [startPos.x, startPos.y, startPos.z]
    const orientation = [0, 0, 0, 1]
    const queryProximity = [
      this.physicsAggregate.shape._pluginData,
      startNative,
      orientation,
      this.keepDistance + this.keepContactTolerance,
      false,
      [BigInt(0)],
    ]
    hknp.HP_World_ShapeProximityWithCollector(hk.world, this._startCollector, queryProximity)

    const queryCast = [this.physicsAggregate.shape._pluginData, orientation, startNative, [endPos.x, endPos.y, endPos.z], false, [BigInt(0)]]
    hknp.HP_World_ShapeCastWithCollector(hk.world, this._castCollector, queryCast)
  }

  private _updateManifold(): void {
    const hk = this.scene.getPhysicsEngine()!.getPhysicsPlugin() as HavokPlugin
    const hknp = hk._hknp

    this.manifold = []

    const numProximityHits = hknp.HP_QueryCollector_GetNumHits(this._startCollector)[1]
    for (let i = 0; i < numProximityHits; i++) {
      const [distance, , contactWorld] = hknp.HP_QueryCollector_GetShapeProximityResult(this._startCollector, i)[1]
      const position = Vector3.FromArray(contactWorld[3])
      const normal = Vector3.FromArray(contactWorld[4])
      const bodyId = contactWorld[0][0]

      // @ts-ignore
      const bodyB = hk._bodies.get(bodyId)
      if (bodyB) {
        const contact: Contact = {
          position,
          normal,
          distance,
          fraction: 0,
          bodyB: bodyB.body,
          allowedPenetration: Math.min(Math.max(this.keepDistance - distance, 0.0), this.keepDistance),
        }
        this.manifold.push(contact)
      }
    }
  }

  private checkSupport(): CharacterSupportedState {
    let hasSupport = false
    let averageNormal = Vector3.Zero()
    let numSupports = 0

    for (const contact of this.manifold) {
      const dot = contact.normal.dot(Vector3.Up())
      if (dot > 0.1) {
        hasSupport = true
        averageNormal.addInPlace(contact.normal)
        numSupports++
      }
    }

    if (!hasSupport) return CharacterSupportedState.UNSUPPORTED

    averageNormal.scaleInPlace(1 / numSupports)
    const slopeCosine = averageNormal.dot(Vector3.Up())
    return slopeCosine > this.maxSlopeCosine ? CharacterSupportedState.SUPPORTED : CharacterSupportedState.SLIDING
  }

  // Pre-allocated objects for camera collision
  private _cameraTargetTemp: Vector3 = new Vector3()
  private _cameraDirectionTemp: Vector3 = new Vector3()
  private _cameraRay: Ray = new Ray(Vector3.Zero(), Vector3.Zero())

  private updateCameraCollision(): void {
    const camera = this.thirdPersonCamera

    // Get camera and target positions using pre-allocated vectors
    this._cameraTargetTemp = this.cameraAttachPoint.getAbsolutePosition()
    camera.position.subtractToRef(this._cameraTargetTemp, this._cameraDirectionTemp)

    const distanceToCamera = this._cameraDirectionTemp.length()
    if (distanceToCamera < 0.0001) return

    // Normalize direction in place
    this._cameraDirectionTemp.normalizeToRef(this._cameraDirectionTemp)

    // Update ray properties instead of creating a new one
    this._cameraRay.origin.copyFrom(this._cameraTargetTemp)
    this._cameraRay.direction.copyFrom(this._cameraDirectionTemp)
    this._cameraRay.length = distanceToCamera

    // Perform ray casting
    const hit = this.scene.pickWithRay(this._cameraRay, (mesh) => {
      return mesh.physicsBody != null && mesh.isEnabled() && mesh !== this.getTransform() && mesh.isPickable
    })

    // Calculate camera radius
    let obstacleRadius = Number.POSITIVE_INFINITY
    const collisionOffset = 0.01

    if (hit && hit.hit && hit.distance < distanceToCamera) {
      obstacleRadius = Math.max(hit.distance - collisionOffset, camera.lowerRadiusLimit ?? 1)
    }

    // Clamp radius between limits
    let clampedRadius = Math.min(camera.radius, obstacleRadius)
    clampedRadius = Math.min(clampedRadius, camera.upperRadiusLimit ?? 9999999)
    clampedRadius = Math.max(clampedRadius, camera.lowerRadiusLimit ?? 1)

    // Apply smooth transition to the new radius to prevent sudden jumps
    // Using Scalar.Lerp for smoother adjustment
    const lerpFactor = 1.0 - Math.exp((-15 * this.scene.getEngine().getDeltaTime()) / 1000) // Adjust speed (15) as needed
    camera.radius = Scalar.Lerp(camera.radius, clampedRadius, lerpFactor)

    // Ensure radius doesn't go significantly below the intended clamped value due to lerp overshoot
    if (Math.abs(camera.radius - clampedRadius) < 0.01) {
      camera.radius = clampedRadius
    }
  }

  private isAnyMovementKeyDown(): false | true | undefined {
    return (
      this.inputMap.get(this.keyBindings['forward']) ||
      this.inputMap.get(this.keyBindings['backward']) ||
      this.inputMap.get(this.keyBindings['left']) ||
      this.inputMap.get(this.keyBindings['right'])
    )
  }

  dropIngredient() {
    super.dropIngredient()
    this.gameEngine.playSfx('trash')
  }

  dropPlate() {
    super.dropPlate()
    this.gameEngine.playSfx('trash')
  }

  /**
   * Updates the character mesh's visibility based on the camera's proximity,
   * applying a smooth fade effect using the `visibility` property.
   */
  private updateCharacterVisibilityFade(deltaSeconds: number): void {
    const camera = this.thirdPersonCamera

    // Ensure the lower radius limit is a valid number
    if (typeof camera.lowerRadiusLimit !== 'number') {
      this.targetVisibility = 1.0 // Default to fully visible if no limit
    } else {
      // Determine target visibility based on camera distance
      const isTooClose = camera.radius <= camera.lowerRadiusLimit + this.visibilityThresholdPadding
      this.targetVisibility = isTooClose ? this.invisibleVisibilityValue : 1.0
    }

    // Check if visibility is already at the target (within a small tolerance)
    if (Math.abs(this.currentVisibility - this.targetVisibility) < 0.01) {
      // Snap to target if very close
      if (this.currentVisibility !== this.targetVisibility) {
        this.currentVisibility = this.targetVisibility
        this.model.visibility = this.currentVisibility
        this.model.getChildMeshes().forEach((child) => (child.visibility = this.currentVisibility))
      }
      return // No need to lerp further
    }

    // Interpolate the current visibility towards the target visibility
    this.currentVisibility = Scalar.Lerp(
      this.currentVisibility,
      this.targetVisibility,
      1.0 - Math.exp(-this.fadeSpeed * deltaSeconds), // Smoother lerp
    )

    // Apply the interpolated visibility to the main character mesh
    // Setting visibility on the parent mesh automatically affects its children.
    this.model.visibility = this.currentVisibility
    this.model.getChildMeshes().forEach((child) => (child.visibility = this.currentVisibility))
  }

  // Override dispose to potentially clean up action manager if needed
  public dispose() {
    super.dispose()
    // Note: Scene's action manager might be shared, be careful if disposing here
    // If ActionManager was created specifically for this controller, dispose it:
    // this.scene.actionManager?.dispose();
  }
}
