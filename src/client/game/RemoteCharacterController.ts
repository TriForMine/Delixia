// RemoteCharacterController.ts
import {AbstractMesh, AnimationGroup, Scene, Vector3} from "@babylonjs/core";
import {CharacterController} from "./CharacterController";
import {moveTowards} from "../utils/utils";
import {Player} from "../../shared/schemas/Player";

export class RemoteCharacterController extends CharacterController {
	private targetPosition: Vector3 = Vector3.Zero();
	private targetYRotation: number = 0;

	public constructor(
		characterMesh: AbstractMesh,
		scene: Scene,
		animationGroups: AnimationGroup[] // Accept animation groups
	) {
		super(characterMesh, scene, animationGroups); // Pass to superclass
		this.physicsAggregate.dispose();
	}

	/**
	 * Receives new state data from the network and updates position and rotation directly.
	 * @param newPlayer The new state data for the remote player.
	 */
	public receiveState(newPlayer: Player): void {
		this.updateAnimationState(newPlayer.animationState);
		this.targetPosition = new Vector3(newPlayer.x, newPlayer.y, newPlayer.z);
		this.targetYRotation = newPlayer.rot;
	}

	/**
	 * Update method is now simplified as interpolation is removed.
	 * If you have other per-frame updates, include them here.
	 * @param _ Time elapsed since the last frame.
	 */
	public update(_: number): void {
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
				this.targetAnim = this.walkAnim;
				break;
			default:
				this.targetAnim = this.idleAnim;
		}

		let weightSum = 0;
		for (const animation of this.nonIdleAnimations) {
			if (animation === this.targetAnim) {
				animation.weight = moveTowards(animation.weight, 1, this.animationBlendSpeed * 0.1); // Using a smaller delta for smoother transitions
			} else {
				animation.weight = moveTowards(animation.weight, 0, this.animationBlendSpeed * 0.1);
			}
			if (animation.weight > 0 && !animation.isPlaying) animation.play(true);
			if (animation.weight === 0 && animation.isPlaying) animation.pause();

			weightSum += animation.weight;
		}

		this.idleAnim.weight = moveTowards(
			this.idleAnim.weight,
			Math.min(Math.max(1 - weightSum, 0.0), 1.0),
			this.animationBlendSpeed * 0.1
		);
	}
}