import { ConnectionStatus, colyseus } from '@client/hooks/use-colyseus.ts'
import type { ChatRoomState } from '@shared/schemas/ChatRoomState.ts'

export const {
  connect: gameConnect,
  disconnectFromColyseus: gameDisconnectFromColyseus,
  useColyseusRoom: useGameColyseusRoom,
  useColyseusState: useGameColyseusState,
  useConnectionStatus: useGameConnectionStatus,
  useConnectionError: useGameConnectionError,
} = colyseus<ChatRoomState>(import.meta.env.VITE_COLYSEUS_ENDPOINT ?? 'ws://localhost:2567')

export const {
  connect: lobbyConnect,
  disconnectFromColyseus: lobbyDisconnectFromColyseus,
  useLobbyRooms: useLobbyRooms,
  useConnectionStatus: useLobbyConnectionStatus,
  useConnectionError: useLobbyConnectionError,
} = colyseus(import.meta.env.VITE_COLYSEUS_ENDPOINT ?? 'ws://localhost:2567')

export { ConnectionStatus }
