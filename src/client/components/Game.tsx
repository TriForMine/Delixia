import { useCallback, useRef } from "react";
import { Scene } from "@babylonjs/core";
import { BabylonScene } from "./BabylonScene";
import { useColyseusRoom } from "../hooks/colyseus";
import { GameEngine } from "../game/GameEngine";

export const Game = ({ onBackToMenu }: { onBackToMenu: () => void }) => {
	const room = useColyseusRoom();
	const gameEngineRef = useRef<GameEngine>();

	// When the Babylon scene is ready, instantiate our GameEngine
	const onSceneReady = useCallback(async (scene: Scene) => {
		if (!room) return;
		gameEngineRef.current = new GameEngine(scene, room);
		await gameEngineRef.current.init();
	}, [room]);

	// Call our GameEngine’s update method on each frame.
	const onRender = useCallback((scene: Scene) => {
		const deltaTime = scene.getEngine().getDeltaTime();
		gameEngineRef.current?.update(deltaTime);
	}, []);

	return (
		<div className="relative w-full h-full">
			<BabylonScene
				antialias
				onSceneReady={onSceneReady}
				onRender={onRender}
				id="my-canvas"
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
