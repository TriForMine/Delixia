import { Ingredient } from './types/enums.ts'

// --- Item Definition ---
export interface ItemDefinition {
  id: Ingredient // Matches the enum value
  name: string // Display name (e.g., "Nori", "Rice", "Onigiri")
  icon: string // Base name for icon lookup (e.g., "nori" -> /ingredients/nori.png)
  model: string // GLB file name (e.g., "Nori.glb")
  isPlate?: boolean // Special flag for plates
  isResult?: boolean // Flag indicating if it's a result item in a recipe
  isFinal?: boolean // Flag indicating if it's the final item in a recipe, which can be served
}

// --- Item Registry ---
export const ITEM_REGISTRY: Record<Ingredient, ItemDefinition> = {
  [Ingredient.None]: { id: Ingredient.None, name: 'None', icon: '', model: '' },
  [Ingredient.Nori]: { id: Ingredient.Nori, name: 'Nori', icon: 'nori', model: 'Nori.glb' },
  [Ingredient.Rice]: { id: Ingredient.Rice, name: 'Rice', icon: 'rice', model: 'Rice Ball.glb' },
  [Ingredient.CookedRice]: { id: Ingredient.CookedRice, name: 'Cooked Rice', icon: 'rice', model: 'Rice Ball.glb', isResult: true },
  [Ingredient.Onigiri]: { id: Ingredient.Onigiri, name: 'Onigiri', icon: 'onigiri', model: 'Onigiri.glb', isResult: true, isFinal: true },
  [Ingredient.Plate]: { id: Ingredient.Plate, name: 'Plate', icon: 'plate', model: 'Plate.glb', isPlate: true },
  [Ingredient.Ebi]: { id: Ingredient.Ebi, name: 'Ebi', icon: 'ebi', model: 'Ebi.glb' },
  [Ingredient.Salmon]: { id: Ingredient.Salmon, name: 'Salmon', icon: 'salmon', model: 'Salmon.glb' },
  [Ingredient.SalmonNigiri]: {
    id: Ingredient.SalmonNigiri,
    name: 'Salmon Nigiri',
    icon: 'salmon_nigiri',
    model: 'Salmon Nigiri.glb',
    isResult: true,
    isFinal: true,
  },
  [Ingredient.EbiNigiri]: {
    id: Ingredient.EbiNigiri,
    name: 'Ebi Nigiri',
    icon: 'ebi_nigiri',
    model: 'Ebi Nigiri.glb',
    isResult: true,
    isFinal: true,
  },
  [Ingredient.SeaUrchin]: { id: Ingredient.SeaUrchin, name: 'Sea Urchin', icon: 'sea_urchin', model: 'Sea Urchin.glb' },
  [Ingredient.SeaUrchinOpen]: {
    id: Ingredient.SeaUrchinOpen,
    name: 'Sea Urchin Open',
    icon: 'sea_urchin_open',
    model: 'Sea Urchin Open.glb',
    isResult: true,
  },
  [Ingredient.SeaUrchinRoll]: {
    id: Ingredient.SeaUrchinRoll,
    name: 'Sea Urchin Roll',
    icon: 'sea_urchin_roll',
    model: 'Sea Urchin Roll.glb',
    isResult: true,
    isFinal: true,
  },
}

// Helper function to get item definition by ID
export function getItemDefinition(id: Ingredient): ItemDefinition | undefined {
  return ITEM_REGISTRY[id]
}
