import { ArraySchema, Schema, type } from '@colyseus/schema'
import { Ingredient, InteractType } from '../types/enums.ts'

export class InteractableObjectState extends Schema {
  @type('number')
  id: number = 0

  @type('number')
  type: InteractType = InteractType.Fridge

  // Indicates if the station is currently busy (e.g., oven cooking)
  @type('boolean')
  isActive: boolean = false

  // For Stock stations: the ingredient they provide
  @type('number')
  ingredient: Ingredient = Ingredient.None

  // For Crafting stations: ingredients placed on them
  @type({ array: 'number' })
  ingredientsOnBoard: ArraySchema<number> = new ArraySchema<number>()

  @type('boolean')
  hasDirtyPlate: boolean = false

  // If the station is temporarily unusable
  @type('boolean')
  disabled: boolean = false

  // ID of the recipe currently being processed (null if none)
  @type('string')
  processingRecipeId: string | null = null

  // Timestamp (server time) when the current processing will end (0 if not processing)
  @type('number')
  processingTimeLeft: number = 0

  @type('number')
  totalProcessingDuration: number = 0
}
