import {
	AbstractMesh,
	ActionManager,
	AnimationGroup,
	ArcRotateCamera,
	ExecuteCodeAction,
	Quaternion,
	Scene,
	TransformNode,
	Vector3,
} from "@babylonjs/core";
import {CharacterController} from "./CharacterController";
import {moveTowards} from "../utils/utils";

export class LocalCharacterController extends CharacterController {
	declare readonly thirdPersonCamera: ArcRotateCamera;

	readonly inputMap: Map<string, boolean>;
	readonly keyForward = "z";
	readonly keyBackward = "s";
	readonly keyLeft = "q";
	readonly keyRight = "d";
	readonly keyDance = "b";
	readonly keyJump = " ";

	public constructor(
		characterMesh: AbstractMesh,
		animationGroups: AnimationGroup[],
		scene: Scene
	) {
		super(characterMesh, scene, animationGroups);
		this.inputMap = new Map();

		scene.actionManager = new ActionManager(scene);
		scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (e) => {
				const key = (e.sourceEvent as KeyboardEvent).key.toLowerCase();
				this.inputMap.set(key, true);
			})
		);
		scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
				const key = (e.sourceEvent as KeyboardEvent).key.toLowerCase();
				this.inputMap.set(key, false);
			})
		);

		const cameraAttachPoint = new TransformNode("cameraAttachPoint", scene);
		cameraAttachPoint.parent = characterMesh;
		cameraAttachPoint.position = new Vector3(0, 1.5, 0);

		const camera = new ArcRotateCamera(
			"thirdPersonCamera",
			-Math.PI / 2,
			Math.PI / 3,
			5,
			Vector3.Zero(),
			scene
		);
		camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

		camera.setTarget(cameraAttachPoint);
		camera.wheelPrecision = 200;
		camera.lowerRadiusLimit = 3;
		camera.upperBetaLimit = Math.PI / 2 + 0.2;

		this.thirdPersonCamera = camera;
	}

	public update(deltaSeconds: number): void {
		this.targetAnim = this.idleAnim;

		const angle180 = Math.PI;
		const angle45 = angle180 / 4;
		const angle90 = angle180 / 2;
		const angle135 = angle45 + angle90;
		const direction = this.thirdPersonCamera.getForwardRay().direction;
		const forward = new Vector3(direction.x, 0, direction.z).normalize();
		const rot = Quaternion.FromLookDirectionLH(forward, Vector3.Up());

		let rotation = 0;
		const movingForward = this.inputMap.get(this.keyForward);
		const movingBackward = this.inputMap.get(this.keyBackward);
		const movingLeft = this.inputMap.get(this.keyLeft);
		const movingRight = this.inputMap.get(this.keyRight);

		if (movingBackward && !movingRight && !movingLeft) {
			rotation = angle180;
		}
		if (movingLeft && !movingForward && !movingBackward) {
			rotation = -angle90;
		}
		if (movingRight && !movingForward && !movingBackward) {
			rotation = angle90;
		}
		if (movingForward && movingRight) {
			rotation = angle45;
		}
		if (movingForward && movingLeft) {
			rotation = -angle45;
		}
		if (movingBackward && movingRight) {
			rotation = angle135;
		}
		if (movingBackward && movingLeft) {
			rotation = -angle135;
		}

		rot.multiplyInPlace(Quaternion.RotationAxis(Vector3.Up(), rotation));

		if (movingForward || movingBackward || movingLeft || movingRight) {
			this.targetAnim = this.walkAnim;

			const quaternion = rot;
			const impostorQuaternion = this.impostorMesh.rotationQuaternion;
			if (impostorQuaternion === null) {
				throw new Error("Impostor quaternion is null");
			}
			Quaternion.SlerpToRef(
				impostorQuaternion,
				quaternion,
				this.rotationSpeed * deltaSeconds,
				impostorQuaternion
			);
			this.impostorMesh.translate(new Vector3(0, 0, -1), this.moveSpeed * deltaSeconds);
			this.physicsAggregate.body.setTargetTransform(this.impostorMesh.absolutePosition, impostorQuaternion);
		}

		if (this.inputMap.get(this.keyDance)) {
			this.targetAnim = this.sambaAnim;
		}

		let weightSum = 0;
		for (const animation of this.nonIdleAnimations) {
			if (animation === this.targetAnim) {
				animation.weight = moveTowards(animation.weight, 1, this.animationBlendSpeed * deltaSeconds);
			} else {
				animation.weight = moveTowards(animation.weight, 0, this.animationBlendSpeed * deltaSeconds);
			}
			if (animation.weight > 0 && !animation.isPlaying) animation.play(true);
			if (animation.weight === 0 && animation.isPlaying) animation.pause();

			weightSum += animation.weight;
		}

		this.idleAnim.weight = moveTowards(
			this.idleAnim.weight,
			Math.min(Math.max(1 - weightSum, 0.0), 1.0),
			this.animationBlendSpeed * deltaSeconds
		);
	}
}
