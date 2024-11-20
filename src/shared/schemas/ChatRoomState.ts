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
		quaternion: { x: number, y: number, z: number, w: number },
	}) {
		const player = this.players.get(id);
		if (!player) return

		player.position.x = data.position.x;
		player.position.y = data.position.y;
		player.position.z = data.position.z;

		player.rotation.x = data.quaternion.x;
		player.rotation.y = data.quaternion.y;
		player.rotation.z = data.quaternion.z;
		player.rotation.w = data.quaternion.w;

		this.players.set(id, player);
	}
}
