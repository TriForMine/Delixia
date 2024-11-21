import {MapSchema, Schema, type} from "@colyseus/schema";
import {Player} from "./Player.ts";

export class ChatRoomState extends Schema {
	@type({map: Player})
	players = new MapSchema<Player>();

	@type("string") mySynchronizedProperty: string = "Hello world";

	createPlayer(id: string) {
		const player = new Player();
		player.name = `Player ${id}`;
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
}
