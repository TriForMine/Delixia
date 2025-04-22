import type { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody'

/**
 * Represents a physics contact point between the character and another object.
 * Used for collision detection and response in character controllers.
 */
export interface Contact {
  /** The world position of the contact point */
  position: Vector3

  /** The surface normal at the contact point */
  normal: Vector3

  /** The distance between the objects at the contact point */
  distance: number

  /** The fraction along the ray where the contact occurred (for raycasts) */
  fraction: number

  /** The physics body that was contacted */
  bodyB: { body: PhysicsBody; index: number }

  /** The allowed penetration depth for this contact */
  allowedPenetration: number
}
