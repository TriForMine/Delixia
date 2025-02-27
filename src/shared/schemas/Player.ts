import { Schema, type } from '@colyseus/schema'
import { Ingredient } from '@shared/types/enums.ts'

export class Player extends Schema {
  @type('boolean')
  connected = false

  @type('string')
  name: string = 'Unknown'

  @type('number')
  x = 0

  @type('number')
  y = 1

  @type('number')
  z = 5

  @type('number')
  rot = 0

  @type('string')
  animationState: string = 'Idle'

  @type('number')
  holdedIngredient: Ingredient = Ingredient.None
}
