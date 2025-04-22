import { create } from 'zustand'

type AppMode = 'menu' | 'game' | 'roomList' | 'settings'

interface RoomToJoin {
  roomName?: string // For joining or creating a room by name
  roomId?: string // For joining a specific room by ID
  forceCreate?: boolean // To force creating a new room
}

interface AppState {
  mode: AppMode
  roomToJoin?: RoomToJoin
  inGameSettingsVisible: boolean
  setInGameSettingsVisible: (visible: boolean) => void
  setMode: (mode: AppMode) => void
  setRoomToJoin: (room: RoomToJoin | undefined) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'menu',
  roomToJoin: undefined,
  setMode: (mode) => set({ mode }),
  setRoomToJoin: (room) => set({ roomToJoin: room }),
  inGameSettingsVisible: false,
  setInGameSettingsVisible: (visible) => set({ inGameSettingsVisible: visible }),
}))
