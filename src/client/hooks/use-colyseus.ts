import type { Schema } from '@colyseus/schema'
import { Client, getStateCallbacks, type Room, type RoomAvailable } from 'colyseus.js'
import { useSyncExternalStore } from 'react'

const RECOVERABLE_ERROR_CODES = [1000, 1001, 1005, 1006]
const MAX_RECONNECT_ATTEMPTS = 5
const INITIAL_RECONNECT_DELAY = 1000

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export function store<T>(value: T) {
  let state = value
  const subscribers = new Set<(value: T) => void>()
  const get = () => state
  const set = (value: T) => {
    state = value
    subscribers.forEach((callback) => callback(value))
  }
  const subscribe = (callback: (value: T | undefined) => void) => {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }
  return { get, set, subscribe }
}

export const colyseus = <S extends Schema>(endpoint: string, schema?: new (...args: unknown[]) => S) => {
  const client = new Client(endpoint)
  const roomStore = store<Room<S> | undefined>(undefined)
  const stateStore = store<S | undefined>(undefined)
  const lobbyRoomsStore = store<RoomAvailable[]>([])
  const connectionStatusStore = store<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
  const connectionErrorStore = store<{ code?: number; message: string | undefined } | null>(null)

  let connecting = false
  let reconnectAttempts = 0
  let reconnectionToken: string | undefined
  let lastConnectionOptions: ConnectionOptions | null = null

  interface ConnectionOptions {
    roomName?: string
    roomId?: string
    forceCreate?: boolean
    isLobby?: boolean
    options?: Record<string, any>
  }

  /** Initialize room handlers and state after connection or reconnection */
  const initializeRoom = (room: Room<S>, isLobby: boolean) => {
    roomStore.set(undefined)
    roomStore.set(room)
    reconnectionToken = room.reconnectionToken
    connectionStatusStore.set(ConnectionStatus.CONNECTED)
    reconnectAttempts = 0

    room.onError((code, message) => {
      console.error(`Room error: ${code} - ${message}`)
      connectionErrorStore.set({ code, message })

      if (RECOVERABLE_ERROR_CODES.includes(code) && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        handleReconnection()
      } else {
        connectionStatusStore.set(ConnectionStatus.ERROR)
      }
    })

    room.onLeave((code) => {
      roomStore.set(undefined)

      if (RECOVERABLE_ERROR_CODES.includes(code) && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        handleReconnection()
      } else {
        stateStore.set(undefined)
        lobbyRoomsStore.set([])
        connectionStatusStore.set(ConnectionStatus.DISCONNECTED)
        reconnectionToken = undefined
        lastConnectionOptions = null
      }
    })

    if (isLobby) {
      room.onMessage('rooms', (rooms: RoomAvailable[]) => {
        lobbyRoomsStore.set(rooms)
      })
      room.onMessage('+', ([roomId, roomInfo]: [string, RoomAvailable]) => {
        const currentRooms = lobbyRoomsStore.get()
        const index = currentRooms.findIndex((r) => r.roomId === roomId)
        if (index !== -1) {
          const updatedRooms = [...currentRooms]
          updatedRooms[index] = { ...updatedRooms[index], ...roomInfo }
          lobbyRoomsStore.set(updatedRooms)
        } else {
          lobbyRoomsStore.set([...currentRooms, roomInfo])
        }
      })
      room.onMessage('-', (roomId: string) => {
        lobbyRoomsStore.set(lobbyRoomsStore.get().filter((r) => r.roomId !== roomId))
      })
    } else {
      stateStore.set(room.state)
      const updatedCollectionsMap: { [key in keyof S]?: boolean } = {}

      room.onStateChange.once((state) => {
        const $ = getStateCallbacks(room)

        for (const key of Object.keys(state as Schema)) {
          // @ts-ignore
          const value = $(state)[key]

          // @ts-ignore
          if (typeof state[key] !== 'object') {
            continue
          }

          updatedCollectionsMap[key as keyof S] = false

          value.onAdd((item: any) => {
            updatedCollectionsMap[key as keyof S] = true
            $(item).onChange(() => {
              updatedCollectionsMap[key as keyof S] = true
            })
          })
          value.onRemove(() => {
            updatedCollectionsMap[key as keyof S] = true
          })
        }

        stateStore.set(state)
      })

      room.onStateChange((state) => {
        if (!state) return

        const copy = { ...state }
        for (const [key, update] of Object.entries(updatedCollectionsMap)) {
          if (!update) continue
          updatedCollectionsMap[key as keyof S] = false
          const value = state[key as keyof S] as unknown
          if ((value as Schema).clone) {
            // @ts-ignore
            copy[key as keyof S] = (value as Schema).clone()
          }
        }

        stateStore.set(copy)
      })
    }
  }

  const connect = async ({ roomName, roomId, forceCreate = false, isLobby = false, options = {} }: ConnectionOptions) => {
    if (connecting || roomStore.get()) return

    const finalOptions = options || {}

    lastConnectionOptions = { roomName, roomId, forceCreate, isLobby, options: finalOptions }
    connectionStatusStore.set(ConnectionStatus.CONNECTING)
    connectionErrorStore.set(null)
    connecting = true

    try {
      let room: Room<S>
      if (roomName) {
        if (forceCreate) {
          room = await client.create<S>(roomName, finalOptions)
        } else {
          room = await client.joinOrCreate<S>(roomName, finalOptions)
        }
      } else if (roomId) {
        room = await client.joinById<S>(roomId, finalOptions, schema)
      } else {
        throw new Error('Must provide either roomName or roomId')
      }

      initializeRoom(room, isLobby)
    } catch (e) {
      console.error('Failed to connect to Colyseus!', e)
      connectionErrorStore.set({
        message: e instanceof Error ? e.message : 'Unknown connection error',
      })
      connectionStatusStore.set(ConnectionStatus.ERROR)
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      }
    } finally {
      connecting = false
    }
  }

  const handleReconnection = async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      connectionStatusStore.set(ConnectionStatus.ERROR)
      return
    }
    reconnectAttempts++
    connectionStatusStore.set(ConnectionStatus.RECONNECTING)

    if (reconnectionToken && process.env.NODE_ENV !== 'development') {
      try {
        const newRoom = await client.reconnect<S>(reconnectionToken)
        initializeRoom(newRoom, lastConnectionOptions?.isLobby || false)
      } catch (_e) {
        const delay = INITIAL_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts)
        setTimeout(handleReconnection, delay)
      }
    } else if (lastConnectionOptions) {
      connecting = false
      connect(lastConnectionOptions)
    } else {
      connectionStatusStore.set(ConnectionStatus.ERROR)
    }
  }

  const disconnectFromColyseus = async () => {
    reconnectAttempts = 0
    lastConnectionOptions = null
    reconnectionToken = undefined

    const room = roomStore.get()
    if (!room) return

    roomStore.set(undefined)
    stateStore.set(undefined)
    lobbyRoomsStore.set([])
    connectionStatusStore.set(ConnectionStatus.DISCONNECTED)

    try {
      await room.leave(true)
    } catch (e) {
      console.error('Error during disconnection:', e)
    }
  }

  const useColyseusRoom = () => {
    const subscribe = (callback: () => void) => roomStore.subscribe(callback)
    const getSnapshot = () => roomStore.get()
    return useSyncExternalStore(subscribe, getSnapshot)
  }

  function useColyseusState(): S | undefined
  function useColyseusState<T>(selector: (state: S) => T): T | undefined
  function useColyseusState<T>(selector?: (state: S) => T) {
    const subscribe = (callback: () => void) => stateStore.subscribe(callback)
    const getSnapshot = () => {
      const state = stateStore.get()
      return state && selector ? selector(state) : state
    }
    return useSyncExternalStore(subscribe, getSnapshot)
  }

  const useLobbyRooms = () => {
    const subscribe = (callback: () => void) => lobbyRoomsStore.subscribe(callback)
    const getSnapshot = () => lobbyRoomsStore.get()
    return useSyncExternalStore(subscribe, getSnapshot)
  }

  const useConnectionStatus = () => {
    const subscribe = (callback: () => void) => connectionStatusStore.subscribe(callback)
    const getSnapshot = () => connectionStatusStore.get()
    return useSyncExternalStore(subscribe, getSnapshot)
  }

  const useConnectionError = () => {
    const subscribe = (callback: () => void) => connectionErrorStore.subscribe(callback)
    const getSnapshot = () => connectionErrorStore.get()
    return useSyncExternalStore(subscribe, getSnapshot)
  }

  return {
    client,
    connect,
    disconnectFromColyseus,
    useColyseusRoom,
    useColyseusState,
    useLobbyRooms,
    useConnectionStatus,
    useConnectionError,
  }
}
