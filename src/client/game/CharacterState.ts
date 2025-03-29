/**
 * Defines the possible states of a character in the game.
 * Used by both local and remote character controllers to manage animations and behavior.
 */
export enum CharacterState {
  /** Character is standing still */
  IDLE = 'IDLE',
  
  /** Character is moving */
  WALKING = 'WALKING',
  
  /** Character is in the jumping phase */
  JUMPING = 'JUMPING',
  
  /** Character is landing after a jump or fall */
  LANDING = 'LANDING',
  
  /** Character is falling */
  FALLING = 'FALLING',
  
  /** Character is performing a dance animation */
  DANCING = 'DANCING',
}