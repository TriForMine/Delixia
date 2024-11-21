import {Schema, type} from "@colyseus/schema";

export class Player extends Schema {
	@type("string")
	name: string = "Unknown";

	@type("number")
	x = Math.floor(Math.random() * 10);

	@type("number")
	y = 1;

	@type("number")
	z = Math.floor(Math.random() * 10);

	@type("number")
	rot = 0;

	@type("string")
	animationState: string = "Idle";
}