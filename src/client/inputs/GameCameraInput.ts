import {
	ArcRotateCamera,
	Axis,
	Nullable,
	Observer,
	PointerEventTypes,
	PointerInfo,
	Scene,
	Vector3,
} from "@babylonjs/core";


export class GameCameraInput {
	private camera: ArcRotateCamera;
	private scene: Scene;

	private keys = {
		forward: false,
		backward: false,
		left: false,
		right: false,
		up: false,
		down: false,
		sprint: false,
	};
	private keyMap: Record<string, string[]> = {
		forward: ["KeyW"],
		backward: ["KeyS"],
		left: ["KeyA"],
		right: ["KeyD"],
		up: ["KeyE"],
		down: ["KeyQ"],
		sprint: ["ShiftLeft", "ShiftRight"],
	};

	private mouseState = {
		isRotating: false,
		isPanning: false,
		prevX: 0,
		prevY: 0,
	};

	private sprintMultiplier = 2;
	private movementSpeed = 0.1; // Adjust as needed
	private rotationSpeed = 0.005;
	private panSpeed = 0.5;

	private pointerObserver: Nullable<Observer<PointerInfo>> = null;

	// Event handlers for window blur and focus
	private onWindowBlur = this.handleWindowBlur.bind(this);

	constructor(camera: ArcRotateCamera, scene: Scene) {
		this.camera = camera;
		this.scene = scene;
	}

	public attachControl(): void {
		// Listen to keyboard events
		window.addEventListener("keydown", this.onKeyDown.bind(this));
		window.addEventListener("keyup", this.onKeyUp.bind(this));

		// Listen to pointer (mouse) events using Babylon.js's pointer observable
		this.pointerObserver = this.scene.onPointerObservable.add(
			this.onPointerEvent.bind(this)
		);

		// Listen to window blur and focus events
		window.addEventListener("blur-sm", this.onWindowBlur);
	}

	public detachControl(): void {
		// Remove keyboard event listeners
		window.removeEventListener("keydown", this.onKeyDown.bind(this));
		window.removeEventListener("keyup", this.onKeyUp.bind(this));

		// Remove pointer observer
		if (this.pointerObserver) {
			this.scene.onPointerObservable.remove(this.pointerObserver);
			this.pointerObserver = null;
		}

		// Remove window blur and focus listeners
		window.removeEventListener("blur-sm", this.onWindowBlur);
	}

	public update(): void {
		let movement = Vector3.Zero();

		if (this.keys.forward) movement.addInPlace(this.camera.getForwardRay().direction);
		if (this.keys.backward)
			movement.addInPlace(this.camera.getForwardRay().direction.scale(-1));
		if (this.keys.left)
			movement.addInPlace(this.getRightVector().scale(-1));
		if (this.keys.right) movement.addInPlace(this.getRightVector());
		if (this.keys.up) movement.addInPlace(Axis.Y);
		if (this.keys.down) movement.addInPlace(Axis.Y.scale(-1));

		if (this.keys.sprint) movement = movement.scale(this.sprintMultiplier);

		movement = movement.normalize().scale(this.movementSpeed);

		// Move the target; ArcRotateCamera orbits around the target
		this.camera.target.addInPlace(movement);
	}

	private onKeyDown(event: KeyboardEvent): void {
		for (const action in this.keyMap) {
			if (this.keyMap[action].includes(event.code)) {
				this.keys[action as keyof typeof this.keys] = true;
				event.preventDefault();
			}
		}
	}

	private onKeyUp(event: KeyboardEvent): void {
		for (const action in this.keyMap) {
			if (this.keyMap[action].includes(event.code)) {
				this.keys[action as keyof typeof this.keys] = false;
				event.preventDefault();
			}
		}
	}

	private onPointerEvent(pointerInfo: PointerInfo): void {
		const event = pointerInfo.event as PointerEvent;

		switch (pointerInfo.type) {
			case PointerEventTypes.POINTERDOWN:
				if (event.button === 0) this.mouseState.isRotating = true; // Left-click
				if (event.button === 2) this.mouseState.isPanning = true; // Right-click
				this.mouseState.prevX = event.clientX;
				this.mouseState.prevY = event.clientY;
				break;

			case PointerEventTypes.POINTERUP:
				if (event.button === 0) this.mouseState.isRotating = false;
				if (event.button === 2) this.mouseState.isPanning = false;
				break;

			case PointerEventTypes.POINTERMOVE:
				const dx = event.clientX - this.mouseState.prevX;
				const dy = event.clientY - this.mouseState.prevY;

				if (this.mouseState.isRotating) {
					// Rotate the camera around the target
					this.camera.alpha -= dx * this.rotationSpeed;
					this.camera.beta -= dy * this.rotationSpeed;

					// Clamp the beta angle to prevent flipping
					const epsilon = 0.001;
					this.camera.beta = Math.max(
						epsilon,
						Math.min(Math.PI - epsilon, this.camera.beta)
					);
				}

				if (this.mouseState.isPanning) {
					// Pan the camera target
					const pan = new Vector3(-dx * this.panSpeed, dy * this.panSpeed, 0);
					const up = this.camera.upVector;
					const right = Vector3.Cross(this.camera.getForwardRay().direction, up).normalize();

					// Adjust pan movement relative to camera orientation
					const panMovement = right.scale(pan.x).add(up.scale(pan.y));

					this.camera.target.addInPlace(panMovement);
				}

				// Update previous mouse positions
				this.mouseState.prevX = event.clientX;
				this.mouseState.prevY = event.clientY;
				break;

			case PointerEventTypes.POINTERWHEEL:
				const wheelEvent = event as unknown as WheelEvent;
				const delta = wheelEvent.deltaY;
				const zoomFactor = 0.1;

				// Adjust the radius (distance to target)
				this.camera.radius += delta * zoomFactor;
				this.camera.radius = Math.max(1, this.camera.radius); // Prevent negative or zero radius

				event.preventDefault();
				break;
		}
	}

	private handleWindowBlur(): void {
		// Reset all movement keys to stop movement
		for (const key in this.keys) {
			this.keys[key as keyof typeof this.keys] = false;
		}
	}

	private getRightVector(): Vector3 {
		const right = new Vector3(
			Math.cos(this.camera.rotation.y),
			0,
			-Math.sin(this.camera.rotation.y)
		);
		return right.normalize();
	}
}
