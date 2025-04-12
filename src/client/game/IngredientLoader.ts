import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager'
import type { Scene } from '@babylonjs/core/scene'
import { Ingredient } from '@shared/types/enums.ts'
import {ITEM_REGISTRY} from "@shared/definitions.ts";

export class IngredientLoader {
  private assetsManager: AssetsManager;
  private ingredientMeshes: Map<Ingredient, Mesh> = new Map();

  constructor(scene: Scene) {
    this.assetsManager = new AssetsManager(scene)
    this.assetsManager.useDefaultLoadingScreen = false
    this.assetsManager.autoHideLoadingUI = false
  }

  // Charger les modèles d’ingrédients
  public async loadIngredientModels(): Promise<void> {
    let tasksAdded = 0;
    for (const key in ITEM_REGISTRY) {
      const ingredientEnum = Number(key) as Ingredient;
      if (isNaN(ingredientEnum) || ingredientEnum === Ingredient.None) continue; // Skip "None" and invalid keys

      const itemDef = ITEM_REGISTRY[ingredientEnum];

      if (itemDef && itemDef.model) { // Only load if a model is defined
        const task = this.assetsManager.addMeshTask(
            `load-${itemDef.name}-model`,
            '',
            'assets/map/japan/', // Assuming all models are here for now
            itemDef.model
        );
        tasksAdded++;

        task.onSuccess = (task) => {
          const mesh = task.loadedMeshes[0] as Mesh;
          mesh.name = `template_${itemDef.name}`; // Give a template name
          mesh.isVisible = false; // Hide template mesh
          mesh.setEnabled(false); // Disable template mesh
          mesh.isPickable = false;

          // Also hide/disable children
          mesh.getChildMeshes().forEach((child) => {
            if (child instanceof Mesh) {
              child.isPickable = false;
              child.isVisible = false;
              child.setEnabled(false);
            }
          });
          this.ingredientMeshes.set(itemDef.id, mesh);
        };
        task.onError = (_task, message, exception) => {
          console.error(`Error loading model ${itemDef.model} for ${itemDef.name}:`, message, exception);
        };
      }
    }

    if (tasksAdded > 0) {
      return new Promise((resolve, reject) => {
        this.assetsManager.onFinish = () => {
          resolve();
        };
        this.assetsManager.onTaskError = (task) => {
          console.error(`Task failed: ${task.name}`);
          reject(new Error("Failed to load some ingredient assets."));
        }
        this.assetsManager.load();
      });
    } else {
      console.log("No ingredient models to load based on registry.");
      return Promise.resolve();
    }
  }

  // Get a cloned instance of an ingredient model
  public getIngredientMesh(ingredient: Ingredient): Mesh | null {
    const originalMesh = this.ingredientMeshes.get(ingredient);
    if (!originalMesh) {
      console.warn(`Template mesh for ingredient ${Ingredient[ingredient]} not loaded or found.`);
      return null;
    }

    // Clone the mesh and its hierarchy
    const clonedMesh = originalMesh.clone(`ingredient_${Ingredient[ingredient]}_${Date.now()}`); // Deep clone
    if (!clonedMesh) {
      console.error(`Failed to clone mesh for ${Ingredient[ingredient]}`);
      return null;
    }

    clonedMesh.isVisible = true;
    clonedMesh.setEnabled(true);
    clonedMesh.isPickable = true;

    // Make children visible and pickable as well
    clonedMesh.getChildMeshes().forEach((child) => {
      child.isVisible = true;
      child.setEnabled(true);
      child.isPickable = true;
    });

    return clonedMesh as Mesh;
  }

  // Dispose of all loaded template meshes
  public dispose(): void {
    this.ingredientMeshes.forEach(mesh => mesh.dispose(false, true));
    this.ingredientMeshes.clear();
    this.assetsManager.reset();
    console.log("IngredientLoader disposed.");
  }
}
