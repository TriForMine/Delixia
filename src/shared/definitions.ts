import { Ingredient, InteractType } from './types/enums.ts';

// --- Item Definition ---
export interface ItemDefinition {
    id: Ingredient;       // Matches the enum value
    name: string;         // Display name (e.g., "Nori", "Rice", "Onigiri")
    icon: string;         // Base name for icon lookup (e.g., "nori" -> /ingredients/nori.png)
    model: string;        // GLB file name (e.g., "Nori.glb")
    isPlate?: boolean;    // Special flag for plates
    isResult?: boolean;   // Flag indicating if it's a recipe result (useful for serving)
}

// --- Item Registry ---
export const ITEM_REGISTRY: Record<Ingredient, ItemDefinition> = {
    [Ingredient.None]: { id: Ingredient.None, name: "None", icon: "", model: "" },
    [Ingredient.Nori]: { id: Ingredient.Nori, name: "Nori", icon: "nori", model: "Nori.glb" },
    [Ingredient.Rice]: { id: Ingredient.Rice, name: "Rice", icon: "rice", model: "Rice Ball.glb" },
    [Ingredient.Onigiri]: { id: Ingredient.Onigiri, name: "Onigiri", icon: "onigiri", model: "Onigiri.glb", isResult: true },
    [Ingredient.Plate]: { id: Ingredient.Plate, name: "Plate", icon: "plate", model: "Plate.glb", isPlate: true },
};

// Helper function to get item definition by ID
export function getItemDefinition(id: Ingredient): ItemDefinition | undefined {
    return ITEM_REGISTRY[id];
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
}

// --- Recipe Registry ---
export const RECIPE_REGISTRY: Record<string, Recipe> = {
    "onigiri_recipe": {
        id: "onigiri_recipe",
        name: "Onigiri",
        result: { ingredient: Ingredient.Onigiri, quantity: 1 },
        requiredIngredients: [
            { ingredient: Ingredient.Rice, quantity: 1 },
            { ingredient: Ingredient.Nori, quantity: 1 },
        ],
        stationType: InteractType.ChoppingBoard,
        scoreValue: 100,
    },
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