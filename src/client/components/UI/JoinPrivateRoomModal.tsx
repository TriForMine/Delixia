import type React from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, KeyRound, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

interface JoinPrivateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onJoinAttempt: (roomId: string, password?: string) => void
  roomId: string | null
  roomName: string | null
}

const JoinPrivateRoomModal: React.FC<JoinPrivateRoomModalProps> = ({ isOpen, onClose, onJoinAttempt, roomId, roomName }) => {
  const [password, setPassword] = useState('')
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => passwordInputRef.current?.focus(), 100)
      setPassword('')
    }
  }, [isOpen])

  const handleJoinClick = useCallback(() => {
    if (!roomId) return

    if (!password) {
      toast.error('Password cannot be empty.')
      passwordInputRef.current?.focus()
      return
    }

    onJoinAttempt(roomId, password)
  }, [roomId, password, onJoinAttempt])

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleJoinClick()
  }

  if (!roomId || !roomName) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            className="bg-base-100 p-6 md:p-8 rounded-xl shadow-xl w-full max-w-sm border border-primary/20 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 btn btn-ghost btn-sm btn-circle text-base-content/70 hover:bg-error/20 hover:text-error"
              aria-label="Close"
            >
              <X size={20} strokeWidth={3} />
            </button>

            <h3 className="text-3xl font-bold mb-4 text-center bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <KeyRound size={26} /> Enter Password
            </h3>
            <p className="text-center mb-6 text-base-content/80">
              Joining room: <span className="font-semibold">{roomName}</span>
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="joinPassword" className="block text-sm font-medium mb-1 opacity-80">
                  Room Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40">
                    <KeyRound size={16} />
                  </span>
                  <input
                    ref={passwordInputRef}
                    type="password"
                    id="joinPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, 20))}
                    maxLength={20}
                    className="input input-bordered input-primary w-full pl-8"
                    placeholder="Enter room password..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  Cancel
                </button>
                <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-dream flex items-center gap-1.5">
                  <LogIn size={18} /> Join Room
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default JoinPrivateRoomModal
