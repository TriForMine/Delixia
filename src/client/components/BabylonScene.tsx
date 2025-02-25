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

		// Tailwind classes for styling the overlay with a gradient background
		this.loadingDiv.className = `
  fixed inset-0
  flex flex-col
  bg-gradient-to-b from-gray-900 to-black
  transition-opacity duration-500
  opacity-0
  z-50
  pointer-events-none
`;


		// Inner HTML structure with improved styling
		this.loadingDiv.innerHTML = `
      <!-- Center container -->
      <div class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-6">
        <!-- Game Title with glow effect -->
        <div class="text-center mb-12">
          <h1 class="text-5xl md:text-6xl font-bold text-white mb-2 tracking-wider animate-pulse">
            Delixia
          </h1>
          <div class="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>
        </div>

        <!-- Loading text with better visibility -->
        <div class="w-full text-center mb-8">
          <p
            id="loading-text"
            class="text-xl md:text-2xl font-medium text-blue-200 tracking-wide"
          >
            <!-- Will be bound to loadingUIText dynamically -->
          </p>
        </div>

        <!-- Enhanced progress bar -->
        <div class="w-full">
          <div class="relative">
            <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-md transform scale-105"></div>
            <div class="relative bg-gray-800/80 rounded-full h-3 backdrop-blur-sm">
              <div
                id="progress-bar-fill"
                class="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50"
                style="width: 0%;">
              </div>
            </div>
          </div>

          <!-- Loading indicator dots -->
          <div class="flex justify-center gap-2 mt-4">
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
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

		if (this.loadingTextElement) {
			this.loadingTextElement.innerText = this.loadingUIText;
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
