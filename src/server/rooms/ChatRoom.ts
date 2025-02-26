import {Client, logger, Room} from "colyseus";
import {ChatRoomState} from "@shared/schemas/ChatRoomState.ts";
import {ServerMapLoader} from "../utils/ServerMapLoader.ts";
import {mapConfigs} from "@shared/maps/japan.ts";

const serverMapLoader = new ServerMapLoader(mapConfigs);

export class ChatRoom extends Room<ChatRoomState> {
	state = new ChatRoomState();
	maxClients = 4;

	onCreate(_options: any) {
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
			logger.info("Interact from", client.sessionId, "on object", objectId);

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

	async onLeave(client: Client, consented: boolean) {
		this.state.setIsConnected(client.sessionId, false);

		try {
			if (consented) {
				throw new Error("consented leave");
			}

			// allow disconnected client to reconnect into this room until 20 seconds
			await this.allowReconnection(client, 20);

			// client returned! let's re-activate it.
			this.state.setIsConnected(client.sessionId, true);
		} catch (e) {

			// 20 seconds expired. let's remove the client.
			this.state.removePlayer(client.sessionId);
		}
	}

	onDispose() {
		logger.info("Dispose ChatRoom");
	}
}