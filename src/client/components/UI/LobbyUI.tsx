import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Users, Play, LogOut, Copy, Check } from 'lucide-react'
import { useGameColyseusState, useGameColyseusRoom } from '@client/hooks/colyseus'
import type { Player } from '@shared/schemas/Player'

interface LobbyUIProps {
  onLeaveLobby: () => void
  onStartGame: () => void
}

const LobbyUI: React.FC<LobbyUIProps> = ({ onLeaveLobby, onStartGame }) => {
  const hostId = useGameColyseusState((state) => state.hostId)
  const playersMap = useGameColyseusState((state) => state.players)
  const maxClients = useGameColyseusState((state) => state.maxClients)
  const room = useGameColyseusRoom()
  const mySessionId = room?.sessionId
  const roomId = room?.roomId

  const [isCopied, setIsCopied] = useState(false)
  const copyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const playerList: { sessionId: string; player: Player }[] = React.useMemo(() => {
    if (!playersMap) return []
    return Array.from(playersMap.entries()).map(([sessionId, player]) => ({ sessionId, player }))
  }, [playersMap])

  const isHost = mySessionId === hostId

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const copyRoomId = () => {
    if (roomId && !isCopied) {
      navigator.clipboard
        .writeText(roomId)
        .then(() => {
          setIsCopied(true)

          if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current)
          }

          copyTimeoutRef.current = setTimeout(() => {
            setIsCopied(false)
            copyTimeoutRef.current = null
          }, 1500)
        })
        .catch((err) => {
          console.error('Failed to copy Room ID: ', err)
        })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-base-200 bg-opacity-95 flex flex-col items-center justify-center z-10 pointer-events-auto p-6"
    >
      <div className="bg-base-100 p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
          Game Lobby
        </h2>

        {roomId && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-base-content opacity-70">
            <span>Room ID: {roomId}</span>
            <button
              onClick={copyRoomId}
              title="Copy Room ID"
              className="p-1 rounded hover:bg-base-300 transition-colors cursor-pointer relative overflow-hidden h-5 w-5 flex items-center justify-center"
              disabled={isCopied}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                  <motion.div
                    key="copied"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center text-success"
                  >
                    <Check size={16} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    <Copy size={14} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-base-content opacity-90 flex items-center justify-center gap-2">
            <Users size={20} /> Players ({playerList.length} / {maxClients})
          </h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto bg-base-200 p-3 rounded-lg">
            {playerList.length > 0 ? (
              playerList.map(({ sessionId, player }) => (
                <li
                  key={sessionId}
                  className={`text-lg p-2 rounded ${
                    sessionId === mySessionId ? 'bg-primary text-primary-content font-semibold' : 'bg-base-100 text-base-content'
                  }`}
                >
                  {player.name} {sessionId === mySessionId && '(You)'}
                </li>
              ))
            ) : (
              <li className="text-base-content opacity-60 italic">Waiting for players...</li>
            )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onStartGame} className="btn-dream flex-1 flex items-center justify-center gap-2 disabled:opacity-50" disabled={!isHost}>
            <Play size={20} /> Start Game
          </button>
          <button
            onClick={onLeaveLobby}
            className="btn-dream-small bg-error/80 hover:bg-error text-error-content flex items-center justify-center gap-1.5"
          >
            <LogOut size={18} strokeWidth={3} /> Leave
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default LobbyUI
