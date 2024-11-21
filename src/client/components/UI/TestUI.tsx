import {useColyseusRoom, useColyseusState} from "../../hooks/colyseus.ts";
import {useEffect, useState} from "react";

export const ChatRoom = () => {
	const room = useColyseusRoom();
	const players = useColyseusState((state) => state.players);
	const [messages, setMessages] = useState<string[]>([]);
	const [currentTab, setCurrentTab] = useState<"chat" | "players">("chat");

	useEffect(() => {
		room?.onMessage("messages", (message: string) => {
			setMessages((prevMessages) => [...prevMessages, message]);
		});

		return () => {
			room?.removeAllListeners();
		};
	}, [room]);

	const sendMessage = () => {
		const input = document.querySelector<HTMLInputElement>("input.chat-input");
		if (input && input.value.trim() !== "") {
			room?.send("message", input.value);
			input.value = "";
		}
	};

	return (
		<div
			className="flex flex-col bg-base-200 text-base-content h-screen">
			{/* Tabs */}
			<div className="tabs tabs-boxed bg-base-300">
				<a
					onClick={() => setCurrentTab("chat")}
					className={`tab ${currentTab === "chat" ? "tab-active" : ""}`}
				>
					Chat
				</a>
				<a
					onClick={() => setCurrentTab("players")}
					className={`tab ${currentTab === "players" ? "tab-active" : ""}`}
				>
					Players
				</a>
			</div>

			{/* Content */}
			<div className="flex-1 p-4 overflow-y-auto">
				{currentTab === "chat" ? (
					<div className="flex flex-col h-full">
						<div className="flex-1 overflow-y-auto space-y-2">
							{messages.map((message, index) => (
								<div key={index}
									 className={`chat ${room?.sessionId === message.split(" ")[0].slice(1, -1) ? "chat-end" : "chat-start"}`}>
									<div className="chat-bubble">
										{message}
									</div>
								</div>
							))}
						</div>
						<div className="flex mt-2">
							<input
								className="chat-input input input-bordered flex-1 mr-2"
								type="text"
								placeholder="Type a message"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										sendMessage();
									}
								}}
							/>
							<button
								onClick={sendMessage}
								className="btn btn-primary"
							>
								Send
							</button>
						</div>
					</div>
				) : (
					<div className="flex flex-col h-full overflow-y-auto space-y-2">
						{[...(players?.values() ?? [])].map((player, index) => (
							<div
								key={index}
								className="card card-bordered bg-base-100 p-2 shadow"
							>
								<p>{player.name}</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
