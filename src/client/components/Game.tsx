import type { Scene } from '@babylonjs/core/scene'
import { ConnectionStatus, useGameColyseusRoom, useGameConnectionError, useGameConnectionStatus } from '@client/hooks/colyseus.ts'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { GameEngine } from '../game/GameEngine'
import { BabylonScene } from './BabylonScene'
import GameUI from "@client/components/UI/GameUI.tsx";
import GameEndScreen from './UI/GameEndScreen'

const ConnectionStatusComponent = ({
                                       onBackToMenu,
                                       gameEngineRef,
                                   }: {
    onBackToMenu: () => void
    gameEngineRef: RefObject<GameEngine | undefined>
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
    }, [connectionStatus, connectionError])

    if (connectionStatus === ConnectionStatus.RECONNECTING) {
        return <div className="absolute top-4 right-4 bg-warning text-white px-4 py-2 rounded-md shadow-lg">Reconnecting to server...</div>
    }
    return null
}

export const Game = ({ onBackToMenu }: { onBackToMenu: () => void }) => {
    const room = useGameColyseusRoom()
    const gameEngineRef = useRef<GameEngine>(undefined)
    const [isLoaded, setIsLoaded] = useState(false)
    const [gameEnded, setGameEnded] = useState(false);
    const [finalScore, setFinalScore] = useState<number | null>(null);

    const handleGameOver = useCallback((score: number) => {
        setFinalScore(score);
        setGameEnded(true);
    }, []);

    // When the Babylon scene is ready, instantiate our GameEngine
    const onSceneReady = useCallback(
        async (scene: Scene) => {
            if (!room) return
            gameEngineRef.current = new GameEngine(scene, room, handleGameOver)

            // Set up an observer to detect when loading is complete
            const engine = scene.getEngine();
            engine.onEndFrameObservable.add(() => {
                setIsLoaded(true);
            });

            await gameEngineRef.current.init()
        },
        [room, handleGameOver],
    )

    // Call our GameEngine's update method on each frame.
    const onRender = useCallback((scene: Scene) => {
        if (!gameEnded) {
            const deltaTime = scene.getEngine().getDeltaTime()
            gameEngineRef.current?.update(deltaTime)
        }
    }, [gameEnded])

    return (
        <div className="relative w-full h-full">
            <BabylonScene antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" className="w-full h-full" />
            <ConnectionStatusComponent onBackToMenu={onBackToMenu} gameEngineRef={gameEngineRef} />
            {isLoaded && (
                gameEnded ? (
                    <GameEndScreen finalScore={finalScore ?? 0} onBackToMenu={onBackToMenu} />
                ) : (
                    <GameUI onBackToMenu={onBackToMenu} />
                )
            )}
        </div>
    )
}
