import type { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager'
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate'
import type { AssetContainer } from '@babylonjs/core/assetContainer'
import type { Scene } from '@babylonjs/core/scene'
import type { MapModelConfig } from '@shared/utils/mapUtils.ts'
import { generateMapHash } from '@shared/utils/mapUtils.ts'
import { InteractableObject } from './InteractableObject'
import type { IngredientLoader } from './IngredientLoader'
import { toast } from 'react-hot-toast'

export class MapLoader {
  private readonly scene: Scene
  private readonly cascadedShadowGenerator: CascadedShadowGenerator
  private assetsManager: AssetsManager
  private loadedContainers: { [fileName: string]: AssetContainer } = {}
  private readonly cloudMaterial: StandardMaterial
  public interactables: InteractableObject[] = []
  private readonly ingredientLoader?: IngredientLoader

  constructor(scene: Scene, cascadedShadowGenerator: CascadedShadowGenerator, ingredientLoader?: IngredientLoader) {
    this.scene = scene
    this.assetsManager = new AssetsManager(this.scene)
    this.assetsManager.autoHideLoadingUI = false
    this.assetsManager.useDefaultLoadingScreen = false
    this.cascadedShadowGenerator = cascadedShadowGenerator
    this.ingredientLoader = ingredientLoader
    const material = new StandardMaterial('cloud', this.scene)
    material.disableLighting = false
    material.emissiveColor = new Color3(0.5, 0.5, 0.5)
    material.alpha = 0.85
    material.backFaceCulling = true
    this.cloudMaterial = material
  }

  public loadAndPlaceModels(
    folder: string,
    modelConfigs: MapModelConfig[],
    onFinish: () => void,
    onProgress?: (progress: number) => void,
    serverMapHash?: string,
  ): void {
    // Reset InteractableObject static properties to prevent issues when reloading the map
    InteractableObject.reset()

    // Clear existing interactables array
    this.interactables = []

    // Verify map hash if provided
    if (serverMapHash) {
      const clientMapHash = generateMapHash(modelConfigs)

      if (clientMapHash !== serverMapHash) {
        console.error(`Map hash mismatch! Client: ${clientMapHash}, Server: ${serverMapHash}`)
        toast.error('Warning: Your game map version differs from the server. This may cause gameplay issues.')
      } else {
        console.log(`Map hash verified: ${clientMapHash}`)
      }
    } else {
      console.warn('No map hash provided for verification, the client hash is:', generateMapHash(modelConfigs), 'this may cause gameplay issues.')
    }

    // 1. Create a unique loading task for each distinct `fileName`
    modelConfigs.forEach((modelConfig) => {
      const { fileName } = modelConfig
      if (!this.loadedContainers[fileName]) {
        const mapFolder = folder + modelConfig.map + '/'
        const task = this.assetsManager.addContainerTask(fileName, '', mapFolder, fileName)

        task.onSuccess = (task) => {
          this.loadedContainers[fileName] = task.loadedContainer
        }

        task.onError = (_task, message, exception) => {
          console.error(`Error loading ${fileName}:`, message, exception)
        }
      }
    })

    // 2. Set up progress tracking if provided
    if (onProgress && typeof onProgress === 'function') {
      this.assetsManager.onProgress = (remainingCount, totalCount) => {
        const loadedCount = totalCount - remainingCount
        const progress = (loadedCount / totalCount) * 100
        onProgress(progress)
      }
    }

    // 3. After all loading tasks are done, instantiate each config’s placements
    this.assetsManager.onFinish = () => {
      modelConfigs.forEach((modelConfig) => {
        const container = this.loadedContainers[modelConfig.fileName]
        if (!container) {
          console.warn(`Could not find loaded container for "${modelConfig.fileName}". Skipping.`)
          return
        }

        const defaultPhysics = modelConfig.defaultPhysics

        // For each placement in this config, instantiate the same container.
        modelConfig.instances.forEach((placement) => {
          const instance = container.instantiateModelsToScene((name) => name)

          // The root node in the container is typically at index 0
          const rootNode = instance.rootNodes[0]
          if (!rootNode || !(rootNode instanceof Mesh)) {
            console.error(`Invalid root node for model "${modelConfig.fileName}"`)
            return
          }
          const root = rootNode

          root.name = modelConfig.fileName.replace('.glb', '')

          // Apply default scaling
          if (modelConfig.defaultScaling) {
            root.scaling.set(modelConfig.defaultScaling.x ?? 1, modelConfig.defaultScaling.y ?? 1, modelConfig.defaultScaling.z ?? 1)
          }

          if (placement.rotation) {
            root.rotation.set(placement.rotation.x ?? 0, placement.rotation.y ?? 0, placement.rotation.z ?? 0)
          }
          // Apply transforms to the root object
          if (placement.position) {
            root.position.set(placement.position.x, placement.position.y, placement.position.z)
          }
          if (placement.scaling) {
            root.scaling.set(placement.scaling.x ?? 1, placement.scaling.y ?? 1, placement.scaling.z ?? 1)
          }

          // Apply physics and shadows recursively to child meshes
          root.getChildMeshes().forEach((mesh) => {
            // Inherit rotation from root to ensure consistent rotation
            if (placement.rotation) {
              mesh.rotation.set(placement.rotation.x ?? 0, placement.rotation.y ?? 0, placement.rotation.z ?? 0)
              mesh.rotationQuaternion = null
            }
            const physics = placement.physics ?? defaultPhysics
            if (!physics) return

            if (!physics.shapeType) {
              console.warn(`Missing shape type for physics in model "${modelConfig.fileName}"`)
              return
            }

            new PhysicsAggregate(
              mesh,
              physics.shapeType,
              {
                mass: physics.mass ?? 0,
                restitution: physics.restitution ?? 0.2, // Default restitution for better bounce
                friction: physics.friction ?? 0.5, // Default friction for better physics feel
              },
              this.scene,
            )

            mesh.receiveShadows = true

            if (modelConfig.fileName == 'cloud1.glb') {
              mesh.material = this.cloudMaterial
            }

            this.cascadedShadowGenerator.addShadowCaster(mesh)
          })

          if (placement.interaction) {
            const interaction = placement.interaction
            if (!interaction || !interaction.id) {
              console.warn(`Missing interaction for model "${modelConfig.fileName}"`)
              return
            }

            const offset = modelConfig.billboardOffset
              ? new Vector3(modelConfig.billboardOffset.x, modelConfig.billboardOffset.y, modelConfig.billboardOffset.z)
              : undefined
            const interactableObj = new InteractableObject(root, this.scene, interaction.interactType, interaction.id, offset, this.ingredientLoader)
            interactableObj.interactionDistance = 2
            this.interactables.push(interactableObj)
          }
        })
      })

      onFinish()
    }

    // 4. Start loading
    this.assetsManager.load()
  }
}
