import { Game } from './components/Game.tsx'
import { useStore } from './store/useStore'
import '@babylonjs/loaders/glTF'
import RoomList from '@client/components/RoomList.tsx'
import { gameConnect, gameDisconnectFromColyseus, lobbyConnect, lobbyDisconnectFromColyseus } from '@client/hooks/colyseus.ts'
import { useCallback, useEffect, useRef, useState } from 'react'
import Settings from './components/UI/Settings.tsx'
import { AnimatePresence, motion } from 'motion/react'
import { Cake, CookingPot, Ghost, Settings as SettingsIcon, Play } from 'lucide-react'
import type { GameEngine } from '@client/game/GameEngine.ts'
import { toast } from 'react-hot-toast'
import { ToasterWithMax } from '@client/components/UI/ToasterWithMax.tsx'

const InitialPseudoSetup: React.FC<{ onPseudoSet: (pseudo: string) => void }> = ({ onPseudoSet }) => {
  const [tempPseudo, setTempPseudo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const finalPseudo = tempPseudo.trim()
    if (finalPseudo && finalPseudo.length >= 3) {
      onPseudoSet(finalPseudo)
    } else {
      toast.error('Your nickname must be at least 3 characters long! 😅')
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 10 }}
        className="bg-base-100 p-8 rounded-2xl shadow-xl text-center border-2 border-base-300 w-full max-w-sm"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent drop-shadow">
          <CookingPot size={28} /> Welcome Chef ! <Cake size={28} />
        </h2>
        <p className="mb-6 text-base-content/80 text-md">Choose your amazing cooking name !</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={tempPseudo}
            onChange={(e) => setTempPseudo(e.target.value.slice(0, 16))}
            maxLength={16}
            className="input input-bordered w-full mb-5 shadow-sm border-rose-50 focus:ring-1"
            placeholder="SuperChefName..."
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05, y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.95 }}
            className="btn-dream"
          >
            Let's get cooking ! 🎉
          </motion.button>
        </form>
        <p className="text-xs mt-4 text-base-content/50 flex items-center justify-center gap-1">
          <Ghost size={16} /> You can change it later.
        </p>
      </motion.div>
    </motion.div>
  )
}

