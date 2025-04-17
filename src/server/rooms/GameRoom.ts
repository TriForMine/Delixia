import { mapConfigs } from '@shared/maps/japan.ts'
import { GameRoomState } from '@shared/schemas/GameRoomState.ts'
import { type Client, logger, Room } from 'colyseus'
import { ServerMapLoader } from '../utils/ServerMapLoader.ts'
import { InteractType } from '@shared/types/enums.ts'
import { generateMapHash } from '@shared/utils/mapUtils.ts'
import { InteractionService } from '../services/InteractionService.ts'
import { RecipeService } from '../services/RecipeService.ts'
import { OrderService } from '../services/OrderService.ts'
import { GameTimerService } from '../services/GameTimerService.ts'

const serverMapLoader = new ServerMapLoader(mapConfigs)

export class GameRoom extends Room<GameRoomState> {
  state = new GameRoomState()
  maxClients = 4

  // Services for managing game logic
  private recipeService!: RecipeService
  private orderService!: OrderService
  private interactionService!: InteractionService
  private gameTimerService!: GameTimerService

  // State specific to this room instance
  private availableChairIds: number[] = []

  onCreate(_options: any) {
    this.recipeService = new RecipeService()
    this.orderService = new OrderService()
    this.interactionService = new InteractionService(this.recipeService, this.orderService) // Inject dependencies
    this.gameTimerService = new GameTimerService()

    const mapHash = generateMapHash(mapConfigs)
    this.state.mapHash = mapHash
    logger.info(`Map hash set: ${mapHash}`)

    this.initializeInteractables()

    this.registerMessageHandlers()

    this.setSimulationInterval((deltaTime) => this.update(deltaTime))

    logger.info(`GameRoom ${this.roomId} created.`)
  }

  private initializeInteractables(): void {
    this.availableChairIds = []
    serverMapLoader.loadInteractables().forEach((interaction) => {
      if (!interaction.id) {
        logger.error('Interaction ID is missing during initialization:', interaction)
        return
      }
      this.state.createInteractableObject(interaction.id, interaction.interactType, interaction.ingredient)

      if (interaction.interactType === InteractType.ServingOrder) {
        this.availableChairIds.push(interaction.id)
        const chairState = this.state.interactableObjects.get(String(interaction.id))
        if (chairState) {
          chairState.disabled = true
        }
        logger.debug(`Chair ${interaction.id} added to available list (disabled).`)
      }
    })
    logger.info(`Initialized ${this.state.interactableObjects.size} interactable objects. ${this.availableChairIds.length} chairs available.`)
  }

  private registerMessageHandlers(): void {
    this.onMessage('message', (client, message) => {
      this.broadcast('messages', `(${client.sessionId}) ${message}`)
    })

    this.onMessage('move', (client, data) => {
      this.state.updatePlayer(client.sessionId, data)
    })

    this.onMessage('interact', (client, data: { objectId: number }) => {
      this.interactionService.handleInteraction(client, data.objectId, this.state)
    })
  }

  onJoin(client: Client) {
    this.state.createPlayer(client.sessionId)
    this.state.setIsConnected(client.sessionId, true)
    logger.info(`${client.sessionId} joined room ${this.roomId}.`)
    client.send('messages', `Welcome to Delixia! Room ID: ${this.roomId}`)
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId)
    if (!player) return

    player.connected = false

    try {
      if (consented) {
        throw new Error('Consented leave')
      }

      logger.info(`${client.sessionId} lost connection. Allowing 20s for reconnection...`)
      await this.allowReconnection(client, 20)

      // If reconnected within the timeout
      player.connected = true // Mark as connected again
      logger.info(`Reconnected: ${client.sessionId}`)
    } catch (_e) {
      logger.info(`${client.sessionId} left permanently.`)
      this.state.removePlayer(client.sessionId)
    }
  }

  onDispose() {
    logger.info(`Dispose GameRoom ${this.roomId}`)
  }

  // Simulation loop - called by setSimulationInterval
  update(deltaTime: number): void {
    try {
      this.gameTimerService.update(deltaTime, this.state, this)
      this.orderService.update(deltaTime, this.state, this.availableChairIds)
      this.recipeService.updateProcessingStations(deltaTime, this.state)
    } catch (error) {
      logger.error(`Error during GameRoom update loop: ${error}`)
    }
  }
}
