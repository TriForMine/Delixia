import {useEffect} from "react";
import {connectToColyseus, disconnectFromColyseus} from "./hooks/colyseus.ts";
import {ChatRoom} from "./components/UI/TestUI.tsx";
import {Game} from "./components/Game.tsx";

const App = () => {
	useEffect(() => {
		(async () => {
			await connectToColyseus("my_room");
		})();

		return () => {
			disconnectFromColyseus().catch(console.error);
		};
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-base-200">
			{/* Main Content */}
			<div className="flex flex-1">
				{/* BabylonJS Scene */}
				<div className="flex-1 bg-base-100">
					<Game/>
				</div>

				{/* ChatRoom */}
				<div className="w-80 bg-base-300 shadow-inner overflow-y-auto">
					<ChatRoom/>
				</div>
			</div>
		</div>
	);
};

export default App;
