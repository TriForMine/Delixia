import {colyseus} from "use-colyseus";
import {ChatRoomState} from "../../shared/schemas/ChatRoomState.ts";

export const {
	client,
	connectToColyseus,
	disconnectFromColyseus,
	useColyseusRoom,
	useColyseusState,
} = colyseus<ChatRoomState>('ws://localhost:2567');