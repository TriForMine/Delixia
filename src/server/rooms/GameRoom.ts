import { mapConfigs } from '@shared/maps/japan.ts'
import { GameRoomState } from '@shared/schemas/GameRoomState.ts'
import { type Client, logger, Room } from 'colyseus'
import { ServerMapLoader } from '../utils/ServerMapLoader.ts'
import { generateMapHash } from '@shared/utils/mapUtils.ts'
import { InteractionService } from '../services/InteractionService.ts'
import { RecipeService } from '../services/RecipeService.ts'
import { OrderService } from '../services/OrderService.ts'
import { GameTimerService } from '../services/GameTimerService.ts'
import { InteractType, GamePhase } from '@shared/types/enums.ts'

const serverMapLoader = new ServerMapLoader(mapConfigs)

export class GameRoom extends Room<GameRoomState> {
  state = new GameRoomState()
  maxClients = 4
  minClientsToStart = 1

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

    logger.info(`GameRoom ${this.roomId} created in WAITING phase.`)

    this.onMessage('startGame', (client) => {
      if (client.sessionId !== this.state.hostId) {
        client.send('error', { message: 'Only the host can start the game.' })
        return
      }

      if (this.state.gamePhase === GamePhase.WAITING) {
        this.tryStartGame()
      }
    })
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

  onJoin(client: Client, options?: any) {
    if (this.state.gamePhase !== GamePhase.WAITING) {
      throw new Error('Game has already started.') // Reject connection
    }

    // --- Assign host ID if not already set or current host id is not connected to the server anymore ---
    if (!this.state.hostId || !this.clients.find((c) => c.sessionId === this.state.hostId)) {
      this.state.hostId = client.sessionId
      logger.info(`Host ID assigned: ${client.sessionId}`)
    }

    const clientPseudo = options?.clientPseudo

    this.state.createPlayer(client.sessionId, clientPseudo)
    this.state.setIsConnected(client.sessionId, true)
    logger.info(`${this.state.players.get(client.sessionId)?.name} (${client.sessionId}) joined room ${this.roomId} (Waiting).`)
    client.send('messages', `Welcome! Waiting for players... Room ID: ${this.roomId}`)
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId)
    if (!player) return

    player.connected = false

    // update host ID if the host leaves
    if (this.state.hostId === client.sessionId) {
      const newHost = Array.from(this.clients).find((c) => c.sessionId !== client.sessionId)
      if (newHost) {
        this.state.hostId = newHost.sessionId
        logger.info(`New host assigned: ${newHost.sessionId}`)
      } else {
        this.state.hostId = ''
      }
    }

    if (this.state.gamePhase === GamePhase.WAITING) {
      logger.info(`Player ${client.sessionId} left during WAITING phase.`)
      this.state.removePlayer(client.sessionId) // Remove immediately from waiting lobby

      return
    }

    // --- Game already started, handle reconnection attempt ---
    try {
      if (consented) {
        throw new Error('Consented leave')
      }

      logger.info(`${client.sessionId} lost connection during PLAYING phase. Allowing 20s for reconnection...`)
      await this.allowReconnection(client, 20)

      player.connected = true
      logger.info(`Reconnected: ${client.sessionId}`)
    } catch (_e) {
      logger.info(`${client.sessionId} left permanently during PLAYING phase.`)
      if (this.state.players.has(client.sessionId)) {
        this.state.removePlayer(client.sessionId)
      }
    }
  }

  onDispose() {
    logger.info(`Dispose GameRoom ${this.roomId}`)
  }

  tryStartGame() {
    if (this.clients.length < this.minClientsToStart) {
      this.broadcast('lobbyMessage', `Need at least ${this.minClientsToStart} players to start.`)
      logger.warn(`Attempted to start game with ${this.clients.length} players, required ${this.minClientsToStart}.`)
      return
    }

    if (this.state.gamePhase === GamePhase.WAITING) {
      logger.info(`Starting game in room ${this.roomId}...`)
      this.state.gamePhase = GamePhase.PLAYING

      // --- LOCK the room ---
      this.lock().catch((err) => logger.error(`Failed to lock room ${this.roomId}:`, err))

      // --- Start actual game timers/logic now ---
      this.gameTimerService.reset()

      this.broadcast('gameStarted') // Notify clients
    }
  }

  // Simulation loop - called by setSimulationInterval
  update(deltaTime: number): void {
    // Only run game logic if the game is actually playing
    if (this.state.gamePhase === GamePhase.PLAYING) {
      try {
        // Pass deltaTime in milliseconds
        this.gameTimerService.update(deltaTime, this.state, this)
        this.orderService.update(deltaTime, this.state, this.availableChairIds)
        this.recipeService.updateProcessingStations(deltaTime, this.state)
      } catch (error) {
        logger.error(`Error during GameRoom update loop: ${error}`)
      }
    }
  }
}