const App: React.FC = () => {
  const mode = useStore((state) => state.mode)
  const setMode = useStore((state) => state.setMode)
  const roomToJoin = useStore((state) => state.roomToJoin)
  const setRoomToJoin = useStore((state) => state.setRoomToJoin)
  const username = useStore((state) => state.username)
  const setUsername = useStore((state) => state.setUsername)
  const [showInitialSetup, setShowInitialSetup] = useState(false)
  const gameEngineRef = useRef<GameEngine | null>(null)

  const setGameEngineInstance = useCallback((engine: GameEngine | null) => {
    gameEngineRef.current = engine
  }, [])

  const applySettingsChanges = useCallback(() => {
    gameEngineRef.current?.applySettings()
  }, [])

  useEffect(() => {
    setShowInitialSetup(!username)
  }, [username])

  const handleInitialPseudoSubmit = (pseudo: string) => {
    setUsername(pseudo)
    setShowInitialSetup(false)
    setMode('menu')
  }

  useEffect(() => {
    if (!showInitialSetup) {
      applySettingsChanges()
    }
  }, [showInitialSetup, applySettingsChanges])

  useEffect(() => {
    if (!username && mode !== 'menu' && mode !== 'settings') {
      setShowInitialSetup(true)
      setMode('menu')
      return
    }

    if (mode === 'game') {
      ;(async () => {
        const connectOptions = {
          ...(roomToJoin?.options || {}),
          clientPseudo: username,
        }
        await gameConnect({
          roomName: roomToJoin?.roomName || 'game',
          roomId: roomToJoin?.roomId,
          forceCreate: roomToJoin?.forceCreate,
          options: connectOptions,
        })
      })()
      return () => {
        gameDisconnectFromColyseus().catch(console.error)
        setRoomToJoin(undefined)
      }
    } else if (mode === 'roomList') {
      ;(async () => {
        await lobbyConnect({ roomName: 'lobby', isLobby: true })
      })()
      return () => {
        lobbyDisconnectFromColyseus().catch(console.error)
      }
    }
  }, [mode, roomToJoin, setRoomToJoin, username, setMode])

  const handlePlay = () => {
    if (!username) {
      setShowInitialSetup(true)
      return
    }
    setMode('roomList')
  }

  const handleOpenSettings = () => {
    setMode('settings')
  }

  const handleBackToMenu = useCallback(async () => {
    try {
      await gameDisconnectFromColyseus()
    } catch (error) {
      console.error('Error disconnecting from game room:', error)
      toast.error("Couldn't cleanly leave the room, returning to menu.")
    } finally {
      setMode('menu')
    }
  }, [setMode])

  return (
    <div className="min-h-screen h-screen flex flex-col bg-base-200 overflow-hidden relative">
      <ToasterWithMax
        position="bottom-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: { background: '#333', color: '#fff' },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
        }}
      />

      <AnimatePresence>
        {!showInitialSetup && mode === 'menu' && (
          <motion.div
            key="decorations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="floating-decorations-container"
            aria-hidden="true"
          >
            <span className="float-element" style={{ top: '18%', left: '24%', animationDelay: '0s', fontSize: '2.5rem' }}>
              🌸
            </span>
            <span className="float-element" style={{ top: '75%', left: '5%', animationDelay: '2.2s', fontSize: '1.8rem' }}>
              🍰
            </span>
            <span className="float-element" style={{ top: '20%', left: '86%', animationDelay: '1.1s', fontSize: '2.8rem' }}>
              ✨
            </span>
            <span className="float-element" style={{ top: '82%', left: '85%', animationDelay: '3.5s', fontSize: '1.7rem' }}>
              🌟
            </span>
            <span className="float-element" style={{ top: '50%', left: '16%', animationDelay: '0.5s', fontSize: '2rem' }}>
              💖
            </span>
            <span className="float-element" style={{ top: '5%', left: '40%', animationDelay: '4.0s', fontSize: '1.4rem' }}>
              ☁️
            </span>
            <span className="float-element" style={{ top: '50%', left: '70%', animationDelay: '1.8s', fontSize: '2.8rem' }}>
              🍓
            </span>
            <span className="float-element" style={{ top: '90%', left: '30%', animationDelay: '0.8s', fontSize: '2.2rem' }}>
              🍭
            </span>
            <span className="float-element" style={{ top: '87%', left: '66%', animationDelay: '5.0s', fontSize: '1.9rem' }}>
              🍙
            </span>
            <span className="float-element" style={{ top: '5%', left: '5%', animationDelay: '3.0s', fontSize: '2.1rem' }}>
              🎉
            </span>
            <span className="float-element" style={{ top: '45%', left: '95%', animationDelay: '2.8s', fontSize: '1.9rem' }}>
              🍩
            </span>
            <span className="float-element" style={{ top: '13%', left: '70%', animationDelay: '0.2s', fontSize: '2.4rem' }}>
              🎐
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showInitialSetup ? (
          <InitialPseudoSetup key="initial-setup" onPseudoSet={handleInitialPseudoSubmit} />
        ) : mode === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            {username && (
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-2xl mb-4 text-base-content/90"
              >
                Ready to cook, <span className="font-bold text-primary drop-shadow">{username}</span>? 🍳
              </motion.h2>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-6xl font-bold mb-2 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent"
            >
              Delixia
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-lg md:text-xl mb-8 text-base-content opacity-80 font-semibold"
            >
              The cutest & most fun <span className="text-secondary font-bold">kitchen</span> on the web! 🎉
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="flex flex-col gap-4 w-64"
            >
              <button onClick={handlePlay} className="btn-dream flex items-center justify-center gap-2">
                <Play size={24} /> Play
              </button>
              <button onClick={handleOpenSettings} className="btn-dream flex items-center justify-center gap-2">
                <SettingsIcon size={22} /> Settings
              </button>
              <button
                onClick={() => {
                  window.open('https://github.com/TriForMine/delixia', '_blank')
                }}
                className="btn btn-outline btn-sm text-base-content/70 hover:bg-base-content/10 border-base-content/30"
              >
                GitHub
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="absolute bottom-4 text-sm opacity-70 text-base-content/70"
            >
              Version {import.meta.env.PUBLIC_APP_VERSION || '0.0.0'}
            </motion.div>
          </motion.div>
        ) : mode === 'settings' ? (
          <Settings key="settings" applySettingsChanges={applySettingsChanges} />
        ) : mode === 'game' ? (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 h-full w-full"
          >
            <div className="flex-1 bg-base-100 w-full h-full">
              <Game onBackToMenu={handleBackToMenu} setGameEngineInstance={setGameEngineInstance} applySettingsChanges={applySettingsChanges} />
            </div>
          </motion.div>
        ) : mode === 'roomList' ? (
          <RoomList key="roomList" />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default App
