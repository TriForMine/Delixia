// RemoteCharacterController.ts
import {AbstractMesh, AnimationGroup, Quaternion, Scene, Vector3,} from "@babylonjs/core";
import {CharacterController, CharacterState} from "./CharacterController";
import {Player} from "../../shared/schemas/Player";

export class RemoteCharacterController extends CharacterController {
	// Reference to the scene for raycasting
	readonly scene: Scene;
	private targetPosition: Vector3 = Vector3.Zero();
	private targetYRotation: number = 0;

	constructor(
		characterMesh: AbstractMesh,
		scene: Scene,
		animationGroups: AnimationGroup[]
	) {
		super(characterMesh, scene, animationGroups);
		this.scene = scene;

		// Dispose of physics if necessary
		if (this.physicsAggregate) {
			this.physicsAggregate.dispose();
		}
	}

	/**
	 * Receives new state data from the network and updates position, rotation, and state.
	 * @param newPlayer The new state data for the remote player.
	 */
	public receiveState(newPlayer: Player): void {
		this.updateAnimationState(newPlayer.animationState);
		this.targetPosition = new Vector3(newPlayer.x, newPlayer.y, newPlayer.z);
		this.targetYRotation = newPlayer.rot;
	}

	/**
	 * Update method to be called every frame.
	 * @param deltaTime Time elapsed since the last frame.
	 */
	public update(deltaTime: number): void {
		this.updateMovement();
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
			this.impostorMesh.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), y);
		} else {
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

	/**
	 * Updates the character's position and rotation based on the target values.
	 */
	private updateMovement(): void {
		this.lerpPosition(this.targetPosition, 0.2);
		this.lerpRotationY(this.targetYRotation, 0.2);
	}

	/**
	 * Updates the animation state based on the provided state name.
	 * @param animationState The name of the new animation state.
	 */
	private updateAnimationState(animationState: string): void {
		switch (animationState) {
			case "Walking":
				this.currentState = CharacterState.WALKING;
				break;
			case "SambaDancing":
				this.currentState = CharacterState.DANCING;
				break;
			case "Jump":
				this.currentState = CharacterState.JUMPING;
				break;
			case "Fall":
				this.currentState = CharacterState.FALLING;
				break;
			case "Landing":
				this.currentState = CharacterState.LANDING;
				break;
			default:
				this.currentState = CharacterState.IDLE;
		}
	}
}