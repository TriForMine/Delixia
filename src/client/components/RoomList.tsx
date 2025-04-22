import type React from 'react'
import { useEffect } from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useLobbyRooms, useGameConnectionStatus, ConnectionStatus } from '@client/hooks/colyseus.ts'
import { useStore } from '@client/store/useStore.ts'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, PlusSquare, Users, Clock, Ghost, Hash, Gamepad2, Play, Search, Lock } from 'lucide-react'
import { formatRelativeTime } from '@client/utils/utils.ts'
import CreateRoomModal from './UI/CreateRoomModal'
import JoinPrivateRoomModal from './UI/JoinPrivateRoomModal'
import toast from 'react-hot-toast'

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
  metadata?: {
    roomName?: string
    isPrivate?: boolean
  }
}

interface RoomCardProps {
  room: RoomAvailable
  onJoin: (roomId: string, isPrivate: boolean, roomName: string | null) => void
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const isFull = room.clients >= room.maxClients
  const relativeTime = formatRelativeTime(room.createdAt)
  const displayName = room.metadata?.roomName || `Room ${room.roomId.substring(0, 4)}`

  const handleJoinClick = () => {
    onJoin(room.roomId, room.metadata?.isPrivate ?? false, displayName)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-base-100 rounded-xl shadow-lg border border-primary/20 overflow-hidden hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-200 ease-out"
    >
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Gamepad2 size={20} strokeWidth={2.5} />
            <span>{displayName}</span>
            {room.metadata?.isPrivate && (
              <span title="Private Room" className="text-secondary tooltip tooltip-right" data-tip="Password Required">
                <Lock size={16} strokeWidth={2.5} />
              </span>
            )}
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

        <div className="flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn-dream-small w-full sm:w-auto ${isFull || room.locked ? 'opacity-50 cursor-not-allowed !bg-gray-400' : ''}`}
            aria-label={`Join room ${room.roomId}`}
            onClick={handleJoinClick}
            disabled={isFull || room.locked}
          >
            Join
          </motion.button>
        </div>
      </div>
    </motion.li>
  )
}

