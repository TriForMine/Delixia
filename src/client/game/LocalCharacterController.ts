import {
	AbstractMesh,
	ActionManager,
	AnimationGroup,
	ArcRotateCamera,
	ExecuteCodeAction,
	Quaternion,
	Ray,
	Scene,
	TransformNode,
	Vector3,
} from "@babylonjs/core";
import {CharacterController} from "./CharacterController";
import {KBCode} from "../utils/keys.ts";

/**
 * Basic state enumeration so we can represent the character’s primary “action.”
 */
enum CharacterState {
	IDLE = "IDLE",
	WALKING = "WALKING",
	JUMPING = "JUMPING",
	LANDING = "LANDING",
	FALLING = "FALLING",
	DANCING = "DANCING",
}

/**
 * A refactored controller class that uses a “lightweight state machine”
 * and organizes animation/physics updates more cleanly.
 */
export class LocalCharacterController extends CharacterController {
	declare readonly thirdPersonCamera: ArcRotateCamera;

	// Input handling
	readonly inputMap: Map<string, boolean>;
	readonly keyForward = KBCode.KeyW;
	readonly keyBackward = KBCode.KeyS;
	readonly keyLeft = KBCode.KeyA;
	readonly keyRight = KBCode.KeyD;
	readonly keyDance = KBCode.KeyB;
	readonly keyJump = KBCode.Space;

	// State variables
	private isJumping = false;
	private isFalling = false;

	// Used for jump input edge detection
	private previousJumpKeyState = false;

