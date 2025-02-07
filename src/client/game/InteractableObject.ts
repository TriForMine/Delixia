import {
	Mesh,
	MeshBuilder,
	StandardMaterial,
	Vector3,
	Scene,
	Texture,
	ParticleSystem,
	Color4
} from "@babylonjs/core";
import {InteractType} from "../../shared/types/enums.ts";

export class InteractableObject {
	public mesh: Mesh;
	public interactionDistance = 2.5;

	private promptPlane: Mesh;
	private scene: Scene;
	private billboardOffset: Vector3;
	private interactType: InteractType;
	public id: number;

	constructor(
		mesh: Mesh,
		scene: Scene,
		interactType: InteractType,
		interactId: number,
		billboardOffset?: Vector3
	) {
		this.mesh = mesh;
		this.scene = scene;
		this.billboardOffset = billboardOffset?.clone() ?? new Vector3(0, 2, 0);

		// 1) Create a plane for the prompt -- do NOT parent it to mesh
		this.promptPlane = MeshBuilder.CreatePlane(
			`${mesh.name}_prompt_plane`,
			{ width: 0.5, height: 0.5 },
			scene
		);

		// 2) Enable billboard so it faces the camera
		this.promptPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;

		// Setup material/texture for the prompt
		const dt = new Texture("assets/input/keyboard2/keyboard_e.png", scene);
		dt.hasAlpha = true;
		const mat = new StandardMaterial("promptMat", scene);
		mat.diffuseTexture = dt;
		mat.emissiveTexture = dt;
		mat.disableLighting = true;
		mat.useAlphaFromDiffuseTexture = true;
		this.promptPlane.material = mat;

		// Hide by default
		this.promptPlane.setEnabled(false);
		this.promptPlane.isPickable = false;

		// 3) Update plane position each frame to 'follow' the mesh
		this.scene.onBeforeRenderObservable.add(() => {
			// Get the mesh's position in world space
			const meshPos = this.mesh.getAbsolutePosition();
			// Add the desired offset
			const newPos = meshPos.add(this.billboardOffset);
			// Set the plane’s absolute position
			this.promptPlane.setAbsolutePosition(newPos);
		});

		this.interactType = interactType;
		this.id = interactId;
	}

	public isPlayerInRange(playerPos: Vector3): boolean {
		const dist = Vector3.Distance(this.mesh.position, playerPos);
		return dist <= this.interactionDistance;
	}

	public showPrompt(show: boolean): void {
		this.promptPlane.setEnabled(show);
	}

	public activate(start: number): void {
		switch (this.interactType) {
			case InteractType.Oven:
				// Create a fire particle system at the oven's position
				const fire = new ParticleSystem("fire", 2000, this.scene);

				fire.particleTexture = new Texture("assets/particles/ExplosionTexture1.png", this.scene);

				// Set the emitter at the oven's position
				fire.emitter = this.mesh.getAbsolutePosition();

				// Optional: adjust the emission area (here, particles emit exactly from the emitter)
				fire.minEmitBox = new Vector3(0, 0, 0);
				fire.maxEmitBox = new Vector3(0, 0, 0);

				// Configure colors to mimic fire
				fire.color1 = new Color4(1, 0.5, 0, 1);  // bright orange
				fire.color2 = new Color4(1, 0.2, 0, 1);  // red-orange
				fire.colorDead = new Color4(0, 0, 0, 0);   // fades to transparent

				// Size settings
				fire.minSize = 0.1;
				fire.maxSize = 0.5;

				// Lifetime settings
				fire.minLifeTime = 0.3;
				fire.maxLifeTime = 0.5;

				// Emission rate and blend mode
				fire.emitRate = 150;
				fire.blendMode = ParticleSystem.BLENDMODE_ONEONE;

				// Gravity and directional settings to push particles upward
				fire.gravity = new Vector3(0, -9.81, 0);
				fire.direction1 = new Vector3(-1, 8, 1);
				fire.direction2 = new Vector3(1, 8, -1);

				// Angular and power settings
				fire.minAngularSpeed = 0;
				fire.maxAngularSpeed = Math.PI;
				fire.minEmitPower = 0.5;
				fire.maxEmitPower = 1;

				// How fast the system updates
				fire.updateSpeed = 0.005;

				// Start the particle system
				fire.start();

				// Stop and dispose the particle system after 5 seconds
				setTimeout(() => {
					fire.stop();
					fire.dispose();
				}, 5000 - (Date.now() - start));
				break;
			default:
				console.warn("Unknown interact type:", this.interactType);
				break;
		}
	}

	public deactivate(): void {
		// Stop the effect
		console.log("Deactivating interactable object", this.id);
	}

	public interact(timestamp: number): void {
		this.activate(timestamp)
	}
}
