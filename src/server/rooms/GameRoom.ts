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

const DEFAULT_MAX_CLIENTS = 4
const DEFAULT_ROOM_NAME_PREFIX = 'Kitchen'

export class GameRoom extends Room<GameRoomState> {
  state = new GameRoomState()

  minClientsToStart = 1

  private recipeService!: RecipeService
  private orderService!: OrderService
  private interactionService!: InteractionService
  private gameTimerService!: GameTimerService

  private availableChairIds: number[] = []

  onCreate(options: any) {
    logger.info(`Creating GameRoom with options: ${JSON.stringify(options)}`)
    this.recipeService = new RecipeService()
    this.orderService = new OrderService()
    this.interactionService = new InteractionService(this.recipeService, this.orderService)
    this.gameTimerService = new GameTimerService()

    this.maxClients = options?.maxClients || DEFAULT_MAX_CLIENTS
    const customRoomName = options?.roomName || `${DEFAULT_ROOM_NAME_PREFIX} #${this.roomId.substring(0, 4)}`
    const isPrivate = options?.isPrivate || false
    const password = options?.password

    const metadata: any = {
      roomName: customRoomName,
      isPrivate: isPrivate,
    }
    if (isPrivate && password) {
      metadata.password = password

      logger.info(`Room ${this.roomId} created as PRIVATE with name: "${customRoomName}"`)
    } else {
      logger.info(`Room ${this.roomId} created as PUBLIC with name: "${customRoomName}"`)
    }
    this.setMetadata(metadata).catch((e) => logger.error('Failed to set metadata:', e))

    const mapHash = generateMapHash(mapConfigs)
    this.state.mapHash = mapHash
    logger.info(`Map hash set: ${mapHash}`)

    this.initializeInteractables()
    this.registerMessageHandlers()

    this.setSimulationInterval((deltaTime) => this.update(deltaTime))

    logger.info(`GameRoom ${this.roomId} fully created. Max Clients: ${this.maxClients}.`)
  }

  onAuth(client: Client, options: any): Promise<boolean> {
    logger.info(`Authenticating client ${client.sessionId} for room ${this.roomId}...`)

    const roomPassword = this.metadata?.password

    if (roomPassword) {
      const clientPassword = options?.password
      if (clientPassword === roomPassword) {
        logger.info(`Client ${client.sessionId} authenticated successfully (password match).`)
        return Promise.resolve(true)
      } else {
        logger.warn(`Client ${client.sessionId} authentication failed (invalid password).`)

        return Promise.resolve(false)
      }
    }

    logger.info(`Client ${client.sessionId} authenticated successfully (no password required).`)
    return Promise.resolve(true)
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

  onJoin(client: Client, options?: any) {
    if (!this.state.hostId || !this.clients.find((c) => c.sessionId === this.state.hostId)) {
      this.state.hostId = client.sessionId
      logger.info(`Host ID assigned: ${client.sessionId}`)
    }

    const clientPseudo = options?.clientPseudo

    this.state.createPlayer(client.sessionId, clientPseudo)
    this.state.setIsConnected(client.sessionId, true)
    logger.info(
      `${this.state.players.get(client.sessionId)?.name} (${client.sessionId}) joined room ${this.roomId} "${this.metadata?.roomName || 'Unnamed'}" (Waiting).`,
    )
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId)
    if (!player) return

    player.connected = false

    const remainingClients = this.clients.filter((c) => c.sessionId !== client.sessionId)
    if (this.state.hostId === client.sessionId) {
      if (remainingClients.length > 0) {
        this.state.hostId = remainingClients[0].sessionId
        logger.info(`Host left. New host assigned: ${this.state.hostId}`)
      } else {
        this.state.hostId = ''
        logger.info(`Host left. Room is now empty.`)
      }
    }

    if (this.state.gamePhase === GamePhase.WAITING || remainingClients.length === 0) {
      logger.info(`Player ${player.name} (${client.sessionId}) left during WAITING phase or room became empty.`)
      this.state.removePlayer(client.sessionId)

      if (remainingClients.length === 0) {
        logger.info(`Room ${this.roomId} is empty, preparing to dispose.`)
      }
      return
    }

    try {
      if (consented) {
        throw new Error('Consented leave')
      }

      logger.info(`${player.name} (${client.sessionId}) lost connection during PLAYING phase. Allowing 20s for reconnection...`)
      await this.allowReconnection(client, 20)

      player.connected = true
      logger.info(`Reconnected: ${player.name} (${client.sessionId})`)
    } catch (_e) {
      logger.info(`${player.name} (${client.sessionId}) left permanently during PLAYING phase.`)
      if (this.state.players.has(client.sessionId)) {
        this.state.removePlayer(client.sessionId)
      }
      if (this.state.gamePhase === GamePhase.PLAYING && remainingClients.length < this.minClientsToStart) {
        logger.warn(
          `Room ${this.roomId} has fallen below minimum players (${remainingClients.length}/${this.minClientsToStart}). Game might end or continue.`,
        )
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

      this.lock().catch((err) => logger.error(`Failed to lock room ${this.roomId}:`, err))

      this.gameTimerService.reset()

      this.broadcast('gameStarted')
    }
  }

  update(deltaTime: number): void {
    if (this.state.gamePhase === GamePhase.PLAYING) {
      try {
        this.gameTimerService.update(deltaTime, this.state, this)
        this.orderService.update(deltaTime, this.state, this.availableChairIds)
        this.recipeService.updateProcessingStations(deltaTime, this.state)
      } catch (error) {
        logger.error(`Error during GameRoom update loop: ${error}`)
      }
    }
  }
}
