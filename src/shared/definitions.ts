import { Ingredient, InteractType } from './types/enums.ts';

// --- Item Definition ---
export interface ItemDefinition {
    id: Ingredient;       // Matches the enum value
    name: string;         // Display name (e.g., "Nori", "Rice", "Onigiri")
    icon: string;         // Base name for icon lookup (e.g., "nori" -> /ingredients/nori.png)
    model: string;        // GLB file name (e.g., "Nori.glb")
    isPlate?: boolean;    // Special flag for plates
    isResult?: boolean;   // Flag indicating if it's a result item in a recipe
    isFinal?: boolean;    // Flag indicating if it's the final item in a recipe, which can be served
}

// --- Item Registry ---
export const ITEM_REGISTRY: Record<Ingredient, ItemDefinition> = {
    [Ingredient.None]: { id: Ingredient.None, name: "None", icon: "", model: "" },
    [Ingredient.Nori]: { id: Ingredient.Nori, name: "Nori", icon: "nori", model: "Nori.glb" },
    [Ingredient.Rice]: { id: Ingredient.Rice, name: "Rice", icon: "rice", model: "Rice Ball.glb" },
    [Ingredient.CookedRice]: { id: Ingredient.CookedRice, name: "Cooked Rice", icon: "rice", model: "Rice Ball.glb", isResult: true },
    [Ingredient.Onigiri]: { id: Ingredient.Onigiri, name: "Onigiri", icon: "onigiri", model: "Onigiri.glb", isResult: true, isFinal: true },
    [Ingredient.Plate]: { id: Ingredient.Plate, name: "Plate", icon: "plate", model: "Plate.glb", isPlate: true },
};

// Helper function to get item definition by ID
export function getItemDefinition(id: Ingredient): ItemDefinition | undefined {
    return ITEM_REGISTRY[id];
}

// Helper function to find a recipe that produces a specific ingredient
function findRecipeByResult(ingredientId: Ingredient): Recipe | undefined {
    if (ingredientId === Ingredient.None) return undefined;
    for (const recipeId in RECIPE_REGISTRY) {
        const recipe = RECIPE_REGISTRY[recipeId];
        if (recipe.result.ingredient === ingredientId) {
            return recipe;
        }
    }
    return undefined;
}

export function countIngredientsMap(ingredients: Ingredient[]): Map<Ingredient, number> {
    const counts = new Map<Ingredient, number>();
    ingredients.forEach(ing => {
        // Skip 'None' just in case, though it shouldn't be in the list
        if (ing !== Ingredient.None) {
            counts.set(ing, (counts.get(ing) || 0) + 1);
        }
    });
    return counts;
}

export function countRecipeRequirements(requirements: RecipeInput[]): Map<Ingredient, number> {
    const counts = new Map<Ingredient, number>();
    requirements.forEach(req => {
        counts.set(req.ingredient, (counts.get(req.ingredient) || 0) + req.quantity);
    });
    return counts;
}

export interface RecipeStepInfo {
    type: 'GET' | 'PROCESS';      // Type of step
    ingredient: Ingredient;      // Ingredient being obtained (GET) or *produced* (PROCESS)
    stationType: InteractType;    // Station involved (Source for GET, Processing station for PROCESS)
    requiredIngredients?: Ingredient[]; // Ingredients needed *at the station* for a PROCESS step
    isFinalStep?: boolean;       // Is this the final item for the order?
}

// --- REVISED Recursive Helper ---
function buildStepsRecursive(
    ingredientToMake: Ingredient,
    stepsArray: RecipeStepInfo[],
    processedIngredients: Set<Ingredient>,
    isFinalTarget: boolean = false
): void {

    if (processedIngredients.has(ingredientToMake) || ingredientToMake === Ingredient.None) {
        return;
    }

    const producingRecipe = findRecipeByResult(ingredientToMake);

    if (!producingRecipe) {
        // --- BASE INGREDIENT ---
        const itemDef = getItemDefinition(ingredientToMake);
        if (!itemDef) return;

        // Find a Stock station providing this, otherwise assume Fridge/Generic Stock
        let sourceStation = InteractType.Fridge; // Default source
        // Example: Check map config if needed later for specific source stations
        // For now, Fridge/Stock is fine.

        stepsArray.push({
            type: 'GET',
            ingredient: ingredientToMake,
            stationType: sourceStation, // Indicate source
            requiredIngredients: [], // GET steps don't require inputs *at the station*
        });
        processedIngredients.add(ingredientToMake);

    } else {
        // --- PROCESSED INGREDIENT ---
        // Ensure all required ingredients are processed first
        producingRecipe.requiredIngredients.forEach(req => {
            buildStepsRecursive(req.ingredient, stepsArray, processedIngredients);
        });

        // Add the processing step itself
        stepsArray.push({
            type: 'PROCESS',
            ingredient: ingredientToMake, // The result
            stationType: producingRecipe.stationType,
            // Explicitly list ingredients needed *at this station* for this recipe
            requiredIngredients: producingRecipe.requiredIngredients.map(req => req.ingredient),
            isFinalStep: isFinalTarget
        });
        processedIngredients.add(ingredientToMake);
    }
}

