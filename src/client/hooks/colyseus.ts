import { ConnectionStatus, colyseus } from '@client/hooks/use-colyseus.ts'
import type { GameRoomState } from '@shared/schemas/GameRoomState.ts'

export const {
  connect: gameConnect,
  disconnectFromColyseus: gameDisconnectFromColyseus,
  useColyseusRoom: useGameColyseusRoom,
  useColyseusState: useGameColyseusState,
  useConnectionStatus: useGameConnectionStatus,
  useConnectionError: useGameConnectionError,
} = colyseus<GameRoomState>(import.meta.env.PUBLIC_COLYSEUS_ENDPOINT ?? 'ws://localhost:2567')

export const {
  connect: lobbyConnect,
  disconnectFromColyseus: lobbyDisconnectFromColyseus,
  useLobbyRooms: useLobbyRooms,
  useConnectionStatus: useLobbyConnectionStatus,
  useConnectionError: useLobbyConnectionError,
} = colyseus(import.meta.env.PUBLIC_COLYSEUS_ENDPOINT ?? 'ws://localhost:2567')

export { ConnectionStatus }
