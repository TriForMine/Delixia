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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 bg-base-200 bg-opacity-95 flex flex-col items-center justify-center z-10 pointer-events-auto p-6"
    >
      <div className="bg-base-100 p-8 rounded-xl shadow-2xl w-full max-w-md text-center relative">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 btn btn-ghost btn-xs btn-circle z-10 text-base-content/70 hover:bg-base-content/10"
          aria-label="Back"
        >
          <ArrowLeft className="text-primary" size={20} strokeWidth={3} />
        </button>

        <h3 className="text-4xl font-bold mb-4 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent flex items-center justify-center gap-3">
          Create Kitchen
        </h3>

        <form onSubmit={handleFormSubmit} className="space-y-5 text-left mt-6">
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
                className="range range-sm range-primary flex-grow"
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
                animate={{ height: 'auto', opacity: 1, marginTop: '1.25rem' }}
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button type="submit" className="btn-dream flex-1 flex items-center justify-center gap-2">
              <PlusSquare size={20} strokeWidth={2.5} /> Create Room
            </button>
            <button type="button" onClick={onBack} className="btn-dream flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default CreateRoomPage
