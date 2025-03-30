import {InteractionConfig, MapModelConfig} from "@shared/utils/mapUtils"

export class ServerMapLoader {
  private readonly configs: MapModelConfig[]

  constructor(configs: MapModelConfig[]) {
    this.configs = configs
  }

  public loadInteractables(): InteractionConfig[] {
    const interactables: InteractionConfig[] = []
    for (const config of this.configs) {
      for (const instance of config.instances) {
        if (instance.interaction) {
          interactables.push(instance.interaction)
        }
      }
    }
    return interactables
  }
}
