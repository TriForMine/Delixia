import React, {useEffect, useRef} from "react";
import {AbstractEngine, Engine, ILoadingScreen, Scene, WebGPUEngine} from "@babylonjs/core";
import type {AbstractEngineOptions} from "@babylonjs/core/Engines/abstractEngine";
import {SceneOptions} from "@babylonjs/core/scene";
import '@babylonjs/core/Engines/WebGPU/Extensions/'

const DisableWebGPU = false;

/**
 * CustomLoadingScreen implements Babylon's ILoadingScreen interface.
 * We bind loadingUIText to an element on our loading overlay, so we can update it dynamically.
 */
export class CustomLoadingScreen implements ILoadingScreen {
	public loadingUIText: string = "";
	public loadingUIBackgroundColor = "rgba(0, 0, 0, 0.8)";

	private loadingDiv?: HTMLDivElement;
	private progressBar?: HTMLDivElement;
	private loadingTextElement?: HTMLParagraphElement;

	constructor(private canvas: HTMLCanvasElement) {
		this.createLoadingUI();
	}

	private createLoadingUI() {
		this.loadingDiv = document.createElement("div");

		// Tailwind classes for styling the overlay.
		this.loadingDiv.className = `
  fixed inset-0
  flex flex-col
  bg-black bg-opacity-80
  bg-cover bg-center
  transition-opacity duration-300
  opacity-0
  z-50
  pointer-events-none
`;


		// Inner HTML structure
		this.loadingDiv.innerHTML = `
      <!-- Top area: Game Title -->
      <div class="flex flex-col items-center mt-10">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
          Delixia
        </h1>
      </div>

      <!-- Middle area: Loading text -->
      <div class="flex flex-col items-center justify-center flex-grow">
        <p 
          id="loading-text"
          class="text-white text-xl md:text-2xl font-medium px-4 text-center"
        >
          <!-- Will be bound to loadingUIText dynamically -->
        </p>
      </div>

      <!-- Bottom area: Progress bar -->
      <div class="w-full px-4 mb-10">
        <div class="max-w-xl mx-auto bg-gray-700 rounded-full h-4">
          <div 
            id="progress-bar-fill"
            class="h-full bg-blue-500 rounded-full transition-all duration-300"
            style="width: 0%;">
          </div>
        </div>
      </div>
    `;

		// Append to DOM
		this.canvas.parentElement?.appendChild(this.loadingDiv);

		// References to elements for later updates
		this.progressBar = this.loadingDiv.querySelector<HTMLDivElement>("#progress-bar-fill") ?? undefined;
		this.loadingTextElement = this.loadingDiv.querySelector<HTMLParagraphElement>("#loading-text") ?? undefined;
	}

	/**
	 * displayLoadingUI is called by Babylon to show the loading screen.
	 */
	public displayLoadingUI(): void {
		if (!this.loadingDiv) return;

		// Update text on each display call, in case it changed
		if (this.loadingTextElement) {
			this.loadingTextElement.innerText = this.loadingUIText || "Loading...";
		}

		this.loadingDiv.style.opacity = "1";
	}

	/**
	 * hideLoadingUI is called by Babylon to hide the loading screen.
	 */
	public hideLoadingUI(): void {
		if (!this.loadingDiv) return;

		this.loadingDiv.style.opacity = "0";
	}

	/**
	 * updateProgress(percentage) updates the progress bar width.
	 */
	public updateProgress(percentage: number): void {
		if (this.progressBar) {
			this.progressBar.style.width = `${percentage.toFixed(0)}%`;
		}
	}
}

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

			engine.loadingScreen = new CustomLoadingScreen(canvas);

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