	constructor(
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
				const key = (e.sourceEvent as KeyboardEvent).code;
				this.inputMap.set(key, true);
			})
		);
		scene.actionManager.registerAction(
			new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
				const code = (e.sourceEvent as KeyboardEvent).code;
				this.inputMap.set(code, false);
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

	/**
	 * Main update loop, invoked every frame.
	 */
	public update(deltaSeconds: number): void {
		this.handleInput();
		this.updateState();
		this.updateMovement();
		this.updateAnimations(deltaSeconds);
	}

	/**
	 * Disposes of the character’s meshes and physics references.
	 */
	public dispose(): void {
		this.impostorMesh.dispose();
		this.model.dispose();
		this.physicsAggregate.dispose();
	}

	/**
	 * Reads the current keyboard inputs and sets flags or triggers
	 * (like “jump” edge detection).
	 */
	private handleInput(): void {
		// Jump edge detection
		const currentJumpKeyState = this.inputMap.get(this.keyJump) || false;
		if (
			currentJumpKeyState &&
			!this.previousJumpKeyState &&
			this.isGrounded() &&
			!this.isJumping
		) {
			this.isJumping = true;
			this.jumpAnim.reset();
			this.jumpAnim.play(false);

			// Apply upward impulse
			this.physicsAggregate.body.applyImpulse(
				new Vector3(0, 5000, 0),
				new Vector3(0, 0, 0)
			);
		}
		this.previousJumpKeyState = currentJumpKeyState;
	}

	/**
	 * Determines the current overall “CharacterState” (idle, walking, jumping, etc.)
	 * based on input, velocity, and other conditions.
	 */
	private updateState(): void {
		// Falling check
		const verticalVelocity = this.physicsAggregate.body.getLinearVelocity().y;
		this.isFalling = verticalVelocity < -0.1;

		// If we’re on the ground, reset jumping state
		if (this.isGrounded() && verticalVelocity <= 0) {
			this.isJumping = false;
		}

		// If dancing key pressed, override everything else
		if (this.inputMap.get(this.keyDance)) {
			this.currentState = CharacterState.DANCING;
			return;
		}

		if (this.isFalling && this.isLanding()) {
			this.currentState = CharacterState.LANDING;
			return;
		}

		// If falling
		if (this.isFalling) {
			this.currentState = CharacterState.FALLING;
			return;
		}

		// If jumping
		if (this.isJumping) {
			this.currentState = CharacterState.JUMPING;
			return;
		}

		// Otherwise, decide between walking or idle
		if (this.isAnyMovementKeyDown()) {
			this.currentState = CharacterState.WALKING;
		} else {
			this.currentState = CharacterState.IDLE;
		}
	}

	/**
	 * Applies movement logic (direction, rotation, velocity)
	 * based on current input.
	 */
	private updateMovement(): void {
		const direction = this.thirdPersonCamera.getForwardRay().direction;
		const forward = new Vector3(direction.x, 0, direction.z).normalize();
		const right = new Vector3(forward.z, 0, -forward.x).normalize();

		// Movement input
		let moveDirection = Vector3.Zero();
		if (this.inputMap.get(this.keyForward)) moveDirection = moveDirection.add(forward);
		if (this.inputMap.get(this.keyBackward)) moveDirection = moveDirection.subtract(forward);
		if (this.inputMap.get(this.keyLeft)) moveDirection = moveDirection.subtract(right);
		if (this.inputMap.get(this.keyRight)) moveDirection = moveDirection.add(right);
		moveDirection = moveDirection.normalize();

		// If no rotationQuaternion (shouldn’t happen if set up properly)
		const currentQuaternion = this.impostorMesh.rotationQuaternion;
		if (!currentQuaternion) {
			throw new Error("Impostor quaternion is null");
		}

		// Desired rotation
		let desiredRotation = currentQuaternion.clone();
		if (!moveDirection.equals(Vector3.Zero())) {
			desiredRotation = Quaternion.FromLookDirectionLH(
				moveDirection,
				Vector3.Up()
			);
		}

		// Apply rotation
		this.applySmoothRotation(currentQuaternion, desiredRotation);

		// Apply movement (preserving existing y-velocity for jump, gravity, etc.)
		const desiredVelocity = moveDirection.scale(this.moveSpeed);
		const currentVelocity = this.physicsAggregate.body.getLinearVelocity();
		const newVelocity = new Vector3(
			desiredVelocity.x,
			currentVelocity.y,
			desiredVelocity.z
		);
		this.physicsAggregate.body.setLinearVelocity(newVelocity);
	}

	// --------------
	// Helper methods
	// --------------

	private isAnyMovementKeyDown(): boolean {
		return (
			this.inputMap.get(this.keyForward) ||
			this.inputMap.get(this.keyBackward) ||
			this.inputMap.get(this.keyLeft) ||
			this.inputMap.get(this.keyRight)
		) === true;
	}

	private applySmoothRotation(
		currentQuaternion: Quaternion,
		desiredQuaternion: Quaternion
	): void {
		if (!desiredQuaternion.equals(currentQuaternion)) {
			// Shortest rotation
			const rotationDelta = Quaternion.Inverse(currentQuaternion).multiply(
				desiredQuaternion
			);
			const rotationDeltaEuler = rotationDelta.toEulerAngles();
			// Only rotate around Y
			const desiredAngularVelocityY = rotationDeltaEuler.y * this.rotationSpeed;
			this.physicsAggregate.body.setAngularVelocity(
				new Vector3(0, desiredAngularVelocityY, 0)
			);
		} else {
			// If not moving, stop rotating
			this.physicsAggregate.body.setAngularVelocity(Vector3.Zero());
		}
	}

	private isGrounded(): boolean {
		return this.checkGround(1.8);
	}

	private isLanding(): boolean {
		return this.checkGround(2.0);
	}

	private checkGround(distance: number): boolean {
		const origin = this.impostorMesh.position.clone();
		origin.y += 1; // Adjust based on character’s height
		const direction = new Vector3(0, -1, 0);

		const ray = new Ray(origin, direction, distance);
		const hit = this.scene.pickWithRay(ray, (mesh) => mesh.isPickable);

		return hit?.hit ?? false;
	}
}
