import {
	Scene,
	AssetsManager,
	HemisphericLight,
	DirectionalLight,
	Vector3,
	MeshBuilder,
	ReflectionProbe,
	Mesh, HavokPlugin, StandardMaterial,
	Color3, Texture, CubeTexture
} from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";
import * as GUI from "@babylonjs/gui";
import HavokPhysics from "@babylonjs/havok";
import { CascadedShadowGenerator } from "@babylonjs/core";
import { LocalCharacterController } from "./LocalCharacterController";
import { RemoteCharacterController } from "./RemoteCharacterController";
import {ChatRoomState} from "../../shared/schemas/ChatRoomState.ts";
import {Player} from "../../shared/schemas/Player.ts";
import {Room} from "colyseus.js";
import {mapConfigs} from "./maps/japan.ts";
import {MapLoader} from "./MapLoader.ts";
import {InteractableObject} from "./InteractableObject.ts";

export class GameEngine {
	private readonly scene: Scene;
	private readonly room: Room<ChatRoomState>;
	private localController?: LocalCharacterController;
	private remoteControllers = new Map<string, RemoteCharacterController>();
	private shadowGenerator!: CascadedShadowGenerator;
	private assetsManager!: AssetsManager;
	private fpsText?: GUI.TextBlock;
	private interactables: InteractableObject[] = [];

	constructor(scene: Scene, room: any) {
		this.scene = scene;
		this.room = room;
	}

