import {Schema, type} from "@colyseus/schema";

export class Player extends Schema {
	@type("string")
	name: string = "Unknown";

	@type("number")
	x = 7;

	@type("number")
	y = 1;

	@type("number")
	z = 7;

	@type("number")
	rot = 0;

	@type("string")
	animationState: string = "Idle";
}