import type React from 'react'
import { useState, useCallback } from 'react'
import { settingsStore, type GraphicsQuality } from '@client/utils/settingsStore'
import { Volume2, MousePointer2, Monitor } from 'lucide-react'
import { motion } from 'motion/react'

interface SharedSettingsPanelProps {
  applySettingsChanges: () => void
  size?: 'small' | 'large' // To adjust styles for different contexts
}

const SharedSettingsPanel: React.FC<SharedSettingsPanelProps> = ({ applySettingsChanges, size = 'large' }) => {
  // --- Common Local States ---
  const [sensitivityX, setSensitivityX] = useState(settingsStore.getSensitivityX())
  const [sensitivityY, setSensitivityY] = useState(settingsStore.getSensitivityY())
  const [wheelPrecision, setWheelPrecision] = useState(settingsStore.getWheelPrecision())
  const [invertY, setInvertY] = useState(settingsStore.getInvertY())
  const [fov, setFov] = useState(settingsStore.getFov())
  const [showFps, setShowFps] = useState(settingsStore.getShowFps())
  const [graphicsQuality, setGraphicsQuality] = useState(settingsStore.getGraphicsQuality())
  const [masterVolume, setMasterVolume] = useState(settingsStore.getMasterVolume())
  const [musicEnabled, setMusicEnabled] = useState(settingsStore.getMusicEnabled())
  const [musicVolume, setMusicVolume] = useState(settingsStore.getMusicVolume())
  const [sfxVolume, setSfxVolume] = useState(settingsStore.getSfxVolume())

  // --- Common Handlers ---
  const handleChangeAndApply = useCallback(
    <T,>(stateSetter: React.Dispatch<React.SetStateAction<T>>, storeSetter: (value: T) => void, value: T) => {
      stateSetter(value)
      storeSetter(value)
      applySettingsChanges()
    },
    [applySettingsChanges],
  )

  // Specific handlers using the generic one
  const handleGraphicsQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    handleChangeAndApply(setGraphicsQuality, settingsStore.setGraphicsQuality, e.target.value as GraphicsQuality)
  const handleSensitivityXChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setSensitivityX, settingsStore.setSensitivityX, parseFloat(e.target.value))
  const handleSensitivityYChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setSensitivityY, settingsStore.setSensitivityY, parseFloat(e.target.value))
  const handleWheelPrecisionChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setWheelPrecision, settingsStore.setWheelPrecision, parseFloat(e.target.value))
  const handleInvertYToggle = (e: React.ChangeEvent<HTMLInputElement>) => handleChangeAndApply(setInvertY, settingsStore.setInvertY, e.target.checked)
  const handleFovChange = (e: React.ChangeEvent<HTMLInputElement>) => handleChangeAndApply(setFov, settingsStore.setFov, parseFloat(e.target.value))
  const handleShowFpsToggle = (e: React.ChangeEvent<HTMLInputElement>) => handleChangeAndApply(setShowFps, settingsStore.setShowFps, e.target.checked)
  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setMasterVolume, settingsStore.setMasterVolume, parseFloat(e.target.value))
  const handleMusicToggleInternal = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setMusicEnabled, settingsStore.setMusicEnabled, e.target.checked)
  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setMusicVolume, settingsStore.setMusicVolume, parseFloat(e.target.value))
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleChangeAndApply(setSfxVolume, settingsStore.setSfxVolume, parseFloat(e.target.value))

  // Conditional styles based on size prop
  const isSmall = size === 'small'
  const sectionPadding = isSmall ? 'p-2' : 'p-4'
  const sectionBorder = isSmall ? 'border border-secondary/10' : 'border border-base-300'
  const sectionBg = isSmall ? 'bg-base-200/50' : 'bg-base-200/40'
  const headingClass = isSmall ? 'text-md font-semibold mb-1 flex items-center gap-1' : 'text-lg font-bold mb-3 border-b pb-1 flex items-center gap-2'
  const labelClass = isSmall ? 'block text-[14px] opacity-70' : 'block text-md font-medium mb-1 opacity-80'
  const rangeClass = isSmall ? 'range range-xs' : 'range range-sm' // Use sm for large mode for better control
  const selectClass = isSmall ? 'select select-bordered select-md' : 'select select-bordered select-md'
  const toggleClass = isSmall ? 'toggle toggle-sm' : 'toggle toggle-sm'
  const valueTextClass = isSmall ? 'text-[14px] font-mono w-8 text-right opacity-70' : 'text-md font-mono w-10 text-right opacity-70'
  const fovValueText = `${(fov * (180 / Math.PI)).toFixed(0)}°` // Display FOV in degrees

  return (
    <>
      {/* --- Mouse & Camera Controls Section --- */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${sectionPadding} ${sectionBg} rounded-lg ${sectionBorder}`}
      >
        <h3 className={`${headingClass} text-secondary border-secondary/30`}>
          <MousePointer2 size={isSmall ? 12 : 18} /> {isSmall ? 'Sensitivity' : 'Mouse & Camera'}
        </h3>
        <div className={`space-y-${isSmall ? 1 : 3}`}>
          {/* Sensitivity X */}
          <div>
            <label htmlFor="sensX" className={labelClass}>
              Horizontal Sensitivity
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="sensX"
                min="0.1"
                max="5" // Increased range
                step="0.1"
                value={sensitivityX}
                onChange={handleSensitivityXChange}
                className={`${rangeClass} range-primary flex-grow`}
              />
              <span className={valueTextClass}>{sensitivityX.toFixed(1)}</span>
            </div>
          </div>
          {/* Sensitivity Y */}
          <div>
            <label htmlFor="sensY" className={labelClass}>
              Vertical Sensitivity
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="sensY"
                min="0.1"
                max="5" // Increased range
                step="0.1"
                value={sensitivityY}
                onChange={handleSensitivityYChange}
                className={`${rangeClass} range-accent flex-grow`}
              />
              <span className={valueTextClass}>{sensitivityY.toFixed(1)}</span>
            </div>
          </div>
          {/* Invert Y Toggle */}
          <div className="form-control">
            <label className={`cursor-pointer label justify-start gap-2 p-0 ${isSmall ? 'mt-1' : ''}`}>
              <input type="checkbox" className={`${toggleClass} toggle-secondary`} checked={invertY} onChange={handleInvertYToggle} />
              <span className={`label-text ${isSmall ? 'text-[14px]' : 'text-md'}`}>Invert Vertical Axis</span>
            </label>
          </div>
          {/* Zoom Precision */}
          <div>
            <label htmlFor="wheelPrec" className={labelClass}>
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
                className={`${rangeClass} range-secondary flex-grow`}
              />
              <span className={valueTextClass}>{wheelPrecision}</span>
            </div>
          </div>
          {/* FOV Slider */}
          <div>
            <label htmlFor="fov" className={labelClass}>
              Field of View (FOV)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="fov"
                min="0.5" // Approx 28 degrees
                max="1.4" // Approx 80 degrees
                step="0.05"
                value={fov}
                onChange={handleFovChange}
                className={`${rangeClass} range-info flex-grow`}
              />
              <span className={valueTextClass}>{fovValueText}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- Display Section --- */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${sectionPadding} ${sectionBg} rounded-lg ${sectionBorder}`}
      >
        <h3 className={`${headingClass} text-info border-info/30`}>
          <Monitor size={isSmall ? 12 : 18} /> Display
        </h3>
        <div className={isSmall ? 'space-y-1' : 'flex flex-col md:flex-row md:items-end gap-4'}>
          <div className={isSmall ? '' : 'flex-1'}>
            <label htmlFor="graphicsQuality" className={labelClass}>
              Overall Quality
            </label>
            <select
              id="graphicsQuality"
              className={`${selectClass} select-info w-full`}
              value={graphicsQuality}
              onChange={handleGraphicsQualityChange}
            >
              <option value="low">Low {isSmall ? '🐢' : '(Perf ++)'}</option>
              <option value="medium">Medium {isSmall ? '🐇' : '(Balanced)'}</option>
              <option value="high">High {isSmall ? '🚀' : '(Quality ++)'}</option>
            </select>
          </div>
          <div className={`form-control ${isSmall ? '' : 'w-auto mb-1'}`}>
            <label className={`cursor-pointer label ${isSmall ? 'justify-start gap-2 p-0 mt-1' : 'py-0'}`}>
              <span className={`label-text ${isSmall ? 'text-[14px]' : 'text-md mr-2 opacity-80'}`}>Show FPS {isSmall ? '⏱️' : ''}</span>
              <input type="checkbox" className={`${toggleClass} toggle-info`} checked={showFps} onChange={handleShowFpsToggle} />
            </label>
          </div>
        </div>
      </motion.section>

      {/* --- Audio Section --- */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${sectionPadding} ${sectionBg} rounded-lg ${sectionBorder}`}
      >
        <h3 className={`${headingClass} text-warning border-warning/30`}>
          <Volume2 size={isSmall ? 12 : 18} /> Audio {isSmall ? '🔊' : ''}
        </h3>
        <div className={`space-y-${isSmall ? 1 : 3}`}>
          {/* Master Volume */}
          <div>
            <label htmlFor="masterVol" className={labelClass}>
              Master Volume 📢
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                id="masterVol"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={handleMasterVolumeChange}
                className={`${rangeClass} range-primary flex-grow`} // Changed color
              />
              <span className={valueTextClass}>{Math.round(masterVolume * 100)}%</span>
            </div>
          </div>
          {/* Music Toggle & Volume */}
          <div className={isSmall ? 'flex items-center gap-2' : 'flex flex-col md:flex-row md:items-center gap-4'}>
            <div className="form-control w-auto">
              <label className="cursor-pointer label justify-start gap-2 p-0">
                <span className={`label-text ${isSmall ? 'text-[14px]' : 'text-md mr-2'}`}>Music {isSmall ? '🎶' : ''}</span>
                <input type="checkbox" className={`${toggleClass} toggle-warning`} checked={musicEnabled} onChange={handleMusicToggleInternal} />
              </label>
            </div>
            <div className={isSmall ? 'flex-grow' : 'flex-1'}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  id="musicVol"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={handleMusicVolumeChange}
                  className={`${rangeClass} range-warning flex-grow`}
                  disabled={!musicEnabled}
                />
                <span className={`${valueTextClass} ${!musicEnabled ? 'opacity-50' : ''}`}>{Math.round(musicVolume * 100)}%</span>
              </div>
            </div>
          </div>
          {/* SFX Volume */}
          <div>
            <label htmlFor="sfxVol" className={labelClass}>
              Effects Volume {isSmall ? '💥' : ''}
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
                className={`${rangeClass} range-error flex-grow`}
              />
              <span className={valueTextClass}>{Math.round(sfxVolume * 100)}%</span>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  )
}

export default SharedSettingsPanel
