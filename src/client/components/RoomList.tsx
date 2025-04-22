import type React from 'react'
import { useLobbyRooms } from '@client/hooks/colyseus.ts'
import { useStore } from '@client/store/useStore.ts'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, PlusSquare, Users, Clock, Ghost, Hash, Gamepad2 } from 'lucide-react'
import { formatRelativeTime } from '@client/utils/utils.ts'

export interface RoomAvailable {
  clients: number
  locked: boolean
  private: boolean
  maxClients: number
  unlisted: boolean
  createdAt: string
  name: string
  processId: string
  roomId: string
  metadata?: any
}

interface RoomCardProps {
  room: RoomAvailable
  onJoin: (roomId: string) => void
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const isFull = room.clients >= room.maxClients
  const relativeTime = formatRelativeTime(room.createdAt)

  return (
    <motion.li
      // Card animation remains
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // Card styling remains the same
      className="bg-base-100 rounded-xl shadow-lg border border-primary/20 overflow-hidden hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-200 ease-out"
    >
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Left Side: Room Details */}
        <div className="flex-grow space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Gamepad2 size={20} strokeWidth={2.5} />
            <span>{room.metadata?.roomName || `Game Room`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-base-content/80 font-mono">
            <Hash size={14} strokeWidth={2.5} />
            <span>{room.roomId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center text-xs text-base-content/60 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Created {relativeTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>
                {room.clients} / {room.maxClients} players
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Join Button */}
        <div className="flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn-dream-small w-full sm:w-auto ${isFull ? 'opacity-50 cursor-not-allowed !bg-gray-400' : ''}`}
            aria-label={`Join room ${room.roomId}`}
            onClick={() => onJoin(room.roomId)}
            disabled={isFull}
          >
            Join
          </motion.button>
        </div>
      </div>
    </motion.li>
  )
}

export const RoomList = () => {
  const rooms: RoomAvailable[] = useLobbyRooms() as RoomAvailable[]
  const setMode = useStore((state) => state.setMode)
  const setRoomToJoin = useStore((state) => state.setRoomToJoin)

  const filteredRooms = rooms.filter((room) => {
    return !room.private && !room.locked && room.clients < room.maxClients && !room.unlisted
  })

  const handleJoinRoom = (roomId: string) => {
    setRoomToJoin({ roomId: roomId })
    setMode('game')
  }

  const handleCreateRoom = () => {
    setRoomToJoin({ roomName: 'game', forceCreate: true })
    setMode('game')
  }

  const handleBackToMenu = () => {
    setMode('menu')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      // *** Reverted Background to match main menu/app base ***
      className="flex flex-col items-center justify-start flex-1 bg-base-200 p-4 pt-6 md:pt-10 overflow-y-auto"
    >
      {/* Header Buttons */}
      <div className="w-full max-w-3xl mb-6 flex justify-between items-center px-2">
        <button className="btn-dream-small flex items-center gap-1 !py-1.5 !px-3 !text-base" onClick={handleBackToMenu}>
          <ArrowLeft size={18} strokeWidth={3} /> Menu
        </button>
        <button className="btn-dream-small flex items-center gap-1 !py-1.5 !px-3 !text-base" onClick={handleCreateRoom}>
          <PlusSquare size={18} strokeWidth={3} /> Create
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          // Adjusted title color for better contrast on bg-base-200 if needed
          // Or keep the gradient if it looks okay on base-200
          className="text-4xl font-bold mb-6 text-center bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent drop-shadow-sm"
        >
          Join a Game
        </motion.h1>

        {/* Room List */}
        <AnimatePresence>
          {filteredRooms.length > 0 ? (
            <motion.ul
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.07,
                  },
                },
              }}
            >
              {filteredRooms.map((room) => (
                <RoomCard key={room.roomId} room={room} onJoin={handleJoinRoom} />
              ))}
            </motion.ul>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              // Adjusted "No rooms" card background for better contrast
              className="text-center mt-10 p-6 bg-base-100 rounded-xl border border-base-300 shadow"
            >
              <Ghost size={48} className="mx-auto mb-4 text-primary opacity-60" />
              <p className="text-xl font-semibold text-base-content opacity-80">No kitchens open right now!</p>
              <p className="text-base-content/60 mt-2">Why not start your own? Click 'Create' above!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default RoomList
