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

	movePlayer(id: string, movement: { x: number, y: number }) {
		const player = this.players.get(id);
		if (!player) return;

		if (movement.x) {
			player.x += movement.x * 10;
		}
		if (movement.y) {
			player.y += movement.y * 10
		}

		this.players.set(id, player);
	}
}
