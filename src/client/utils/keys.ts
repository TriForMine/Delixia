export const enum KBCode {
  Escape = 'Escape',
  Digit1 = 'Digit1',
  Digit2 = 'Digit2',
  Digit3 = 'Digit3',
  Digit4 = 'Digit4',
  Digit5 = 'Digit5',
  Digit6 = 'Digit6',
  Digit7 = 'Digit7',
  Digit8 = 'Digit8',
  Digit9 = 'Digit9',
  Digit0 = 'Digit0',
  Minus = 'Minus',
  Equal = 'Equal',
  Backspace = 'Backspace',
  Tab = 'Tab',
  KeyQ = 'KeyQ',
  KeyW = 'KeyW',
  KeyE = 'KeyE',
  KeyR = 'KeyR',
  KeyT = 'KeyT',
  KeyY = 'KeyY',
  KeyU = 'KeyU',
  KeyI = 'KeyI',
  KeyO = 'KeyO',
  KeyP = 'KeyP',
  BracketLeft = 'BracketLeft',
  BracketRight = 'BracketRight',
  Enter = 'Enter',
  ControlLeft = 'ControlLeft',
  KeyA = 'KeyA',
  KeyS = 'KeyS',
  KeyD = 'KeyD',
  KeyF = 'KeyF',
  KeyG = 'KeyG',
  KeyH = 'KeyH',
  KeyJ = 'KeyJ',
  KeyK = 'KeyK',
  KeyL = 'KeyL',
  Semicolon = 'Semicolon',
  Quote = 'Quote',
  Backquote = 'Backquote',
  ShiftLeft = 'ShiftLeft',
  Backslash = 'Backslash',
  KeyZ = 'KeyZ',
  KeyX = 'KeyX',
  KeyC = 'KeyC',
  KeyV = 'KeyV',
  KeyB = 'KeyB',
  KeyN = 'KeyN',
  KeyM = 'KeyM',
  Comma = 'Comma',
  Period = 'Period',
  Slash = 'Slash',
  ShiftRight = 'ShiftRight',
  NumpadMultiply = 'NumpadMultiply',
  AltLeft = 'AltLeft',
  Space = 'Space',
  CapsLock = 'CapsLock',
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  Numpad7 = 'Numpad7',
  Numpad8 = 'Numpad8',
  Numpad9 = 'Numpad9',
  NumpadSubtract = 'NumpadSubtract',
  Numpad4 = 'Numpad4',
  Numpad5 = 'Numpad5',
  Numpad6 = 'Numpad6',
  NumpadAdd = 'NumpadAdd',
  Numpad1 = 'Numpad1',
  Numpad2 = 'Numpad2',
  Numpad3 = 'Numpad3',
  Numpad0 = 'Numpad0',
  NumpadDecimal = 'NumpadDecimal',
  IntlBackslash = 'IntlBackslash',
  F11 = 'F11',
  F12 = 'F12',
  NumpadEqual = 'NumpadEqual',
  F13 = 'F13',
  F14 = 'F14',
  F15 = 'F15',
  F16 = 'F16',
  F17 = 'F17',
  F18 = 'F18',
  F19 = 'F19',
  F20 = 'F20',
  Lang2 = 'Lang2',
  Lang1 = 'Lang1',
  IntlRo = 'IntlRo',
  IntlYen = 'IntlYen',
  NumpadComma = 'NumpadComma',
  NumpadEnter = 'NumpadEnter',
  ControlRight = 'ControlRight',
  NumpadDivide = 'NumpadDivide',
  AltRight = 'AltRight',
  NumLock = 'NumLock',
  Home = 'Home',
  ArrowUp = 'ArrowUp',
  PageUp = 'PageUp',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  End = 'End',
  ArrowDown = 'ArrowDown',
  PageDown = 'PageDown',
  Delete = 'Delete',
  MetaLeft = 'MetaLeft',
  MetaRight = 'MetaRight',
  ContextMenu = 'ContextMenu',
}

/**
 * Converts a KeyboardEvent.code string into a shorter, display-friendly string.
 * @param keyCode The KeyboardEvent.code value (e.g., "KeyE", "Space", "Digit1").
 * @returns A display-friendly string (e.g., "E", "SPACE", "1").
 */
export function getDisplayKey(keyCode: string): string {
  if (!keyCode) return '?'

  if (keyCode.startsWith('Key')) {
    return keyCode.substring(3)
  }
  if (keyCode.startsWith('Digit')) {
    return keyCode.substring(5)
  }
  if (keyCode.startsWith('Numpad')) {
    const numPart = keyCode.substring(6)
    switch (numPart) {
      case 'Decimal':
        return 'NUM .'
      case 'Divide':
        return 'NUM /'
      case 'Multiply':
        return 'NUM *'
      case 'Subtract':
        return 'NUM -'
      case 'Add':
        return 'NUM +'
      case 'Enter':
        return 'NUM ↵'
      default:
        return `NUM ${numPart}`
    }
  }
  switch (keyCode) {
    case 'Space':
      return 'SPACE'
    case 'ArrowUp':
      return '↑'
    case 'ArrowDown':
      return '↓'
    case 'ArrowLeft':
      return '←'
    case 'ArrowRight':
      return '→'
    case 'Backquote':
      return '`'
    case 'Minus':
      return '-'
    case 'Equal':
      return '='
    case 'BracketLeft':
      return '['
    case 'BracketRight':
      return ']'
    case 'Backslash':
      return '\\'
    case 'Semicolon':
      return ';'
    case 'Quote':
      return "'"
    case 'Comma':
      return ','
    case 'Period':
      return '.'
    case 'Slash':
      return '/'
    case 'Enter':
      return '↵'
    case 'Escape':
      return 'ESC'
    case 'Tab':
      return 'TAB'
    case 'CapsLock':
      return 'CAPS'
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'SHIFT'
    case 'ControlLeft':
    case 'ControlRight':
      return 'CTRL'
    case 'AltLeft':
    case 'AltRight':
      return 'ALT'
    case 'MetaLeft':
    case 'MetaRight':
      return 'WIN'
    case 'ContextMenu':
      return 'MENU'
    case 'Delete':
      return 'DEL'
    case 'Home':
      return 'HOME'
    case 'End':
      return 'END'
    case 'PageUp':
      return 'PG UP'
    case 'PageDown':
      return 'PG DN'
    default:
      return keyCode.length > 7 ? keyCode.substring(0, 5) + '…' : keyCode
  }
}
