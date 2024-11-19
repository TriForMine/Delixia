import {useColyseusRoom, useColyseusState} from "../../hooks/colyseus.ts";
import {useEffect, useState} from "react";

export const ChatRoom = () => {
	const room = useColyseusRoom();
	const players = useColyseusState(state => state.players);
	const [messages, setMessages] = useState<string[]>([]);
	const [currentTab, setCurrentTab] = useState<"chat" | "players">("chat");

	useEffect(() => {
		room?.onMessage("messages", (message: string) => {
			console.log("ChatRoom received message:", message);
			setMessages([...messages, message]);
		})
	}, [room, messages]);

	const sendMessage = () => {
		const input = document.querySelector("input");
		if (input) {
			room?.send("message", input.value);
			input.value = "";
		}
	}

	return (
		<div className="flex flex-col h-screen bg-gray-800 text-white">
			<div className="flex-1 flex">
				{
					currentTab === "chat" ? (
						<div className="flex-1 flex flex-col">
							<div className="flex flex-col h-full overflow-y-auto p-4 bg-gray-800 text-white space-y-2">
								{messages.map((message, index) => (
									<div key={index} className="p-2 bg-gray-700 rounded">
										{message}
									</div>
								))}
							</div>
							<div className="flex">
								<input className="flex-1 bg-gray-900 text-white p-2" type="text"/>
								<button onClick={sendMessage} className="bg-gray-900 text-white p-2 ml-2">
									Send
								</button>
							</div>
						</div>
					) : (
						<div className="flex-1 flex flex-col">
							<div className="flex flex-col h-full overflow-y-auto p-4 bg-gray-800 text-white">
								{[...players?.values() ?? []].map((player, index) => (
									<div key={index} className="p-2 bg-gray-700 rounded">
										{player.name}
									</div>
								))}
							</div>
						</div>
					)
				}
			</div>
			<div className="flex bg-gray-800 pt-2">
				<button onClick={() => setCurrentTab("chat")}
						className="flex-1 bg-gray-900 border-r border-gray-700 rounded-l rounded-r-none text-white">
					Chat
				</button>
				<button onClick={() => setCurrentTab("players")}
						className="flex-1 bg-gray-900 text-white rounded-r rounded-l-none">
					Players
				</button>
			</div>
		</div>
	);
}