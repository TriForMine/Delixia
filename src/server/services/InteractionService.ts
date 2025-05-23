import type { Client } from 'colyseus'
import type { GameRoomState } from '@shared/schemas/GameRoomState'
import type { InteractableObjectState } from '@shared/schemas/InteractableObjectState'
import { Ingredient, InteractType } from '@shared/types/enums'
import { logger } from 'colyseus'
import type { RecipeService } from './RecipeService'
import { getItemDefinition } from '@shared/items'
import type { OrderService } from './OrderService'
import type { Player } from '@shared/schemas/Player.ts'
import { findRecipeByResult, type Recipe, RECIPE_REGISTRY } from '@shared/recipes'
import { countRecipeRequirements } from '@shared/ingredientUtils.ts'

export class InteractionService {
  constructor(
    private recipeService: RecipeService,
    private orderService: OrderService,
  ) {}

  public handleInteraction(client: Client, objectId: number, state: GameRoomState): void {
    const player = state.players.get(client.sessionId)
    const obj = state.interactableObjects.get(String(objectId))

    if (!player || !obj) {
      logger.warn(`Interaction failed: Player ${client.sessionId} or Object ${objectId} not found.`)
      return
    }

    if (obj.disabled) {
      logger.warn(`Player ${client.sessionId} tried to interact with disabled object ${objectId} (Type: ${InteractType[obj.type]})`)
      client.send('cannotInteract', { message: 'Cannot interact with this right now.' })
      return
    }

    logger.info(`Handling Interact from ${client.sessionId} on object ${objectId} (Type: ${InteractType[obj.type]})`)

    switch (obj.type) {
      case InteractType.Stock:
        this.handleStockInteraction(client, player, obj, state)
        break
      case InteractType.Trash:
        this.handleTrashInteraction(client, player, state)
        break
      case InteractType.ServingOrder:
        if (obj.hasDirtyPlate && player.holdedIngredient === Ingredient.None && !player.holdingPlate) {
          state.pickupPlate(client.sessionId)
          obj.hasDirtyPlate = false
          obj.disabled = true
          logger.info(`Player ${client.sessionId} picked up dirty plate from chair ${objectId}. Chair now clean and disabled.`)
          client.send('pickupPlace')
        } else if (obj.hasDirtyPlate) {
          client.send('alreadyCarrying', { message: 'Cannot interact while carrying something or plate is dirty.' })
        } else {
          // Original serving logic (only if not picking up dirty plate)
          this.orderService.handleServeAttempt(client, player, obj.id, state)
        }
        break
      case InteractType.ChoppingBoard:
      case InteractType.Oven:
        this.handleProcessingStationInteraction(client, player, obj, state)
        break
      case InteractType.ServingBoard:
        this.handleServingBoardInteraction(client, player, obj, state)
        break
      default:
        logger.warn(`Interaction logic not implemented for type: ${InteractType[obj.type]}`)
        client.send('cannotInteract', { message: 'Cannot interact with this.' })
        break
    }
  }

  private handleStockInteraction(client: Client, player: Player, obj: InteractableObjectState, state: GameRoomState): void {
    const stockIngredient = obj.ingredient
    const stockItemDef = getItemDefinition(stockIngredient)
    const playerIngredient = player.holdedIngredient
    const isHoldingPlate = player.holdingPlate
    const playerIngredientDef = getItemDefinition(playerIngredient)

    if (!stockItemDef) {
      logger.error(`Stock object ${obj.id} has invalid ingredient: ${stockIngredient}`)
      client.send('error', { message: 'Internal server error.' })
      return
    }

    // Validation checks
    if (playerIngredient !== Ingredient.None && !isHoldingPlate && !playerIngredientDef?.isFinal) {
      client.send('alreadyCarrying', { message: 'You are already carrying something!' })
      return
    }
    if (isHoldingPlate && !stockItemDef.isPlate && !stockItemDef.isFinal) {
      client.send('alreadyCarrying', { message: 'Cannot pick that up while holding a plate!' })
      return
    }
    if (playerIngredientDef?.isFinal && !stockItemDef.isPlate) {
      client.send('alreadyCarrying', { message: 'You are already carrying a completed dish!' })
      return
    }
    if (stockItemDef.isPlate && isHoldingPlate) {
      client.send('alreadyCarrying', { message: 'You are already holding a plate!' })
      return
    }

    // Perform pickup
    if (stockItemDef.isPlate) {
      state.pickupPlate(client.sessionId)
      logger.info(`Player ${client.sessionId} picked up a plate`)
    } else {
      state.pickupIngredient(client.sessionId, stockIngredient)
      logger.info(`Player ${client.sessionId} picked up ${stockItemDef.name}`)
    }
    // Optionally trigger visual feedback for the stock object
    obj.isActive = true
    obj.activeSince = Date.now()
    setTimeout(() => (obj.isActive = false), 200) // Short visual feedback
  }

