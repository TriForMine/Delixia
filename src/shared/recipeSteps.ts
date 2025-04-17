import { Ingredient, InteractType } from './types/enums.ts'
import { findRecipeByResult, getRecipeDefinition } from './recipes.ts'
import { getItemDefinition } from './items.ts'

export interface RecipeStepInfo {
  type: 'GET' | 'PROCESS' // Type of step
  ingredient: Ingredient // Ingredient being obtained (GET) or *produced* (PROCESS)
  stationType: InteractType // Station involved (Source for GET, Processing station for PROCESS)
  requiredIngredients?: Ingredient[] // Ingredients needed *at the station* for a PROCESS step
  isFinalStep?: boolean // Is this the final item for the order?
}

// --- REVISED Recursive Helper ---
function buildStepsRecursive(
  ingredientToMake: Ingredient,
  stepsArray: RecipeStepInfo[],
  processedIngredients: Set<Ingredient>,
  isFinalTarget: boolean = false,
): void {
  if (processedIngredients.has(ingredientToMake) || ingredientToMake === Ingredient.None) {
    return
  }

  const producingRecipe = findRecipeByResult(ingredientToMake)

  if (!producingRecipe) {
    // --- BASE INGREDIENT ---
    const itemDef = getItemDefinition(ingredientToMake)
    if (!itemDef) return

    // Find a Stock station providing this, otherwise assume Fridge/Generic Stock
    let sourceStation = InteractType.Fridge // Default source
    // Example: Check map config if needed later for specific source stations
    // For now, Fridge/Stock is fine.

    stepsArray.push({
      type: 'GET',
      ingredient: ingredientToMake,
      stationType: sourceStation, // Indicate source
      requiredIngredients: [], // GET steps don't require inputs *at the station*
    })
    processedIngredients.add(ingredientToMake)
  } else {
    // --- PROCESSED INGREDIENT ---
    // Ensure all required ingredients are processed first
    producingRecipe.requiredIngredients.forEach((req) => {
      buildStepsRecursive(req.ingredient, stepsArray, processedIngredients)
    })

    // Add the processing step itself
    stepsArray.push({
      type: 'PROCESS',
      ingredient: ingredientToMake, // The result
      stationType: producingRecipe.stationType,
      // Explicitly list ingredients needed *at this station* for this recipe
      requiredIngredients: producingRecipe.requiredIngredients.map((req) => req.ingredient),
      isFinalStep: isFinalTarget,
    })
    processedIngredients.add(ingredientToMake)
  }
}

/**
 * Generates a logical sequence of steps (get, process) needed to create a target recipe item.
 * @param targetRecipeId The ID of the final recipe for the order.
 * @returns An array of RecipeStepInfo representing the cooking flow.
 */
export function getRecipeSteps(targetRecipeId: string): RecipeStepInfo[] {
  const finalRecipe = getRecipeDefinition(targetRecipeId)
  if (!finalRecipe) return []

  const steps: RecipeStepInfo[] = []
  const processed = new Set<Ingredient>()

  buildStepsRecursive(finalRecipe.result.ingredient, steps, processed, true)

  return steps
}
