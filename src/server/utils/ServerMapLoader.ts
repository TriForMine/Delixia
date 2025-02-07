import { InteractionConfig } from "@shared/types/map";
import {MapModelConfig} from "@shared/types/map.ts";

export class ServerMapLoader {
	private readonly configs: MapModelConfig[];

	constructor(configs: MapModelConfig[]) {
		this.configs = configs;
	}

	public loadInteractables(): InteractionConfig[] {
		const interactables: InteractionConfig[] = [];
		for (const config of this.configs) {
			for (const instance of config.instances) {
				if (instance.interaction) {
					interactables.push(instance.interaction);
				}
			}
		}
		return interactables;
	}
}