import {useCallback, useEffect, useRef} from "react";
import {Scene} from "@babylonjs/core";
import {BabylonScene} from "./BabylonScene";
import {GameEngine} from "../game/GameEngine";
import {useGameColyseusRoom} from "@client/hooks/colyseus.ts";

export const Game = ({onBackToMenu}: { onBackToMenu: () => void }) => {
	const room = useGameColyseusRoom();
	const gameEngineRef = useRef<GameEngine>(undefined);
	
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

	useEffect(() => {
		if (!room)
			return;

		room.onLeave((code) => {
			console.log("Room leave", code);
			gameEngineRef.current?.dispose();
			onBackToMenu();
		})
		room.onError((code, message) => {
			console.error("Room error", code, message);
			gameEngineRef.current?.dispose();
			onBackToMenu();
		});
	}, [room]);

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
				className="absolute top-4 left-4 btn btn-primary btn-lg gap-2 shadow-lg hover:scale-105 transition-transform"
			>
				<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
					 stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
				</svg>
				Main menu
			</button>
		</div>
	);
};
