import { Ingredient, InteractType } from "./types/enums";

export interface RecipeStep {
    // A text description of what to do at this step.
    instruction: string;
    // If this step requires an ingredient, specify which and how many.
    ingredients?: Array<{ ingredient: Ingredient; quantity: number }>;
    // Which machine or interaction is needed for this step.
    machine?: InteractType;
}

export interface Recipe {
    id: string;      // Unique identifier (e.g., "noriRoll")
    name: string;    // Display name (e.g., "Nori Roll")
    steps: RecipeStep[];
}

export const RECIPES: Recipe[] = [
    {
        id: "onigiri",
        name: "Onigiri",
        steps: [
            {
                instruction: "Take rice from the stock and place it on a chopping board.",
                ingredients: [{ ingredient: Ingredient.Rice, quantity: 1 }],
                machine: InteractType.ChoppingBoard,
            },
            {
                instruction: "Take nori from the stock and place it on the same chopping board (order doesn't matter).",
                ingredients: [{ ingredient: Ingredient.Nori, quantity: 1 }],
                machine: InteractType.ChoppingBoard,
            },
            {
                instruction: "Once both rice and nori are on the chopping board, they will automatically combine into an Onigiri.",
            },
        ],
    },
];
