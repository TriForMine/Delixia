import {mapConfigs} from '@shared/maps/japan.ts'
import {GameRoomState} from '@shared/schemas/GameRoomState.ts'
import {type Client, logger, Room} from 'colyseus'
import {ServerMapLoader} from '../utils/ServerMapLoader.ts'
import {Ingredient, InteractType} from '@shared/types/enums.ts'
import {RECIPES} from '@shared/recipes';
import {Order} from '@shared/schemas/Order';
import {generateMapHash} from '@shared/utils/mapUtils.ts';

const serverMapLoader = new ServerMapLoader(mapConfigs)

export class GameRoom extends Room<GameRoomState> {
  state = new GameRoomState()
  maxClients = 4

  onCreate(_options: any) {
    // Generate and set the map hash
    const mapHash = generateMapHash(mapConfigs);
    this.state.mapHash = mapHash;
    logger.info(`Map hash set: ${mapHash}`);

    serverMapLoader.loadInteractables().forEach((interaction) => {
      if (!interaction.id) {
        logger.error('Interaction ID is missing:', interaction)
        return
      }
      this.state.createInteractableObject(interaction.id, interaction.interactType, interaction.ingredient)
    })

    this.onMessage('message', (client, message) => {
      this.broadcast('messages', `(${client.sessionId}) ${message}`)
    })

    this.onMessage('move', (client, data) => {
      this.state.updatePlayer(client.sessionId, data)
    })

    this.onMessage('interact', (client, data: { objectId: number }) => {
      const objectId = data.objectId
      logger.info('Interact from', client.sessionId, 'on object', objectId)

      const obj = this.state.interactableObjects.get(String(objectId))
      if (obj) {
        switch (obj.type) {
          case InteractType.Oven:
            const newActive = !obj.isActive
            this.state.updateInteractableObject(objectId, { isActive: newActive })
            break
          case InteractType.Stock:
            const isCarryingStock = this.state.getIngredient(client.sessionId) !== Ingredient.None

            if (isCarryingStock) {
              client.send('alreadyCarrying', { message: 'Tu portes déjà un ingrédient !' })
              return
            }

            const ingredient = obj?.ingredient

            // Handle plates differently
            if (ingredient === Ingredient.Plate) {
              this.state.pickupPlate(client.sessionId)
              logger.info(`Player ${client.sessionId} picked up a plate`)
            } else {
              // For other ingredients, check if player can pick them up (based on plate status)
              this.state.pickupIngredient(client.sessionId, ingredient as Ingredient)
              logger.info(`Player ${client.sessionId} picked up ${Ingredient[ingredient as Ingredient]}`)
            }
            break
          case InteractType.Trash: {
            const playerIngredient = this.state.getIngredient(client.sessionId)
            const isHoldingPlate = this.state.isHoldingPlate(client.sessionId)

            if (playerIngredient !== undefined && playerIngredient !== Ingredient.None) {
              this.state.dropIngredient(client.sessionId)
              logger.info(`Player ${client.sessionId} dropped ${Ingredient[playerIngredient]} in the trash`)
            } else if (isHoldingPlate) {
              this.state.dropPlate(client.sessionId)
              logger.info(`Player ${client.sessionId} dropped a plate in the trash`)
            } else {
              client.send('noIngredient', {message: 'You are not carrying any ingredient or plate!'})
            }
            break
          }
          case InteractType.ServingOrder:
            const servingPlayerIngredient = this.state.getIngredient(client.sessionId)
            const servingIsHoldingPlate = this.state.isHoldingPlate(client.sessionId)

            // Check if player is holding a plate with an onigiri
            if (servingIsHoldingPlate && servingPlayerIngredient === Ingredient.Onigiri) {
              // Find an incomplete order for onigiri
              const onigiriOrder = this.state.orders.find(order => 
                order.recipeId === "onigiri" && !order.completed
              );

              if (onigiriOrder) {
                // Mark the order as completed
                onigiriOrder.completed = true;
                logger.info(`Player ${client.sessionId} completed order ${onigiriOrder.id} for onigiri`);

                // Remove the ingredient from the player but keep the plate
                this.state.dropIngredient(client.sessionId);

                // Send success message to client
                client.send('orderCompleted', { message: 'Order completed successfully!' });
              } else {
                // No matching order found
                client.send('noMatchingOrder', { message: 'There is no order for this item!' });
              }
            } else if (!servingIsHoldingPlate) {
              // Player is not holding a plate
              client.send('needPlate', { message: 'You need to serve the food on a plate!' });
            } else {
              // Player is holding a plate but not with the right ingredient
              client.send('wrongIngredient', { message: 'This is not what was ordered!' });
            }
            break;

          case InteractType.ChoppingBoard:
            const playerIngredient = this.state.getIngredient(client.sessionId)
            const isHoldingPlate = this.state.isHoldingPlate(client.sessionId)

            // If player is carrying an ingredient, place it on the board
            if (playerIngredient !== undefined && playerIngredient !== Ingredient.None) {
              // Check if adding this ingredient would correspond to a valid recipe
              const currentIngredients = [...obj.ingredientsOnBoard.values()] as Ingredient[];
              const potentialIngredients = [...currentIngredients, playerIngredient];

              // Check if this combination is valid for any recipe
              let isValidAddition = false;

              // First check: Is this a valid ingredient for any recipe?
              for (const recipe of RECIPES) {
                // Get all ingredients required for this recipe
                const recipeIngredients = recipe.steps
                  .filter(step => step.ingredients && step.machine === InteractType.ChoppingBoard)
                  .flatMap(step => step.ingredients?.map(i => i.ingredient) || []);

                // Check if the player's ingredient is used in any recipe
                if (recipeIngredients.includes(playerIngredient)) {
                  isValidAddition = true;
                  break;
                }
              }

              // Second check: Would adding this ingredient create a valid partial recipe?
              if (isValidAddition && currentIngredients.length > 0) {
                isValidAddition = false; // Reset and check if this specific combination is valid

                for (const recipe of RECIPES) {
                  // Get all ingredients required for this recipe
                  const recipeIngredients = recipe.steps
                    .filter(step => step.ingredients && step.machine === InteractType.ChoppingBoard)
                    .flatMap(step => step.ingredients?.map(i => i.ingredient) || []);

                  // Check if all potential ingredients are part of this recipe
                  const allIngredientsValid = potentialIngredients.every(ing => recipeIngredients.includes(ing));

                  // Check if we're not adding duplicates that aren't in the recipe
                  const ingredientCounts = potentialIngredients.reduce((counts, ing) => {
                    counts[ing] = (counts[ing] || 0) + 1;
                    return counts;
                  }, {} as Record<number, number>);

                  // Count how many of each ingredient are needed in the recipe
                  const recipeIngredientCounts = recipeIngredients.reduce((counts, ing) => {
                    counts[ing] = (counts[ing] || 0) + 1;
                    return counts;
                  }, {} as Record<number, number>);

                  // Check if we're not exceeding the required quantity for any ingredient
                  const validQuantities = Object.entries(ingredientCounts).every(
                    ([ing, count]) => count <= (recipeIngredientCounts[Number(ing)] || 0)
                  );

                  if (allIngredientsValid && validQuantities) {
                    isValidAddition = true;
                    break;
                  }
                }
              }

              if (isValidAddition) {
                // Add the ingredient to the board
                obj.ingredientsOnBoard.push(playerIngredient)
                obj.activeSince = Date.now()
                logger.info(`Player ${client.sessionId} placed ${Ingredient[playerIngredient]} on chopping board ${objectId}`)

                // Remove the ingredient from the player
                this.state.dropIngredient(client.sessionId)

                // Check if we've completed a recipe
                const currentBoardIngredients = [...obj.ingredientsOnBoard.values()] as Ingredient[];

                // Check each recipe to see if we've completed it
                for (const recipe of RECIPES) {
                  // Get all ingredients required for this recipe
                  const recipeIngredients = recipe.steps
                    .filter(step => step.ingredients && step.machine === InteractType.ChoppingBoard)
                    .flatMap(step => step.ingredients?.map(i => i.ingredient) || []);

                  // Sort both arrays to compare them regardless of order
                  const sortedBoardIngredients = [...currentBoardIngredients].sort();
                  const sortedRecipeIngredients = [...recipeIngredients].sort();

                  // Check if the board has exactly the ingredients needed for this recipe
                  if (sortedBoardIngredients.length === sortedRecipeIngredients.length && 
                      sortedBoardIngredients.every((ing, idx) => ing === sortedRecipeIngredients[idx])) {

                    // We've completed a recipe! Clear the board and add the result
                    obj.ingredientsOnBoard.clear();

                    // For now, we only have onigiri, but this could be expanded
                    if (recipe.id === "onigiri") {
                      obj.ingredientsOnBoard.push(Ingredient.Onigiri);
                      obj.activeSince = Date.now();
                      logger.info(`Player ${client.sessionId} created ${recipe.name}, placed on board ${objectId}`);
                    }

                    break;
                  }
                }
              } else {
                client.send('invalidIngredient', { message: 'This ingredient cannot be placed on the board!' })
              }
            } else {
              // If there are ingredients on the board, pick them up
              if (obj.ingredientsOnBoard.length > 0) {
                // Get the first ingredient on the board (should be the only one if it's an onigiri)
                const ingredient = obj.ingredientsOnBoard[0] as Ingredient;

                // If it's an onigiri, player can pick it up regardless of plate status
                // If it's not an onigiri and player is holding a plate, they can't pick it up
                if (ingredient !== Ingredient.Onigiri && isHoldingPlate) {
                  client.send('invalidIngredient', { message: 'You can only pick up onigiri with a plate!' })
                  return
                }

                // Give the ingredient to the player
                this.state.pickupIngredient(client.sessionId, ingredient);
                logger.info(`Player ${client.sessionId} picked up ${Ingredient[ingredient]} from chopping board ${objectId}`);

                // Clear the board
                obj.ingredientsOnBoard.clear();
                obj.activeSince = Date.now()
              } else {
                client.send('noIngredient', { message: 'You are not carrying any ingredient and the board is empty!' })
              }
            }
            break
          default:
            break
        }
      }
    })

    // Instead of using setInterval, use the update loop.
    this.setSimulationInterval((deltaTime) => this.update(deltaTime))
  }

