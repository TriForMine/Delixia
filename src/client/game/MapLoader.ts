import {
	AssetContainer,
	AssetsManager,
	Mesh,
	Scene,
	PhysicsAggregate, CascadedShadowGenerator, Vector3, StandardMaterial,
    Color3,
} from "@babylonjs/core";
import { InteractableObject } from "./InteractableObject";
import {MapModelConfig} from "@shared/types/map.ts";

export class MapLoader {
	private readonly scene: Scene;
	private readonly cascadedShadowGenerator: CascadedShadowGenerator;
	private assetsManager: AssetsManager;
	private loadedContainers: { [fileName: string]: AssetContainer } = {};
	private cloudMaterial: StandardMaterial;
	public interactables: InteractableObject[] = [];

	constructor(scene: Scene, cascadedShadowGenerator: CascadedShadowGenerator) {
		this.scene = scene;
		this.assetsManager = new AssetsManager(this.scene);
		this.assetsManager.autoHideLoadingUI = false;
		this.assetsManager.useDefaultLoadingScreen = false;
		this.cascadedShadowGenerator = cascadedShadowGenerator;
		const material = new StandardMaterial("cloud", this.scene);
		material.disableLighting = false;
		material.emissiveColor = new Color3(0.5, 0.5, 0.5);
		material.alpha = 0.85;
		material.backFaceCulling = true;
		this.cloudMaterial = material;
	}

	public loadAndPlaceModels(
		folder: string,
		modelConfigs: MapModelConfig[],
		onFinish: () => void,
		onProgress?: (progress: number) => void
	): void {
		// 1. Create a unique loading task for each distinct `fileName`
		modelConfigs.forEach((modelConfig) => {
			const { fileName } = modelConfig;
			if (!this.loadedContainers[fileName]) {
				const mapFolder = folder + modelConfig.map + "/";
				const task = this.assetsManager.addContainerTask(fileName, "", mapFolder, fileName);

				task.onSuccess = (task) => {
					this.loadedContainers[fileName] = task.loadedContainer;
				};

				task.onError = (_task, message, exception) => {
					console.error(`Error loading ${fileName}:`, message, exception);
				};
			}
		});

		// 2. Set up progress tracking if provided
		if (onProgress && typeof onProgress === "function") {
			this.assetsManager.onProgress = (remainingCount, totalCount) => {
				const loadedCount = totalCount - remainingCount;
				const progress = (loadedCount / totalCount) * 100;
				onProgress(progress);
			};
		}

		// 3. After all loading tasks are done, instantiate each config’s placements
		this.assetsManager.onFinish = () => {
			modelConfigs.forEach((modelConfig) => {
				const container = this.loadedContainers[modelConfig.fileName];
				if (!container) {
					console.warn(
						`Could not find loaded container for "${modelConfig.fileName}". Skipping.`
					);
					return;
				}

				const defaultPhysics = modelConfig.defaultPhysics;

				// For each placement in this config, instantiate the same container.
				modelConfig.instances.forEach((placement) => {
					const instance = container.instantiateModelsToScene((name) => name);

					// The root node in the container is typically at index 0
					const rootNode = instance.rootNodes[0];
					if (!rootNode || !(rootNode instanceof Mesh)) {
						console.error(`Invalid root node for model "${modelConfig.fileName}"`);
						return;
					}
					const root = rootNode;

					root.name = modelConfig.fileName.replace(".glb", "");

					// Apply default scaling
					if (modelConfig.defaultScaling) {
						root.scaling.set(
							modelConfig.defaultScaling.x ?? 1,
							modelConfig.defaultScaling.y ?? 1,
							modelConfig.defaultScaling.z ?? 1
						);
					}

					if (placement.interaction) {
						const offset =
							modelConfig.billboardOffset
								? new Vector3(modelConfig.billboardOffset.x, modelConfig.billboardOffset.y, modelConfig.billboardOffset.z)
								: undefined;
						const interactableObj = new InteractableObject(root, this.scene, placement.interaction.interactType, placement.interaction.id, offset);
						interactableObj.interactionDistance = 2;
						this.interactables.push(interactableObj);
					}

					if (placement.rotation) {
						root.rotation.set(
							placement.rotation.x ?? 0,
							placement.rotation.y ?? 0,
							placement.rotation.z ?? 0
						);
					}
					// Apply transforms to the root object
					if (placement.position) {
						root.position.set(
							placement.position.x,
							placement.position.y,
							placement.position.z
						);
					}
					if (placement.scaling) {
						root.scaling.set(
							placement.scaling.x ?? 1,
							placement.scaling.y ?? 1,
							placement.scaling.z ?? 1
						);
					}

					// Apply physics and shadows recursively to child meshes
					root.getChildMeshes().forEach((mesh) => {
						// Inherit rotation from root to ensure consistent rotation
						if (placement.rotation) {
							mesh.rotation.set(
								placement.rotation.x ?? 0,
								placement.rotation.y ?? 0,
								placement.rotation.z ?? 0
							);
							mesh.rotationQuaternion = null;
						}
						const physics = placement.physics ?? defaultPhysics;
						if (!physics) return;

						if (!physics.shapeType) {
							console.warn(`Missing shape type for physics in model "${modelConfig.fileName}"`);
							return;
						}

						new PhysicsAggregate(mesh, physics.shapeType, {
							mass: physics.mass ?? 0,
							restitution: physics.restitution ?? 0.2, // Default restitution for better bounce
							friction: physics.friction ?? 0.5, // Default friction for better physics feel
						}, this.scene);

						mesh.receiveShadows = true;

						if (modelConfig.fileName == "cloud1.glb") {
							mesh.material = this.cloudMaterial;
						}

						this.cascadedShadowGenerator.addShadowCaster(mesh);
					});
				});
			});
			
			onFinish();
		};

		// 4. Start loading
		this.assetsManager.load();
	}
}
