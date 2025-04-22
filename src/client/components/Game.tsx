import type { Scene } from '@babylonjs/core/scene'
import {
  ConnectionStatus,
  useGameColyseusRoom,
  useGameColyseusState,
  useGameConnectionError,
  useGameConnectionStatus,
} from '@client/hooks/colyseus.ts'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { GameEngine } from '../game/GameEngine'
import { BabylonScene } from './BabylonScene'
import GameUI from '@client/components/UI/GameUI.tsx'
import GameEndScreen from './UI/GameEndScreen'
import LobbyUI from './UI/LobbyUI'
import { GamePhase } from '@shared/types/enums'
import InGameSettingsMenu from '@client/components/UI/InGameSettingsMenu.tsx'

const ConnectionStatusComponent = ({
  onBackToMenu,
  gameEngineRef,
}: {
  onBackToMenu: () => void
  gameEngineRef: RefObject<GameEngine | null> // Changed to null
}) => {
  const connectionStatus = useGameConnectionStatus()
  const connectionError = useGameConnectionError()

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.ERROR) {
      console.error('Connection error:', connectionError?.message)
      gameEngineRef.current?.dispose()
      onBackToMenu()
    } else if (connectionStatus === ConnectionStatus.RECONNECTING) {
      console.log('Attempting to reconnect to game server...')
    }
  }, [connectionStatus, connectionError, gameEngineRef, onBackToMenu])

  if (connectionStatus === ConnectionStatus.RECONNECTING) {
    return <div className="absolute top-4 right-4 bg-warning text-white px-4 py-2 rounded-md shadow-lg">Reconnecting to server...</div>
  }
  return null
}

interface GameProps {
  onBackToMenu: () => void
  setGameEngineInstance: (engine: GameEngine | null) => void
  applySettingsChanges: () => void
}

export const Game: React.FC<GameProps> = ({ onBackToMenu, setGameEngineInstance, applySettingsChanges }) => {
  const room = useGameColyseusRoom()
  const gameEngineRef = useRef<GameEngine | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)

  const gamePhase = useGameColyseusState((state) => state.gamePhase) ?? GamePhase.WAITING

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score)
  }, [])

  // When the Babylon scene is ready, instantiate our GameEngine
  const onSceneReady = useCallback(
    async (scene: Scene) => {
      if (!room) return
      const engine = new GameEngine(scene, room, handleGameOver)
      gameEngineRef.current = engine
      setGameEngineInstance(engine) // Pass the instance up to App

      // Set up an observer to detect when loading is complete
      engine
        .getScene()
        .getEngine()
        .onEndFrameObservable.add(() => {
          // This logic might need refinement if loading has multiple stages
          // For now, assume engine.init completes loading
          setIsLoaded(true)
        })

      await engine.init()
    },
    [room, handleGameOver, setGameEngineInstance],
  )

  // Call our GameEngine's update method on each frame.
  const onRender = useCallback(
    (scene: Scene) => {
      // Only update if playing and engine exists
      if (gamePhase === GamePhase.PLAYING && gameEngineRef.current) {
        const deltaTime = scene.getEngine().getDeltaTime()
        gameEngineRef.current?.update(deltaTime)
      }
    },
    [gamePhase], // isPaused is internal to GameEngine
  )

  const handleStartGame = () => {
    if (room) {
      room.send('startGame')
    }
  }

  const onDispose = useCallback(() => {
    gameEngineRef.current?.dispose()
    gameEngineRef.current = null
    setGameEngineInstance(null) // Notify parent that engine is gone
  }, [setGameEngineInstance])

  // Ensure cleanup on component unmount
  useEffect(() => {
    return () => {
      gameEngineRef.current?.dispose()
      gameEngineRef.current = null
      setGameEngineInstance(null)
    }
  }, [setGameEngineInstance])

  return (
    <div className="relative w-full h-full">
      {gamePhase === GamePhase.WAITING && <LobbyUI onLeaveLobby={onBackToMenu} onStartGame={handleStartGame} />}

      {gamePhase === GamePhase.PLAYING && (
        <BabylonScene antialias onDispose={onDispose} onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" className="w-full h-full" />
      )}

      {gamePhase === GamePhase.PLAYING && <InGameSettingsMenu applySettingsChanges={applySettingsChanges} />}

      {gamePhase === GamePhase.PLAYING && isLoaded && <GameUI onBackToMenu={onBackToMenu} />}

      {gamePhase === GamePhase.FINISHED && <GameEndScreen finalScore={finalScore ?? 0} onBackToMenu={onBackToMenu} />}

      <ConnectionStatusComponent onBackToMenu={onBackToMenu} gameEngineRef={gameEngineRef} />
    </div>
  )
}
