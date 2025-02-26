import { Schema } from "@colyseus/schema";
import {Client, type Room, RoomAvailable} from "colyseus.js";
import { useSyncExternalStore } from "react";

export function store<T>(value: T) {
	let state = value;
	const subscribers = new Set<(value: T) => void>();
	const get = () => state;
	const set = (value: T) => {
		state = value;
		subscribers.forEach((callback) => callback(value));
	};
	const subscribe = (callback: (value: T | undefined) => void) => {
		subscribers.add(callback);
		return () => subscribers.delete(callback);
	};
	return { get, set, subscribe };
}

export const colyseus = <S = Schema>(
	endpoint: string,
	schema?: new (...args: unknown[]) => S
) => {
	const client = new Client(endpoint);
	const roomStore = store<Room<S> | undefined>(undefined);
	const stateStore = store<S | undefined>(undefined);
	const lobbyRoomsStore = store<RoomAvailable[]>([]);
	let connecting = false;

	const connect = async ({ roomName, roomId, forceCreate = false, isLobby = false, options = {} }: {
		roomName?: string;
		roomId?: string;
		forceCreate?: boolean;
		isLobby?: boolean;
		options?: Record<string, any>;
	}) => {
		if (connecting || roomStore.get()) return;
		connecting = true;
		try {
			let room;
			if (roomName) {
				if (forceCreate) {
					room = await client.create<S>(roomName, options);
				} else {
					room = await client.joinOrCreate<S>(roomName, options);
				}
			} else if (roomId) {
				room = await client.joinById<S>(roomId, options, schema);
			} else {
				throw new Error("Must provide either roomName or roomId");
			}
			roomStore.set(room);

			if (isLobby) {
				room.onMessage("rooms", (rooms: RoomAvailable[]) => {
					lobbyRoomsStore.set(rooms);
				});
				room.onMessage("+", ([roomId, roomInfo]: [string, RoomAvailable]) => {
					const currentRooms = lobbyRoomsStore.get();
					const index = currentRooms.findIndex((r) => r.roomId === roomId);

					console.log("Adding room", roomInfo);

					if (index !== -1) {
						const updatedRooms = [...currentRooms];
						updatedRooms[index] = { ...updatedRooms[index], ...roomInfo };
						lobbyRoomsStore.set(updatedRooms);
					} else {
						lobbyRoomsStore.set([...currentRooms, roomInfo]);
					}
				});
				room.onMessage("-", (roomId: string) => {
					console.log("Removing room", roomId);
					lobbyRoomsStore.set(lobbyRoomsStore.get().filter(r => r.roomId !== roomId));
				});
			} else {
				stateStore.set(room.state);
				const updatedCollectionsMap: { [key in keyof S]?: boolean } = {};

				for (const [key, value] of Object.entries(room.state as Schema)) {
					if (
						typeof value !== "object" ||
						!value.clone ||
						!value.onAdd ||
						!value.onRemove
					) {
						continue;
					}
					updatedCollectionsMap[key as keyof S] = false;
					value.onAdd((item: any) => {
						updatedCollectionsMap[key as keyof S] = true;
						item.onChange(() => {
							updatedCollectionsMap[key as keyof S] = true;
						});
					});
					value.onRemove(() => {
						updatedCollectionsMap[key as keyof S] = true;
					});
				}

				room.onStateChange((state) => {
					if (!state) return;
					const copy = { ...state };
					for (const [key, update] of Object.entries(updatedCollectionsMap)) {
						if (!update) continue;
						updatedCollectionsMap[key as keyof S] = false;
						const value = state[key as keyof S] as unknown;
						if ((value as Schema).clone) {
							// @ts-ignore
							copy[key as keyof S] = (value as Schema).clone();
						}
					}
					stateStore.set(copy);
				});

				console.log(`Successfully connected to Colyseus room ${roomName || roomId} at ${endpoint}`);
			}
		} catch (e) {
			console.error("Failed to connect to Colyseus!", e);
		} finally {
			connecting = false;
		}
	};

	const disconnectFromColyseus = async () => {
		const room = roomStore.get();
		if (!room) return;
		roomStore.set(undefined);
		stateStore.set(undefined);
		lobbyRoomsStore.set([]);
		try {
			await room.leave();
			console.log("Disconnected from Colyseus!");
		} catch {}
	};

	const useColyseusRoom = () => {
		const subscribe = (callback: () => void) => roomStore.subscribe(callback);
		const getSnapshot = () => roomStore.get();
		return useSyncExternalStore(subscribe, getSnapshot);
	};

	function useColyseusState(): S | undefined;
	function useColyseusState<T>(selector: (state: S) => T): T | undefined;
	function useColyseusState<T>(selector?: (state: S) => T) {
		const subscribe = (callback: () => void) => stateStore.subscribe(callback);
		const getSnapshot = () => {
			const state = stateStore.get();
			return state && selector ? selector(state) : state;
		};
		return useSyncExternalStore(subscribe, getSnapshot);
	}

	const useLobbyRooms = () => {
		const subscribe = (callback: () => void) => lobbyRoomsStore.subscribe(callback);
		const getSnapshot = () => lobbyRoomsStore.get();
		return useSyncExternalStore(subscribe, getSnapshot);
	};

	return {
		client,
		connect,
		disconnectFromColyseus,
		useColyseusRoom,
		useColyseusState,
		useLobbyRooms,
	};
};