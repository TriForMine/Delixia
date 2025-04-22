import type React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '@client/store/useStore'

import { ChevronLeft, Save, RotateCcw, Gamepad2, Image as ImageIcon, Volume2, UserCircle, MousePointer2 } from 'lucide-react'
import { defaultKeyBindings, type GameAction, type GraphicsQuality, settingsStore } from '@client/utils/settingsStore'

// Labels for game actions (for display)
const actionLabels: Record<GameAction, string> = {
  forward: 'Move Forward ',
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

// Props expected by the component
interface SettingsProps {
  applySettingsChanges: () => void // Function to notify GameEngine to apply changes live
}

const Settings: React.FC<SettingsProps> = ({ applySettingsChanges }) => {
  const setMode = useStore((state) => state.setMode)

  // --- Local states for each setting ---
  // Initialized with saved or default values
  const [pseudo, setPseudo] = useState(settingsStore.getPseudo())
  const [sensitivityX, setSensitivityX] = useState(settingsStore.getSensitivityX())
  const [sensitivityY, setSensitivityY] = useState(settingsStore.getSensitivityY())
  const [wheelPrecision, setWheelPrecision] = useState(settingsStore.getWheelPrecision())
  const [graphicsQuality, setGraphicsQuality] = useState(settingsStore.getGraphicsQuality())
  const [showFps, setShowFps] = useState(settingsStore.getShowFps())
  const [musicEnabled, setMusicEnabled] = useState(settingsStore.getMusicEnabled())
  const [musicVolume, setMusicVolume] = useState(settingsStore.getMusicVolume())
  const [sfxVolume, setSfxVolume] = useState(settingsStore.getSfxVolume())
  const [keyBindings, setKeyBindings] = useState(settingsStore.getKeyBindings())
  const [listeningAction, setListeningAction] = useState<GameAction | null>(null) // For remapping
  const [errorMessage, setErrorMessage] = useState<string | null>(null) // For key errors

  // --- Handlers for changes ---

  // Nickname
  const handlePseudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPseudo(e.target.value.slice(0, 16)) // Limit to 16 characters
  }
  const savePseudo = useCallback(() => {
    const trimmedPseudo = pseudo.trim()
    if (trimmedPseudo) {
      settingsStore.setPseudo(trimmedPseudo)
      alert('Nickname saved!')
    } else {
      alert('Nickname cannot be empty.')
      setPseudo(settingsStore.getPseudo()) // Reset to the old one if empty
    }
  }, [pseudo])

  // Generic function for sliders and selects that apply directly
  const handleChangeAndApply = useCallback(
    <T,>(stateSetter: React.Dispatch<React.SetStateAction<T>>, storeSetter: (value: T) => void, value: T) => {
      stateSetter(value)
      storeSetter(value)
      applySettingsChanges() // Notify GameEngine
    },
    [applySettingsChanges],
  )

  // Graphics
  const handleGraphicsQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChangeAndApply(setGraphicsQuality, settingsStore.setGraphicsQuality, e.target.value as GraphicsQuality)
  }
  const handleShowFpsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeAndApply(setShowFps, settingsStore.setShowFps, e.target.checked)
  }

  // Sensitivity
  const handleSensitivityXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeAndApply(setSensitivityX, settingsStore.setSensitivityX, parseFloat(e.target.value))
  }
  const handleSensitivityYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeAndApply(setSensitivityY, settingsStore.setSensitivityY, parseFloat(e.target.value))
  }
  const handleWheelPrecisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeAndApply(setWheelPrecision, settingsStore.setWheelPrecision, parseFloat(e.target.value))
  }

  // Audio
  const handleMusicToggleInternal = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChangeAndApply(setMusicEnabled, settingsStore.setMusicEnabled, e.target.checked)
    },
    [handleChangeAndApply], // Use the generic handler
  )
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeAndApply(setMusicVolume, settingsStore.setMusicVolume, parseFloat(e.target.value))
  }
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChangeAndApply(setSfxVolume, settingsStore.setSfxVolume, parseFloat(e.target.value))
  }

  // Key Remapping
  const handleListen = useCallback((action: GameAction) => {
    setListeningAction(action)
    setErrorMessage(null)
  }, [])

  const resetKeyBindings = useCallback(() => {
    const defaultBindingsCopy = { ...defaultKeyBindings }
    setKeyBindings(defaultBindingsCopy)
    settingsStore.setKeyBindings(defaultBindingsCopy)
    setErrorMessage(null)
    applySettingsChanges() // Reload in the controller if necessary
    alert('Keys reset to default.')
  }, [applySettingsChanges])

  // UseEffect for key listening
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
        setErrorMessage(`Key already used by "${actionLabels[conflictAction]}"`)
        setListeningAction(null)
        return
      }
      const updatedBindings = { ...keyBindings, [listeningAction]: newKeyCode }
      setKeyBindings(updatedBindings)
      settingsStore.setKeyBindings(updatedBindings)
      setListeningAction(null)
      setErrorMessage(null)
      // No need for applySettingsChanges here, LocalController reads the new config as needed
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [listeningAction, keyBindings]) // Keep keyBindings dependency

  return (
    // --- Main Container & Background ---
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-pink-900/70 to-yellow-900/70 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 pointer-events-auto"
    >
      {/* --- Central Panel --- */}
      <motion.div
        initial={{ y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
        className="bg-base-100 p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-3xl text-base-content relative border border-secondary/20" // Subtle pink theme border
      >
        {/* Back Button (Improved Style) */}
        <button
          onClick={() => setMode('menu')}
          className="absolute top-3 left-3 btn btn-ghost btn-sm btn-circle z-10 hover:bg-base-content/10"
          aria-label="Back"
        >
          <ChevronLeft className="text-primary" size={24} strokeWidth={2.5} />
        </button>
        {/* Main Title - Added w-full for robust centering */}
        <h2 className="w-full text-4xl font-extrabold mb-6 text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center justify-center gap-3">
          Settings
        </h2>
        {/* --- Scrollable Area for Options --- */}
        <div className="max-h-[60vh] lg:max-h-[65vh] overflow-y-auto pr-3 space-y-6 custom-scrollbar">
          {/* Added scrollbar class */}
          {/* --- Player Profile Section --- */}
          <section className="p-4 bg-base-200/40 rounded-lg border border-base-300">
            <h3 className="text-lg font-bold mb-4 border-b border-primary/30 pb-1 text-primary flex items-center gap-2">
              <UserCircle size={18} /> Player Profile
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="avatar placeholder flex-shrink-0">
                <div className="bg-gradient-to-br from-primary to-secondary text-neutral-content rounded-full w-16 h-16 ring-2 ring-primary ring-offset-base-100 ring-offset-2 shadow-md flex items-center justify-center text-3xl font-semibold">
                  {(pseudo || '?').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-grow w-full sm:w-auto">
                <label htmlFor="pseudo" className="block text-sm font-medium mb-1 opacity-80">
                  In-game Nickname
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="pseudo"
                    value={pseudo}
                    onChange={handlePseudoChange}
                    maxLength={16}
                    className="input input-bordered input-primary input-sm flex-grow"
                    placeholder="Your name..."
                  />
                  <button onClick={savePseudo} className="btn btn-primary btn-sm btn-outline btn-square" aria-label="Save">
                    {' '}
                    <Save size={16} />{' '}
                  </button>
                </div>
                <p className="text-xs text-base-content/60 mt-1">Visible to other players.</p>
              </div>
            </div>
          </section>
          <section className="p-4 bg-base-200/40 rounded-lg border border-base-300">
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
                  <span className="text-sm font-medium w-28 flex-shrink-0 opacity-90">{label}</span> {/* Increased width for longer labels */}
                  <kbd className="kbd kbd-sm min-w-[80px] text-center border-secondary/50">{keyBindings[action as GameAction] || 'N/A'}</kbd>
                  <button
                    onClick={() => handleListen(action as GameAction)}
                    className={`btn btn-xs w-20 font-semibold ${listeningAction === action ? 'btn-secondary' : 'btn-outline btn-secondary'}`}
                    disabled={listeningAction !== null && listeningAction !== action}
                  >
                    {listeningAction === action ? '...' : 'Edit'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={resetKeyBindings} className="btn btn-sm btn-outline btn-warning mt-4 flex items-center gap-1">
              {' '}
              <RotateCcw size={14} /> Reset{' '}
            </button>
          </section>
          <section className="p-4 bg-base-200/40 rounded-lg border border-base-300">
            <h3 className="text-lg font-bold mb-3 border-b border-secondary/30 pb-1 text-secondary flex items-center gap-2">
              <MousePointer2 size={18} /> Mouse Controls
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="sensX" className="block text-sm font-medium mb-1 opacity-80">
                  Horizontal Sensitivity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="sensX"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={sensitivityX}
                    onChange={handleSensitivityXChange}
                    className="range range-xs range-primary flex-grow"
                  />
                  <span className="text-sm font-mono w-10 text-right opacity-70">{sensitivityX.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <label htmlFor="sensY" className="block text-sm font-medium mb-1 opacity-80">
                  Vertical Sensitivity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="sensY"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={sensitivityY}
                    onChange={handleSensitivityYChange}
                    className="range range-xs range-accent flex-grow"
                  />
                  <span className="text-sm font-mono w-10 text-right opacity-70">{sensitivityY.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <label htmlFor="wheelPrec" className="block text-sm font-medium mb-1 opacity-80">
                  Zoom Precision (Wheel)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="wheelPrec"
                    min="1"
                    max="100"
                    step="1"
                    value={wheelPrecision}
                    onChange={handleWheelPrecisionChange}
                    className="range range-xs range-secondary flex-grow"
                  />
                  <span className="text-sm font-mono w-10 text-right opacity-70">{wheelPrecision}</span>
                </div>
              </div>
            </div>
          </section>
          <section className="p-4 bg-base-200/40 rounded-lg border border-base-300">
            <h3 className="text-lg font-bold mb-3 border-b border-info/30 pb-1 text-info flex items-center gap-2">
              <ImageIcon size={18} /> Graphics
            </h3>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label htmlFor="graphicsQuality" className="block text-sm font-medium mb-1 opacity-80">
                  Overall Quality
                </label>
                <select
                  id="graphicsQuality"
                  className="select select-bordered select-info select-sm w-full"
                  value={graphicsQuality}
                  onChange={handleGraphicsQualityChange}
                >
                  <option value="low">Low (Performance ++)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Quality ++)</option>
                </select>
              </div>
              <div className="form-control w-auto mb-1">
                {' '}
                <label className="cursor-pointer label py-0">
                  <span className="label-text text-sm mr-2 opacity-80">Show FPS</span>
                  <input type="checkbox" className="toggle toggle-sm toggle-info" checked={showFps} onChange={handleShowFpsToggle} />
                </label>
              </div>
            </div>
          </section>
          <section className="p-4 bg-base-200/40 rounded-lg border border-base-300">
            <h3 className="text-lg font-bold mb-3 border-b border-warning/30 pb-1 text-warning flex items-center gap-2">
              <Volume2 size={18} /> Audio
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="form-control w-auto">
                <label className="cursor-pointer label">
                  <span className="label-text text-sm mr-2 opacity-80">Music</span>
                  <input type="checkbox" className="toggle toggle-sm toggle-warning" checked={musicEnabled} onChange={handleMusicToggleInternal} />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label htmlFor="musicVol" className="block text-sm font-medium mb-1 opacity-80">
                    Music Volume
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      id="musicVol"
                      min="0"
                      max="1"
                      step="0.05"
                      value={musicVolume}
                      onChange={handleMusicVolumeChange}
                      className="range range-xs range-warning flex-grow"
                    />
                    <span className="text-sm font-mono w-10 text-right opacity-70">{Math.round(musicVolume * 100)}%</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="sfxVol" className="block text-sm font-medium mb-1 opacity-80">
                    Effects Volume
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      id="sfxVol"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sfxVolume}
                      onChange={handleSfxVolumeChange}
                      className="range range-xs range-error flex-grow"
                    />
                    <span className="text-sm font-mono w-10 text-right opacity-70">{Math.round(sfxVolume * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>{' '}
      </motion.div>
    </motion.div>
  )
}

export default Settings
