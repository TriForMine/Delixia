import type { Player } from '@shared/schemas/Player'
import { CharacterController } from './CharacterController'
import { CharacterState } from './CharacterState'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Scene } from '@babylonjs/core/scene'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'
import type { Ingredient } from '@shared/types/enums.ts'
import {AudioManager} from "@client/game/managers/AudioManager.ts";

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

  // Footstep Sound Properties for Remote
  private isPlayingFootsteps: boolean = false;
  private timeSinceLastStep: number = 0;
  private readonly stepInterval: number = 0.45; // Same as local for consistency
  private readonly footstepSoundNames: string[] = [
    'footstep_wood_01',
    'footstep_wood_02',
    'footstep_wood_03',
    'footstep_wood_04',
  ];
  private lastFootstepIndex: number = -1;

  constructor(
      characterMesh: AbstractMesh,
      scene: Scene,
      ingredientLoader: IngredientLoader,
      animationGroups: AnimationGroup[],
      audioManager: AudioManager,
  ) {
    super(characterMesh, scene, ingredientLoader, animationGroups, audioManager)
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

    // Update plate status first
    if (newPlayer.holdingPlate !== this.isHoldingPlate) {
      if(newPlayer.holdingPlate) this.forcePickupPlate();
      else this.dropPlate();
    }

    // Update the ingredient if necessary
    if (newPlayer.holdedIngredient !== undefined) {
      this.forceSetIngredient(newPlayer.holdedIngredient as Ingredient)
    }

    this.updateAnimationState(newPlayer.animationState);
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
    this.previousPosition.copyFrom(this.targetPosition)

    // Update target position and rotation
    this.targetPosition = new Vector3(newPlayer.x, newPlayer.y, newPlayer.z)
    this.targetYRotation = newPlayer.rot

    // Calculate velocity for prediction
    const now = performance.now()
    const timeDelta = (now - this.lastUpdateTime) / 1000 // Convert to seconds
    if (timeDelta > 0) {
      // Calculate velocity based on position change
      this.currentVelocity = this.targetPosition.subtract(this.previousPosition).scale(1 / timeDelta)
    }
    this.lastUpdateTime = now

    this.updateAnimationState(newPlayer.animationState)

    if (newPlayer.holdingPlate && !this.isHoldingPlate) {
      this.forcePickupPlate()
    } else if (!newPlayer.holdingPlate && this.isHoldingPlate) {
      this.dropPlate()
    }

    this.forceSetIngredient(newPlayer.holdedIngredient as Ingredient)
  }

  /**
   * Update method to be called every frame.
   * @param deltaTime Time elapsed since the last frame.
   */
  public update(deltaTime: number): void {
    this.updateMovement(deltaTime)
    this.updateAnimations(deltaTime)
    this.updateFootstepSounds(deltaTime);
  }

  /**
   * Disposes of the character's resources.
   */
  public dispose(): void {
    super.dispose()
    // Additional dispose logic if necessary
  }

  public lerpRotationY(y: number, alpha: number) {
    const gap = Math.abs(this.impostorMesh.rotationQuaternion!.toEulerAngles().y - y)
    if (gap > Math.PI) {
      // For large rotation differences, just set directly to avoid spinning
      this.impostorMesh.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), y)
    } else {
      // For small differences, use smooth interpolation
      this.impostorMesh.rotationQuaternion = Quaternion.Slerp(this.impostorMesh.rotationQuaternion!, Quaternion.RotationAxis(Vector3.Up(), y), alpha)
    }
  }

  public lerpPosition(position: Vector3, alpha: number) {
    this.impostorMesh.position = Vector3.Lerp(this.impostorMesh.position, position, alpha)
  }

  // Pre-allocated vectors for movement calculations
  private _predictedPositionTemp: Vector3 = new Vector3()

  /**
   * Updates the character's position and rotation based on the target values.
   * Uses velocity-based prediction for smoother movement.
   */
  private updateMovement(deltaTime: number): void {
    // Calculate predicted position based on velocity
    this._predictedPositionTemp.copyFrom(this.targetPosition)

    // Add velocity-based prediction for smoother movement
    if (this.currentVelocity.lengthSquared() > 0.01) {
      this.currentVelocity.scaleToRef(deltaTime, this._predictedPositionTemp)
      this.targetPosition.addToRef(this._predictedPositionTemp, this._predictedPositionTemp)
    }

    this.lerpPosition(this._predictedPositionTemp, this.positionInterpolationFactor)
    this.lerpRotationY(this.targetYRotation, this.rotationInterpolationFactor)
  }

  /**
   * Updates the animation state based on the provided state name.
   * @param animationState The name of the new animation state.
   */
  private updateAnimationState(animationState: string): void {
    const previousEffectiveState = this.currentState;

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
      case 'Land':
        this.currentState = CharacterState.LANDING
        break
      default:
        this.currentState = CharacterState.IDLE
    }

    if (this.currentState === CharacterState.WALKING && previousEffectiveState !== CharacterState.WALKING) {
      this.startFootstepSounds();
    } else if (this.currentState !== CharacterState.WALKING && previousEffectiveState === CharacterState.WALKING) {
      this.stopFootstepSounds();
    }

    if (this.currentState === CharacterState.LANDING && (previousEffectiveState === CharacterState.FALLING || previousEffectiveState === CharacterState.JUMPING)) {
      this.audioManager.playSound('jumpLand', 0.65, false, this.getTransform());
    }

  }

  private updateFootstepSounds(deltaTime: number): void {
    // Only run timer if footsteps should be playing
    if (!this.isPlayingFootsteps) {
      return;
    }

    // Check if the character is still considered walking (based on current state)
    // Added a check for isEnabled, good practice for remote entities
    if (this.currentState === CharacterState.WALKING && this.impostorMesh.isEnabled()) {
      this.timeSinceLastStep += deltaTime;

      if (this.timeSinceLastStep >= this.stepInterval) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * this.footstepSoundNames.length);
        } while (this.footstepSoundNames.length > 1 && randomIndex === this.lastFootstepIndex);

        const soundName = this.footstepSoundNames[randomIndex];
        this.lastFootstepIndex = randomIndex;

        // Play the sound spatially attached to the remote character's transform
        this.audioManager.playSound(soundName, 0.55, false, this.getTransform());

        this.timeSinceLastStep -= this.stepInterval; // Reset timer correctly
      }
    } else {
      // If state changed or mesh disabled while timer was running, stop
      this.stopFootstepSounds();
    }
  }

  private startFootstepSounds(): void {
    if (!this.isPlayingFootsteps) {
      this.isPlayingFootsteps = true;
      this.timeSinceLastStep = this.stepInterval; // Play first step almost immediately
      this.lastFootstepIndex = -1;
    }
  }

  private stopFootstepSounds(): void {
    if (this.isPlayingFootsteps) {
      this.isPlayingFootsteps = false;
      this.timeSinceLastStep = 0;
      this.lastFootstepIndex = -1;
    }
  }
}
