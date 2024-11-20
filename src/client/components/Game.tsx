import {BabylonScene} from "./BabylonScene.tsx";

import {
	ArcRotateCamera,
	Color3,
	DirectionalLight,
	GIRSM,
	GIRSMManager,
	HavokPlugin,
	HemisphericLight,
	KeyboardEventTypes,
	Mesh,
	MeshBuilder,
	PhysicsAggregate,
	PhysicsShapeType,
	Quaternion,
	ReflectiveShadowMap,
	Scene,
	ShadowGenerator,
	StandardMaterial,
	Vector3
} from "@babylonjs/core";
import {useCallback} from "react";
import {useColyseusRoom} from "../hooks/colyseus.ts";
import HavokPhysics from "@babylonjs/havok";

let currentPlayer: Mesh;

export const Game = () => {
	const room = useColyseusRoom();

	const onSceneReady = useCallback(async (scene: Scene) => {
		if (room === undefined) {
			return;
		}

		// This creates and positions a free camera (non-mesh)
		const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene);

		const canvas = scene.getEngine().getRenderingCanvas();

		// This attaches the camera to the canvas
		camera.attachControl(canvas, true);

		// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
		const hemisphericLight = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
		hemisphericLight.intensity = 0.3;

		// Directional Light
		const light = new DirectionalLight("light", new Vector3(2, -1, 3), scene);
		light.position = new Vector3(-300, 5, -300);
		light.intensity = 0.7;

		const hk = new HavokPlugin(true, await HavokPhysics())
		scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

		// Our built-in 'box' shape.
		currentPlayer = MeshBuilder.CreateBox("box", {size: 2}, scene);
		currentPlayer.receiveShadows = true;

		// Move the box upward 1/2 its height
		currentPlayer.position.y = 1;

		new PhysicsAggregate(currentPlayer, PhysicsShapeType.BOX, {mass: 1}, scene);

		const otherPlayersMaterial = new StandardMaterial("material", scene);
		otherPlayersMaterial.diffuseColor = new Color3(0, 1, 0);

		const material = new StandardMaterial("material", scene);
		material.diffuseColor = new Color3(1, 0, 0);
		currentPlayer.material = material;

		// Our built-in 'ground' shape.
		const ground = MeshBuilder.CreateGround("ground", {width: 50, height: 50}, scene);
		const groundMaterial = new StandardMaterial("groundMaterial", scene);
		groundMaterial.diffuseColor = new Color3(1, 1, 1);
		ground.material = groundMaterial;
		ground.receiveShadows = true;
		new PhysicsAggregate(ground, PhysicsShapeType.BOX, {
			mass: 0,
			friction: 0.5,
			restitution: 0.7
		}, scene);

		// Global Illumination Manager
		const outputDimensions = {
			width: scene.getEngine().getRenderWidth(),
			height: scene.getEngine().getRenderHeight()
		}

		// Global Illumination
		const rsm = new ReflectiveShadowMap(scene, light, outputDimensions);
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
		const shadowGenerator = new ShadowGenerator(1024, light);
		shadowGenerator.useBlurExponentialShadowMap = true;
		shadowGenerator.blurKernel = 32;
		shadowGenerator.addShadowCaster(currentPlayer);
		shadowGenerator.useKernelBlur = true;
		shadowGenerator.usePercentageCloserFiltering = true;

		room.state.players.onAdd((player, sessionId) => {
			if (sessionId !== room.sessionId) {
				const playerBox = MeshBuilder.CreateBox("player", {size: 2}, scene);
				playerBox.position.y = player.position.y;
				playerBox.position.x = player.position.x;
				playerBox.position.z = player.position.z;
				playerBox.rotationQuaternion = new Quaternion(player.rotation.x, player.rotation.y, player.rotation.z, player.rotation.w);
				playerBox.material = otherPlayersMaterial;
				playerBox.receiveShadows = true;

				shadowGenerator.addShadowCaster(playerBox);


				player.position.listen("x", (x) => {
					playerBox.position.x = x;
				})
				player.position.listen("y", (y) => {
					playerBox.position.y = y;
				})
				player.position.listen("z", (z) => {
					playerBox.position.z = z;
				})

				player.rotation.listen("x", (x) => {
					playerBox.rotationQuaternion = new Quaternion(x, playerBox.rotationQuaternion!.y, playerBox.rotationQuaternion!.z, playerBox.rotationQuaternion!.w);
				})
				player.rotation.listen("y", (y) => {
					playerBox.rotationQuaternion = new Quaternion(playerBox.rotationQuaternion!.x, y, playerBox.rotationQuaternion!.z, playerBox.rotationQuaternion!.w);
				})
				player.rotation.listen("z", (z) => {
					playerBox.rotationQuaternion = new Quaternion(playerBox.rotationQuaternion!.x, playerBox.rotationQuaternion!.y, z, playerBox.rotationQuaternion!.w);
				})
				player.rotation.listen("w", (w) => {
					playerBox.rotationQuaternion = new Quaternion(playerBox.rotationQuaternion!.x, playerBox.rotationQuaternion!.y, playerBox.rotationQuaternion!.z, w);
				})

				player.onRemove(() => {
					playerBox.dispose();
				})
			} else {
				currentPlayer.position.x = player.position.x;
				currentPlayer.position.y = player.position.y;
				currentPlayer.position.z = player.position.z;
			}
		})

		const keyboard: { x: number, y: number, z: number } = {x: 0, y: 0, z: 0};

		scene.onKeyboardObservable.add((kbInfo) => {
			switch (kbInfo.type) {
				case KeyboardEventTypes.KEYDOWN:
					switch (kbInfo.event.key) {
						case "z":
							keyboard.z = 10;
							break;
						case "q":
							keyboard.x = -10;
							break;
						case "s":
							keyboard.z = -10;
							break;
						case "d":
							keyboard.x = 10;
							break;
						case " ":
							keyboard.y = 10;
							break;
					}
					currentPlayer.physicsBody?.setLinearVelocity(new Vector3(keyboard.x, keyboard.y, keyboard.z));
					break;
				case KeyboardEventTypes.KEYUP:
					switch (kbInfo.event.key) {
						case "z":
							keyboard.z = 0;
							break;
						case "q":
							keyboard.x = 0;
							break;
						case "s":
							keyboard.z = 0;
							break;
						case "d":
							keyboard.x = 0;
							break;
						case " ":
							keyboard.y = 0;
							break;
					}
					currentPlayer.physicsBody?.setLinearVelocity(new Vector3(keyboard.x, keyboard.y, keyboard.z));
					break;
			}
		})
	}, [room]);

	/**
	 * Will run on every frame render.  We are spinning the box on y-axis.
	 */
	const onRender = useCallback((_: Scene) => {
		if (room && currentPlayer) {
			console.log(currentPlayer.position);
			room.send("move", {
				position: {
					x: currentPlayer.position.x, y: currentPlayer.position.y, z: currentPlayer.position.z
				},
				quaternion: {
					x: currentPlayer.rotationQuaternion!.x,
					y: currentPlayer.rotationQuaternion!.y,
					z: currentPlayer.rotationQuaternion!.z,
					w: currentPlayer.rotationQuaternion!.w
				}
			});
		}
	}, [room, currentPlayer]);

	return <BabylonScene antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas"
						 className="w-full h-full"/>
}