import {
	Mesh,
	MeshBuilder,
	StandardMaterial,
	Vector3,
	Scene, Texture
} from "@babylonjs/core";

export class InteractableObject {
	public mesh: Mesh;
	public interactionDistance = 2.5;

	private promptPlane: Mesh;

	constructor(mesh: Mesh, scene: Scene, billboardOffset?: Vector3) {
		this.mesh = mesh;

		// Create a plane for the prompt
		this.promptPlane = MeshBuilder.CreatePlane(
			`${mesh.name}_prompt_plane`,
			{ width: 0.75, height: 0.75 },
			scene
		);
		// Position relative to the mesh
		this.promptPlane.position = billboardOffset?.clone() ?? new Vector3(0, 2, 0);
		this.promptPlane.parent = mesh;

		// Make it billboard so it always faces the camera
		this.promptPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;

		// Create a texture from assets/input/keyboard/keyboard_e.png
		const dt = new Texture("assets/input/keyboard/T_E_Key_Dark.png", scene);
		dt.hasAlpha = true;
		const mat = new StandardMaterial("promptMat", scene);
		mat.diffuseTexture = dt;
		mat.emissiveTexture  = dt;
		mat.disableLighting = true;
		mat.useAlphaFromDiffuseTexture = true;

		this.promptPlane.material = mat;

		// Hide by default
		this.promptPlane.setEnabled(false);
		this.promptPlane.isPickable = false;
	}

	/**
	 * Checks distance from the player's position.
	 */
	public isPlayerInRange(playerPos: Vector3): boolean {
		const dist = Vector3.Distance(this.mesh.position, playerPos);
		return dist <= this.interactionDistance;
	}

	/**
	 * Show/hide the 3D billboard prompt
	 */
	public showPrompt(show: boolean): void {
		this.promptPlane.setEnabled(show);
	}

	public interact(): void {
		console.log(`Interacted with: ${this.mesh.name}`);
		// your custom logic...
	}
}
