import {Client, Room} from "colyseus";
import {ChatRoomState} from "../../shared/schemas/ChatRoomState.ts";

export class ChatRoom extends Room<ChatRoomState> {
	maxClients = 4;

	onCreate(options: any) {
		console.log("ChatRoom created!", options);

		this.setState(new ChatRoomState());

		this.onMessage("message", (client, message) => {
			console.log("ChatRoom received message from", client.sessionId, ":", message);
			this.broadcast("messages", `(${client.sessionId}) ${message}`);
		});

		this.onMessage("move", (client, data) => {
			console.log("ChatRoom received move from", client.sessionId, ":", data);
			this.state.movePlayer(client.sessionId, data);
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