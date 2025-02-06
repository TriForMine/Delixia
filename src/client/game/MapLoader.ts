import {
	Animation,
	AssetContainer,
	AssetsManager,
	Mesh,
	PhysicsShapeType,
	Scene,
	PhysicsAggregate, ParticleSystem,
	Texture,
	Vector3, Color4, TransformNode, PointLight, Color3
} from "@babylonjs/core";
import type {AbstractMesh} from "@babylonjs/core/Meshes/abstractMesh";


export interface PhysicsConfig {
	shapeType: PhysicsShapeType;    // e.g. PhysicsShapeType.BOX, PhysicsShapeType.MESH, etc.
	mass?: number;                   // e.g. 0 for static, > 0 for dynamic
	restitution?: number;
	friction?: number;
}

export interface MapModelConfig {
	fileName: string;
	defaultScaling?: { x?: number; y?: number; z?: number };

	/** Default physics if no per-instance physics is specified */
	defaultPhysics?: PhysicsConfig;

	instances: Array<{
		position: { x: number; y: number; z: number };
		rotation?: { x?: number; y?: number; z?: number };
		scaling?: { x?: number; y?: number; z?: number };

		/** Optional override for physics */
		physics?: PhysicsConfig;
	}>;
}

export class MapLoader {
	private readonly scene: Scene;
	private assetsManager: AssetsManager;
	private loadedContainers: { [fileName: string]: AssetContainer } = {};

	constructor(scene: Scene) {
		this.scene = scene;
		this.assetsManager = new AssetsManager(this.scene);
	}

	public loadAndPlaceModels(
		folder: string,
		modelConfigs: MapModelConfig[],
		onFinish: () => void
	): void {
		// 1. Create a unique loading task for each distinct `fileName`
		modelConfigs.forEach((modelConfig) => {
			const { fileName } = modelConfig;
			if (!this.loadedContainers[fileName]) {
				const task = this.assetsManager.addContainerTask(fileName, "", folder, fileName);

				task.onSuccess = (task) => {
					this.loadedContainers[fileName] = task.loadedContainer;
				};

				task.onError = (_task, message, exception) => {
					console.error(`Error loading ${fileName}:`, message, exception);
				};
			}
		});

		// 2. After all loading tasks are done, instantiate each config’s placements
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
					const root = instance.rootNodes[0] as Mesh;
					if (!root) return;

					if (modelConfig.fileName === "Fantasy Portal 3D LowPoly Model.glb") {
						// Create a transform node for the emitter, positioned at the top center of the portal’s stand
						const emitterNode = new TransformNode("portalEmitter", this.scene);
						emitterNode.parent = root;
						emitterNode.position = new Vector3(0, 0.7, 0); // Adjust this Y-offset as needed

						// Animate the emitter node to continuously rotate, enhancing the vortex feel
						const rotateAnimation = new Animation(
							"rotateEmitter",
							"rotation.y",
							30,
							Animation.ANIMATIONTYPE_FLOAT,
							Animation.ANIMATIONLOOPMODE_CYCLE
						);
						rotateAnimation.setKeys([
							{ frame: 0, value: 0 },
							{ frame: 360, value: 2 * Math.PI }
						]);
						emitterNode.animations = [rotateAnimation];
						this.scene.beginAnimation(emitterNode, 0, 360, true);

						// Optionally, add a point light to further enhance the magical glow
						// (Be sure to import Color3 from "@babylonjs/core")
						const portalLight = new PointLight("portalLight", emitterNode.getAbsolutePosition(), this.scene);
						portalLight.diffuse = new Color3(0.4, 0.2, 0.8);
						portalLight.intensity = 1.5;
						portalLight.parent = emitterNode;

						// Configure the particle system for a swirling vortex effect
						const particleSystem = new ParticleSystem("portalVortex", 2000, this.scene);
						particleSystem.particleTexture = new Texture("assets/particles/DarkMagicSmoke.png", this.scene);

						// Use the alpha channel of the texture so non-opaque parts stay transparent
						particleSystem.emitter = emitterNode as AbstractMesh;
						particleSystem.billboardMode = ParticleSystem.BILLBOARDMODE_ALL;

						// Limit emission to a small disc area at the emitter’s location
						particleSystem.minEmitBox = new Vector3(-0.5, 0, -0.5);
						particleSystem.maxEmitBox = new Vector3(0.5, 0, 0.5);

						// Create a swirling vortex effect by computing a tangent direction based on the particle’s initial position
						particleSystem.startDirectionFunction = (_worldMatrix, directionToUpdate, particle) => {
							// Determine the particle's position relative to the emitter
							const emitterPos = emitterNode.getAbsolutePosition();
							const relativePos = particle.position.subtract(emitterPos);

							// If the particle starts very near the center, choose a random direction
							if (relativePos.length() < 0.001) {
								const angle = Math.random() * 2 * Math.PI;
								relativePos.x = Math.cos(angle);
								relativePos.z = Math.sin(angle);
							}
							// Compute the tangent vector (perpendicular on the XZ plane) to create a swirling motion
							const tangent = new Vector3(-relativePos.z, 0, relativePos.x).normalize();
							const horizontalSpeed = 0.5 + Math.random() * 0.5;
							const verticalSpeed = 2 + Math.random();

							directionToUpdate.x = tangent.x * horizontalSpeed;
							directionToUpdate.y = verticalSpeed;
							directionToUpdate.z = tangent.z * horizontalSpeed;
							directionToUpdate.normalize();
						};

						// Set colors for that magical, bluish-purplish effect
						particleSystem.color1 = new Color4(0.2, 0.5, 1.0, 1.0); // Bright blue
						particleSystem.color2 = new Color4(0.1, 0.3, 0.8, 1.0); // Slightly darker blue
						particleSystem.colorDead = new Color4(0.0, 0.1, 0.5, 0.0); // Fade out to a deep blue

						// Adjust sizes, lifetimes, and other parameters for a smoother vortex effect
						particleSystem.minSize = 0.3;
						particleSystem.maxSize = 0.5;
						particleSystem.minLifeTime = 1.2;
						particleSystem.maxLifeTime = 1.4;
						particleSystem.emitRate = 250;
						particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
						particleSystem.gravity = new Vector3(0, 0, 0); // No gravity so particles don't fall prematurely
						particleSystem.minAngularSpeed = 0;
						particleSystem.maxAngularSpeed = Math.PI;

						particleSystem.start();
					}

					// Apply default scaling
					if (modelConfig.defaultScaling) {
						root.scaling.set(
							modelConfig.defaultScaling.x ?? 1,
							modelConfig.defaultScaling.y ?? 1,
							modelConfig.defaultScaling.z ?? 1
						);
					}

					if (placement.rotation) {
						root.rotation.set(
							placement.rotation.x ?? 0,
							placement.rotation.y ?? 0,
							placement.rotation.z ?? 0
						);
					}
					// Apply transforms
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

					// Apply physics recursively
					root.getChildMeshes().forEach((mesh) => {
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

						const { shapeType, mass, restitution, friction } = physics;

						new PhysicsAggregate(mesh, shapeType, {
							mass: mass ?? 0,
							restitution: restitution ?? 0,
							friction: friction ?? 0,
						}, this.scene);

						mesh.receiveShadows = true;
					});
				});
			});

			onFinish();
		};

		// 3. Start loading
		this.assetsManager.load();
	}
}
