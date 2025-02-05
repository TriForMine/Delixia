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
				<div className="flex flex-col items-center justify-center flex-1">
					<h1 className="text-4xl mb-8">Main Menu</h1>
					<button className="btn btn-primary mb-4" onClick={handlePlayGame}>
						Play Game
					</button>
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
