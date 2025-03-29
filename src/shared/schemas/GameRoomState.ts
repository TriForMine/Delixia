import {ArraySchema, MapSchema, Schema, type} from '@colyseus/schema'
import { Ingredient, type InteractType } from '../types/enums.ts'
import { InteractableObjectState } from './InteractableObjectState.ts'
import { Player } from './Player.ts'
import {Order} from "@shared/schemas/Order.ts";

export class GameRoomState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>()

  @type({ map: InteractableObjectState })
  interactableObjects = new MapSchema<InteractableObjectState>()

  @type({ array: Order })
  orders = new ArraySchema<Order>();

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
  }

  getIngredient(playerId: string) {
    const player = this.players.get(playerId)
    return player?.holdedIngredient
  }

  pickupIngredient(playerId: string, ingredient: Ingredient) {
    const player = this.players.get(playerId)
    if (!player) return

    console.log('Picking up ingredient', ingredient)
    player.holdedIngredient = ingredient
  }

  dropIngredient(playerId: string) {
    const player = this.players.get(playerId)
    if (!player) return

    player.holdedIngredient = Ingredient.None
  }
}
