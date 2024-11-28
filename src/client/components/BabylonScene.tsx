import React, {useEffect, useRef} from "react";
import {AbstractEngine, Engine, Scene, WebGPUEngine} from "@babylonjs/core";
import type {AbstractEngineOptions} from "@babylonjs/core/Engines/abstractEngine";
import {SceneOptions} from "@babylonjs/core/scene";
import '@babylonjs/core/Engines/WebGPU/Extensions/'

const DisableWebGPU = false;

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
	onSceneReady: (scene: Scene) => Promise<void>;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>) => {
	const reactCanvas = useRef(null);
	const engineRef = useRef<AbstractEngine | null>(null);
	const isInitializing = useRef(false);
	const [isEngineInitialized, setIsEngineInitialized] = React.useState(false);

	useEffect(() => {
		const {current: canvas} = reactCanvas;

		if (!canvas || isEngineInitialized) return;

		const createEngine = async () => {
			if (engineRef.current || isInitializing.current) return;
			isInitializing.current = true;
			let engine: AbstractEngine;

			if (!DisableWebGPU && await WebGPUEngine.IsSupportedAsync) {
				const webgpuEngine = new WebGPUEngine(canvas, engineOptions);
				await webgpuEngine.initAsync();
				engine = webgpuEngine;
			} else {
				engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);
			}

			engineRef.current = engine;
			isInitializing.current = false;
			setIsEngineInitialized(true);
			engine.displayLoadingUI();
		};

		createEngine().catch(console.error);

		return () => {
			setIsEngineInitialized(false);
			if (engineRef.current) {
				engineRef.current.hideLoadingUI();
				engineRef.current.dispose();
				engineRef.current = null;
			}
		};
	}, [antialias, engineOptions, adaptToDeviceRatio]);

	useEffect(() => {
		if (!isEngineInitialized) return;

		let scene: Scene | undefined;

		const createScene = async () => {
			const engine = engineRef.current!;
			scene = new Scene(engine, sceneOptions);

			const onReady = async () => {
				scene?.onBeforeRenderObservable.add(() => {
					if (!scene) return;
					onRender?.(scene)
				});
				engine.runRenderLoop(() => {
					if (!scene) return;
					if (scene.activeCamera) scene.render();
				});
				scene?.getEngine().hideLoadingUI();
			}

			if (scene.isReady()) {
				await onSceneReady(scene);
				await onReady();
			} else {
				scene.onReadyObservable.addOnce(async (scene) => {
					await onSceneReady(scene);
					await onReady();
				})
			}

			const resize = () => {
				engine.resize(true);
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

		createScene().catch(console.error);

		return () => {
			if (scene) {
				scene.dispose();
			}
		};
	}, [isEngineInitialized, onRender, onSceneReady, sceneOptions]);

	return <canvas ref={reactCanvas} {...rest} tabIndex={0}/>;
};
