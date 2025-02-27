import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager'
import type { Scene } from '@babylonjs/core/scene'
import { Ingredient } from '@shared/types/enums.ts'

export class IngredientLoader {
  private assetsManager: AssetsManager
  private ingredientMeshes: Map<Ingredient, Mesh> = new Map()

  constructor(scene: Scene) {
    this.assetsManager = new AssetsManager(scene)
    this.assetsManager.useDefaultLoadingScreen = false
    this.assetsManager.autoHideLoadingUI = false
  }

  // Charger les modèles d’ingrédients
  public async loadIngredients(): Promise<void> {
    const task = this.assetsManager.addMeshTask(`load-Nori-model`, '', 'assets/map/japan/', `Nori.glb`)
    task.onSuccess = (task) => {
      const mesh = task.loadedMeshes[0] as Mesh
      mesh.isVisible = false
      this.ingredientMeshes.set(Ingredient.Nori, mesh)
    }

    // Ajoutez d'autres ingrédients ici si nécessaire
    this.assetsManager.load()
  }

  // Récupérer une instance clonée d’un modèle
  public getIngredientMesh(ingredient: Ingredient): Mesh {
    const originalMesh = this.ingredientMeshes.get(ingredient)
    if (!originalMesh) throw new Error(`Modèle pour l’ingrédient ${ingredient} non chargé`)

    const clonedMesh = originalMesh.clone(`ingredient_${ingredient}`)
    return clonedMesh
  }
}
