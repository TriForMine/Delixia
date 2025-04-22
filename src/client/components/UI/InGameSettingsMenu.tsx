import type React from 'react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@client/store/useStore'
import { settingsStore, type GraphicsQuality } from '@client/utils/settingsStore'
import { X, Volume2, MousePointer2, Monitor } from 'lucide-react'

interface InGameSettingsMenuProps {
  applySettingsChanges: () => void
}

const InGameSettingsMenu: React.FC<InGameSettingsMenuProps> = ({ applySettingsChanges }) => {
  const setInGameSettingsVisible = useStore((state) => state.setInGameSettingsVisible)
  const isVisible = useStore((state) => state.inGameSettingsVisible)

  // --- Local states ---
  const [sensitivityX, setSensitivityX] = useState(settingsStore.getSensitivityX())
  const [sensitivityY, setSensitivityY] = useState(settingsStore.getSensitivityY())
  const [showFps, setShowFps] = useState(settingsStore.getShowFps())
  const [graphicsQuality, setGraphicsQuality] = useState(settingsStore.getGraphicsQuality())
  const [musicVolume, setMusicVolume] = useState(settingsStore.getMusicVolume())
  const [sfxVolume, setSfxVolume] = useState(settingsStore.getSfxVolume())

  // --- Handlers ---
  const handleChangeAndApply = useCallback(
    (setState: React.Dispatch<React.SetStateAction<any>>, setter: (value: any) => void, value: any) => {
      setState(value)
      setter(value)
      applySettingsChanges()
    },
    [applySettingsChanges],
  )
  const handleGraphicsQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    handleChangeAndApply(setGraphicsQuality, settingsStore.setGraphicsQuality, e.target.value as GraphicsQuality)
  const handleSensitivityXChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setSensitivityX, settingsStore.setSensitivityX, parseFloat(e.target.value))
  const handleSensitivityYChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setSensitivityY, settingsStore.setSensitivityY, parseFloat(e.target.value))
  const handleShowFpsToggle = (e: React.ChangeEvent<HTMLInputElement>) => handleChangeAndApply(setShowFps, settingsStore.setShowFps, e.target.checked)
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setMusicVolume, settingsStore.setMusicVolume, parseFloat(e.target.value))
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setSfxVolume, settingsStore.setSfxVolume, parseFloat(e.target.value))

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-x-0 top-[10%] sm:top-[15%] mx-auto w-[90%] max-w-xs z-30 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-base-100/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-primary/30 text-base-content">
            <button
              onClick={() => setInGameSettingsVisible(false)}
              className="absolute top-1.5 right-1.5 btn btn-ghost btn-xs btn-circle text-primary/70 hover:bg-error/20 hover:text-error"
              aria-label="Close"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <h2 className="text-base font-bold mb-3 text-center text-primary">Quick Options ☕</h2>
            <div className="space-y-3">
              {/* Mouse Sensitivity */}
              <div className="p-2 bg-base-200/50 rounded border border-secondary/10">
                <h3 className="text-xs font-semibold mb-1 flex items-center gap-1 text-secondary">
                  <MousePointer2 size={12} /> Sensitivity
                </h3>
                <div className="mb-1">
                  <label className="block text-[10px] opacity-70">Horizontal</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={sensitivityX}
                    onChange={handleSensitivityXChange}
                    className="range range-xs range-primary w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] opacity-70">Vertical</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={sensitivityY}
                    onChange={handleSensitivityYChange}
                    className="range range-xs range-accent w-full"
                  />
                </div>
              </div>

              {/* Display Settings */}
              <div className="p-2 bg-base-200/50 rounded border border-info/10">
                <h3 className="text-xs font-semibold mb-1 flex items-center gap-1 text-info">
                  <Monitor size={12} /> Display
                </h3>
                <div className="mb-1">
                  <label className="block text-[10px] opacity-70">Quality</label>
                  <select
                    className="select select-bordered select-xs w-full select-info"
                    value={graphicsQuality}
                    onChange={handleGraphicsQualityChange}
                  >
                    <option value="low">Low 🐢</option>
                    <option value="medium">Medium 🐇</option>
                    <option value="high">High 🚀</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="cursor-pointer label justify-start gap-2 p-0 mt-1">
                    <input type="checkbox" className="toggle toggle-xs toggle-info" checked={showFps} onChange={handleShowFpsToggle} />
                    <span className="label-text text-[10px]">Show FPS ⏱️</span>
                  </label>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="p-2 bg-base-200/50 rounded border border-warning/10">
                <h3 className="text-xs font-semibold mb-1 flex items-center gap-1 text-warning">
                  <Volume2 size={12} /> Audio 🔊
                </h3>
                <div className="mb-1">
                  <label className="block text-[10px] opacity-70">Music Volume 🎶</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={handleMusicVolumeChange}
                    className="range range-xs range-warning w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] opacity-70">Effects Volume 💥</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={handleSfxVolumeChange}
                    className="range range-xs range-error w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InGameSettingsMenu