const RoomList = () => {
  const rawRooms: RoomAvailable[] = useLobbyRooms() as RoomAvailable[]
  const setMode = useStore((state) => state.setMode)
  const setRoomToJoin = useStore((state) => state.setRoomToJoin)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null)
  const [targetRoomName, setTargetRoomName] = useState<string | null>(null)

  const connectionStatus = useGameConnectionStatus()

  const filteredRooms = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase()
    return rawRooms.filter((room) => {
      const displayName = (room.metadata?.roomName || `Room ${room.roomId.substring(0, 4)}`).toLowerCase()
      const roomId = room.roomId.toLowerCase()
      const matchesSearch = lowerSearchTerm === '' || displayName.includes(lowerSearchTerm) || roomId.includes(lowerSearchTerm)

      return !room.locked && !room.unlisted && matchesSearch
    })
  }, [rawRooms, searchTerm])

  const handleBackToMenu = useCallback(() => setMode('menu'), [setMode])
  const handleOpenCreateModal = useCallback(() => setIsCreateModalOpen(true), [])
  const handleCloseCreateModal = useCallback(() => setIsCreateModalOpen(false), [])
  const handleClosePasswordModal = useCallback(() => setIsPasswordModalOpen(false), [])

  const handleJoinClick = useCallback(
    (roomId: string, isPrivate: boolean, roomName: string | null) => {
      if (isPrivate) {
        setTargetRoomId(roomId)
        setTargetRoomName(roomName)
        setIsPasswordModalOpen(true)
      } else {
        setRoomToJoin({ roomId: roomId, options: {} })
        setMode('game')
      }
    },
    [setRoomToJoin, setMode],
  )

  const handleJoinPrivateRoomAttempt = useCallback(
    (roomId: string, password?: string) => {
      if (!password) {
        toast.error('Password is required for private rooms.')
        return
      }
      console.log(`Attempting to join private room ${roomId} with password.`)
      setRoomToJoin({ roomId: roomId, options: { password: password } })
      setMode('game')
    },
    [setRoomToJoin, setMode],
  )

  useEffect(() => {
    if (isPasswordModalOpen && connectionStatus !== ConnectionStatus.CONNECTING) {
      if (connectionStatus !== ConnectionStatus.CONNECTED) {
      } else {
        setIsPasswordModalOpen(false)
        setTargetRoomId(null)
        setTargetRoomName(null)
      }
    }

    if (!isPasswordModalOpen && targetRoomId) {
      setTargetRoomId(null)
      setTargetRoomName(null)
    }
  }, [connectionStatus, isPasswordModalOpen, targetRoomId])

  const handleQuickPlay = useCallback(() => {
    const firstAvailablePublic = filteredRooms.find((room) => !room.metadata?.isPrivate && room.clients < room.maxClients)
    if (firstAvailablePublic) {
      console.log(`Quick Play: Joining room ${firstAvailablePublic.roomId}`)
      setRoomToJoin({ roomId: firstAvailablePublic.roomId, options: {} })
      setMode('game')
    } else {
      console.log('Quick Play: No suitable public room found, creating new one...')
      setRoomToJoin({ roomName: 'game', forceCreate: true, options: {} })
      setMode('game')
    }
  }, [filteredRooms, setRoomToJoin, setMode])

  const handleCreateRoom = useCallback(
    (options: Record<string, any>) => {
      setRoomToJoin({ roomName: 'game', forceCreate: true, options: options })
      setMode('game')
      setIsCreateModalOpen(false)
    },
    [setRoomToJoin, setMode],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-start flex-1 bg-base-200 p-4 pt-6 md:pt-10 overflow-y-auto h-full"
    >
      <div className="w-full max-w-4xl mb-6 px-2 sticky top-0 z-10 bg-base-200/80 backdrop-blur-sm py-3 rounded-b-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              className="btn-dream-small flex-grow md:flex-grow-0 flex items-center justify-center gap-1 !py-1.5 !px-3 !text-sm"
              onClick={handleBackToMenu}
            >
              <ArrowLeft size={16} strokeWidth={3} /> Menu
            </button>
            <button
              className="btn-dream-small flex-grow md:flex-grow-0 flex items-center justify-center gap-1 !py-1.5 !px-3 !text-sm"
              onClick={handleQuickPlay}
            >
              <Play size={16} strokeWidth={3} /> Quick Play
            </button>
            <button
              className="btn-dream-small flex-grow md:flex-grow-0 flex items-center justify-center gap-1 !py-1.5 !px-3 !text-sm !bg-accent hover:!bg-accent/90 !text-accent-content"
              onClick={handleOpenCreateModal}
            >
              <PlusSquare size={16} strokeWidth={3} /> Create
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered input-sm w-full pr-8"
            />
            <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl flex-1 overflow-y-auto pb-6 custom-scrollbar">
        {' '}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-4xl font-bold mb-6 text-center bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent drop-shadow-sm"
        >
          Join a Game
        </motion.h1>
        <AnimatePresence>
          {filteredRooms.length > 0 ? (
            <motion.ul className="space-y-4">
              {filteredRooms.map((room) => (
                <RoomCard key={room.roomId} room={room} onJoin={handleJoinClick} />
              ))}
            </motion.ul>
          ) : (
            <motion.div
              key="no-rooms"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.2 }}
              className="text-center mt-10 p-6 bg-base-100 rounded-xl border border-base-300 shadow"
            >
              <Ghost size={48} className="mx-auto mb-4 text-primary opacity-60" />
              {searchTerm ? (
                <>
                  <p className="text-xl font-semibold text-base-content opacity-80">No kitchens match your search!</p>
                  <p className="text-base-content/60 mt-2">Try a different search term or create a new room.</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-semibold text-base-content opacity-80">No public kitchens open right now!</p>
                  <p className="text-base-content/60 mt-2">Try 'Quick Play' or 'Create' one above!</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} onCreate={handleCreateRoom} />

      <JoinPrivateRoomModal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        onJoinAttempt={handleJoinPrivateRoomAttempt}
        roomId={targetRoomId}
        roomName={targetRoomName}
      />
    </motion.div>
  )
}

export default RoomList