  onJoin(client: Client) {
    this.broadcast('messages', `${client.sessionId} joined.`)
    this.state.createPlayer(client.sessionId)
    this.state.setIsConnected(client.sessionId, true)

    client.send('messages', 'Welcome to the room: ' + client.sessionId)
  }

  async onLeave(client: Client, consented: boolean) {
    this.state.setIsConnected(client.sessionId, false)

    try {
      if (consented) {
        throw new Error('consented leave')
      }

      logger.info(`${client.sessionId} lost connection to the room. Attempting reconnection for 20 seconds...`)

      // allow disconnected client to reconnect into this room until 20 seconds
      await this.allowReconnection(client, 20)

      logger.info(`Reconnected: ${client.sessionId}`)

      // client returned! let's re-activate it.
      this.state.setIsConnected(client.sessionId, true)
    } catch (e) {
      logger.info(`${client.sessionId} left the room.`, e)

      // 20 seconds expired. let's remove the client.
      this.state.removePlayer(client.sessionId)
    }
  }

  onDispose() {
    logger.info('Dispose ChatRoom')
  }

  // TODO: Remove this, it's just for testing.
  // Timer accumulator for order creation (in milliseconds)
  private orderTimer: number = 20000;
  // Order creation interval (e.g., every 20 seconds)
  private ORDER_INTERVAL: number = 20 * 1000;

