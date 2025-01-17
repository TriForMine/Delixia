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

	private isJumping = false;
	private previousJumpKeyState = false;

	public constructor(
		characterMesh: AbstractMesh,
		animationGroups: AnimationGroup[],
		scene: Scene
	) {
		super(characterMesh, scene, animationGroups);
		this.inputMap = new Map();

		// Register input actions
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

		// Camera setup (unchanged)
		const cameraAttachPoint = new TransformNode("cameraAttachPoint", scene);
		cameraAttachPoint.parent = characterMesh;
		cameraAttachPoint.position = new Vector3(0, 1, 0);

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
		camera.upperRadiusLimit = 10;
		camera.lowerBetaLimit = 0.1;

		this.thirdPersonCamera = camera;
	}

	public update(deltaSeconds: number): void {
		this.targetAnim = this.idleAnim;

		// Handle movement input
		const direction = this.thirdPersonCamera.getForwardRay().direction;
		const forward = new Vector3(direction.x, 0, direction.z).normalize();
		const right = new Vector3(forward.z, 0, -forward.x).normalize(); // Corrected Right vector
		// Removed initialization to Identity

		// Input flags
		const movingForward = this.inputMap.get(this.keyForward);
		const movingBackward = this.inputMap.get(this.keyBackward);
		const movingLeft = this.inputMap.get(this.keyLeft);
		const movingRight = this.inputMap.get(this.keyRight);

		// Calculate desired movement direction
		let moveDirection = Vector3.Zero();
		if (movingForward) moveDirection = moveDirection.add(forward);
		if (movingBackward) moveDirection = moveDirection.subtract(forward);
		if (movingLeft) moveDirection = moveDirection.subtract(right);
		if (movingRight) moveDirection = moveDirection.add(right);
		moveDirection = moveDirection.normalize();

		// Get current rotation
		const currentQuaternion = this.impostorMesh.rotationQuaternion;
		if (currentQuaternion === null) {
			throw new Error("Impostor quaternion is null");
		}

		// Initialize rot to current rotation
		let rot = currentQuaternion.clone();

		// Calculate desired rotation based on movement direction
		if (!moveDirection.equals(Vector3.Zero())) {
			rot = Quaternion.FromLookDirectionLH(moveDirection, Vector3.Up());
		}

		// Set target animation based on movement
		if (movingForward || movingBackward || movingLeft || movingRight) {
			this.targetAnim = this.walkAnim;
		}

		// Apply rotation using setAngularVelocity
		if (!moveDirection.equals(Vector3.Zero())) {
			// Calculate the shortest rotation to the desired orientation
			const rotationDelta = Quaternion.Inverse(currentQuaternion).multiply(rot);
			const rotationDeltaEuler = rotationDelta.toEulerAngles();

			// Calculate angular velocity only on the Y-axis
			const desiredAngularVelocityY = rotationDeltaEuler.y * this.rotationSpeed;

			// Apply angular velocity smoothly
			const angularVelocity = new Vector3(0, desiredAngularVelocityY, 0);
			this.physicsAggregate.body.setAngularVelocity(angularVelocity);
		} else {
			// When not moving, stop angular velocity to prevent rotation back to default
			this.physicsAggregate.body.setAngularVelocity(new Vector3(0, 0, 0));
		}

		// Apply movement using setLinearVelocity
		const desiredVelocity = moveDirection.scale(this.moveSpeed);
		// Preserve the existing Y velocity (e.g., gravity, jumping)
		const currentVelocity = this.physicsAggregate.body.getLinearVelocity();
		const newVelocity = new Vector3(desiredVelocity.x, currentVelocity.y, desiredVelocity.z);
		this.physicsAggregate.body.setLinearVelocity(newVelocity);

		// Handle dance input
		if (this.inputMap.get(this.keyDance)) {
			this.targetAnim = this.sambaDanceAnim;
		}

		// Handle jump input with edge detection
		const currentJumpKeyState = this.inputMap.get(this.keyJump) || false;
		if (
			currentJumpKeyState &&
			!this.previousJumpKeyState &&
			this.isGrounded() &&
			!this.isJumping
		) {
			this.targetAnim = this.jumpAnim;
			this.isJumping = true;
			this.physicsAggregate.body.applyImpulse(new Vector3(0, 20000, 0), new Vector3(0, 0, 0));
		}
		this.previousJumpKeyState = currentJumpKeyState;

		// Update vertical velocity and detect falling
		const verticalVelocity = this.physicsAggregate.body.getLinearVelocity().y;
		if (verticalVelocity < -0.1) { // Threshold to avoid jitter
			this.targetAnim = this.fallingAnim;
		}

		// Reset jump and fall states if grounded
		if (this.isGrounded()) {
			this.isJumping = false;
		}

		// Update animations
		let weightSum = 0;
		for (const animation of this.nonIdleAnimations) {
			if (animation === this.targetAnim) {
				animation.weight = moveTowards(animation.weight, 1, this.animationBlendSpeed * deltaSeconds);
				if (!animation.isPlaying) animation.play(true);
			} else {
				animation.weight = moveTowards(animation.weight, 0, this.animationBlendSpeed * deltaSeconds);
				if (animation.weight === 0 && animation.isPlaying) animation.pause();
			}
			weightSum += animation.weight;
		}

		// Update idle animation weight
		this.idleAnim.weight = moveTowards(
			this.idleAnim.weight,
			Math.max(1 - weightSum, 0.0),
			this.animationBlendSpeed * deltaSeconds
		);
	}

	public dispose() {
		this.impostorMesh.dispose();
		this.model.dispose();
		this.physicsAggregate.dispose();
	}

	// New method for ground detection
	private isGrounded(): boolean {
		return this.physicsAggregate.body.getLinearVelocity().y === 0;
	}
}
