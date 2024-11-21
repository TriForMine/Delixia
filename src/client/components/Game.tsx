import {BabylonScene} from "./BabylonScene.tsx";

import {
	DirectionalLight,
	GIRSM,
	GIRSMManager,
	HavokPlugin,
	HemisphericLight,
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

interface PlayerMeshes {
	[sessionId: string]: RemoteCharacterController;
}

export const Game = () => {
	const room = useColyseusRoom();
	const playerControllers = useRef<PlayerMeshes>({});
	const localController = useRef<LocalCharacterController | undefined>(undefined);

	const onSceneReady = useCallback(async (scene: Scene) => {
		if (!room) return;

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
		const shadowGenerator = new ShadowGenerator(1024, sun);
		shadowGenerator.useBlurExponentialShadowMap = true;
		shadowGenerator.blurKernel = 32;
		shadowGenerator.useKernelBlur = true;
		shadowGenerator.usePercentageCloserFiltering = true;

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

		// Create local player

		localController.current = await LocalCharacterController.CreateAsync(scene);
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

			const remoteController = await RemoteCharacterController.CreateAsync(scene);
			remoteController.setPosition(new Vector3(player.x, player.y, player.z));
			remoteController.setRotationY(player.rot);

			shadowGenerator.addShadowCaster(remoteController.model);
			playerControllers.current[sessionId] = remoteController;

			remoteController.receiveState(player);

			player.onChange(() => {
				console.log(`Player ${sessionId} changed: ${player.x}, ${player.y}, ${player.z}, ${player.rot}, ${player.animationState}`);
				remoteController.receiveState(player);
			})

			// Handle player removal
			player.onRemove(() => {
				remoteController.dispose();
				delete playerControllers.current[sessionId];
			});
		})
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

	return <BabylonScene antialias onSceneReady={onSceneReady} onRender={onUpdate} id="my-canvas"
						 className="w-full h-full"/>
}