  private handleTrashInteraction(client: Client, player: Player, state: GameRoomState): void {
    const playerIngredient = player.holdedIngredient
    const isHoldingPlate = player.holdingPlate
    const playerIngredientDef = getItemDefinition(playerIngredient)

    if (playerIngredient !== Ingredient.None) {
      state.dropIngredient(client.sessionId)
      logger.info(`Player ${client.sessionId} dropped ${playerIngredientDef?.name ?? 'item'} in the trash`)
    } else if (isHoldingPlate) {
      state.dropPlate(client.sessionId)
      logger.info(`Player ${client.sessionId} dropped a plate in the trash`)
    } else {
      client.send('noIngredient', { message: 'You are not carrying anything!' })
    }
  }

  private handleProcessingStationInteraction(client: Client, player: Player, obj: InteractableObjectState, state: GameRoomState): void {
    const playerIngredient = player.holdedIngredient
    const isHoldingPlate = player.holdingPlate

    if (playerIngredient !== Ingredient.None) {
      // --- Placing Ingredient ---
      if (isHoldingPlate) {
        client.send('invalidPlacement', { message: 'Cannot place plate here.' })
        return
      }
      this.placeIngredientOnStation(client, player, obj, state)
    } else {
      // --- Picking Up Ingredient ---
      this.pickupIngredientFromStation(client, player, obj, state)
    }
  }

  private findRecipeThatUpgrades(baseRecipe: Recipe, addedIngredient: Ingredient, stationType: InteractType): Recipe | null {
    const baseIngredientMap = countRecipeRequirements(baseRecipe.requiredIngredients)
    const targetIngredientMap = new Map(baseIngredientMap)
    targetIngredientMap.set(addedIngredient, (targetIngredientMap.get(addedIngredient) || 0) + 1)

    for (const recipeId in RECIPE_REGISTRY) {
      const potentialUpgradeRecipe = RECIPE_REGISTRY[recipeId]

      // Check basic conditions: station type, upgradesFrom link MUST match base recipe ID
      if (potentialUpgradeRecipe.stationType !== stationType || potentialUpgradeRecipe.upgradesFrom !== baseRecipe.id) {
        continue
      }

      const upgradeRequirementsMap = countRecipeRequirements(potentialUpgradeRecipe.requiredIngredients)

      // Check if the requirements match exactly: base ingredients + added ingredient
      if (upgradeRequirementsMap.size !== targetIngredientMap.size) {
        continue
      }
      let match = true
      for (const [ingredient, count] of targetIngredientMap.entries()) {
        if (upgradeRequirementsMap.get(ingredient) !== count) {
          match = false
          break
        }
      }

      if (match) {
        logger.debug(`Found upgrade recipe ${potentialUpgradeRecipe.id} for base ${baseRecipe.id} adding ${Ingredient[addedIngredient]}`)
        return potentialUpgradeRecipe
      }
    }
    logger.debug(`No upgrade recipe found for base ${baseRecipe.id} adding ${Ingredient[addedIngredient]}`)
    return null // No matching upgrade recipe found
  }

