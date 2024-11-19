import React, {useEffect, useRef} from "react";
import {AbstractEngine, Engine, Scene, WebGPUEngine} from "@babylonjs/core";
import type {AbstractEngineOptions} from "@babylonjs/core/Engines/abstractEngine";
import {SceneOptions} from "@babylonjs/core/scene";
import '@babylonjs/core/Engines/WebGPU/Extensions/'

let engine: AbstractEngine;

export const BabylonScene = ({
								 antialias,
								 engineOptions,
								 adaptToDeviceRatio,
								 sceneOptions,
								 onRender,
								 onSceneReady,
								 ...rest
							 }: {
	antialias?: boolean;
	engineOptions?: AbstractEngineOptions;
	adaptToDeviceRatio?: boolean;
	sceneOptions?: SceneOptions;
	onRender?: (scene: Scene) => void;
	onSceneReady: (scene: Scene) => void;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>) => {
	const reactCanvas = useRef(null);
	const [isEngineInitialized, setIsEngineInitialized] = React.useState(false);

	useEffect(() => {
		const {current: canvas} = reactCanvas;

		if (!canvas || isEngineInitialized) return;

		const createEngine = async () => {
			if (await WebGPUEngine.IsSupportedAsync) {
				const webgpuEngine = new WebGPUEngine(canvas, engineOptions);
				await webgpuEngine.initAsync();
				engine = webgpuEngine;
				setIsEngineInitialized(true);
			} else {
				engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);
			}
		};

		createEngine().catch(console.error);

		return () => {
			setIsEngineInitialized(false);
			if (engine) {
				engine.dispose();
			}
		};
	}, [antialias, engineOptions, adaptToDeviceRatio]);

	useEffect(() => {
		if (!isEngineInitialized) return;

		let scene: Scene | undefined;

		const createScene = () => {
			scene = new Scene(engine, sceneOptions);
			if (scene.isReady()) {
				onSceneReady(scene);
			} else {
				scene.onReadyObservable.addOnce((scene) => onSceneReady(scene));
			}

			engine.runRenderLoop(() => {
				if (!scene) return;
				if (typeof onRender === "function") onRender(scene);
				scene.render();
			});

			const resize = () => {
				scene?.getEngine().resize();
			};

			if (window) {
				window.addEventListener("resize", resize);
			}

			return () => {
				scene?.getEngine().dispose();
				if (window) {
					window.removeEventListener("resize", resize);
				}
			};
		}

		createScene();

		return () => {
			if (scene) {
				scene.dispose();
			}
		};
	}, [isEngineInitialized, onRender, onSceneReady, sceneOptions]);

	return <canvas ref={reactCanvas} {...rest} />;
};
