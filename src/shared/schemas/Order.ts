import { Schema, type } from '@colyseus/schema'

export class Order extends Schema {
  @type('string')
  id: string = '' // Unique order identifier

  // Reference to the recipe from the central recipes list (e.g., "noriRoll")
  @type('string')
  recipeId: string = ''

  // Reference to the character who placed the order
  @type('string')
  customerType: string = 'chick'

  // Flag indicating whether the order is completed.
  @type('boolean')
  completed: boolean = false

  // Timestamp for when the order was created.
  @type('number')
  createdAt: number = Date.now()

  // Timestamp (in milliseconds) by which the order must be completed.
  // For example, if you set this to Date.now() + 60000, the order has a 60-second deadline.
  @type('number')
  timeLeft: number = 0

  @type('number')
  totalDuration: number = 0

  @type('number')
  chairId: number = -1
}
