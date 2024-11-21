import {Client, Room} from "colyseus";
import {ChatRoomState} from "../../shared/schemas/ChatRoomState.ts";

export class ChatRoom extends Room<ChatRoomState> {
	maxClients = 4;

	onCreate(options: any) {
		this.setState(new ChatRoomState());

		this.onMessage("message", (client, message) => {
			this.broadcast("messages", `(${client.sessionId}) ${message}`);
		});

		this.onMessage("move", (client, data) => {
			this.state.updatePlayer(client.sessionId, data);
		})
	}

	onJoin(client: Client) {
		this.broadcast("messages", `${client.sessionId} joined.`);
		this.state.createPlayer(client.sessionId);

		client.send("messages", "Welcome to the room: " + client.sessionId);
	}

	onLeave(client: Client) {
		this.broadcast("messages", `${client.sessionId} left.`);
		this.state.removePlayer(client.sessionId);
	}

	onDispose() {
		console.log("Dispose ChatRoom");
	}
}