	/**
	 * Initializes the game:
	 * – Sets up keyboard shortcuts (e.g. toggle the inspector)
	 * – Creates lights, physics, and shadow generators
	 * – Loads assets (including the player character model)
	 * – Creates the environment (skybox, ground, etc.)
	 */
	async init(): Promise<void> {
		// Toggle the Babylon Inspector with Ctrl+Alt+Shift+I
		this.scene.onKeyboardObservable.add((kbInfo) => {
			if (
				kbInfo.event.ctrlKey &&
				kbInfo.event.altKey &&
				kbInfo.event.shiftKey &&
				kbInfo.event.key === "I"
			) {
				if (Inspector.IsVisible) {
					Inspector.Hide();
				} else {
					Inspector.Show(this.scene, {});
				}
			}
		});

		// Create an AssetsManager to load assets
		this.assetsManager = new AssetsManager(this.scene);

		// Load the character model (using a container task)
		const characterTask = this.assetsManager.addContainerTask(
			"characterTask",
			"",
			"assets/characters/",
			"character.glb"
		);

		// Enable physics with Havok (using the latest async initialization)
		const hk = new HavokPlugin(true, await HavokPhysics())
		this.scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

		// Create basic lights
		const hemi = new HemisphericLight("hemilight", new Vector3(0, 1, 0), this.scene);
		hemi.intensity = 0.3;

		const sun = new DirectionalLight("sun", new Vector3(-5, -10, 5).normalize(), this.scene);
		sun.position = sun.direction.negate().scaleInPlace(40);

		// Create a shadow generator
		this.shadowGenerator = new CascadedShadowGenerator(1024, sun);
		this.shadowGenerator.blurKernel = 32;
		this.shadowGenerator.useKernelBlur = true;
		this.shadowGenerator.usePercentageCloserFiltering = true;
		this.shadowGenerator.shadowMaxZ = 20;

		// Additional lights (if needed)
		const extraHemi = new HemisphericLight("extraHemi", Vector3.Up(), this.scene);
		extraHemi.intensity = 0.4;

		const skybox = MeshBuilder.CreateBox("skyBox", {size:150}, this.scene);
		const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new CubeTexture("assets/skybox/skybox", this.scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
		skyboxMaterial.specularColor = new Color3(0, 0, 0);
		skybox.material = skyboxMaterial;

		// Create a reflection probe and set the environment texture
		const rp = new ReflectionProbe("ref", 512, this.scene);
		rp.renderList?.push(skybox);
		this.scene.environmentTexture = rp.cubeTexture;

		// When the character model is loaded…
		characterTask.onSuccess = (task) => {
			// Instantiate the local player from the loaded container.
			const localInstance = task.loadedContainer.instantiateModelsToScene((name) => name);
			const mesh = localInstance.rootNodes[0] as Mesh;
			mesh.scaling = new Vector3(1, 1, 1);
			mesh.rotation = new Vector3(0, 0, 0);
			this.localController = new LocalCharacterController(mesh, localInstance.animationGroups, this.scene);
			this.localController.model.receiveShadows = true;
			this.shadowGenerator.addShadowCaster(this.localController.model);

			// Listen for new remote players joining via the Colyseus room state.
			this.room.state.players.onAdd(async (player: Player, sessionId: string) => {
				if (sessionId === this.room.sessionId) {
					// (Local player state is already handled.)
					this.localController?.setPosition(new Vector3(player.x, player.y, player.z));
					this.localController?.setRotationY(player.rot);
					return;
				}
				// Instantiate a remote player model.
				const remoteInstance = task.loadedContainer.instantiateModelsToScene((name) => name);
				const remoteMesh = remoteInstance.rootNodes[0] as Mesh;
				remoteMesh.scaling = new Vector3(1, 1, 1);
				remoteMesh.rotation = new Vector3(0, 0, 0);
				const remoteController = new RemoteCharacterController(remoteMesh, this.scene, remoteInstance.animationGroups);
				remoteController.setPosition(new Vector3(player.x, player.y, player.z));
				remoteController.setRotationY(player.rot);
				remoteMesh.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(remoteMesh);
				this.remoteControllers.set(sessionId, remoteController);

				remoteController.receiveState(player);
				player.onChange(() => remoteController.receiveState(player));
				player.onRemove(() => {
					remoteController.dispose();
					this.remoteControllers.delete(sessionId);
				});
			});
		};

		// When all assets are loaded, create a simple full‐screen GUI (e.g. an FPS counter)
		this.assetsManager.onFinish = () => {
			const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
			this.fpsText = new GUI.TextBlock();
			this.fpsText.text = "FPS: 0";
			this.fpsText.color = "white";
			this.fpsText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
			this.fpsText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
			this.fpsText.paddingRight = "10px";
			this.fpsText.paddingTop = "10px";
			advancedTexture.addControl(this.fpsText);
		};

		// Start asset loading.
		this.assetsManager.load();

		const kitchenFolder = "assets/map/";
		const kitchenLoader = new MapLoader(this.scene, this.shadowGenerator);

		kitchenLoader.loadAndPlaceModels(kitchenFolder, mapConfigs, () => {
			console.log("All map models loaded and placed!");
			this.interactables = kitchenLoader.interactables;
		});

		// Request pointer lock (and focus) for immersive controls.
		this.scene.getEngine().getRenderingCanvas()?.requestPointerLock().catch(console.error);
		this.scene.getEngine().getRenderingCanvas()?.focus();
	}

	/**
	 * Called every frame.
	 * Updates the local player, sends movement messages, updates remote players, and updates GUI.
	 */
	update(deltaTime: number): void {
		const deltaSeconds = deltaTime / 1000;

		this.localController?.update(deltaSeconds);

		if (this.localController) {
			const playerPos = this.localController.position;
			let nearest: InteractableObject | null = null;
			let nearestDist = Infinity;

			// 1. Find the nearest interactable within range
			for (const obj of this.interactables) {
				const dist = Vector3.Distance(obj.mesh.position, playerPos);
				if (dist < obj.interactionDistance && dist < nearestDist) {
					nearestDist = dist;
					nearest = obj;
				}
			}

			// 2. Hide all billboards
			for (const obj of this.interactables) {
				obj.showPrompt(false);
			}

			// 3. If we found a valid nearest object, show it
			if (nearest) {
				nearest.showPrompt(true);
			}
		}

		if (this.room && this.localController) {
			const transform = this.localController.getTransform();
			const animationState = this.localController.getTargetAnim.name;
			this.room.send("move", {
				position: {
					x: transform.position.x,
					y: transform.position.y,
					z: transform.position.z
				},
				rotation: { y: transform.rotationQuaternion?.toEulerAngles().y },
				animationState,
				timestamp: Date.now()
			});
		}

		// Update all remote controllers.
		this.remoteControllers.forEach((controller) => {
			controller.update(deltaSeconds);
		});

		// Update FPS counter.
		if (this.fpsText) {
			this.fpsText.text = `FPS: ${this.scene.getEngine().getFps().toFixed()}`;
		}
	}
}
