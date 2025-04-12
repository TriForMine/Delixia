import {ArraySchema, MapSchema, Schema, type} from '@colyseus/schema'
import { Ingredient, type InteractType } from '../types/enums.ts'
import { InteractableObjectState } from './InteractableObjectState.ts'
import { Player } from './Player.ts'
import {Order} from "@shared/schemas/Order.ts";
import {getItemDefinition} from "@shared/definitions.ts";

export class GameRoomState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>()

  @type({ map: InteractableObjectState })
  interactableObjects = new MapSchema<InteractableObjectState>()

  @type({ array: Order })
  orders = new ArraySchema<Order>();

  // Hash of the map configuration for version verification
  @type("string")
  mapHash: string = "";

  // Time left for the current game round, defaults to 5 minutes
  @type("number")
  timeLeft: number = 5 * 60 * 1000

  @type("number")
  score: number = 0


  createPlayer(id: string) {
    const player = new Player()
    player.name = `Player ${id}`
    this.players.set(id, player)
  }

  isConnected(id: string) {
    const player = this.players.get(id)
    return player ? player.connected : false
  }

  setIsConnected(id: string, value: boolean) {
    const player = this.players.get(id)
    if (!player) return

    player.connected = value
    this.players.set(id, player)
  }

  removePlayer(id: string) {
    this.players.delete(id)
  }

  updatePlayer(
      id: string,
      data: {
        position: { x: number; y: number; z: number }
        rotation: { y: number }
        animationState: string
      },
  ) {
    const player = this.players.get(id)
    if (!player) return

    player.x = data.position.x
    player.y = data.position.y
    player.z = data.position.z

    player.rot = data.rotation.y

    player.animationState = data.animationState

    this.players.set(id, player)
  }

  createInteractableObject(id: number, type: InteractType, ingredient: Ingredient | undefined) {
    const obj = new InteractableObjectState()
    obj.id = id
    obj.type = type
    obj.isActive = false
    obj.ingredient = ingredient ?? Ingredient.None

    this.interactableObjects.set(String(id), obj)
  }

  updateInteractableObject(id: number, changes: Partial<InteractableObjectState>) {
    const key = String(id)
    const obj = this.interactableObjects.get(key)
    if (!obj) return

    if (typeof changes.isActive !== 'undefined') {
      obj.isActive = changes.isActive
      obj.activeSince = Date.now()

      setTimeout(() => {
        obj.isActive = false
      }, 5000)
    }

    if (typeof changes.disabled !== 'undefined') {
      obj.disabled = changes.disabled
    }
  }

  disableInteractableObject(id: number, disabled: boolean = true) {
    this.updateInteractableObject(id, { disabled })
  }

  getIngredient(playerId: string) {
    const player = this.players.get(playerId)
    return player?.holdedIngredient
  }

  pickupIngredient(playerId: string, ingredient: Ingredient) {
    const player = this.players.get(playerId)
    if (!player) return

    const ingredientDef = getItemDefinition(ingredient);

    // Can't pick up if already holding something incompatible
    if (player.holdedIngredient !== Ingredient.None) {
      return; // Already holding something
    }
    // If holding a plate, only allow picking up results
    if (player.holdingPlate && (!ingredientDef || !ingredientDef.isFinal)) {
      return;
    }

    player.holdedIngredient = ingredient;
  }

  dropIngredient(playerId: string) {
    const player = this.players.get(playerId)
    if (!player) return

    player.holdedIngredient = Ingredient.None
  }

  pickupPlate(playerId: string) {
    const player = this.players.get(playerId)
    if (!player) return

    const currentIngredient = player.holdedIngredient;
    const currentIngredientIsFinal = currentIngredient !== Ingredient.None && !!getItemDefinition(currentIngredient)?.isFinal;

    if (currentIngredient !== Ingredient.None && !currentIngredientIsFinal) {
      return;
    }

    if (player.holdingPlate) {
      return;
    }

    player.holdingPlate = true
  }

  dropPlate(playerId: string) {
    const player = this.players.get(playerId)
    if (!player) return

    if (player.holdedIngredient !== Ingredient.None) {
      const heldItemDef = getItemDefinition(player.holdedIngredient);
      if (heldItemDef?.isFinal) {
        player.holdedIngredient = Ingredient.None;
      }
    }

    player.holdingPlate = false;
  }

  isHoldingPlate(playerId: string) {
    const player = this.players.get(playerId)
    return player ? player.holdingPlate : false
  }
}
