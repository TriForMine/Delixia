import type React from 'react'
import { useEffect } from 'react'
import { Game } from './components/Game.tsx'
import { useStore } from './store/useStore'
import '@babylonjs/loaders/glTF'
import { RoomList } from '@client/components/RoomList.tsx'
import { gameConnect, gameDisconnectFromColyseus, lobbyConnect, lobbyDisconnectFromColyseus } from '@client/hooks/colyseus.ts'

const App: React.FC = () => {
  const mode = useStore((state) => state.mode)
  const setMode = useStore((state) => state.setMode)
  const roomToJoin = useStore((state) => state.roomToJoin)
  const setRoomToJoin = useStore((state) => state.setRoomToJoin)

  useEffect(() => {
    if (mode === 'game') {
      ;(async () => {
        await gameConnect({
          roomName: roomToJoin?.roomName,
          roomId: roomToJoin?.roomId,
          forceCreate: roomToJoin?.forceCreate,
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
  }, [mode, roomToJoin, setRoomToJoin])

  const handlePlayGame = () => {
    setRoomToJoin({ roomName: 'game' })
    setMode('game')
  }

  const handleBackToMenu = () => {
    setMode('menu')
  }

  const handleRoomList = () => {
    setMode('roomList')
  }

  return (
    <div className="min-h-screen h-screen flex flex-col bg-base-200 overflow-hidden">
      {mode === 'menu' && (
        <div className="flex flex-col items-center justify-center flex-1 bg-base-200 bg-opacity-90">
          <h1 className="text-6xl font-bold mb-2 text-primary">Delixia</h1>
          <p className="text-xl mb-8 text-base-content opacity-80">Un jeu de cuisine multijoueur</p>

          <div className="flex flex-col gap-4 w-64">
            <button className="btn btn-primary btn-lg w-full" onClick={handlePlayGame}>
              Quick Play
            </button>

            <button className="btn btn-outline btn-lg w-full" onClick={handleRoomList}>
              Join Room
            </button>

            <button className="btn btn-outline btn-lg w-full" onClick={() => window.open('https://github.com/TriForMine/delixia', '_blank')}>
              GitHub
            </button>
          </div>

          <div className="fixed bottom-4 text-sm opacity-70">Version {import.meta.env.VITE_APP_VERSION || '0.0.0'}</div>
        </div>
      )}
      {mode === 'game' && (
        <div className="flex flex-1 h-full">
          {/* Game */}
          <div className="flex-1 bg-base-100">
            <Game onBackToMenu={handleBackToMenu} />
          </div>
        </div>
      )}
      {mode === 'roomList' && <RoomList />}
    </div>
  )
}

export default App
