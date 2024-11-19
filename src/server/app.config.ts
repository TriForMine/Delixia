import config from "@colyseus/tools";
import {monitor} from "@colyseus/monitor";
import {playground} from "@colyseus/playground";
import {BunWebSockets} from "@colyseus/bun-websockets"

/**
 * Import your Room files
 */
import {ChatRoom} from "./rooms/ChatRoom.ts";

export default config({
	options: {
		devMode: true
	},

	initializeTransport: function () {
		return new BunWebSockets({})
	},

	initializeGameServer: (gameServer) => {
		/**
		 * Define your room handlers:
		 */
		gameServer.define('my_room', ChatRoom);

	},

	initializeExpress: (app) => {
		/**
		 * Bind your custom express routes here:
		 * Read more: https://expressjs.com/en/starter/basic-routing.html
		 */
		app.get("/hello_world", (_, res) => {
			res.send("It's time to kick ass and chew bubblegum!");
		});

		/**
		 * Use @colyseus/playground
		 * (It is not recommended to expose this route in a production environment)
		 */
		if (process.env.NODE_ENV !== "production") {
			app.use("/", playground);
		}

		/**
		 * Use @colyseus/monitor
		 * It is recommended to protect this route with a password
		 * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
		 */
		app.use("/colyseus", monitor());
	}
});
