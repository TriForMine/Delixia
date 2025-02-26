import {MapSchema, Schema, type} from "@colyseus/schema";
import {Player} from "./Player.ts";
import { InteractableObjectState } from "./InteractableObjectState.ts";
import {InteractType} from "../types/enums.ts";

export class ChatRoomState extends Schema {
	@type({map: Player})
	players = new MapSchema<Player>();

	@type({ map: InteractableObjectState })
	objects = new MapSchema<InteractableObjectState>();

	@type("string") mySynchronizedProperty: string = "Hello world";

	createPlayer(id: string) {
		const player = new Player();
		player.name = `Player ${id}`;
		this.players.set(id, player);
	}

	setIsConnected(id: string, value: boolean) {
		const player = this.players.get(id);
		if (!player) return;

		player.connected = value;
		this.players.set(id, player);
	}

	removePlayer(id: string) {
		this.players.delete(id);
	}

	updatePlayer(id: string, data: {
		position: { x: number, y: number, z: number },
		rotation: { y: number },
		animationState: string
	}) {
		const player = this.players.get(id);
		if (!player) return

		player.x = data.position.x;
		player.y = data.position.y;
		player.z = data.position.z;

		player.rot = data.rotation.y;

		player.animationState = data.animationState;

		this.players.set(id, player);
	}

	createInteractableObject(
		id: number,
		type: InteractType
	) {
		const obj = new InteractableObjectState();
		obj.id = id;
		obj.type = type;
		obj.isActive = false;
		// use the object's “key” as a string
		this.objects.set(String(id), obj);
	}

	updateInteractableObject(id: number, changes: Partial<InteractableObjectState>) {
		const key = String(id);
		const obj = this.objects.get(key);
		if (!obj) return;

		if (typeof changes.isActive !== "undefined") {
			obj.isActive = changes.isActive;
			obj.activeSince = Date.now();

			setTimeout(() => {
				obj.isActive = false;
			}, 5000);
		}
	}
}
