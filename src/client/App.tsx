import { Game } from './components/Game.tsx';
import { useStore } from './store/useStore';
import '@babylonjs/loaders/glTF';
import { RoomList } from '@client/components/RoomList.tsx';
import { gameConnect, gameDisconnectFromColyseus, lobbyConnect, lobbyDisconnectFromColyseus } from '@client/hooks/colyseus.ts';
import { useEffect } from 'react';
import {useAudioPlayer} from "react-use-audio-player";

const App: React.FC = () => {
  const mode = useStore((state) => state.mode);
  const setMode = useStore((state) => state.setMode);
  const roomToJoin = useStore((state) => state.roomToJoin);
  const setRoomToJoin = useStore((state) => state.setRoomToJoin);

  useAudioPlayer('/assets/music/theme.mp3', {
    format: 'mp3',
    autoplay: true,
    loop: true,
    initialVolume: 0.05,
  });

  useEffect(() => {
    if (mode === 'game') {
      ;(async () => {
        await gameConnect({
          roomName: roomToJoin?.roomName,
          roomId: roomToJoin?.roomId,
          forceCreate: roomToJoin?.forceCreate,
        });
      })();
      return () => {
        gameDisconnectFromColyseus().catch(console.error);
      };
    } else if (mode === 'roomList') {
      ;(async () => {
        await lobbyConnect({
          roomName: 'lobby',
          isLobby: true,
        });
      })();
      return () => {
        lobbyDisconnectFromColyseus().catch(console.error);
      };
    }
  }, [mode, roomToJoin]);

  const handlePlayGame = () => {
    setRoomToJoin({ roomName: 'game' });
    setMode('game');
  };

  const handleBackToMenu = () => {
    setMode('menu');
  };

  const handleRoomList = () => {
    setMode('roomList');
  };

  return (
      <div className="min-h-screen h-screen flex flex-col bg-base-200 overflow-hidden">
        {mode === 'menu' && (
            <div className="flex flex-col items-center justify-center flex-1">
              <h1 className="text-6xl font-bold mb-2 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
                Delixia
              </h1>
              <p className="text-xl mb-8 text-base-content opacity-80">A cooking game with a twist!</p>
              <div className="flex flex-col gap-4 w-64">
                <button
                    onClick={handlePlayGame}
                    className="btn-dream"
                >
                  Quick Play
                </button>
                <button
                    onClick={handleRoomList}
                    className="btn-dream"
                >
                  Join Room
                </button>
                <button
                    onClick={() => {
                      window.open('https://github.com/TriForMine/delixia', '_blank');
                    }}
                    className="btn-dream"
                >
                  GitHub
                </button>
              </div>
              <div className="fixed bottom-4 text-sm opacity-70 text-white">Version {import.meta.env.PUBLIC_APP_VERSION || '0.0.0'}</div>
            </div>
        )}
        {mode === 'game' && (
            <div className="flex flex-1 h-full">
              <div className="flex-1 bg-base-100">
                <Game onBackToMenu={handleBackToMenu} />
              </div>
            </div>
        )}
        {mode === 'roomList' && <RoomList />}
      </div>
  );
};

export default App;