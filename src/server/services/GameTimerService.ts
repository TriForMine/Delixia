import type { GameRoomState } from '@shared/schemas/GameRoomState'
import { GamePhase } from '@shared/types/enums'
import type { Room } from 'colyseus' // Import base Room type
import { logger } from 'colyseus'

export class GameTimerService {
  private timeSyncBatch: number = 0
  private readonly TIME_SYNC_INTERVAL = 250 // Sync time every 250ms
  private gameEnded: boolean = false

  public update(deltaTime: number, state: GameRoomState, room: Room<GameRoomState>): void {
    if (this.gameEnded || state.timeLeft <= 0) {
      return // Stop updating if game has ended
    }

    this.timeSyncBatch += deltaTime

    if (this.timeSyncBatch >= this.TIME_SYNC_INTERVAL) {
      state.timeLeft = Math.max(0, state.timeLeft - this.timeSyncBatch)
      this.timeSyncBatch = 0 // Reset batch

      if (state.timeLeft <= 0) {
        this.endGame(state, room)
      }
    }
  }

  private async endGame(state: GameRoomState, room: Room<GameRoomState>): Promise<void> {
    if (this.gameEnded) return // Prevent multiple calls

    state.gamePhase = GamePhase.FINISHED
    this.gameEnded = true
    logger.info(`Game time ended! Final Score: ${state.score}`)

    // Lock the room, broadcast score, and disconnect
    await room.lock()
    room.broadcast('gameOver', { finalScore: state.score })

    // Optional: Delay disconnect slightly to ensure message delivery
    setTimeout(async () => {
      logger.info(`Disconnecting room ${room.roomId} after game over.`)
      await room.disconnect()
    }, 1000) // 1 second delay
  }

  public reset(): void {
    this.gameEnded = false
    this.timeSyncBatch = 0
  }
}
