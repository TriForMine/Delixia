import { Ingredient, InteractType } from './types/enums.ts'

// --- Recipe Definition ---
export interface RecipeInput {
  ingredient: Ingredient
  quantity: number
}

export interface Recipe {
  id: string // Unique identifier (e.g., "onigiri_recipe")
  name: string // Display name (e.g., "Onigiri") - Can be derived from result usually
  result: RecipeInput // The final item produced
  requiredIngredients: RecipeInput[] // Ingredients needed at the station
  stationType: InteractType // Where the combination happens (e.g., ChoppingBoard)
  processingTime?: number // Optional: Time in ms for stations like Oven
  scoreValue?: number // Optional: Score value for the recipe
  forServing?: boolean // Optional: Flag for serving orders
  upgradesFrom?: string // Optional: ID of the recipe this one upgrades from
}

// --- Recipe Registry ---
export const RECIPE_REGISTRY: Record<string, Recipe> = {
  onigiri_recipe: {
    id: 'onigiri_recipe',
    name: 'Onigiri',
    result: { ingredient: Ingredient.Onigiri, quantity: 1 },
    requiredIngredients: [
      { ingredient: Ingredient.CookedRice, quantity: 1 },
      { ingredient: Ingredient.Nori, quantity: 1 },
    ],
    stationType: InteractType.ChoppingBoard,
    scoreValue: 100,
    forServing: true,
  },
  cooked_rice_recipe: {
    id: 'cooked_rice_recipe',
    name: 'Cooked Rice',
    result: { ingredient: Ingredient.CookedRice, quantity: 1 },
    requiredIngredients: [{ ingredient: Ingredient.Rice, quantity: 1 }],
    stationType: InteractType.Oven,
    processingTime: 5000,
  },
  ebi_nigiri_recipe: {
    id: 'ebi_nigiri_recipe',
    name: 'Ebi Nigiri',
    result: { ingredient: Ingredient.EbiNigiri, quantity: 1 },
    requiredIngredients: [
      { ingredient: Ingredient.CookedRice, quantity: 1 },
      { ingredient: Ingredient.Ebi, quantity: 1 },
    ],
    stationType: InteractType.ChoppingBoard,
    scoreValue: 150,
    forServing: true,
    upgradesFrom: 'onigiri_recipe',
  },
  salmon_nigiri_recipe: {
    id: 'salmon_nigiri_recipe',
    name: 'Salmon Nigiri',
    result: { ingredient: Ingredient.SalmonNigiri, quantity: 2 },
    requiredIngredients: [
      { ingredient: Ingredient.CookedRice, quantity: 1 },
      { ingredient: Ingredient.Salmon, quantity: 1 },
      { ingredient: Ingredient.Nori, quantity: 1 },
    ],
    stationType: InteractType.ChoppingBoard,
    scoreValue: 150,
    forServing: true,
    upgradesFrom: 'onigiri_recipe',
  },
  sea_urchin_recipe: {
    id: 'sea_urchin_recipe',
    name: 'Sea Urchin',
    result: { ingredient: Ingredient.SeaUrchinOpen, quantity: 1 },
    requiredIngredients: [{ ingredient: Ingredient.SeaUrchin, quantity: 1 }],
    stationType: InteractType.ChoppingBoard,
    scoreValue: 100,
  },
  sea_urchin_roll_recipe: {
    id: 'sea_urchin_roll_recipe',
    name: 'Sea Urchin Roll',
    result: { ingredient: Ingredient.SeaUrchinRoll, quantity: 1 },
    requiredIngredients: [
      { ingredient: Ingredient.CookedRice, quantity: 1 },
      { ingredient: Ingredient.SeaUrchinOpen, quantity: 1 },
      { ingredient: Ingredient.Nori, quantity: 1 },
    ],
    stationType: InteractType.ChoppingBoard,
    scoreValue: 200,
    forServing: true,
    upgradesFrom: 'onigiri_recipe',
  },
}

// Helper function to get recipe definition by ID
export function getRecipeDefinition(id: string): Recipe | undefined {
  return RECIPE_REGISTRY[id]
}

// Helper function to find a recipe that produces a specific ingredient
export function findRecipeByResult(ingredientId: Ingredient): Recipe | undefined {
  if (ingredientId === Ingredient.None) return undefined
  for (const recipeId in RECIPE_REGISTRY) {
    const recipe = RECIPE_REGISTRY[recipeId]
    if (recipe.result.ingredient === ingredientId) {
      return recipe
    }
  }
  return undefined
}

// Helper to find a recipe based on ingredients at a station
export function findCompletedRecipe(stationIngredients: Ingredient[], stationType: InteractType): Recipe | null {
  for (const recipeId in RECIPE_REGISTRY) {
    const recipe = RECIPE_REGISTRY[recipeId]
    if (recipe.stationType !== stationType) {
      continue // Skip recipes not made at this station type
    }

    // Check if the station has the exact required ingredients (count and type)
    const requiredMap = new Map<Ingredient, number>()
    recipe.requiredIngredients.forEach((req) => {
      requiredMap.set(req.ingredient, (requiredMap.get(req.ingredient) || 0) + req.quantity)
    })

    const stationMap = new Map<Ingredient, number>()
    stationIngredients.forEach((ing) => {
      stationMap.set(ing, (stationMap.get(ing) || 0) + 1)
    })

    if (requiredMap.size !== stationMap.size) {
      continue // Different number of ingredient types
    }

    let match = true
    for (const [ingredient, count] of requiredMap.entries()) {
      if (stationMap.get(ingredient) !== count) {
        match = false
        break
      }
    }

    if (match) {
      return recipe // Found a matching recipe
    }
  }
  return null // No matching recipe found
}
