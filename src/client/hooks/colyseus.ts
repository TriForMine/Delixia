import {ChatRoomState} from "@shared/schemas/ChatRoomState.ts";
import {colyseus} from "@client/hooks/use-colyseus.ts";

export const {
	connect: gameConnect,
	disconnectFromColyseus: gameDisconnectFromColyseus,
	useColyseusRoom: useGameColyseusRoom,
	useColyseusState: useGameColyseusState
} = colyseus<ChatRoomState>(
	import.meta.env.VITE_COLYSEUS_ENDPOINT ?? "ws://localhost:2567",
);

export const {
	connect: lobbyConnect,
	disconnectFromColyseus: lobbyDisconnectFromColyseus,
	useLobbyRooms: useLobbyRooms
} = colyseus(
	import.meta.env.VITE_COLYSEUS_ENDPOINT ?? "ws://localhost:2567",
);