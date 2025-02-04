import {Axis, FlyCamera, Nullable, Observer, PointerEventTypes, PointerInfo, Scene, Vector3,} from "@babylonjs/core";

export class CustomFlyCameraInput {
	private camera: FlyCamera;
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
		rightClick: false,
		middleClick: false,
		prevX: 0,
		prevY: 0,
	};

	private sprintMultiplier = 2;
	private movementSpeed = 0.2;
	private rotationSpeed = 0.002;
	private panSpeed = 0.02;

	private pointerObserver: Nullable<Observer<PointerInfo>> = null;

	// Event handlers for window blur and focus
	private onWindowBlur = this.handleWindowBlur.bind(this);

	constructor(camera: FlyCamera, scene: Scene) {
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

		// Remove window blur listeners
		window.removeEventListener("blur-sm", this.onWindowBlur);
	}

	public update(): void {
		let movement = Vector3.Zero();

		if (this.keys.forward) movement.addInPlace(this.getForwardVector());
		if (this.keys.backward)
			movement.addInPlace(this.getForwardVector().scale(-1));
		if (this.keys.left)
			movement.addInPlace(this.getRightVector().scale(-1));
		if (this.keys.right) movement.addInPlace(this.getRightVector());
		if (this.keys.up) movement.addInPlace(Axis.Y);
		if (this.keys.down) movement.addInPlace(Axis.Y.scale(-1));

		if (this.keys.sprint) movement = movement.scale(this.sprintMultiplier);

		movement = movement.normalize().scale(this.movementSpeed);
		this.camera.position.addInPlace(movement);
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
				if (event.button === 2) this.mouseState.rightClick = true; // Right-click
				if (event.button === 1) this.mouseState.middleClick = true; // Middle-click
				this.mouseState.prevX = event.clientX;
				this.mouseState.prevY = event.clientY;
				break;

			case PointerEventTypes.POINTERUP:
				if (event.button === 2) this.mouseState.rightClick = false;
				if (event.button === 1) this.mouseState.middleClick = false;
				break;

			case PointerEventTypes.POINTERMOVE:
				const dx = event.clientX - this.mouseState.prevX;
				const dy = event.clientY - this.mouseState.prevY;

				if (this.mouseState.rightClick) {
					this.camera.rotation.y += dx * this.rotationSpeed;
					this.camera.rotation.x += dy * this.rotationSpeed;

					// Clamp vertical rotation
					this.camera.rotation.x = Math.max(
						-Math.PI / 2,
						Math.min(Math.PI / 2, this.camera.rotation.x)
					);
				}

				if (this.mouseState.middleClick) {
					// Calculate panning movement based on mouse movement
					const panX = dx * this.panSpeed;
					const panY = dy * this.panSpeed;

					// Get the camera's right and up vectors
					const right = this.getRightVector().normalize();
					const up = this.getUpVector().normalize();

					// Calculate movement vector based on mouse movement
					const movement = right.scale(-panX).add(up.scale(panY));

					// Update camera position
					this.camera.position.addInPlace(movement);
				}

				// Update previous mouse positions
				this.mouseState.prevX = event.clientX;
				this.mouseState.prevY = event.clientY;
				break;

			case PointerEventTypes.POINTERWHEEL:
				const wheelEvent = event as unknown as WheelEvent;
				const zoomSpeed = 0.1;
				const zoomDirection = wheelEvent.deltaY < 0 ? 1 : -1;
				this.camera.position.addInPlace(
					this.getForwardVector().scale(zoomSpeed * zoomDirection)
				);
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

	private getForwardVector(): Vector3 {
		const forward = new Vector3(
			Math.sin(this.camera.rotation.y),
			0,
			Math.cos(this.camera.rotation.y)
		);
		return forward.normalize();
	}

	private getRightVector(): Vector3 {
		const right = new Vector3(
			Math.cos(this.camera.rotation.y),
			0,
			-Math.sin(this.camera.rotation.y)
		);
		return right.normalize();
	}

	private getUpVector(): Vector3 {
		return Axis.Y;
	}
}
