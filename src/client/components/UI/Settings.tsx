import type React from 'react'
import { useRef } from 'react'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '@client/store/useStore'
import { ChevronLeft, Save, RotateCcw, Gamepad2, UserCircle, AlertTriangle } from 'lucide-react'
import { defaultKeyBindings, type GameAction, settingsStore } from '@client/utils/settingsStore'
import SharedSettingsPanel from './SharedSettingsPanel'
import toast from 'react-hot-toast'

// Labels for game actions (for display)
const actionLabels: Record<GameAction, string> = {
  forward: 'Move Forward',
  backward: 'Move Backward',
  left: 'Move Left',
  right: 'Move Right',
  jump: 'Jump',
  interact: 'Interact',
  dance: 'Dance',
}

// Keys that cannot be assigned
const forbiddenKeys = [
  'Escape',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'PrintScreen',
  'ScrollLock',
  'Pause',
  'ContextMenu',
  'MetaLeft',
  'MetaRight',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'Enter',
  'NumpadEnter',
  'Tab',
]

interface SettingsProps {
  applySettingsChanges: () => void
}

const Settings: React.FC<SettingsProps> = ({ applySettingsChanges }) => {
  const setMode = useStore((state) => state.setMode)
  const setStoreUsername = useStore((state) => state.setUsername)

  // --- States specific to this full settings screen ---
  const [inputUsername, setInputUsername] = useState(settingsStore.getUsername())
  const [keyBindings, setKeyBindings] = useState(settingsStore.getKeyBindings())
  const [listeningAction, setListeningAction] = useState<GameAction | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const usernameInputRef = useRef<HTMLInputElement>(null)

  // --- Handlers specific to this screen ---
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUsername(e.target.value.slice(0, 16))
  }

  const saveUsername = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      // Accept optional form event
      event?.preventDefault() // Prevent default form submission
      const trimmedUsername = inputUsername.trim()
      if (trimmedUsername && trimmedUsername.length >= 3) {
        setStoreUsername(trimmedUsername) // Use the store action
        toast.success('Nickname saved!')
      } else {
        if (!trimmedUsername) {
          toast.error('Nickname cannot be empty.')
        } else {
          toast.error('Nickname must be at least 3 characters.')
        }
        // Revert input to the stored username on error for better UX
        setInputUsername(settingsStore.getUsername())
        usernameInputRef.current?.focus() // Refocus on error
      }
    },
    [inputUsername, setStoreUsername],
  )

  const handleListen = useCallback((action: GameAction) => {
    setListeningAction(action)
    setErrorMessage(null)
  }, [])

  const resetKeyBindings = useCallback(() => {
    const defaultBindingsCopy = { ...defaultKeyBindings }
    setKeyBindings(defaultBindingsCopy)
    settingsStore.setKeyBindings(defaultBindingsCopy)
    setErrorMessage(null)
    applySettingsChanges()
    toast.success('Keys reset to default.')
  }, [applySettingsChanges])

  const handleResetAll = () => {
    settingsStore.resetAllSettings()
  }

  useEffect(() => {
    if (!listeningAction) return
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const newKeyCode = event.code
      if (forbiddenKeys.includes(newKeyCode)) {
        setErrorMessage(`Reserved key: ${newKeyCode}`)
        setListeningAction(null)
        return
      }
      let conflictAction: GameAction | null = null
      for (const action in keyBindings) {
        if (keyBindings[action as GameAction] === newKeyCode && action !== listeningAction) {
          conflictAction = action as GameAction
          break
        }
      }
      if (conflictAction) {
        setErrorMessage(`Key "${newKeyCode}" already used by "${actionLabels[conflictAction]}"`)
        setListeningAction(null)
        return
      }
      const updatedBindings = { ...keyBindings, [listeningAction]: newKeyCode }
      setKeyBindings(updatedBindings)
      settingsStore.setKeyBindings(updatedBindings)
      setListeningAction(null)
      setErrorMessage(null)
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [listeningAction, keyBindings])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0  backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 pointer-events-auto"
    >
      <motion.div
        initial={{ y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
        className="bg-base-100 p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-3xl text-base-content relative border border-secondary/20"
      >
        <button
          onClick={() => setMode('menu')}
          className="absolute top-3 left-3 btn btn-ghost btn-sm btn-circle z-10 hover:bg-base-content/10"
          aria-label="Back"
        >
          <ChevronLeft className="text-rose-100" size={24} strokeWidth={2.5} />
        </button>
        <h2 className="w-full text-4xl font-extrabold mb-6 text-center bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent flex items-center justify-center gap-3">
          Settings
        </h2>
        <div className="max-h-[60vh] lg:max-h-[65vh] overflow-y-auto pr-3 space-y-6 custom-scrollbar">
          {/* --- Player Profile Section --- */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="p-4 bg-base-200/40 rounded-lg border border-base-300"
          >
            <h3 className="text-lg font-bold mb-4 border-b border-primary/30 pb-1 text-primary flex items-center gap-2">
              <UserCircle size={18} /> Player Profile
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-grow w-full sm:w-auto">
                <label htmlFor="username" className="block text-md font-medium mb-1 opacity-80">
                  In-game Nickname
                </label>
                <form onSubmit={saveUsername} className="flex items-center gap-2">
                  <input
                    ref={usernameInputRef}
                    type="text"
                    id="username"
                    value={inputUsername}
                    onChange={handleUsernameChange}
                    maxLength={16}
                    className="input input-bordered input-primary input-md flex-grow"
                    placeholder="Your name..."
                  />
                  <button type="submit" className="btn btn-primary btn-sm btn-outline btn-square" aria-label="Save">
                    <Save size={16} />
                  </button>
                </form>
                <p className="text-sm text-base-content/60 mt-1">Visible to other players.</p>
              </div>
            </div>
          </motion.section>

          {/* --- Shared Settings Panel --- */}
          <SharedSettingsPanel applySettingsChanges={applySettingsChanges} size="large" />

          {/* --- Keyboard Controls Section (Specific to this screen) --- */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-base-200/40 rounded-lg border border-base-300"
          >
            <h3 className="text-lg font-bold mb-3 border-b border-accent/30 pb-1 text-accent flex items-center gap-2">
              <Gamepad2 size={18} /> Keyboard Controls
            </h3>
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="alert alert-error alert-sm mb-3 text-xs py-1 px-2 overflow-hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
              {Object.entries(actionLabels).map(([action, label]) => (
                <div key={action} className="flex justify-between items-center gap-3 py-1">
                  <span className="text-md font-medium w-28 flex-shrink-0 opacity-90">{label}</span>
                  <kbd className="kbd kbd-lg min-w-[80px] text-center border-secondary/50">{keyBindings[action as GameAction] || 'N/A'}</kbd>
                  <button
                    onClick={() => handleListen(action as GameAction)}
                    className={`btn btn-md w-20 font-semibold ${listeningAction === action ? 'btn-secondary loading' : 'btn-outline btn-secondary'}`} // Added loading state
                    disabled={listeningAction !== null && listeningAction !== action}
                  >
                    {listeningAction === action ? '...' : 'Edit'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={resetKeyBindings} className="btn btn-md btn-outline btn-warning mt-4 flex items-center gap-1">
              <RotateCcw size={14} /> Reset Keys
            </button>
          </motion.section>

          {/* --- Reset All Settings Section --- */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 bg-error/10 rounded-lg border border-error/30"
          >
            <h3 className="text-lg font-bold mb-3 border-b border-error/30 pb-1 text-error flex items-center gap-2">
              <AlertTriangle size={18} /> Danger Zone
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-md text-error/80">Reset all settings to their defaults ?</p>
              <button onClick={() => setShowResetConfirm(true)} className="btn btn-md btn-outline btn-error">
                Reset All
              </button>
            </div>
          </motion.section>
        </div>
      </motion.div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowResetConfirm(false)} // Close on backdrop click
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="bg-base-100 p-6 rounded-lg shadow-xl max-w-sm w-full border border-error"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <h4 className="text-xl font-bold text-error mb-3 flex items-center gap-2">
                <AlertTriangle /> Confirm Reset
              </h4>
              <p className="mb-5 text-base-content/80">Are you sure you want to reset all settings to default? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="btn-dream btn-md">
                  Cancel
                </button>
                <button onClick={handleResetAll} className="btn-md btn-reset">
                  Yes, Reset All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Settings
