// src/client/components/UI/CreateRoomModal.tsx (New File)
import type React from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Lock, Users, Hash, PlusSquare } from 'lucide-react' // Added PlusSquare for Create button
import toast from 'react-hot-toast'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (options: Record<string, any>) => void
}

const MAX_ROOM_NAME_LENGTH = 30
const MAX_PASSWORD_LENGTH = 20
const MIN_PASSWORD_LENGTH = 3

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const roomNameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRoomName('')
      setMaxPlayers(4)
      setIsPrivate(false)
      setPassword('')
      // Focus the room name input when opened
      setTimeout(() => roomNameInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Focus password input when it appears
  useEffect(() => {
    if (isPrivate && isOpen) {
      setTimeout(() => passwordInputRef.current?.focus(), 100)
    }
  }, [isPrivate, isOpen])

  const handleCreateClick = useCallback(() => {
    const trimmedName = roomName.trim().slice(0, MAX_ROOM_NAME_LENGTH)

    if (!trimmedName) {
      toast.error('Please enter a room name.')
      roomNameInputRef.current?.focus()
      return
    }

    if (isPrivate && (!password || password.length < MIN_PASSWORD_LENGTH)) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters for private rooms.`)
      passwordInputRef.current?.focus()
      return
    }

    const options: Record<string, any> = {
      roomName: trimmedName,
      maxClients: maxPlayers,
    }

    if (isPrivate && password) {
      options.password = password.slice(0, MAX_PASSWORD_LENGTH) // Ensure password length constraint
      options.isPrivate = true
    }

    onCreate(options)
    // onClose(); // Keep modal open on error, close only on success via `onCreate` potentially leading to mode change
  }, [roomName, maxPlayers, isPrivate, password, onCreate])

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleCreateClick()
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
                onClick={onClose} // Close when clicking backdrop
            >
              <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: -20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                  className="bg-base-100 p-6 rounded-2xl shadow-xl w-full max-w-md border border-primary/30 relative"
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
              >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 btn btn-ghost btn-sm btn-circle text-base-content/70 hover:bg-error/20 hover:text-error"
                    aria-label="Close"
                >
                  <X size={20} strokeWidth={3} />
                </button>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-6 text-center text-primary flex items-center justify-center gap-2">
                  <PlusSquare size={24} /> Create New Kitchen
                </h3>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Room Name Input */}
                  <div>
                    <label htmlFor="roomName" className="block text-sm font-medium mb-1 opacity-80">
                      Room Name
                    </label>
                    <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40">
                    <Hash size={16} />
                  </span>
                      <input
                          ref={roomNameInputRef}
                          type="text"
                          id="roomName"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          maxLength={MAX_ROOM_NAME_LENGTH}
                          className="input input-bordered input-primary w-full pl-8"
                          placeholder="My Awesome Kitchen"
                          required // Basic HTML5 validation
                      />
                    </div>
                  </div>

                  {/* Max Players Slider */}
                  <div>
                    <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1 opacity-80">
                      Max Players ({maxPlayers})
                    </label>
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-base-content/50 flex-shrink-0" />
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

                  {/* Private Toggle */}
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

                  {/* Password Input (Conditional) */}
                  <AnimatePresence>
                    {isPrivate && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="overflow-hidden" // Needed for smooth height animation
                        >
                          <label htmlFor="password" className="block text-sm font-medium mb-1 opacity-80">
                            Password (min {MIN_PASSWORD_LENGTH} chars)
                          </label>
                          <input
                              ref={passwordInputRef}
                              type="password"
                              id="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              maxLength={MAX_PASSWORD_LENGTH}
                              className="input input-bordered input-secondary w-full"
                              placeholder="Enter password..."
                              required={isPrivate} // HTML5 validation if private
                              minLength={isPrivate ? MIN_PASSWORD_LENGTH : undefined} // HTML5 validation
                          />
                        </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="btn btn-ghost">
                      Cancel
                    </button>
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary flex items-center gap-1.5"
                    >
                      <PlusSquare size={18} /> Create Room
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  )
}

export default CreateRoomModal