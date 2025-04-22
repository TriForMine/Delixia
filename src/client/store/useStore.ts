import { settingsStore } from '@client/utils/settingsStore'
import { create } from 'zustand'

type AppMode = 'menu' | 'game' | 'roomList' | 'settings' | 'createRoom' | 'tutorial'

interface RoomToJoin {
  roomName?: string // For joining or creating a room by name
  roomId?: string // For joining a specific room by ID
  forceCreate?: boolean // To force creating a new room
  options?: Record<string, any>
}

interface AppState {
  mode: AppMode
  roomToJoin?: RoomToJoin
  inGameSettingsVisible: boolean
  setInGameSettingsVisible: (visible: boolean) => void
  setMode: (mode: AppMode) => void
  setRoomToJoin: (room: RoomToJoin | undefined) => void
  username: string
  setUsername: (newUsername: string) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'menu',
  roomToJoin: undefined,
  setMode: (mode) => set({ mode }),
  setRoomToJoin: (room) => set({ roomToJoin: room }),
  inGameSettingsVisible: false,
  setInGameSettingsVisible: (visible) => set({ inGameSettingsVisible: visible }),
  username: settingsStore.getUsername(),
  setUsername: (newUsername) => {
    const trimmedUsername = newUsername.trim().slice(0, 16)
    if (trimmedUsername) {
      settingsStore.setUsername(trimmedUsername)
      set({ username: trimmedUsername })
    } else {
      console.warn('Attempted to set an empty username.')
      set({ username: settingsStore.getUsername() })
    }
  },
}))
