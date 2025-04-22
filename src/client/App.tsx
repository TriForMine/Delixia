import { Game } from './components/Game.tsx'
import { useStore } from './store/useStore'
import '@babylonjs/loaders/glTF'
import { RoomList } from '@client/components/RoomList.tsx'
import { gameConnect, gameDisconnectFromColyseus, lobbyConnect, lobbyDisconnectFromColyseus } from '@client/hooks/colyseus.ts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { settingsStore } from './utils/settingsStore.ts'
import Settings from './components/UI/Settings.tsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Cake, CookingPot, Ghost } from 'lucide-react'
import type { GameEngine } from '@client/game/GameEngine.ts'

const InitialPseudoSetup: React.FC<{ onPseudoSet: (pseudo: string) => void }> = ({ onPseudoSet }) => {
  const [tempPseudo, setTempPseudo] = useState('')
  const handleSubmit = () => {
    const finalPseudo = tempPseudo.trim()
    if (finalPseudo && finalPseudo.length >= 3) {
      onPseudoSet(finalPseudo)
    } else {
      alert('Your nickname must be at least 3 characters long! 😅')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-primary/80 via-secondary/80 to-accent/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 10 }}
        className="bg-base-100 p-8 rounded-2xl shadow-xl text-center border-2 border-base-300 w-full max-w-sm"
      >
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow">
          <CookingPot size={28} /> Welcome Chef! <Cake size={28} />
        </h2>
        <p className="mb-6 text-base-content/80 text-sm">Choose your amazing cooking name! 🧑‍🍳✨</p>
        <input
          type="text"
          value={tempPseudo}
          onChange={(e) => setTempPseudo(e.target.value.slice(0, 16))}
          maxLength={16}
          className="input input-bordered input-primary w-full mb-5 shadow-sm focus:ring-2 focus:ring-primary"
          placeholder="SuperChefName..."
          autoFocus
        />
        <motion.button
          whileHover={{ scale: 1.05, y: -2, transition: { duration: 0.1 } }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="btn btn-primary btn-block shadow-lg font-semibold text-lg"
        >
          Let's get cooking! 🎉
        </motion.button>
        <p className="text-xs mt-4 text-base-content/50 flex items-center justify-center gap-1">
          <Ghost size={12} /> You can change it later.
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
  const [showInitialSetup, setShowInitialSetup] = useState(false)
  const [playerPseudo, setPlayerPseudo] = useState('')
  const gameEngineRef = useRef<GameEngine | null>(null)

  // Callback to be passed to Game component to get the GameEngine instance
  const setGameEngineInstance = useCallback((engine: GameEngine | null) => {
    gameEngineRef.current = engine
  }, [])

  // Callback to apply settings changes, calls method on the GameEngine instance
  const applySettingsChanges = useCallback(() => {
    gameEngineRef.current?.applySettings()
  }, [])

  useEffect(() => {
    const savedPseudo = settingsStore.getPseudo()
    if (!savedPseudo) {
      setShowInitialSetup(true) // Show setup screen if no pseudo exists
    } else {
      setPlayerPseudo(savedPseudo) // Load existing pseudo
    }
  }, [])

  const handlePseudoSet = (pseudo: string) => {
    settingsStore.setPseudo(pseudo)
    setPlayerPseudo(pseudo)
    setShowInitialSetup(false)
    setMode('menu')
  }

  useEffect(() => {
    // Apply audio settings initially when App mounts (if not in initial setup)
    if (!showInitialSetup) {
      applySettingsChanges()
    }
  }, [showInitialSetup, applySettingsChanges]) // Re-apply if user finishes setup

  useEffect(() => {
    if (mode === 'game') {
      ;(async () => {
        const connectOptions = {
          clientPseudo: playerPseudo,
        }

        await gameConnect({
          roomName: roomToJoin?.roomName,
          roomId: roomToJoin?.roomId,
          forceCreate: roomToJoin?.forceCreate,
          options: connectOptions,
        })
      })()
      return () => {
        gameDisconnectFromColyseus().catch(console.error)
      }
    } else if (mode === 'roomList') {
      ;(async () => {
        await lobbyConnect({
          roomName: 'lobby',
          isLobby: true,
        })
      })()
      return () => {
        lobbyDisconnectFromColyseus().catch(console.error)
      }
    }
  }, [mode, roomToJoin, playerPseudo]) // Add playerPseudo dependency if it affects connection options

  const handlePlayGame = () => {
    setRoomToJoin({
      roomName: 'game',
    })
    setMode('game')
  }

  const handleOpenSettings = () => {
    setMode('settings')
  }

  const handleBackToMenu = () => {
    setMode('menu')
  }

  const handleRoomList = () => {
    setMode('roomList')
  }

  return (
    <div className="min-h-screen h-screen flex flex-col bg-base-200 overflow-hidden relative">
      <AnimatePresence>
        {!showInitialSetup && mode === 'menu' && (
          <motion.div
            key="decorations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="floating-decorations-container"
            aria-hidden="true"
          >
            {/* Emojis variés */}
            <span className="float-element" style={{ top: '10%', left: '15%', animationDelay: '0s', fontSize: '2.5rem' }}>
              🌸
            </span>
            <span className="float-element" style={{ top: '75%', left: '5%', animationDelay: '2.2s', fontSize: '1.8rem' }}>
              🍰
            </span>
            <span className="float-element" style={{ top: '20%', left: '80%', animationDelay: '1.1s', fontSize: '3rem' }}>
              ✨
            </span>
            <span className="float-element" style={{ top: '85%', left: '90%', animationDelay: '3.5s', fontSize: '1.5rem' }}>
              🌟
            </span>
            <span className="float-element" style={{ top: '50%', left: '10%', animationDelay: '0.5s', fontSize: '2rem' }}>
              💖
            </span>
            <span className="float-element" style={{ top: '5%', left: '40%', animationDelay: '4.0s', fontSize: '1.4rem' }}>
              ☁️
            </span>
            <span className="float-element" style={{ top: '60%', left: '70%', animationDelay: '1.8s', fontSize: '2.8rem' }}>
              🍓
            </span>
            <span className="float-element" style={{ top: '90%', left: '30%', animationDelay: '0.8s', fontSize: '2.2rem' }}>
              🍭
            </span>
            <span className="float-element" style={{ top: '35%', left: '55%', animationDelay: '5.0s', fontSize: '1.6rem' }}>
              🍙
            </span>
            <span className="float-element" style={{ top: '5%', left: '5%', animationDelay: '3.0s', fontSize: '2.1rem' }}>
              🎉
            </span>
            <span className="float-element" style={{ top: '45%', left: '95%', animationDelay: '2.8s', fontSize: '1.9rem' }}>
              🍩
            </span>
            <span className="float-element" style={{ top: '70%', left: '50%', animationDelay: '0.2s', fontSize: '2.4rem' }}>
              🎐
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {showInitialSetup && <InitialPseudoSetup onPseudoSet={handlePseudoSet} />}

      {!showInitialSetup && mode === 'menu' && (
        <div className="flex flex-col items-center justify-center flex-1">
          {playerPseudo && (
            <motion.h2 className="text-2xl mb-4 text-base-content/90">
              Ready to cook, <span className="font-bold text-primary drop-shadow">{playerPseudo}</span>? 🍳
            </motion.h2>
          )}

          <h1 className="text-6xl font-bold mb-2 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
            Delixia
          </h1>
          <p className="text-lg md:text-xl mb-8 text-base-content opacity-80 font-semibold">
            The cutest & most fun <span className="text-secondary font-bold">kitchen</span> on the web! 🎉
          </p>
          <div className="flex flex-col gap-4 w-64">
            <button onClick={handlePlayGame} className="btn-dream">
              Quick Play
            </button>
            <button onClick={handleRoomList} className="btn-dream">
              Join Room
            </button>
            <button onClick={handleOpenSettings} className="btn-dream">
              Settings
            </button>
            <button
              onClick={() => {
                window.open('https://github.com/TriForMine/delixia', '_blank')
              }}
              className="btn-dream"
            >
              GitHub
            </button>
          </div>
          <div className="fixed bottom-4 text-sm opacity-70 text-white">Version {import.meta.env.PUBLIC_APP_VERSION || '0.0.0'}</div>
        </div>
      )}
      {!showInitialSetup && mode === 'settings' && <Settings applySettingsChanges={applySettingsChanges} />}
      {!showInitialSetup && mode === 'game' && (
        <div className="flex flex-1 h-full">
          <div className="flex-1 bg-base-100">
            <Game onBackToMenu={handleBackToMenu} setGameEngineInstance={setGameEngineInstance} applySettingsChanges={applySettingsChanges} />
          </div>
        </div>
      )}
      {!showInitialSetup && mode === 'roomList' && <RoomList />}
    </div>
  )
}

export default App
