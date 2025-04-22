// src/client/components/UI/CreateRoomModal.tsx (New File)
import type React from 'react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Lock, Users, Hash } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (options: Record<string, any>) => void
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')

  const handleCreateClick = useCallback(() => {
    const trimmedName = roomName.trim().slice(0, 30)

    if (!trimmedName) {
      toast.error('Please enter a room name.')
      return
    }

    if (isPrivate && (!password || password.length < 3)) {
      toast.error('Password must be at least 3 characters for private rooms.')
      return
    }

    const options: Record<string, any> = {
      roomName: trimmedName,
      maxClients: maxPlayers,
    }

    if (isPrivate && password) {
      options.password = password
      options.isPrivate = true
    }

    onCreate(options)
  }, [roomName, maxPlayers, isPrivate, password, onCreate])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value.slice(0, 20))
  }

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
            className="bg-base-100 p-6 rounded-2xl shadow-xl w-full max-w-md border border-primary/30 relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 btn btn-ghost btn-sm btn-circle text-base-content/70 hover:bg-error/20 hover:text-error"
              aria-label="Close"
            >
              <X size={20} strokeWidth={3} />
            </button>

            <h3 className="text-2xl font-bold mb-6 text-center text-primary">Create New Kitchen</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium mb-1 opacity-80">
                  Room Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40">
                    <Hash size={16} />
                  </span>
                  <input
                    type="text"
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    maxLength={30}
                    className="input input-bordered input-primary w-full pl-8"
                    placeholder="My Awesome Kitchen"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1 opacity-80">
                  Max Players ({maxPlayers})
                </label>
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-base-content/50" />
                  <input
                    type="range"
                    id="maxPlayers"
                    min="1"
                    max="4"
                    step="1"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                    className="range range-primary range-sm flex-grow"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3 px-0">
                  <Lock size={18} className={`transition-colors ${isPrivate ? 'text-primary' : 'text-base-content/50'}`} />
                  <span className={`label-text transition-opacity ${isPrivate ? 'opacity-100 font-medium' : 'opacity-70'}`}>
                    Private Room (Password Required)
                  </span>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="toggle toggle-primary ml-auto"
                  />
                </label>
              </div>

              <AnimatePresence>
                {isPrivate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="password" className="block text-sm font-medium mb-1 opacity-80">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={handlePasswordChange}
                      maxLength={20}
                      className="input input-bordered input-secondary w-full"
                      placeholder="Enter password..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleCreateClick} className="btn btn-primary">
                Create Room
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CreateRoomModal
