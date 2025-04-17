import type { GameRoomState } from '@shared/schemas/GameRoomState'
import { Order } from '@shared/schemas/Order'
import { RECIPE_REGISTRY, getRecipeDefinition } from '@shared/recipes'
import { logger, type Client } from 'colyseus'
import { getItemDefinition } from '@shared/items'
import type { Player } from '@shared/schemas/Player'

export class OrderService {
  private orderTimer: number = 5000 // Time until first order check
  private readonly MIN_ORDER_INTERVAL: number = 15 * 1000
  private readonly MAX_ORDER_INTERVAL: number = 30 * 1000
  private nextOrderInterval: number = this.calculateNextInterval()
  private readonly MAX_ACTIVE_ORDERS = 5
  private readonly ORDER_DEADLINE_MS = 60 * 1000 // 60 seconds

  private calculateNextInterval(): number {
    return this.MIN_ORDER_INTERVAL + Math.random() * (this.MAX_ORDER_INTERVAL - this.MIN_ORDER_INTERVAL)
  }

  public update(deltaTime: number, state: GameRoomState, availableChairIds: number[]): void {
    const now = Date.now()

    // --- Order Generation ---
    this.orderTimer += deltaTime
    if (
      this.orderTimer >= this.nextOrderInterval &&
      state.orders.filter((o) => !o.completed).length < this.MAX_ACTIVE_ORDERS && // Count only active orders
      availableChairIds.length > 0
    ) {
      this.tryGenerateOrder(now, state, availableChairIds)
      this.orderTimer = 0 // Reset timer
      this.nextOrderInterval = this.calculateNextInterval() // Calculate next interval
    } else if (this.orderTimer >= this.nextOrderInterval && availableChairIds.length === 0) {
      // Optional: Log skipping due to no chairs
      this.orderTimer = 0 // Reset timer anyway
      this.nextOrderInterval = this.calculateNextInterval()
    }

    // --- Order Cleanup & Expiration ---
    this.cleanupOrders(now, state, availableChairIds)
  }

  private tryGenerateOrder(now: number, state: GameRoomState, availableChairIds: number[]): void {
    const availableRecipeIds = Object.keys(RECIPE_REGISTRY).filter((key) => RECIPE_REGISTRY[key].forServing)
    if (availableRecipeIds.length === 0) return // No servable recipes defined

    const randomRecipeId = availableRecipeIds[Math.floor(Math.random() * availableRecipeIds.length)]
    const recipe = getRecipeDefinition(randomRecipeId)
    if (!recipe) return // Should not happen if ID came from registry

    // Assign a chair ID
    const randomIndex = Math.floor(Math.random() * availableChairIds.length)
    const assignedChairId = availableChairIds.splice(randomIndex, 1)[0] // Remove and get ID

    const order = new Order()
    order.id = `${now}-${Math.random().toString(36).substring(2, 7)}`
    order.recipeId = recipe.id
    order.customerType = Math.random() < 0.5 ? 'chick' : 'chicken'
    order.completed = false
    order.createdAt = now
    order.deadline = now + this.ORDER_DEADLINE_MS
    order.chairId = assignedChairId

    state.orders.push(order)
    logger.info(`Created order ${order.id} (${recipe.name}) at chair ${assignedChairId}. Deadline: ${new Date(order.deadline).toLocaleTimeString()}`)

    // Enable the assigned chair object
    const chairObjState = state.interactableObjects.get(String(assignedChairId))
    if (chairObjState) {
      chairObjState.disabled = false
    } else {
      logger.error(`Could not find state for chair ${assignedChairId} to enable it.`)
    }
  }

  private cleanupOrders(now: number, state: GameRoomState, availableChairIds: number[]): void {
    const ordersToRemoveIndices: number[] = []
    state.orders.forEach((order, index) => {
      // Check completion OR expiration
      if (order.completed || (order.deadline > 0 && now > order.deadline)) {
        ordersToRemoveIndices.push(index)
        if (!order.completed) {
          logger.warn(`Order ${order.id} (${order.recipeId}) expired.`)
          // Optional: Apply penalty for expired order
          // state.score -= 50;
        }
      }
    })

    // Remove orders in reverse index order to avoid issues with splicing
    for (let i = ordersToRemoveIndices.length - 1; i >= 0; i--) {
      const indexToRemove = ordersToRemoveIndices[i]
      const removedOrder = state.orders[indexToRemove]

      if (removedOrder) {
        // Make the chair available again and disable it
        if (removedOrder.chairId !== -1) {
          if (!availableChairIds.includes(removedOrder.chairId)) {
            availableChairIds.push(removedOrder.chairId)
          }
          const chairObjState = state.interactableObjects.get(String(removedOrder.chairId))
          if (chairObjState) {
            chairObjState.disabled = true // Disable interaction again
          } else {
            logger.error(`Could not find state for chair ${removedOrder.chairId} to disable after order removal.`)
          }
        }
        // Remove the order from the state array
        state.orders.splice(indexToRemove, 1)
        logger.info(`Removed order ${removedOrder.id} from state. Chair ${removedOrder.chairId} made available/disabled.`)
      }
    }
  }

  public handleServeAttempt(client: Client, player: Player, chairObjectId: number, state: GameRoomState): void {
    const playerIngredient = player.holdedIngredient
    const isHoldingPlate = player.holdingPlate
    const heldItemDef = getItemDefinition(playerIngredient)

    // Basic Check: Must hold plate and a final dish
    if (!isHoldingPlate || !heldItemDef || !heldItemDef.isFinal) {
      client.send('invalidServe', { message: 'You need to serve a completed dish on a plate!' })
      return
    }

    // Find the active order assigned specifically to THIS chair
    const matchingOrder = state.orders.find((order) => order.chairId === chairObjectId && !order.completed)

    if (!matchingOrder) {
      client.send('noOrderHere', { message: 'There is no active order at this seat!' })
      logger.warn(`Player ${client.sessionId} tried serving at chair ${chairObjectId}, but no matching active order found.`)
      return
    }

    // Check if the held dish matches the order's recipe
    const requiredRecipe = getRecipeDefinition(matchingOrder.recipeId)
    if (!requiredRecipe || requiredRecipe.result.ingredient !== playerIngredient) {
      client.send('wrongOrder', { message: 'This is not the dish ordered here!' })
      logger.warn(
        `Player ${client.sessionId} served ${heldItemDef.name} at chair ${chairObjectId}, but order ${matchingOrder.id} needs ${requiredRecipe?.name ?? 'unknown'}.`,
      )
      return
    }

    // All checks passed: Complete the order
    matchingOrder.completed = true // Mark for removal in the next update loop
    const points = requiredRecipe.scoreValue ?? 100 // Use recipe score or default
    state.score += points

    logger.info(
      `Player ${client.sessionId} completed order ${matchingOrder.id} (${requiredRecipe.name}) at chair ${chairObjectId}. +${points} points. Score: ${state.score}`,
    )

    // Clear player's hands (state methods handle visuals implicitly via listeners)
    state.dropIngredient(client.sessionId)
    state.dropPlate(client.sessionId)

    client.send('orderCompleted', { message: `Order completed! +${points} points` })
    // The cleanupOrders method in the update loop will handle removing the order and freeing the chair.
  }
}
