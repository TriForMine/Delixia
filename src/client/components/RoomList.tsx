import { useLobbyRooms } from '@client/hooks/colyseus.ts'
import { useStore } from '@client/store/useStore.ts'

export interface RoomAvailable<Metadata = any> {
  name: string
  roomId: string
  clients: number
  maxClients: number
  metadata?: Metadata
}

export const RoomList = () => {
  const rooms = useLobbyRooms()
  const setMode = useStore((state) => state.setMode)
  const setRoomToJoin = useStore((state) => state.setRoomToJoin)

  const filteredRooms = rooms.filter((room: any) => {
    return !room.private && !room.locked && room.clients < room.maxClients
  })

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-base-200 bg-opacity-90 p-4">
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <button
          className="btn-dream-small"
          onClick={() => {
            setMode('menu')
          }}
        >
          Back to menu
        </button>
        <button
          className="btn-dream-small"
          onClick={() => {
            setRoomToJoin({ roomName: 'game', forceCreate: true })
            setMode('game')
          }}
        >
          Create Room
        </button>
      </div>
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
          Available Rooms
        </h1>
        {filteredRooms.length > 0 ? (
          <ul className="space-y-2">
            {filteredRooms.map((room) => (
              <li key={room.roomId} className="flex justify-between items-center p-4 bg-base-100 rounded-lg shadow">
                <span className="text-lg">
                  {room.name} {room.roomId}
                </span>
                <span className="text-sm text-gray-500">
                  {room.clients} / {room.maxClients}
                </span>
                <button
                  className="btn-dream-small"
                  aria-label={`Join room ${room.name}`}
                  onClick={() => {
                    setRoomToJoin({ roomId: room.roomId })
                    setMode('game')
                  }}
                  disabled={room.clients >= room.maxClients}
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No rooms available. Create a new room to start.</p>
        )}
      </div>
    </div>
  )
}