  update(deltaTime: number) {
    // deltaTime is provided in milliseconds.
    // Accumulate the deltaTime into orderTimer.
    this.orderTimer += deltaTime;

    // When the accumulated time exceeds our ORDER_INTERVAL, create a new order.
    if (this.orderTimer >= this.ORDER_INTERVAL) {

      const recipe = RECIPES.find(r => r.id === "onigiri");
      if (recipe) {
        const order = new Order();
        order.id = String(Date.now());
        order.recipeId = recipe.id;
        order.completed = false;
        order.createdAt = Date.now();
        // Optionally, set a deadline (e.g., 60 seconds from now)
        order.deadline = Date.now() + 60000;
        this.state.orders.push(order);
        logger.info(`Created order ${order.id} for recipe ${order.recipeId}`);
      }
      // Subtract the interval from the timer (in case deltaTime overshoots)
      this.orderTimer -= this.ORDER_INTERVAL;
    }

    // Check for deadlines and remove completed orders
    const now = Date.now();
    this.state.orders.forEach((order) => {
      if (order.completed) {
        // Remove the order if it's completed
        this.state.orders.splice(this.state.orders.indexOf(order), 1);
        logger.info(`Order ${order.id} completed and removed.`);
      } else if (now > order.deadline) {
        // Handle expired orders (e.g., notify players)
        logger.warn(`Order ${order.id} has expired.`);
        this.state.orders.splice(this.state.orders.indexOf(order), 1);
      }
    });
  }
}
