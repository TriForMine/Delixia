import type { GameRoomState } from '@shared/schemas/GameRoomState'
import type { InteractableObjectState } from '@shared/schemas/InteractableObjectState'
import type { Ingredient, InteractType } from '@shared/types/enums'
import { findCompletedRecipe, getRecipeDefinition, RECIPE_REGISTRY } from '@shared/recipes'
import { countIngredientsMap, countRecipeRequirements } from '@shared/ingredientUtils'
import { logger } from 'colyseus'

export class RecipeService {
  public updateProcessingStations(deltaTime: number, state: GameRoomState): void {
    state.interactableObjects.forEach((obj) => {
      if (obj.isActive && obj.processingRecipeId && obj.processingTimeLeft > 0) {
        obj.processingTimeLeft = Math.max(0, obj.processingTimeLeft - deltaTime) // Use passed deltaTime
        if (obj.processingTimeLeft <= 0) {
          this.completeProcessing(obj, state)
        }
      }
    })
  }

  public checkAndCompleteRecipe(obj: InteractableObjectState, _state: GameRoomState): void {
    const completedRecipe = findCompletedRecipe([...obj.ingredientsOnBoard.values()], obj.type)
    if (completedRecipe) {
      logger.info(`Recipe ${completedRecipe.name} requirements met on station ${obj.id}.`)
      obj.ingredientsOnBoard.clear() // Clear input ingredients

      if (completedRecipe.processingTime && completedRecipe.processingTime > 0) {
        // Start timed processing
        obj.isActive = true
        obj.processingRecipeId = completedRecipe.id
        obj.processingTimeLeft = completedRecipe.processingTime
        obj.activeSince = Date.now()
        obj.totalProcessingDuration = completedRecipe.processingTime
        logger.info(`Starting processing for ${completedRecipe.name} on station ${obj.id} for ${completedRecipe.processingTime}ms.`)
      } else {
        // Instant recipe completion
        obj.ingredientsOnBoard.push(completedRecipe.result.ingredient)
        obj.activeSince = Date.now()
        logger.info(`Instantly created ${completedRecipe.name} on station ${obj.id}`)
      }
    }
  }

  private completeProcessing(obj: InteractableObjectState, _state: GameRoomState): void {
    const recipe = getRecipeDefinition(obj.processingRecipeId!)
    if (recipe) {
      obj.ingredientsOnBoard.clear() // Ensure input ingredients are gone if any somehow remained
      obj.ingredientsOnBoard.push(recipe.result.ingredient)
      logger.info(`Finished processing ${recipe.name} on station ${obj.id}. Result added.`)
    } else {
      logger.error(`Could not find recipe ${obj.processingRecipeId} after processing finished for object ${obj.id}`)
      obj.ingredientsOnBoard.clear() // Clear the board anyway
    }
    // Reset processing state
    obj.isActive = false
    obj.processingRecipeId = null
    obj.processingTimeLeft = 0
    obj.totalProcessingDuration = 0
    obj.activeSince = Date.now()
  }

  /**
   * Checks if a potential set of ingredients represents valid progress towards *any* recipe
   * at the given station type. It prevents adding ingredients that don't fit or exceed limits.
   */
  public checkRecipeProgress(potentialIngredients: Ingredient[], stationType: InteractType): boolean {
    const potentialCounts = countIngredientsMap(potentialIngredients)
    let allowsProgress = false

    for (const recipeId in RECIPE_REGISTRY) {
      const recipe = RECIPE_REGISTRY[recipeId]
      if (recipe.stationType !== stationType) continue // Only check recipes for this station

      const recipeRequirementCounts = countRecipeRequirements(recipe.requiredIngredients)
      let isPotentialStepForThisRecipe = true

      for (const [ingredient, count] of potentialCounts.entries()) {
        const requiredCount = recipeRequirementCounts.get(ingredient)
        // If the ingredient isn't needed at all, or the count exceeds the requirement
        if (requiredCount === undefined || count > requiredCount) {
          isPotentialStepForThisRecipe = false
          break // This combination is invalid for this specific recipe
        }
      }

      if (isPotentialStepForThisRecipe) {
        allowsProgress = true // Found at least one recipe this combination could lead to
        break
      }
    }
    return allowsProgress
  }
}
