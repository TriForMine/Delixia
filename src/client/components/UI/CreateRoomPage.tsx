import type React from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Lock, Users, Hash, PlusSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateRoomPageProps {
  onBack: () => void
  onCreate: (options: Record<string, any>) => void
}

const MAX_ROOM_NAME_LENGTH = 30
const MAX_PASSWORD_LENGTH = 20
const MIN_PASSWORD_LENGTH = 3

const CreateRoomPage: React.FC<CreateRoomPageProps> = ({ onBack, onCreate }) => {
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const roomNameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRoomName('')
    setMaxPlayers(4)
    setIsPrivate(false)
    setPassword('')
    setTimeout(() => roomNameInputRef.current?.focus(), 150)
  }, [])

  useEffect(() => {
    if (isPrivate) {
      setTimeout(() => passwordInputRef.current?.focus(), 100)
    }
  }, [isPrivate])

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
      options.password = password.slice(0, MAX_PASSWORD_LENGTH)
      options.isPrivate = true
    }

    onCreate(options)
  }, [roomName, maxPlayers, isPrivate, password, onCreate])

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleCreateClick()
  }

  return (
    <motion.div
      key="create-room-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center justify-center flex-1 bg-base-200 p-4 pt-6 md:pt-10 overflow-y-auto h-full"
    >
      <div className="bg-base-100 p-6 rounded-2xl shadow-xl w-full max-w-md border border-base-content/20 relative">
        <button onClick={onBack} className="absolute top-3 left-3 btn btn-ghost btn-sm btn-circle z-10 hover:bg-base-content/10" aria-label="Back">
          <ArrowLeft className="text-primary" size={24} strokeWidth={2.5} />
        </button>

        <h3 className="text-2xl font-bold mb-6 text-center text-base-content/90 flex items-center justify-center gap-2 pt-2">
          <PlusSquare size={24} /> Create New Kitchen
        </h3>

        <form onSubmit={handleFormSubmit} className="space-y-4">
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
                className="input input-bordered w-full pl-8"
                placeholder="My Awesome Kitchen"
                required
              />
            </div>
          </div>

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
                className="range range-sm flex-grow"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3 px-0">
              <Lock size={18} className={`transition-colors ${isPrivate ? 'text-base-content/80' : 'text-base-content/50'}`} />
              <span className={`label-text transition-opacity ${isPrivate ? 'opacity-100 font-medium' : 'opacity-70'}`}>
                Private Room (Password Required)
              </span>
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="toggle toggle-sm ml-auto" />
            </label>
          </div>

          <AnimatePresence>
            {isPrivate && (
              <motion.div
                key="password-input"
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
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
                  className="input input-bordered w-full"
                  placeholder="Enter password..."
                  required={isPrivate}
                  minLength={isPrivate ? MIN_PASSWORD_LENGTH : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onBack} className="btn btn-ghost">
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-neutral flex items-center gap-1.5"
            >
              <PlusSquare size={18} /> Create Room
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default CreateRoomPage
