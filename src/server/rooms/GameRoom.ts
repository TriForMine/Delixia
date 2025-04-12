import {mapConfigs} from '@shared/maps/japan.ts'
import {GameRoomState} from '@shared/schemas/GameRoomState.ts'
import {type Client, logger, Room} from 'colyseus'
import {ServerMapLoader} from '../utils/ServerMapLoader.ts'
import {Ingredient, InteractType} from '@shared/types/enums.ts'
import {Order} from '@shared/schemas/Order';
import {generateMapHash} from '@shared/utils/mapUtils.ts';
import {
  countIngredientsMap,
  countRecipeRequirements,
  findCompletedRecipe,
  getItemDefinition,
  getRecipeDefinition,
  RECIPE_REGISTRY
} from "@shared/definitions.ts";

const serverMapLoader = new ServerMapLoader(mapConfigs)

export class GameRoom extends Room<GameRoomState> {
  state = new GameRoomState()
  maxClients = 4

  onCreate(_options: any) {
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
      const player = this.state.players.get(client.sessionId);
      const obj = this.state.interactableObjects.get(String(objectId))

      if (!player || !obj) {
        logger.warn(`Interaction failed: Player ${client.sessionId} or Object ${objectId} not found.`);
        return;
      }

      logger.info(`Interact from ${client.sessionId} on object ${objectId} (Type: ${InteractType[obj.type]})`);

      const playerIngredient = player.holdedIngredient;
      const isHoldingPlate = player.holdingPlate;
      const playerIngredientDef = getItemDefinition(playerIngredient);

      switch (obj.type) {
        case InteractType.Stock:
          const stockIngredient = obj.ingredient;
          const stockItemDef = getItemDefinition(stockIngredient);

          if (!stockItemDef) {
            logger.error(`Stock object ${objectId} has invalid ingredient: ${stockIngredient}`);
            client.send('error', { message: 'Internal server error.' });
            return;
          }

          // Can't pick up if holding something incompatible
          if (playerIngredient !== Ingredient.None && !isHoldingPlate && !playerIngredientDef?.isFinal) {
            client.send('alreadyCarrying', { message: 'You are already carrying something!' });
            return;
          }
          if (isHoldingPlate && !stockItemDef.isPlate && !stockItemDef.isFinal) {
            client.send('alreadyCarrying', { message: 'Cannot pick that up while holding a plate!' });
            return;
          }
          if (playerIngredientDef?.isFinal && !stockItemDef.isPlate) {
            client.send('alreadyCarrying', { message: 'You are already carrying a completed dish!' });
            return;
          }

          if (stockItemDef.isPlate) {
            if(isHoldingPlate) {
              client.send('alreadyCarrying', { message: 'You are already holding a plate!' });
              return;
            }
            this.state.pickupPlate(client.sessionId);
            logger.info(`Player ${client.sessionId} picked up a plate`);
          } else {
            this.state.pickupIngredient(client.sessionId, stockIngredient);
            logger.info(`Player ${client.sessionId} picked up ${stockItemDef.name}`);
          }
          break;

        case InteractType.Trash:
          if (playerIngredient !== Ingredient.None) {
            this.state.dropIngredient(client.sessionId);
            logger.info(`Player ${client.sessionId} dropped ${playerIngredientDef?.name ?? 'item'} in the trash`);
          } else if (isHoldingPlate) {
            this.state.dropPlate(client.sessionId);
            logger.info(`Player ${client.sessionId} dropped a plate in the trash`);
          } else {
            client.send('noIngredient', { message: 'You are not carrying anything!' });
          }
          break;

        case InteractType.ServingOrder:
          const heldItemDef = getItemDefinition(playerIngredient);

          // Must be holding a plate AND a recipe result
          if (!isHoldingPlate || !heldItemDef || !heldItemDef.isFinal) {
            client.send('invalidServe', { message: 'You need to serve a completed dish on a plate!' });
            return;
          }

          // Find the recipe that produces this result
          let servedRecipeId: string | null = null;
          for (const recipeId in RECIPE_REGISTRY) {
            if (RECIPE_REGISTRY[recipeId].result.ingredient === playerIngredient) {
              servedRecipeId = recipeId;
              break;
            }
          }

          if (!servedRecipeId) {
            logger.error(`Cannot find recipe for result ingredient: ${playerIngredient}`);
            client.send('error', { message: 'Internal server error.' });
            return;
          }

          // Find an incomplete order for this specific recipe
          const matchingOrder = this.state.orders.find(order =>
              order.recipeId === servedRecipeId && !order.completed
          );

          if (matchingOrder) {
            matchingOrder.completed = true; // Mark as completed (will be removed in update loop)
            const recipeDef = getRecipeDefinition(servedRecipeId);
            const points = recipeDef?.scoreValue ?? 100; // Use recipe score or default
            this.state.score += points;

            logger.info(`Player ${client.sessionId} completed order ${matchingOrder.id} for ${recipeDef?.name}. Awarded ${points} points. Total score: ${this.state.score}`);

            this.state.dropIngredient(client.sessionId);
            this.state.dropPlate(client.sessionId);

            client.send('orderCompleted', { message: 'Order completed successfully!' });
          } else {
            client.send('noMatchingOrder', { message: 'There is no order for this item!' });
          }
          break;

        case InteractType.ChoppingBoard:
        case InteractType.Oven:
          // Player has an ingredient? Try placing it.
          if (playerIngredient !== Ingredient.None) {
            // Check if the station is currently processing something
            if (obj.isActive) {
              client.send('stationBusy', { message: 'Station is currently processing!' });
              console.warn(`Player ${client.sessionId} tried to place an ingredient on a busy station ${objectId}.`);
              return;
            }

            // Check if station already holds a final/completed item that shouldn't be mixed
            const currentIngredientsOnBoard = [...obj.ingredientsOnBoard.values()];
            const hasFinalItem = currentIngredientsOnBoard.some(ing => getItemDefinition(ing)?.isFinal);
            if (hasFinalItem) {
              client.send('boardNotEmpty', { message: 'Clear the completed item first!' });
              console.warn(`Player ${client.sessionId} tried to place an ingredient on station ${objectId} which already has a final item.`);
              return;
            }

            const ingredientToAdd = playerIngredient;
            const potentialIngredients = [...currentIngredientsOnBoard, ingredientToAdd];
            const potentialCounts = countIngredientsMap(potentialIngredients);

            let allowsProgress = false; // Flag to check if addition is valid for at least one recipe

            for (const recipeId in RECIPE_REGISTRY) {
              const recipe = RECIPE_REGISTRY[recipeId];
              // Only check recipes for the current station type
              if (recipe.stationType !== obj.type) continue;

              const recipeRequirementCounts = countRecipeRequirements(recipe.requiredIngredients);

              let isPotentialStepForThisRecipe = true;
              // Check if every ingredient in the potential set is valid for THIS recipe
              for (const [ingredient, count] of potentialCounts.entries()) {
                const requiredCount = recipeRequirementCounts.get(ingredient);
                // If the ingredient is not needed OR the count exceeds what's needed
                if (requiredCount === undefined || count > requiredCount) {
                  isPotentialStepForThisRecipe = false;
                  break; // This combination is invalid for this specific recipe
                }
              }

              // If the combination is valid *so far* for this recipe, it allows progress
              if (isPotentialStepForThisRecipe) {
                allowsProgress = true;
                break; // Found at least one recipe this addition could lead to
              }
            }

            // If adding the ingredient doesn't lead to any valid recipe progress...
            if (!allowsProgress) {
              client.send('invalidCombination', { message: 'Cannot add this ingredient here right now.' });
              logger.warn(`Player ${client.sessionId} tried to add ${playerIngredientDef?.name} to ${InteractType[obj.type]} ${objectId}, but it doesn't fit any recipe or exceeds limits.`);
              return; // Prevent adding the ingredient
            }

            // Add ingredient to the board/station
            obj.ingredientsOnBoard.push(playerIngredient);
            this.state.dropIngredient(client.sessionId); // Take from player
            obj.activeSince = Date.now(); // Update timestamp (optional visual feedback)
            logger.info(`Player ${client.sessionId} placed ${playerIngredientDef?.name} on ${InteractType[obj.type]} ${objectId}`);

            const completedRecipe = findCompletedRecipe([...obj.ingredientsOnBoard.values()], obj.type);
            if (completedRecipe) {
              logger.info(`Recipe ${completedRecipe.name} requirements met on station ${objectId}.`);
              // Clear input ingredients immediately
              obj.ingredientsOnBoard.clear();

              if (completedRecipe.processingTime && completedRecipe.processingTime > 0) {
                obj.isActive = true; // Mark as active
                obj.processingRecipeId = completedRecipe.id; // Store recipe ID
                obj.activeSince = Date.now(); // Store start time
                obj.processingEndTime = obj.activeSince + completedRecipe.processingTime; // Store end time
                logger.info(`Starting processing for ${completedRecipe.name} on station ${objectId} until ${obj.processingEndTime}.`);

                // Find the client-side object to potentially update visuals/sound immediately
                const clientInteractable = this.state.interactableObjects.get(String(objectId));
                if (clientInteractable) {
                  clientInteractable.isActive = true;
                  clientInteractable.processingRecipeId = completedRecipe.id;
                  clientInteractable.processingEndTime = obj.processingEndTime;
                }

              } else {
                // Instant recipe completion
                obj.ingredientsOnBoard.push(completedRecipe.result.ingredient);
                obj.activeSince = Date.now();
                // Find the client-side object to potentially update visuals/sound immediately
                const clientInteractable = this.state.interactableObjects.get(String(objectId));
                if (clientInteractable) {
                  clientInteractable.ingredientsOnBoard.clear(); // Clear visuals of inputs
                  clientInteractable.ingredientsOnBoard.push(completedRecipe.result.ingredient); // Show result
                }
                logger.info(`Instantly created ${completedRecipe.name} on station ${objectId}`);
              }
            }
          }
          // Player is empty-handed? Try picking up.
          else
          {
            // Check if the station is processing something
            if (obj.ingredientsOnBoard.length > 0) {
              const itemOnBoard = obj.ingredientsOnBoard[0]; // Usually pick up the first/result item
              const itemDefOnBoard = getItemDefinition(itemOnBoard);

              if (!itemDefOnBoard) {
                console.error(`Station ${objectId} contains invalid ingredient: ${itemOnBoard}`);
                client.send('error', { message: 'Internal server error.' });
                return;
              }

              // Check plate compatibility
              if (isHoldingPlate && !itemDefOnBoard.isFinal && !itemDefOnBoard.isPlate) {
                console.warn(`Player ${client.sessionId} tried to pick up ${itemDefOnBoard.name} while holding a plate.`);
                client.send('invalidPickup', { message: 'Cannot pick that up while holding a plate!' });
                return;
              }

              // Ensure player isn't holding something incompatible already
              if (playerIngredient !== Ingredient.None && !isHoldingPlate) {
                console.warn(`Player ${client.sessionId} tried to pick up while already holding ${playerIngredientDef?.name}.`);
                client.send('alreadyCarrying', { message: 'You are already carrying something!' });
                return;
              }

              if (playerIngredient !== Ingredient.None && isHoldingPlate && itemDefOnBoard.isPlate) {
                console.warn(`Player ${client.sessionId} tried to pick up plate while already holding a plate.`);
                client.send('alreadyCarrying', { message: 'You are already carrying a plate!' });
                return;
              }

              // Perform pickup
              if(itemDefOnBoard.isPlate) {
                this.state.pickupPlate(client.sessionId);
              } else {
                this.state.pickupIngredient(client.sessionId, itemOnBoard);
              }
              obj.ingredientsOnBoard.shift(); // Remove the item from the board state
              obj.activeSince = Date.now();
              logger.info(`Player ${client.sessionId} picked up ${itemDefOnBoard.name} from ${InteractType[obj.type]} ${objectId}`);

              // Update client-side state immediately for responsiveness
              const clientInteractable = this.state.interactableObjects.get(String(objectId));
              if(clientInteractable) {
                const indexToRemove = clientInteractable.ingredientsOnBoard.findIndex(ing => ing === itemOnBoard);
                if (indexToRemove > -1) {
                  clientInteractable.ingredientsOnBoard.splice(indexToRemove, 1);
                }
              }

            } else {
              console.warn(`Player ${client.sessionId} tried to pick up from an empty station ${objectId}.`);
              client.send('boardEmpty', { message: 'Nothing to pick up!' });
            }
          }
          break;
        default:
          logger.warn(`Interaction logic not implemented for type: ${InteractType[obj.type]}`);
          client.send('cannotInteract', { message: 'Cannot interact with this.' });
          break;
      }
    });

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

  // Order generation properties
  private orderTimer: number = 5000; // Start generating orders sooner
  private readonly MIN_ORDER_INTERVAL: number = 15 * 1000; // Minimum 15s between orders
  private readonly MAX_ORDER_INTERVAL: number = 30 * 1000; // Maximum 30s between orders
  private nextOrderInterval: number = this.MIN_ORDER_INTERVAL + Math.random() * (this.MAX_ORDER_INTERVAL - this.MIN_ORDER_INTERVAL);
  private readonly MAX_ACTIVE_ORDERS = 5; // Limit concurrent orders

  private timeLeftBatch: number = 0;

  async update(deltaTime: number) {
    const now = Date.now();

    // Batch time left updates
    this.timeLeftBatch += deltaTime;
    if (this.timeLeftBatch >= 250) {
      if (this.state.timeLeft > 0) {
        this.state.timeLeft = Math.max(0, this.state.timeLeft - this.timeLeftBatch);
      }
      this.timeLeftBatch = 0;

      // End game if time runs out
      if (this.state.timeLeft <= 0) {
        logger.info("Game time ended!");
        // Add logic to handle game end (e.g., lock room, broadcast final score)
        await this.lock(); // Prevent new players from joining
        this.broadcast("gameOver", { finalScore: this.state.score });
        await this.disconnect()
        return; // Stop further updates
      }
    }

    // --- Order Generation ---
    this.orderTimer += deltaTime;
    if (this.orderTimer >= this.nextOrderInterval && this.state.orders.length < this.MAX_ACTIVE_ORDERS) {
      const availableRecipeIds = Object.keys(RECIPE_REGISTRY).filter(
          key => RECIPE_REGISTRY[key].forServing
      );

      if (availableRecipeIds.length > 0) {
        const randomRecipeId = availableRecipeIds[Math.floor(Math.random() * availableRecipeIds.length)];
        const recipe = getRecipeDefinition(randomRecipeId);

        if (recipe) {
          const order = new Order();
          order.id = String(Date.now()) + Math.random().toString(36).substring(2, 7);
          order.recipeId = recipe.id;
          order.completed = false;
          order.createdAt = now;
          order.deadline = now + 60000; // 60-second deadline
          this.state.orders.push(order);
          logger.info(`Created order ${order.id} for recipe ${recipe.name}`);
        }
      }
      // Reset timer and set next random interval
      this.orderTimer = 0;
      this.nextOrderInterval = this.MIN_ORDER_INTERVAL + Math.random() * (this.MAX_ORDER_INTERVAL - this.MIN_ORDER_INTERVAL);
    }

    // --- Order Cleanup & Expiration ---
    const ordersToRemove: Order[] = [];
    this.state.orders.forEach((order) => {
      if (order.completed) {
        ordersToRemove.push(order);
        logger.info(`Order ${order.id} completed and queued for removal.`);
      } else if (now > order.deadline) {
        ordersToRemove.push(order);
        logger.warn(`Order ${order.id} has expired and queued for removal.`);
      }
    });

    if (ordersToRemove.length > 0) {
      ordersToRemove.forEach(order => {
        const index = this.state.orders.indexOf(order);
        if (index !== -1) {
          this.state.orders.splice(index, 1);
        }
      });
    }


    // --- Process Station Timers ---
    this.state.interactableObjects.forEach((obj) => {
      // Check only active ovens with a processing recipe
      if (obj.type === InteractType.Oven && obj.isActive && obj.processingRecipeId && obj.processingEndTime > 0) {
        if (now >= obj.processingEndTime) {
          const recipe = getRecipeDefinition(obj.processingRecipeId);
          if (recipe) {
            obj.ingredientsOnBoard.clear(); // Ensure input ingredients are gone
            obj.ingredientsOnBoard.push(recipe.result.ingredient); // Add the result
            logger.info(`Finished processing ${recipe.name} on station ${obj.id}. Result added.`);
          } else {
            logger.error(`Could not find recipe ${obj.processingRecipeId} after processing finished for object ${obj.id}`);
          }
          // Reset processing state
          obj.isActive = false;
          obj.processingRecipeId = null;
          obj.processingEndTime = 0;
          obj.activeSince = now; // Update timestamp
        }
      }
    });
  }
}
