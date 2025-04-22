import { KBCode } from '@client/utils/keys'

export type GameAction = 'forward' | 'backward' | 'left' | 'right' | 'jump' | 'interact' | 'dance'
export type GraphicsQuality = 'low' | 'medium' | 'high'

export const defaultKeyBindings: Record<GameAction, string> = {
  forward: KBCode.KeyW,
  backward: KBCode.KeyS,
  left: KBCode.KeyA,
  right: KBCode.KeyD,
  jump: KBCode.Space,
  interact: KBCode.KeyE,
  dance: KBCode.KeyB,
}

// Helper to retrieve a value with a default value and an expected type
function getSetting<T>(key: string, defaultValue: T): T {
  const storedValue = localStorage.getItem(key)
  if (storedValue === null) {
    return defaultValue
  }

  try {
    if (typeof defaultValue === 'boolean') {
      return (storedValue === 'true') as T
    }
    if (typeof defaultValue === 'number') {
      const num = parseFloat(storedValue)
      return isNaN(num) ? defaultValue : (num as T)
    }
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      const parsed = JSON.parse(storedValue)
      // Check if the type matches (simple verification)
      if (typeof parsed === typeof defaultValue) {
        return parsed as T
      }
      console.warn(`Type mismatch for setting ${key}. Using default.`)
      return defaultValue
    }
    // For strings and other types
    return storedValue as T
  } catch (error) {
    console.error(`Error reading setting ${key}:`, error)
    return defaultValue
  }
}

// Helper to save a value
function setSetting<T>(key: string, value: T): void {
  try {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value)
    localStorage.setItem(key, valueToStore)
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error)
  }
}

// Helper to merge saved bindings with defaults (in case new actions are added)
function mergeBindings(saved: any): Record<GameAction, string> {
  const merged = { ...defaultKeyBindings } // Start with a copy of the defaults
  if (saved && typeof saved === 'object') {
    for (const action in defaultKeyBindings) {
      // If the action exists in the saved data and is a non-empty string
      if (saved[action] && typeof saved[action] === 'string') {
        merged[action as GameAction] = saved[action]
      }
    }
  }
  return merged
}

// Export functions and define parameter keys
export const settingsKeys = {
  PLAYER_PSEUDO: 'delixia_playerPseudo',
  SENSITIVITY_X: 'delixia_sensitivityX',
  SENSITIVITY_Y: 'delixia_sensitivityY',
  WHEEL_PRECISION: 'delixia_wheelPrecision',
  SHOW_FPS: 'delixia_showFps',
  MUSIC_ENABLED: 'delixia_musicEnabled',
  MUSIC_VOLUME: 'delixia_musicVolume',
  SFX_VOLUME: 'delixia_sfxVolume',
  GRAPHICS_QUALITY: 'delixia_graphicsQuality',
  KEY_BINDINGS: 'delixia_keyBindings',
}

export const settingsStore = {
  // --- Pseudo ---
  getPseudo: () => getSetting<string>(settingsKeys.PLAYER_PSEUDO, ''),
  setPseudo: (value: string) => setSetting<string>(settingsKeys.PLAYER_PSEUDO, value.trim()), // Trim when saving

  // --- Mouse Controls ---
  getSensitivityX: () => getSetting<number>(settingsKeys.SENSITIVITY_X, 1.0),
  setSensitivityX: (value: number) => setSetting<number>(settingsKeys.SENSITIVITY_X, Math.max(0.1, Math.min(value, 3))), // Clamp value

  getSensitivityY: () => getSetting<number>(settingsKeys.SENSITIVITY_Y, 1.0),
  setSensitivityY: (value: number) => setSetting<number>(settingsKeys.SENSITIVITY_Y, Math.max(0.1, Math.min(value, 3))), // Clamp value

  getWheelPrecision: () => getSetting<number>(settingsKeys.WHEEL_PRECISION, 12),
  setWheelPrecision: (value: number) => setSetting<number>(settingsKeys.WHEEL_PRECISION, Math.max(1, Math.min(value, 100))), // Clamp value

  // --- Display ---
  getShowFps: () => getSetting<boolean>(settingsKeys.SHOW_FPS, false),
  setShowFps: (value: boolean) => setSetting<boolean>(settingsKeys.SHOW_FPS, value),

  getGraphicsQuality: () => getSetting<GraphicsQuality>(settingsKeys.GRAPHICS_QUALITY, 'medium'), // Medium by default
  setGraphicsQuality: (value: GraphicsQuality) => setSetting<GraphicsQuality>(settingsKeys.GRAPHICS_QUALITY, value),

  // --- Audio ---
  getMusicEnabled: () => getSetting<boolean>(settingsKeys.MUSIC_ENABLED, true), // Music ON by default
  setMusicEnabled: (value: boolean) => setSetting<boolean>(settingsKeys.MUSIC_ENABLED, value),

  getMusicVolume: () => getSetting<number>(settingsKeys.MUSIC_VOLUME, 0.3), // Default volume 0.3 (30%)
  setMusicVolume: (value: number) => setSetting<number>(settingsKeys.MUSIC_VOLUME, Math.max(0, Math.min(value, 1))), // Clamp 0-1

  getSfxVolume: () => getSetting<number>(settingsKeys.SFX_VOLUME, 0.7), // Default volume 0.7 (70%)
  setSfxVolume: (value: number) => setSetting<number>(settingsKeys.SFX_VOLUME, Math.max(0, Math.min(value, 1))), // Clamp 0-1

  // --- Keyboard Controls ---
  getKeyBindings: (): Record<GameAction, string> => {
    const storedValue = localStorage.getItem(settingsKeys.KEY_BINDINGS)
    let bindings = { ...defaultKeyBindings } // Copy of defaults
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue)
        bindings = mergeBindings(parsed) // Merge with defaults
      } catch (error) {
        console.error('Error parsing key bindings, using defaults:', error)
      }
    }
    return bindings
  },
  setKeyBindings: (bindings: Record<GameAction, string>): void => {
    setSetting<Record<GameAction, string>>(settingsKeys.KEY_BINDINGS, bindings)
  },

  // --- Utility ---
  resetAllSettings: (): void => {
    // List all defined keys
    Object.values(settingsKeys).forEach((key) => {
      localStorage.removeItem(key)
    })
    console.log('All settings reset to default.')
  },
}
