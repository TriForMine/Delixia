import {Schema, type} from "@colyseus/schema";

class Position extends Schema {
	@type("number")
	x = Math.floor(Math.random() * 10);

	@type("number")
	y = Math.floor(3);

	@type("number")
	z = Math.floor(Math.random() * 10);
}

class Quaternion extends Schema {
	@type("number")
	x = 0;

	@type("number")
	y = 0;

	@type("number")
	z = 0;

	@type("number")
	w = 1;
}

export class Player extends Schema {
	@type("string")
	name: string = "Unknown";

	@type(Position)
	position = new Position();

	@type(Quaternion)
	rotation = new Quaternion();
}