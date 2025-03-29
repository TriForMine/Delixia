import { ArraySchema, Schema, type } from '@colyseus/schema'
import { Ingredient, InteractType } from '../types/enums.ts'

export class InteractableObjectState extends Schema {
  @type('number')
  id: number = 0

  @type('number')
  type: InteractType = InteractType.Fridge

  @type('boolean')
  isActive: boolean = false

  @type('number')
  activeSince: number = 0

  @type('number')
  ingredient: number = Ingredient.None

  @type({ array: "number" })
  ingredientsOnBoard: ArraySchema<number> = new ArraySchema<number>()
}
