// File: src/shared/schemas/InteractableObjectState.ts
import { Schema, type } from "@colyseus/schema";
import {InteractType} from "../types/enums.ts";

export class InteractableObjectState extends Schema {
	@type("number")
	id: number = 0;

	@type("number")
	type: InteractType = InteractType.Fridge;

	@type("boolean")
	isActive: boolean = false;

	@type("number")
	activeSince: number = 0;
}
