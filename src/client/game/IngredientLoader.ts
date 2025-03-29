import { Mesh } from '@babylonjs/core/Meshes/mesh'
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
      mesh.getChildMeshes().forEach((child) => {
        if (child instanceof Mesh) {
          child.isPickable = false
          child.isVisible = false
        }
      })
      this.ingredientMeshes.set(Ingredient.Nori, mesh)
    }

    const task2 = this.assetsManager.addMeshTask(`load-Rice-model`, '', 'assets/map/japan/', `Rice Ball.glb`)
    task2.onSuccess = (task) => {
      const mesh = task.loadedMeshes[0] as Mesh
      mesh.isVisible = false
      mesh.getChildMeshes().forEach((child) => {
        if (child instanceof Mesh) {
          child.isPickable = false
          child.isVisible = false
        }
      })
      this.ingredientMeshes.set(Ingredient.Rice, mesh)
    }

    const task3 = this.assetsManager.addMeshTask(`load-Onigiri-model`, '', 'assets/map/japan/', `Onigiri.glb`)
    task3.onSuccess = (task) => {
      const mesh = task.loadedMeshes[0] as Mesh
      mesh.isVisible = false
      mesh.getChildMeshes().forEach((child) => {
        if (child instanceof Mesh) {
          child.isPickable = false
          child.isVisible = false
        }
      })
      this.ingredientMeshes.set(Ingredient.Onigiri, mesh)
    }

    const task4 = this.assetsManager.addMeshTask(`load-Plate-model`, '', 'assets/map/japan/', `Plate.glb`)
    task4.onSuccess = (task) => {
      const mesh = task.loadedMeshes[0] as Mesh
      mesh.isVisible = false
      mesh.getChildMeshes().forEach((child) => {
        if (child instanceof Mesh) {
          child.isPickable = false
          child.isVisible = false
        }
      })
      this.ingredientMeshes.set(Ingredient.Plate, mesh)
    }

    // Ajoutez d'autres ingrédients ici si nécessaire
    this.assetsManager.load()
  }

  // Récupérer une instance clonée d’un modèle
  public getIngredientMesh(ingredient: Ingredient): Mesh {
    const originalMesh = this.ingredientMeshes.get(ingredient)
    if (!originalMesh) throw new Error(`Modèle pour l’ingrédient ${ingredient} non chargé`)

    const clonedMesh = originalMesh.clone(`ingredient_${ingredient}`)
    clonedMesh.isVisible = true
    clonedMesh.getChildMeshes().forEach((child) => {
            child.isPickable = true
            child.isVisible = true
    })
    return clonedMesh
  }
}
