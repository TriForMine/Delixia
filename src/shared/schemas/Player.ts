import {Schema, type} from "@colyseus/schema";

export class Player extends Schema {
	@type("string")
	name: string = "Unknown";

	@type("number")
	x = Math.floor(Math.random() * 400);

	@type("number")
	y = Math.floor(Math.random() * 400);
}