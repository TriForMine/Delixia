import {BabylonScene} from "./BabylonScene.tsx";
import {FlyCamera, HemisphericLight, MeshBuilder, PointerEventTypes, Scene, Vector3,} from "@babylonjs/core";
import {useCallback} from "react";
import * as GUI from '@babylonjs/gui'
import {CustomFlyCameraInput} from "../inputs/EditorCameraInput.ts";

export const LevelEditor = ({onBackToMenu}: { onBackToMenu: () => void }) => {
	const onSceneReady = useCallback(async (scene: Scene) => {
		// Set up basic lighting
		new HemisphericLight("light", new Vector3(0, 1, 0), scene);

		// Set up camera
		const camera = new FlyCamera(
			"editorCamera",
			new Vector3(0, 5, -10),
			scene
		);

		const input = new CustomFlyCameraInput(camera, scene);
		input.attachControl();

		// Create ground
		const ground = MeshBuilder.CreateGround(
			"ground",
			{width: 50, height: 50},
			scene
		);

		// Enable object placement on click
		scene.onPointerObservable.add((pointerInfo) => {
			if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
				const pickResult = scene.pick(
					scene.pointerX,
					scene.pointerY,
					(mesh) => mesh === ground
				);
				if (pickResult && pickResult.hit && pickResult.pickedPoint) {
					// Place a box at the clicked position
					const box = MeshBuilder.CreateBox(
						"box",
						{size: 1},
						scene
					);
					box.position = pickResult.pickedPoint;
					box.position.y += 0.5; // Adjust height to sit on the ground
				}
			}
		});

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
			input.update();
		});
	}, []);

	const onUpdate = useCallback((_: Scene) => {
		// Handle per-frame updates if necessary
	}, []);

	return (
		<div className="relative w-full h-full">
			<BabylonScene
				antialias
				onSceneReady={onSceneReady}
				onRender={onUpdate}
				id="editor-canvas"
				className="w-full h-full"
			/>
			<button
				onClick={onBackToMenu}
				className="absolute top-4 left-4 btn btn-primary"
			>
				Back to Menu
			</button>
		</div>
	);
};
