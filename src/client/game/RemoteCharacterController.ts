import type { Player } from '@shared/schemas/Player'
import { CharacterController } from './CharacterController'
import { CharacterState } from './CharacterState'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Scene } from '@babylonjs/core/scene'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'
import type { Ingredient } from '@shared/types/enums.ts'

export class RemoteCharacterController extends CharacterController {
  // Reference to the scene for raycasting
  readonly scene: Scene
  private targetPosition: Vector3 = Vector3.Zero()
  private targetYRotation: number = 0

  // Network interpolation properties
  private previousPosition: Vector3 = new Vector3()
  private currentVelocity: Vector3 = new Vector3()
  private lastUpdateTime: number = 0
  private positionInterpolationFactor: number = 0.2
  private rotationInterpolationFactor: number = 0.2

  constructor(characterMesh: AbstractMesh, scene: Scene, ingredientLoader: IngredientLoader, animationGroups: AnimationGroup[]) {
    super(characterMesh, scene, ingredientLoader, animationGroups)
    this.scene = scene
    this.previousPosition.copyFrom(characterMesh.position)
    this.lastUpdateTime = performance.now()

    // Dispose of physics if necessary
    if (this.physicsAggregate) {
      this.physicsAggregate.dispose()
    }
  }

  public receiveFirstState(newPlayer: Player): void {
    this.targetPosition = new Vector3(newPlayer.x, newPlayer.y, newPlayer.z)
    this.targetYRotation = newPlayer.rot
    this.previousPosition.copyFrom(this.targetPosition)

    // Set the impostor mesh to be enabled
    this.impostorMesh.setEnabled(true)

    // Update the ingredient if necessary
    if (newPlayer.holdedIngredient !== undefined) {
      this.forceSetIngredient(newPlayer.holdedIngredient as Ingredient)
    }
  }

  /**
   * Receives new state data from the network and updates position, rotation, and state.
   * @param newPlayer The new state data for the remote player.
   */
  public receiveState(newPlayer: Player): void {
    if (!newPlayer.connected) {
      this.impostorMesh.setEnabled(false)
      return
    }

    this.impostorMesh.setEnabled(true)

    // Store previous position for velocity calculation
    this.previousPosition.copyFrom(this.targetPosition);

    // Update target position and rotation
    this.targetPosition = new Vector3(newPlayer.x, newPlayer.y, newPlayer.z);
    this.targetYRotation = newPlayer.rot;

    // Calculate velocity for prediction
    const now = performance.now();
    const timeDelta = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    if (timeDelta > 0) {
      // Calculate velocity based on position change
      this.currentVelocity = this.targetPosition.subtract(this.previousPosition).scale(1 / timeDelta);
    }
    this.lastUpdateTime = now;

    this.updateAnimationState(newPlayer.animationState);

    this.forceSetIngredient(newPlayer.holdedIngredient as Ingredient);
  }

  /**
   * Update method to be called every frame.
   * @param deltaTime Time elapsed since the last frame.
   */
  public update(deltaTime: number): void {
    this.updateMovement(deltaTime);

    this.updateAnimations(deltaTime);
  }

  /**
   * Disposes of the character's resources.
   */
  public dispose(): void {
    super.dispose();
    // Additional dispose logic if necessary
  }

  public lerpRotationY(y: number, alpha: number) {
    const gap = Math.abs(this.impostorMesh.rotationQuaternion!.toEulerAngles().y - y);
    if (gap > Math.PI) {
      // For large rotation differences, just set directly to avoid spinning
      this.impostorMesh.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), y);
    } else {
      // For small differences, use smooth interpolation
      this.impostorMesh.rotationQuaternion = Quaternion.Slerp(
          this.impostorMesh.rotationQuaternion!,
          Quaternion.RotationAxis(Vector3.Up(), y),
          alpha
      );
    }
  }

  public lerpPosition(position: Vector3, alpha: number) {
    this.impostorMesh.position = Vector3.Lerp(this.impostorMesh.position, position, alpha);
  }

  // Pre-allocated vectors for movement calculations
  private _predictedPositionTemp: Vector3 = new Vector3();

  /**
   * Updates the character's position and rotation based on the target values.
   * Uses velocity-based prediction for smoother movement.
   */
  private updateMovement(deltaTime: number): void {
    // Calculate predicted position based on velocity
    this._predictedPositionTemp.copyFrom(this.targetPosition);

    // Add velocity-based prediction for smoother movement
    if (this.currentVelocity.lengthSquared() > 0.01) {
      this.currentVelocity.scaleToRef(deltaTime, this._predictedPositionTemp);
      this.targetPosition.addToRef(this._predictedPositionTemp, this._predictedPositionTemp);
    }

    this.lerpPosition(this._predictedPositionTemp, this.positionInterpolationFactor);
    this.lerpRotationY(this.targetYRotation, this.rotationInterpolationFactor);
  }

  /**
   * Updates the animation state based on the provided state name.
   * @param animationState The name of the new animation state.
   */
  private updateAnimationState(animationState: string): void {
    switch (animationState) {
      case 'Walking':
        this.currentState = CharacterState.WALKING
        break
      case 'SambaDancing':
        this.currentState = CharacterState.DANCING
        break
      case 'Jump':
        this.currentState = CharacterState.JUMPING
        break
      case 'Fall':
        this.currentState = CharacterState.FALLING
        break
      case 'Landing':
        this.currentState = CharacterState.LANDING
        break
      default:
        this.currentState = CharacterState.IDLE
    }
  }
}
