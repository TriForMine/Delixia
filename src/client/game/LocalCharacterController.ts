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
import { CharacterController, CharacterState } from './CharacterController'
import type { GameEngine } from './GameEngine.ts'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'

export class LocalCharacterController extends CharacterController {
  readonly inputMap: Map<string, boolean>
  readonly keyForward = KBCode.KeyW
  readonly keyBackward = KBCode.KeyS
  readonly keyLeft = KBCode.KeyA
  readonly keyRight = KBCode.KeyD
  readonly keyDance = KBCode.KeyB
  readonly keyJump = KBCode.Space
  readonly keyInteract = KBCode.KeyE

  private isJumping = false
  private isFalling = false
  private previousJumpKeyState = false
  private previousInteractKeyState = false

  private readonly cameraAttachPoint: TransformNode
  private readonly gameEngine: GameEngine
  readonly thirdPersonCamera: ArcRotateCamera

  constructor(
    gameEngine: GameEngine,
    characterMesh: AbstractMesh,
    ingredientLoader: IngredientLoader,
    animationGroups: AnimationGroup[],
    scene: Scene,
  ) {
    super(characterMesh, scene, ingredientLoader, animationGroups)

    this.gameEngine = gameEngine
    this.inputMap = new Map()

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
    camera.lowerRadiusLimit = 1.5
    camera.upperRadiusLimit = 10
    camera.lowerBetaLimit = 0.1
    camera.upperBetaLimit = Math.PI / 2 + 0.2
    camera.wheelPrecision = 30
    // Adjust near/far plane to avoid near‐clipping
    camera.minZ = 0.7
    camera.maxZ = 1000

    // Make it look at the attach point
    camera.setTarget(this.cameraAttachPoint)

    this.thirdPersonCamera = camera
  }

  public update(deltaSeconds: number): void {
    this.handleInput()
    this.updateState()
    this.updateMovement()
    this.updateAnimations(deltaSeconds)

    // Check for collisions behind the character every frame
    this.updateCameraCollision()
  }

  private handleInput(): void {
    // Handle jump (once on key press)
    const currentJumpKeyState = this.inputMap.get(this.keyJump) || false
    if (currentJumpKeyState && !this.previousJumpKeyState && this.isGrounded() && !this.isJumping) {
      this.isJumping = true
      this.jumpAnim.reset()
      this.jumpAnim.play(false)

      this.physicsAggregate.body.applyImpulse(new Vector3(0, 5000, 0), new Vector3(0, 0, 0))
    }
    this.previousJumpKeyState = currentJumpKeyState

    // Handle interact (once on key press)
    const currentInteractKeyState = this.inputMap.get(this.keyInteract) || false
    if (currentInteractKeyState && !this.previousInteractKeyState) {
      this.gameEngine.tryInteract(this)
    }
    this.previousInteractKeyState = currentInteractKeyState
  }

  private updateState(): void {
    const verticalVelocity = this.physicsAggregate.body.getLinearVelocity().y
    this.isFalling = verticalVelocity < -0.1

    if (this.isGrounded() && verticalVelocity <= 0) {
      this.isJumping = false
    }

    if (this.inputMap.get(this.keyDance)) {
      this.currentState = CharacterState.DANCING
      return
    }
    if (this.isFalling && this.isLanding()) {
      this.currentState = CharacterState.LANDING
      return
    }
    if (this.isFalling) {
      this.currentState = CharacterState.FALLING
      return
    }
    if (this.isJumping) {
      this.currentState = CharacterState.JUMPING
      return
    }
    this.currentState = this.isAnyMovementKeyDown() ? CharacterState.WALKING : CharacterState.IDLE
  }

