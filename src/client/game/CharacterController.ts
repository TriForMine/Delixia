import {
	AbstractMesh,
	AnimationGroup,
	ArcRotateCamera,
	MeshBuilder,
	PhysicsAggregate,
	PhysicsShapeType,
	Quaternion,
	Scene,
	Vector3,
} from "@babylonjs/core";

export class CharacterController {
	readonly model: AbstractMesh;
	readonly physicsAggregate: PhysicsAggregate;
	readonly moveSpeed = 1.8;
	readonly rotationSpeed = 6;
	readonly animationBlendSpeed = 4.0;
	readonly walkAnim: AnimationGroup;
	readonly sambaAnim: AnimationGroup;
	readonly idleAnim: AnimationGroup;
	readonly nonIdleAnimations: AnimationGroup[];
	readonly thirdPersonCamera?: ArcRotateCamera;
	protected targetAnim: AnimationGroup;

	protected readonly impostorMesh: AbstractMesh;

	protected constructor(
		characterMesh: AbstractMesh,
		scene: Scene,
		animationGroups: AnimationGroup[],
		thirdPersonCamera?: ArcRotateCamera
	) {
		this.impostorMesh = MeshBuilder.CreateCapsule(
			"CharacterTransform",
			{height: 2, radius: 0.5},
			scene
		);
		this.impostorMesh.visibility = 0;
		this.impostorMesh.rotationQuaternion = Quaternion.Identity();

		this.model = characterMesh;
		this.model.parent = this.impostorMesh;
		this.model.rotate(Vector3.Up(), Math.PI);
		this.model.position.y = -1;

		this.thirdPersonCamera = thirdPersonCamera;

		const walkAnimGroup = animationGroups.find(ag => ag.name === "Walking");
		if (walkAnimGroup === undefined) throw new Error("'Walking' animation not found");
		this.walkAnim = walkAnimGroup;
		this.walkAnim.weight = 0;

		const idleAnimGroup = animationGroups.find(ag => ag.name === "Idle");
		if (idleAnimGroup === undefined) throw new Error("'Idle' animation not found");
		this.idleAnim = idleAnimGroup;
		this.idleAnim.weight = 1;

		const sambaAnimGroup = animationGroups.find(ag => ag.name === "SambaDancing");
		if (sambaAnimGroup === undefined) throw new Error("'Samba' animation not found");
		this.sambaAnim = sambaAnimGroup;
		this.sambaAnim.weight = 0;

		this.targetAnim = this.idleAnim;
		this.nonIdleAnimations = [this.walkAnim, this.sambaAnim];

		this.physicsAggregate = new PhysicsAggregate(
			this.getTransform(),
			PhysicsShapeType.CAPSULE,
			{
				mass: 1,
				friction: 0.5,
			}
		);

		this.physicsAggregate.body.setMassProperties({inertia: Vector3.ZeroReadOnly});
		this.physicsAggregate.body.setAngularDamping(100);
		this.physicsAggregate.body.setLinearDamping(10);
	}

	get position() {
		return this.impostorMesh.position;
	}

	get rotation() {
		return this.impostorMesh.rotationQuaternion;
	}

	get getTargetAnim() {
		return this.targetAnim;
	}

	public getTransform() {
		return this.impostorMesh;
	}

	public setPosition(position: Vector3) {
		this.impostorMesh.position = position;
	}

	public setRotation(rotation: Quaternion) {
		this.impostorMesh.rotationQuaternion = rotation;
	}

	public setRotationY(y: number) {
		this.impostorMesh.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), y);
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

	public update(_deltaSeconds: number): void {
		return
	}

	public dispose() {
		this.impostorMesh.dispose();
		this.model.dispose();
		this.physicsAggregate.dispose();
	}
}
