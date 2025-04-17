import { Ingredient } from './types/enums.ts'
import type { RecipeInput } from './recipes.ts'

export function countIngredientsMap(ingredients: Ingredient[]): Map<Ingredient, number> {
  const counts = new Map<Ingredient, number>()
  ingredients.forEach((ing) => {
    // Skip 'None' just in case, though it shouldn't be in the list
    if (ing !== Ingredient.None) {
      counts.set(ing, (counts.get(ing) || 0) + 1)
    }
  })
  return counts
}

export function countRecipeRequirements(requirements: RecipeInput[]): Map<Ingredient, number> {
  const counts = new Map<Ingredient, number>()
  requirements.forEach((req) => {
    counts.set(req.ingredient, (counts.get(req.ingredient) || 0) + req.quantity)
  })
  return counts
}