  private updateMovement(): void {
    // Get camera-forward direction (ignoring vertical)
    const cameraForward = this.thirdPersonCamera.getForwardRay().direction
    const forward = new Vector3(cameraForward.x, 0, cameraForward.z).normalize()
    const right = new Vector3(forward.z, 0, -forward.x).normalize()

    let moveDirection = Vector3.Zero()
    if (this.inputMap.get(this.keyForward)) {
      moveDirection = moveDirection.add(forward)
    }
    if (this.inputMap.get(this.keyBackward)) {
      moveDirection = moveDirection.subtract(forward)
    }
    if (this.inputMap.get(this.keyLeft)) {
      moveDirection = moveDirection.subtract(right)
    }
    if (this.inputMap.get(this.keyRight)) {
      moveDirection = moveDirection.add(right)
    }
    moveDirection = moveDirection.normalize()

    // Rotate the character
    const currentQuaternion = this.getTransform().rotationQuaternion
    if (!currentQuaternion) {
      throw new Error('Character rotation quaternion is null')
    }

    let desiredRotation = currentQuaternion.clone()
    if (!moveDirection.equals(Vector3.Zero())) {
      desiredRotation = Quaternion.FromLookDirectionLH(moveDirection, Vector3.Up())
    }
    this.applySmoothRotation(currentQuaternion, desiredRotation)

    // Apply movement
    const desiredVelocity = moveDirection.scale(this.moveSpeed)
    const currentVelocity = this.physicsAggregate.body.getLinearVelocity()
    const newVelocity = new Vector3(desiredVelocity.x, currentVelocity.y, desiredVelocity.z)
    this.physicsAggregate.body.setLinearVelocity(newVelocity)
  }

  private applySmoothRotation(currentQuaternion: Quaternion, desiredQuaternion: Quaternion): void {
    if (!desiredQuaternion.equals(currentQuaternion)) {
      const rotationDelta = Quaternion.Inverse(currentQuaternion).multiply(desiredQuaternion)
      const rotationDeltaEuler = rotationDelta.toEulerAngles()
      const desiredAngularVelocityY = rotationDeltaEuler.y * this.rotationSpeed
      this.physicsAggregate.body.setAngularVelocity(new Vector3(0, desiredAngularVelocityY, 0))
    } else {
      this.physicsAggregate.body.setAngularVelocity(Vector3.Zero())
    }
  }

  private isGrounded(): boolean {
    return this.checkGround(1.8)
  }

  private isLanding(): boolean {
    return this.checkGround(2.0)
  }

  private checkGround(distance: number): boolean {
    const origin = this.getTransform().position.clone()
    origin.y += 1
    const ray = new Ray(origin, Vector3.Down(), distance)
    const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable)
    return hit?.hit ?? false
  }

  /**
   * updateCameraCollision():
   *
   * - We do a ray pick behind the character (from the attach point to the camera).
   * - If there's an obstacle that's closer than where the camera currently is,
   *   we clamp the camera's radius to that obstacle distance, effectively
   *   blocking the user from zooming out into the wall.
   * - If there's no obstacle, the user can zoom freely, up to camera.upperRadiusLimit.
   *
   * NOTE: We remove smoothing/lerping for an "immediate" clamp so it's
   * truly impossible to zoom out behind an object.
   */
  private updateCameraCollision(): void {
    const camera = this.thirdPersonCamera
    const targetPos = this.cameraAttachPoint.getAbsolutePosition()
    const cameraPos = camera.position
    const direction = cameraPos.subtract(targetPos)
    const distanceToCamera = direction.length()

    if (distanceToCamera < 0.0001) return // avoid zero-length direction

    const normalizedDirection = direction.normalize()
    const ray = new Ray(targetPos, normalizedDirection, distanceToCamera)

    // Ray pick ignoring the character itself
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return mesh.isPickable && mesh !== this.getTransform()
    })

    // We'll assume no obstacle if pick fails
    let obstacleRadius = Number.POSITIVE_INFINITY
    const collisionOffset = 0.01

    // If there's an obstacle behind the character, determine how far away it is
    if (hit && hit.hit && hit.distance < distanceToCamera) {
      // The farthest we can place the camera is 'hit.distance - offset'
      obstacleRadius = Math.max(hit.distance - collisionOffset, camera.lowerRadiusLimit ?? 1)
    }

    // The maximum we allow the camera radius to be is the lesser of
    // (a) user’s desired radius (camera.radius),
    // (b) the obstacle's limit, and
    // (c) the camera's upperRadiusLimit.
    let clampedRadius = Math.min(camera.radius, obstacleRadius)
    clampedRadius = Math.min(clampedRadius, camera.upperRadiusLimit ?? 9999999)

    // And it can't go below the lowerRadiusLimit
    clampedRadius = Math.max(clampedRadius, camera.lowerRadiusLimit ?? 1)

    // Finally, set the camera radius to this clamped value
    camera.radius = clampedRadius
  }

  private isAnyMovementKeyDown(): boolean {
    return (
      (this.inputMap.get(this.keyForward) ||
        this.inputMap.get(this.keyBackward) ||
        this.inputMap.get(this.keyLeft) ||
        this.inputMap.get(this.keyRight)) === true
    )
  }
}
