import {Client, Room} from "colyseus";
import {ChatRoomState} from "@shared/schemas/ChatRoomState.ts";
import {ServerMapLoader} from "../utils/ServerMapLoader.ts";
import {mapConfigs} from "@shared/maps/japan.ts";

const serverMapLoader = new ServerMapLoader(mapConfigs);

export class ChatRoom extends Room<ChatRoomState> {
	maxClients = 4;

	onCreate(_options: any) {
		this.setState(new ChatRoomState());

		serverMapLoader.loadInteractables().forEach((interaction) => {
			this.state.createInteractableObject(interaction.id, interaction.interactType);
		})

		this.onMessage("message", (client, message) => {
			this.broadcast("messages", `(${client.sessionId}) ${message}`);
		});

		this.onMessage("move", (client, data) => {
			this.state.updatePlayer(client.sessionId, data);
		})

		this.onMessage("interact", (client, data: { objectId: number }) => {
			const objectId = data.objectId;
			console.log("Interact from", client.sessionId, "on object", objectId);

			const obj = this.state.objects.get(String(objectId));
			if (obj) {
				const newActive = !obj.isActive;
				this.state.updateInteractableObject(objectId, { isActive: newActive });
			}
		});
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