import { Ingredient } from './types/enums.ts'

// --- Visual Configuration Registry ---
// Store visual adjustments for ingredients when held or placed.
// Offsets are relative to a base position determined by context (hand attachment point, plate center, board anchor).
// Scale is now unified per ingredient.
export interface Vector3Config {
  x: number
  y: number
  z: number
}

export interface QuaternionConfig {
  x: number
  y: number
  z: number
  w: number
}

export interface IngredientVisualContextConfig {
  positionOffset?: Vector3Config
  rotationOffset?: QuaternionConfig
}

export interface HoldingConfig {
  scale?: Vector3Config
  hand?: IngredientVisualContextConfig
  onPlate?: IngredientVisualContextConfig
  onBoard?: IngredientVisualContextConfig
}

export const INGREDIENT_VISUAL_CONFIG: Partial<Record<Ingredient, HoldingConfig>> = {
  [Ingredient.Plate]: {
    scale: { x: 0.6, y: 0.6, z: 0.6 },
  },
  [Ingredient.Rice]: {
    scale: { x: 0.4, y: 0.4, z: 0.4 },
    onBoard: {
      positionOffset: {
        x: 0,
        y: -0.1,
        z: 0,
      },
    },
  },
  [Ingredient.CookedRice]: {
    scale: { x: 0.4, y: 0.4, z: 0.4 },
    onBoard: {
      positionOffset: {
        x: 0,
        y: -0.1,
        z: 0,
      },
    },
  },
  [Ingredient.Nori]: {
    scale: { x: 0.4, y: 0.4, z: 0.4 },
    onBoard: {
      positionOffset: {
        x: 0,
        y: -0.05,
        z: 0,
      },
    },
  },
  [Ingredient.Ebi]: {
    onBoard: {
      positionOffset: {
        x: 0,
        y: -0.05,
        z: 0,
      },
    },
  },
  [Ingredient.EbiNigiri]: {
    scale: { x: 0.6, y: 0.6, z: 0.6 },
  },
  [Ingredient.Salmon]: {
    onBoard: {
      positionOffset: {
        x: 0.23,
        y: -0.1,
        z: 0,
      },
    },
  },
  [Ingredient.SalmonNigiri]: {
    scale: { x: 0.6, y: 0.6, z: 0.6 },
  },
  [Ingredient.SeaUrchinRoll]: {
    scale: { x: 0.4, y: 0.4, z: 0.4 },
    onBoard: {
      positionOffset: {
        x: 0,
        y: -0.1,
        z: 0,
      },
    },
  },
  [Ingredient.Onigiri]: {
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    onBoard: {
      positionOffset: {
        x: 0,
        y: -0.1,
        z: 0,
      },
    },
  },
}
