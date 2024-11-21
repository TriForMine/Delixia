import {colyseus} from "use-colyseus";
import {ChatRoomState} from "../../shared/schemas/ChatRoomState.ts";

export const {
	client,
	connectToColyseus,
	disconnectFromColyseus,
	useColyseusRoom,
	useColyseusState,
} = colyseus<ChatRoomState>(
	import.meta.env.VITE_COLYSEUS_ENDPOINT ?? "ws://localhost:2567",
);