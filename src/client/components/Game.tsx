import {BabylonScene} from "./BabylonScene.tsx";

import {
	AssetsManager,
	CascadedShadowGenerator,
	DirectionalLight,
	GIRSM,
	GIRSMManager,
	HavokPlugin,
	HemisphericLight,
	Mesh,
	MeshBuilder,
	PBRMetallicRoughnessMaterial,
	PhysicsAggregate,
	PhysicsShapeType,
	ReflectionProbe,
	ReflectiveShadowMap,
	Scene,
	ShadowGenerator,
	Vector3
} from "@babylonjs/core";
import {useCallback, useRef} from "react";
import {useColyseusRoom} from "../hooks/colyseus.ts";
import HavokPhysics from "@babylonjs/havok";
import {SkyMaterial} from "@babylonjs/materials";
import {RemoteCharacterController} from "../game/RemoteCharacterController.ts";
import {LocalCharacterController} from "../game/LocalCharacterController.ts";
import * as GUI from '@babylonjs/gui'

interface PlayerMeshes {
	[sessionId: string]: RemoteCharacterController;
}

export const Game = ({onBackToMenu}: { onBackToMenu: () => void }) => {
	const room = useColyseusRoom();
	const playerControllers = useRef<PlayerMeshes>({});
	const localController = useRef<LocalCharacterController | undefined>(undefined);

	const onSceneReady = useCallback(async (scene: Scene) => {
		if (!room) return;

		// Initialize AssetsManager
		const assetsManager = new AssetsManager(scene);

		// Load the character model
		const characterTask = assetsManager.addContainerTask("character task", "", "assets/characters/", "character.glb");

		const hk = new HavokPlugin(true, await HavokPhysics())
		scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

		// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
		const hemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
		hemisphericLight.intensity = 0.3;

		// Directional Light
		const sun = new DirectionalLight("light", new Vector3(-5, -10, 5).normalize(), scene);
		sun.position = sun.direction.negate().scaleInPlace(40);

		// Global Illumination Manager
		const outputDimensions = {
			width: scene.getEngine().getRenderWidth(),
			height: scene.getEngine().getRenderHeight()
		}

		// Global Illumination
		const rsm = new ReflectiveShadowMap(scene, sun, outputDimensions);
		rsm.addMesh()

		const defaultGITextureRatio = 2;

		const giTextureDimensions = {
			width: Math.floor(scene.getEngine().getRenderWidth(true) / defaultGITextureRatio),
			height: Math.floor(scene.getEngine().getRenderHeight(true) / defaultGITextureRatio),
		};

		const giRSMMgr = new GIRSMManager(scene, outputDimensions, giTextureDimensions, 2048);

		const giRSM = new GIRSM(rsm);

		giRSMMgr.addGIRSM(giRSM);
		giRSMMgr.addMaterial();

		// Shadows
		const shadowGenerator = new CascadedShadowGenerator(1024, sun);
		shadowGenerator.blurKernel = 32;
		shadowGenerator.useKernelBlur = true;
		shadowGenerator.usePercentageCloserFiltering = true;
		shadowGenerator.shadowMaxZ = 20;
		shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

		const hemiLight = new HemisphericLight("hemi", Vector3.Up(), scene);
		hemiLight.intensity = 0.4;

		const skyMaterial = new SkyMaterial("skyMaterial", scene);
		skyMaterial.backFaceCulling = false;
		skyMaterial.useSunPosition = true;
		skyMaterial.sunPosition = sun.direction.negate();

		const skybox = MeshBuilder.CreateBox("skyBox", {size: 100.0}, scene);
		skybox.material = skyMaterial;

		// Reflection probe
		const rp = new ReflectionProbe("ref", 512, scene);
		rp.renderList?.push(skybox);

		scene.environmentTexture = rp.cubeTexture;

		// Ground
		const groundMaterial = new PBRMetallicRoughnessMaterial("groundMat", scene);
		const ground = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
		ground.material = groundMaterial;
		ground.receiveShadows = true;

		new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
			mass: 0,
		}, scene);

		const cube = MeshBuilder.CreateBox("cube", {size: 0.5}, scene);
		cube.position = new Vector3(2, 0.25, 2);
		new PhysicsAggregate(cube, PhysicsShapeType.BOX, {
			mass: 0
		}, scene);


		characterTask.onSuccess = (task) => {
			const localPlayer = task.loadedContainer.instantiateModelsToScene((name) => name);

			// Create local player
			const mesh = localPlayer.rootNodes[0] as Mesh;
			mesh.scaling = new Vector3(1, 1, 1);
			mesh.rotation = new Vector3(0, 0, 0);
			localController.current = new LocalCharacterController(mesh, localPlayer.animationGroups, scene);
			localController.current.model.receiveShadows = true;
			shadowGenerator.addShadowCaster(localController.current.model);

			room.state.players.onAdd(async (player, sessionId) => {
				if (sessionId === room.sessionId) {
					// Initialize local player position and rotation
					localController.current?.setPosition(
						new Vector3(player.x, player.y, player.z)
					);
					localController.current?.setRotationY(player.rot);
					return
				}

				const remotePlayer = task.loadedContainer.instantiateModelsToScene((name) => name);
				const mesh = remotePlayer.rootNodes[0] as Mesh;
				mesh.scaling = new Vector3(1, 1, 1);
				mesh.rotation = new Vector3(0, 0, 0);
				const remoteController = new RemoteCharacterController(mesh, scene, remotePlayer.animationGroups);
				remoteController.setPosition(new Vector3(player.x, player.y, player.z));
				remoteController.setRotationY(player.rot);

				remoteController.model.receiveShadows = true;
				shadowGenerator.addShadowCaster(remoteController.model);
				playerControllers.current[sessionId] = remoteController;

				remoteController.receiveState(player);

				player.onChange(() => {
					remoteController.receiveState(player);
				})

				// Handle player removal
				player.onRemove(() => {
					remoteController.dispose();
					delete playerControllers.current[sessionId];
				});
			})
		}

		assetsManager.onFinish = _ => {
			// Create GUI
			const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

			// Add FPS Counter
			const fpsText = new GUI.TextBlock();
			fpsText.text = "FPS: 0";
			fpsText.color = "white";
			fpsText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
			fpsText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
			fpsText.paddingRight = "10px";
			fpsText.paddingTop = "10px";
			advancedTexture.addControl(fpsText);

			scene.onBeforeRenderObservable.add(() => {
				fpsText.text = `FPS: ${scene.getEngine().getFps().toFixed()}`;
			});
		}

		assetsManager.load();

		// Lock the cursor when the game is running
		scene.getEngine().getRenderingCanvas()?.requestPointerLock()
			.catch(console.error);

		// Make sure the canvas is focused
		scene.getEngine().getRenderingCanvas()?.focus();
	}, [room]);

	/**
	 * Will run on every frame render. We are updating the local player and interpolating remote players.
	 */
	const onUpdate = useCallback(
		(scene: Scene) => {
			const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
			localController.current?.update(deltaSeconds);
			if (room && localController.current) {
				const transform = localController.current.getTransform();
				const animationState = localController.current.getTargetAnim.name;

				room.send("move", {
					position: {
						x: transform.position.x,
						y: transform.position.y,
						z: transform.position.z,
					},
					rotation: {
						y: transform.rotationQuaternion?.toEulerAngles().y,
					},
					animationState: animationState,
					timestamp: Date.now(),
				});
			}

			// Update remote players with interpolation
			Object.values(playerControllers.current).forEach((remoteController) => {
				remoteController.update(deltaSeconds);
			});
		},
		[room]
	);

	return <div className="relative w-full h-full">
		<BabylonScene antialias onSceneReady={onSceneReady} onRender={onUpdate} id="my-canvas"
					  className="w-full h-full"/>
		<button
			onClick={onBackToMenu}
			className="absolute top-4 left-4 btn btn-primary"
		>
			Back to Menu
		</button>
	</div>
}