  private placeIngredientOnStation(client: Client, player: Player, obj: InteractableObjectState, state: GameRoomState): void {
    const playerIngredient = player.holdedIngredient
    const playerIngredientDef = getItemDefinition(playerIngredient)

    if (!playerIngredientDef || playerIngredient === Ingredient.None) {
      logger.warn(`Player ${client.sessionId} trying to place invalid/None ingredient.`)
      return
    }

    if (obj.isActive) {
      client.send('stationBusy', { message: 'Station is currently processing!' })
      return
    }

    const currentIngredientsOnBoard = [...obj.ingredientsOnBoard.values()]

    if (currentIngredientsOnBoard.length === 1) {
      const boardIngredient = currentIngredientsOnBoard[0]
      const boardItemDef = getItemDefinition(boardIngredient)

      // Check if the single item on board is a result item (and not a plate)
      if (boardItemDef && boardItemDef.isResult && !boardItemDef.isPlate) {
        const baseRecipe = findRecipeByResult(boardIngredient) // Find the recipe that MADE the item on board

        if (baseRecipe) {
          // Look for a recipe that upgrades this base recipe by adding the player's ingredient
          const upgradeRecipe = this.findRecipeThatUpgrades(baseRecipe, playerIngredient, obj.type)

          if (upgradeRecipe) {
            // --- UPGRADE PATH ---
            logger.info(
              `Player ${client.sessionId} is upgrading ${baseRecipe.name} with ${playerIngredientDef.name} to make ${upgradeRecipe.name} on ${InteractType[obj.type]} ${obj.id}`,
            )

            // 1. Consume the player's ingredient
            state.dropIngredient(client.sessionId)

            // 2. Clear the board of the OLD item
            obj.ingredientsOnBoard.clear()
            obj.activeSince = Date.now() // Update timestamp after clearing

            // 3. Process the UPGRADE recipe (add result or start timer)
            if (upgradeRecipe.processingTime && upgradeRecipe.processingTime > 0) {
              obj.isActive = true
              obj.processingRecipeId = upgradeRecipe.id
              obj.activeSince = Date.now()
              obj.processingEndTime = obj.activeSince + upgradeRecipe.processingTime
              logger.info(`Starting processing for UPGRADED ${upgradeRecipe.name} on station ${obj.id} for ${upgradeRecipe.processingTime}ms.`)
            } else {
              // Instant upgrade
              obj.ingredientsOnBoard.push(upgradeRecipe.result.ingredient)
              obj.activeSince = Date.now() // Update timestamp after adding result
              logger.info(`Instantly UPGRADED to ${upgradeRecipe.name} on station ${obj.id}`)
              // Optional: Play a specific "upgrade complete" sound?
              client.send('orderCompleted') // Reuse sound? Or add new one?
            }
            return // Interaction handled (Upgrade)
          } else {
            logger.debug(`No upgrade path found from ${baseRecipe.name} with ${playerIngredientDef.name} on ${InteractType[obj.type]} ${obj.id}`)
          }
        } else {
          logger.debug(`Item ${boardItemDef.name} on board is a result, but couldn't find the recipe that made it.`)
        }
      }
    }

    // --- FALLBACK: COMBINE BASE INGREDIENTS LOGIC (from previous answer) ---
    logger.debug(`No upgrade scenario detected for ${playerIngredientDef.name} on ${InteractType[obj.type]} ${obj.id}. Checking base combination.`)

    // Check if the board ALREADY contains a final item. Prevent adding more if so.
    const boardHasFinalItem = currentIngredientsOnBoard.some((ing) => getItemDefinition(ing)?.isFinal)
    if (boardHasFinalItem) {
      client.send('boardNotEmpty', { message: 'Clear the completed item first!' })
      return
    }

    const potentialIngredients = [...currentIngredientsOnBoard, playerIngredient]
    if (!this.recipeService.checkRecipeProgress(potentialIngredients, obj.type)) {
      client.send('invalidCombination', { message: 'Cannot add this ingredient here right now.' })
      logger.warn(`Player ${client.sessionId} tried invalid combination on ${InteractType[obj.type]} ${obj.id}`)
      return
    }

    // Add ingredient and drop from player
    obj.ingredientsOnBoard.push(playerIngredient)
    state.dropIngredient(client.sessionId)
    obj.activeSince = Date.now() // Update timestamp
    logger.info(`Player ${client.sessionId} placed ${playerIngredientDef.name} on ${InteractType[obj.type]} ${obj.id}`)

    // Check for recipe completion
    this.recipeService.checkAndCompleteRecipe(obj, state)
  }

  private pickupIngredientFromStation(client: Client, player: Player, obj: InteractableObjectState, state: GameRoomState): void {
    const isHoldingPlate = player.holdingPlate

    if (obj.isActive) {
      client.send('stationBusy', { message: 'Cannot pickup while processing!' })
      return
    }
    if (obj.ingredientsOnBoard.length > 0) {
      const itemOnBoard = obj.ingredientsOnBoard[obj.ingredientsOnBoard.length - 1] // Pick the last added (often the result)
      const itemDefOnBoard = getItemDefinition(itemOnBoard)

      if (!itemDefOnBoard) {
        logger.error(`Station ${obj.id} contains invalid ingredient: ${itemOnBoard}`)
        client.send('error', { message: 'Internal server error.' })
        return
      }

      // Check compatibility
      if (isHoldingPlate && !itemDefOnBoard.isFinal && !itemDefOnBoard.isPlate) {
        client.send('invalidPickup', { message: 'Cannot pick that up while holding a plate!' })
        return
      }
      if (player.holdedIngredient !== Ingredient.None) {
        // Player must be empty handed (unless picking plate)
        if (!isHoldingPlate || !itemDefOnBoard.isPlate) {
          // Allow picking plate if holding plate is target
          client.send('alreadyCarrying', { message: 'You are already carrying something!' })
          return
        }
        if (isHoldingPlate && itemDefOnBoard.isPlate) {
          client.send('alreadyCarrying', { message: 'You are already carrying a plate!' })
          return
        }
      }

      // Perform pickup
      if (itemDefOnBoard.isPlate) {
        state.pickupPlate(client.sessionId)
      } else {
        state.pickupIngredient(client.sessionId, itemOnBoard)
      }
      obj.ingredientsOnBoard.pop() // Remove the picked item
      obj.activeSince = Date.now()
      logger.info(`Player ${client.sessionId} picked up ${itemDefOnBoard.name} from ${InteractType[obj.type]} ${obj.id}`)
    } else {
      client.send('boardEmpty', { message: 'Nothing to pick up!' })
    }
  }

