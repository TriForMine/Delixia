import {
	ArcRotateCamera,
	Color3,
	DirectionalLight,
	GIRSMManager,
	HemisphericLight,
	Mesh,
	MeshBuilder,
	ReflectiveShadowMap,
	Scene,
	ShadowGenerator,
	StandardMaterial,
	Vector3
} from "@babylonjs/core";
import {BabylonScene} from "./components/BabylonScene.tsx";
import {GIRSM} from "@babylonjs/core/Rendering/GlobalIllumination/giRSM";
import {useEffect} from "react";
import {connectToColyseus, disconnectFromColyseus} from "./hooks/colyseus.ts";
import {ChatRoom} from "./components/UI/TestUI.tsx";

let box: Mesh;

const onSceneReady = (scene: Scene) => {
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
	light.position = new Vector3(-3, 5, -3);
	light.intensity = 0.7;

	// Our built-in 'box' shape.
	box = MeshBuilder.CreateBox("box", {size: 2}, scene);

	// Move the box upward 1/2 its height
	box.position.y = 1;

	const material = new StandardMaterial("material", scene);
	material.diffuseColor = new Color3(0, 1, 0);
	box.material = material;

	// Our built-in 'ground' shape.
	const ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
	const groundMaterial = new StandardMaterial("groundMaterial", scene);
	groundMaterial.diffuseColor = new Color3(1, 1, 1);
	ground.material = groundMaterial;
	ground.receiveShadows = true;

	// Add walls
	const wall1 = MeshBuilder.CreatePlane("wall1", {width: 4, height: 6}, scene);
	wall1.position.z = 3;
	wall1.position.y = 2
	wall1.rotation.z = Math.PI / 2;
	wall1.material = material;
	wall1.receiveShadows = true;

	const wall2 = MeshBuilder.CreatePlane("wall2", {width: 4, height: 6}, scene);
	wall2.position.z = 0;
	wall2.position.y = 2
	wall2.position.x = 3;
	wall2.rotation.z = Math.PI / 2;
	wall2.rotation.y = Math.PI / 2;
	wall2.material = material;
	wall2.receiveShadows = true;

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
	shadowGenerator.addShadowCaster(box);
	shadowGenerator.useKernelBlur = true;
	shadowGenerator.usePercentageCloserFiltering = true;
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene: Scene) => {
	if (box !== undefined) {
		const deltaTimeInMillis = scene.getEngine().getDeltaTime();

		const rpm = 10;
		box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
	}
};

const App = () => {
	useEffect(() => {
		(async () => {
			await connectToColyseus('my_room');
		})();

		return () => {
			disconnectFromColyseus().catch(console.error);
		};
	}, []);

	return <div className="h-screen w-screen bg-gray-800 flex">
		<div className="flex-1">
			<BabylonScene antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas"
						  className="w-full h-full"/>
		</div>
		<div className="w-100 bg-gray-900">
			<ChatRoom/>
		</div>
	</div>
};

export default App;