// --- REVISED getRecipeSteps (Main Function) ---
/**
 * Generates a logical sequence of steps (get, process) needed to create a target recipe item.
 * @param targetRecipeId The ID of the final recipe for the order.
 * @returns An array of RecipeStepInfo representing the cooking flow.
 */
export function getRecipeSteps(targetRecipeId: string): RecipeStepInfo[] {
    const finalRecipe = getRecipeDefinition(targetRecipeId);
    if (!finalRecipe) return [];

    const steps: RecipeStepInfo[] = [];
    const processed = new Set<Ingredient>();

    buildStepsRecursive(finalRecipe.result.ingredient, steps, processed, true);

    // --- Optional: Optimization/Merging Pass ---
    // Example: If Get Rice -> Process Rice happens consecutively, maybe merge visually?
    // For now, the raw step list is clear enough. Let the UI handle presentation.

    return steps;
}

// --- Recipe Definition ---
export interface RecipeInput {
    ingredient: Ingredient;
    quantity: number;
}

export interface Recipe {
    id: string;                   // Unique identifier (e.g., "onigiri_recipe")
    name: string;                 // Display name (e.g., "Onigiri") - Can be derived from result usually
    result: RecipeInput;          // The final item produced
    requiredIngredients: RecipeInput[]; // Ingredients needed at the station
    stationType: InteractType;    // Where the combination happens (e.g., ChoppingBoard)
    processingTime?: number;      // Optional: Time in ms for stations like Oven
    scoreValue?: number;          // Optional: Score value for the recipe
    forServing?: boolean;         // Optional: Flag for serving orders
}

// --- Recipe Registry ---
export const RECIPE_REGISTRY: Record<string, Recipe> = {
    "onigiri_recipe": {
        id: "onigiri_recipe",
        name: "Onigiri",
        result: { ingredient: Ingredient.Onigiri, quantity: 1 },
        requiredIngredients: [
            { ingredient: Ingredient.CookedRice, quantity: 1 },
            { ingredient: Ingredient.Nori, quantity: 1 },
        ],
        stationType: InteractType.ChoppingBoard,
        scoreValue: 100,
        forServing: true,
    },
    "cooked_rice_recipe": {
        id: "cooked_rice_recipe",
        name: "Cooked Rice",
        result: { ingredient: Ingredient.CookedRice, quantity: 1 },
        requiredIngredients: [
            { ingredient: Ingredient.Rice, quantity: 1 },
        ],
        stationType: InteractType.Oven,
        processingTime: 5000,
    }
};

// Helper function to get recipe definition by ID
export function getRecipeDefinition(id: string): Recipe | undefined {
    return RECIPE_REGISTRY[id];
}

// Helper to find a recipe based on ingredients at a station
export function findCompletedRecipe(
    stationIngredients: Ingredient[],
    stationType: InteractType
): Recipe | null {
    for (const recipeId in RECIPE_REGISTRY) {
        const recipe = RECIPE_REGISTRY[recipeId];
        if (recipe.stationType !== stationType) {
            continue; // Skip recipes not made at this station type
        }

        // Check if the station has the exact required ingredients (count and type)
        const requiredMap = new Map<Ingredient, number>();
        recipe.requiredIngredients.forEach(req => {
            requiredMap.set(req.ingredient, (requiredMap.get(req.ingredient) || 0) + req.quantity);
        });

        const stationMap = new Map<Ingredient, number>();
        stationIngredients.forEach(ing => {
            stationMap.set(ing, (stationMap.get(ing) || 0) + 1);
        });

        if (requiredMap.size !== stationMap.size) {
            continue; // Different number of ingredient types
        }

        let match = true;
        for (const [ingredient, count] of requiredMap.entries()) {
            if (stationMap.get(ingredient) !== count) {
                match = false;
                break;
            }
        }

        if (match) {
            return recipe; // Found a matching recipe
        }
    }
    return null; // No matching recipe found
}