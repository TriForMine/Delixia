/**
 * Defines the possible ground support states for a character.
 * Used to determine how the character should move and interact with the environment.
 */
export enum CharacterSupportedState {
  /** Character has no ground support and is in the air */
  UNSUPPORTED,
  
  /** Character is on a slope that is too steep to stand on but can slide down */
  SLIDING,
  
  /** Character is fully supported by the ground and can move normally */
  SUPPORTED,
}