  private handleServingBoardInteraction(client: Client, player: Player, obj: InteractableObjectState, state: GameRoomState): void {
    const boardIngredients = obj.ingredientsOnBoard
    const boardHasPlate = boardIngredients.includes(Ingredient.Plate)
    const boardDishIngredient = boardIngredients.find((ing) => ing !== Ingredient.Plate && (getItemDefinition(ing)?.isFinal ?? false))

    const playerIngredient = player.holdedIngredient
    const isHoldingPlate = player.holdingPlate
    const heldItemDef = getItemDefinition(playerIngredient)
    const isHoldingFinalDish = heldItemDef?.isFinal ?? false

    // --- Placing items ---
    if (playerIngredient !== Ingredient.None || isHoldingPlate) {
      if (isHoldingPlate && isHoldingFinalDish && boardIngredients.length === 0) {
        // P1
        boardIngredients.push(Ingredient.Plate)
        boardIngredients.push(playerIngredient)
        state.dropPlate(client.sessionId)
        state.dropIngredient(client.sessionId)
        logger.info(`Player ${client.sessionId} placed Plate and ${heldItemDef?.name} onto ServingBoard ${obj.id}`)
      } else if (isHoldingPlate && playerIngredient === Ingredient.None && boardIngredients.length === 0) {
        // P2
        boardIngredients.push(Ingredient.Plate)
        state.dropPlate(client.sessionId)
        logger.info(`Player ${client.sessionId} placed Plate onto ServingBoard ${obj.id}`)
      } else if (!isHoldingPlate && isHoldingFinalDish && boardHasPlate && !boardDishIngredient) {
        // P3
        boardIngredients.push(playerIngredient)
        state.dropIngredient(client.sessionId)
        logger.info(`Player ${client.sessionId} placed ${heldItemDef?.name} onto Plate on ServingBoard ${obj.id}`)
      } else {
        // Invalid placements
        if (isHoldingPlate && boardHasPlate) client.send('invalidPlacement', { message: 'Cannot place a plate on another plate!' })
        else if (boardIngredients.length >= 2) client.send('boardFull', { message: 'This board is full!' })
        else if (isHoldingFinalDish && !boardHasPlate) client.send('needPlateOnBoard', { message: 'Place a plate down first!' })
        else if (playerIngredient !== Ingredient.None && !isHoldingFinalDish)
          client.send('cannotPlaceRaw', { message: 'Only finished dishes can be placed here.' })
        else client.send('cannotInteract', { message: 'Cannot do that action here.' })
        return // Stop processing if invalid
      }
      obj.activeSince = Date.now() // Update timestamp on successful placement
    }
    // --- Taking items ---
    else if (playerIngredient === Ingredient.None && !isHoldingPlate) {
      if (boardHasPlate && boardDishIngredient) {
        // T1
        state.pickupPlate(client.sessionId)
        state.pickupIngredient(client.sessionId, boardDishIngredient)
        boardIngredients.clear()
        logger.info(`Player ${client.sessionId} picked up Plate and Dish from ServingBoard ${obj.id}`)
      } else if (boardHasPlate && !boardDishIngredient) {
        // T2
        state.pickupPlate(client.sessionId)
        const plateIndex = boardIngredients.findIndex((ing) => ing === Ingredient.Plate)
        if (plateIndex > -1) boardIngredients.splice(plateIndex, 1)
        logger.info(`Player ${client.sessionId} picked up Plate from ServingBoard ${obj.id}`)
      } else {
        // T3 - Board empty
        client.send('boardEmpty', { message: 'Nothing to pick up!' })
        return // Stop processing if invalid
      }
      obj.activeSince = Date.now() // Update timestamp on successful pickup
    } else {
      // Player is holding something but trying to take? Invalid.
      client.send('alreadyCarrying', { message: 'Drop your item first!' })
    }
  }
}
