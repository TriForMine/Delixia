import React, {useEffect} from 'react';
import {connectToColyseus, disconnectFromColyseus} from './hooks/colyseus.ts';
import {Game} from './components/Game.tsx';
import {useStore} from './store/useStore';
import '@babylonjs/loaders/glTF';

const App: React.FC = () => {
	const mode = useStore((state) => state.mode);
	const setMode = useStore((state) => state.setMode);

	useEffect(() => {
		if (mode === 'game') {
			(async () => {
				await connectToColyseus('my_room');
			})();

			return () => {
				disconnectFromColyseus().catch(console.error);
			};
		}
	}, [mode]);

	const handlePlayGame = () => {
		setMode('game');
	};

	const handleBackToMenu = () => {
		setMode('menu');
	};

	return (
		<div className="min-h-screen h-screen flex flex-col bg-base-200 overflow-hidden">
			{mode === 'menu' && (
				<div className="flex flex-col items-center justify-center flex-1 bg-base-200 bg-opacity-90">
					<h1 className="text-6xl font-bold mb-2 text-primary">Delixia</h1>
					<p className="text-xl mb-8 text-base-content opacity-80">Un jeu de cuisine multijoueur</p>
					
					<div className="flex flex-col gap-4 w-64">
						<button
							className="btn btn-primary btn-lg w-full"
							onClick={handlePlayGame}
						>
							Jouer
						</button>
						
						<button
							className="btn btn-outline btn-lg w-full"
							onClick={() => window.open('https://github.com/TriForMine/delixia', '_blank')}
						>
							GitHub
						</button>
					</div>
					
					<div className="fixed bottom-4 text-sm opacity-70">
						Version {import.meta.env.VITE_APP_VERSION || '0.0.0'}
					</div>
				</div>
			)}
			{mode === 'game' && (
				<div className="flex flex-1 h-full">
					{/* Game */}
					<div className="flex-1 bg-base-100">
						<Game onBackToMenu={handleBackToMenu}/>
					</div>
				</div>
			)}
		</div>
	);
};

export default App;
