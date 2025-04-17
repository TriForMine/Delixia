import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate'
import { moveTowards } from '../utils/utils.ts'
import type { Scene } from '@babylonjs/core/scene'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup'
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import { Ingredient } from '@shared/types/enums.ts'
import type { IngredientLoader } from '@client/game/IngredientLoader.ts'
import type { Mesh } from '@babylonjs/core/Meshes'
import { CharacterState } from './CharacterState'
import type { AudioManager } from '@client/game/managers/AudioManager.ts'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { INGREDIENT_VISUAL_CONFIG, type IngredientVisualContextConfig } from '@shared/visualConfigs.ts'
import { getItemDefinition } from '@shared/items.ts'

export class CharacterController {
  protected readonly audioManager: AudioManager
  protected readonly ingredientLoader: IngredientLoader
  private currentIngredientMesh?: Mesh | null = undefined
  private plateMesh?: Mesh | null = undefined
  readonly scene: Scene
  readonly model: AbstractMesh
  readonly physicsAggregate: PhysicsAggregate
  readonly moveSpeed = 1.8
  readonly rotationSpeed = 6
  readonly animationBlendSpeed = 4.0
  readonly jumpForce = 5.0
  readonly walkAnim: AnimationGroup
  readonly idleAnim: AnimationGroup
  readonly jumpAnim: AnimationGroup
  readonly landingAnim: AnimationGroup
  readonly fallingAnim: AnimationGroup
  readonly sambaDanceAnim: AnimationGroup
  readonly nonIdleAnimations: AnimationGroup[]
  readonly thirdPersonCamera?: ArcRotateCamera
  protected targetAnim: AnimationGroup
  protected readonly impostorMesh: AbstractMesh
  protected currentState: CharacterState = CharacterState.IDLE
  protected ingredient: Ingredient = Ingredient.None
  protected holdingPlate: boolean = false
  protected readonly holdAttachmentPoint: TransformNode

  protected constructor(
    characterMesh: AbstractMesh,
    scene: Scene,
    ingredientLoader: IngredientLoader,
    animationGroups: AnimationGroup[],
    audioManager: AudioManager,
  ) {
    this.scene = scene
    this.ingredientLoader = ingredientLoader
    this.audioManager = audioManager

    this.impostorMesh = MeshBuilder.CreateCapsule('CharacterTransform', { height: 1.5, radius: 0.3 }, scene)
    this.impostorMesh.visibility = 0
    this.impostorMesh.rotationQuaternion = Quaternion.Identity()
    this.impostorMesh.position.y = 1
    this.impostorMesh.position.x = 0
    this.impostorMesh.position.z = 3.5
    this.impostorMesh.isPickable = false

    this.holdAttachmentPoint = new TransformNode('holdAttachmentPoint', scene)
    this.holdAttachmentPoint.parent = this.impostorMesh
    this.holdAttachmentPoint.position = new Vector3(0, -0.2, -0.4) // Adjust as needed
    this.holdAttachmentPoint.rotationQuaternion = Quaternion.Identity()
    this.holdAttachmentPoint.scaling = Vector3.One() // Ensure it doesn't scale

    this.model = characterMesh
    this.model.parent = this.impostorMesh
    this.model.rotate(Vector3.Up(), Math.PI)
    this.model.position.y = -0.75
    characterMesh.isPickable = false

    // Make all submeshes unselectable
    this.model.getChildMeshes().forEach((mesh) => {
      mesh.isPickable = false
      mesh.receiveShadows = true
    })

    const walkAnimGroup = animationGroups.find((ag) => ag.name === 'Walking')
    if (walkAnimGroup === undefined) throw new Error("'Walking' animation not found")
    this.walkAnim = walkAnimGroup
    this.walkAnim.weight = 0

    const sambaDanceAnimGroup = animationGroups.find((ag) => ag.name === 'SambaDancing')
    if (sambaDanceAnimGroup === undefined) throw new Error("'SambaDancing' animation not found")
    this.sambaDanceAnim = sambaDanceAnimGroup
    this.sambaDanceAnim.weight = 0

    const jumpAnimGroup = animationGroups.find((ag) => ag.name === 'Jump')
    if (jumpAnimGroup === undefined) throw new Error("'Jumping' animation not found")
    this.jumpAnim = jumpAnimGroup
    this.jumpAnim.weight = 0

    const fallingAnimGroup = animationGroups.find((ag) => ag.name === 'Fall')
    if (fallingAnimGroup === undefined) throw new Error("'Falling' animation not found")
    this.fallingAnim = fallingAnimGroup
    this.fallingAnim.weight = 0

    const landingAnimGroup = animationGroups.find((ag) => ag.name === 'Land')
    if (landingAnimGroup === undefined) throw new Error("'Landing' animation not found")
    this.landingAnim = landingAnimGroup
    this.landingAnim.weight = 0

    const idleAnimGroup = animationGroups.find((ag) => ag.name === 'Idle')
    if (idleAnimGroup === undefined) throw new Error("'Idle' animation not found")
    this.idleAnim = idleAnimGroup
    this.idleAnim.weight = 1
    this.idleAnim.play(true)

    this.targetAnim = this.idleAnim
    this.nonIdleAnimations = [this.walkAnim, this.sambaDanceAnim, this.jumpAnim, this.fallingAnim, this.landingAnim]

    this.physicsAggregate = new PhysicsAggregate(this.getTransform(), PhysicsShapeType.CAPSULE, {
      mass: 1,
      friction: 0.5,
    })

    this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly })
    this.physicsAggregate.body.setAngularDamping(100)
    this.physicsAggregate.body.setLinearDamping(10)
  }

  private clearHeldItemVisuals(): void {
    if (this.currentIngredientMesh) {
      this.currentIngredientMesh.dispose()
      this.currentIngredientMesh = undefined
    }
    if (this.plateMesh) {
      this.plateMesh.dispose()
      this.plateMesh = undefined
    }
  }

  private updateHeldItemVisuals(): void {
    this.clearHeldItemVisuals() // Clear previous visuals

    const plateHoldingConfig = INGREDIENT_VISUAL_CONFIG[Ingredient.Plate]
    const heldIngredientConfig = INGREDIENT_VISUAL_CONFIG[this.ingredient]
    const heldIngredientDef = getItemDefinition(this.ingredient)

    const defaultScale = new Vector3(0.5, 0.5, 0.5)

    // --- 1. Handle Plate ---
    if (this.holdingPlate) {
      this.plateMesh = this.ingredientLoader.getIngredientMesh(Ingredient.Plate)
      if (this.plateMesh) {
        // Parent plate to the attachment point
        this.plateMesh.parent = this.holdAttachmentPoint

        // Apply config or defaults to the plate
        const plateScale = plateHoldingConfig?.scale
          ? new Vector3(plateHoldingConfig.scale.x, plateHoldingConfig.scale.y, plateHoldingConfig.scale.z)
          : defaultScale
        this.plateMesh.scaling = plateScale

        const contextConfig = plateHoldingConfig?.hand
        const defaultPlatePos = Vector3.Zero()

        this.plateMesh.position = contextConfig?.positionOffset
          ? new Vector3(contextConfig.positionOffset.x, contextConfig.positionOffset.y, contextConfig.positionOffset.z)
          : defaultPlatePos

        this.plateMesh.rotationQuaternion = contextConfig?.rotationOffset
          ? new Quaternion(
              contextConfig.rotationOffset.x,
              contextConfig.rotationOffset.y,
              contextConfig.rotationOffset.z,
              contextConfig.rotationOffset.w,
            )
          : Quaternion.Identity()

        this.plateMesh.isPickable = false
        this.plateMesh.getChildMeshes().forEach((m) => (m.isPickable = false))
      }
    }

    // --- 2. Handle Ingredient ---
    if (this.ingredient !== Ingredient.None && heldIngredientDef) {
      this.currentIngredientMesh = this.ingredientLoader.getIngredientMesh(this.ingredient)
      if (this.currentIngredientMesh) {
        let targetParent: TransformNode | Mesh = this.holdAttachmentPoint
        let contextConfig: IngredientVisualContextConfig | undefined
        let basePosition: Vector3

        if (this.holdingPlate && this.plateMesh) {
          targetParent = this.plateMesh
          contextConfig = heldIngredientConfig?.onPlate
          basePosition = new Vector3(0, 0.1, 0)
        } else {
          targetParent = this.holdAttachmentPoint
          contextConfig = heldIngredientConfig?.hand
          basePosition = new Vector3(0, -0.1, 0.1)
        }

        this.currentIngredientMesh.parent = targetParent

        let ingredientScale = heldIngredientConfig?.scale
          ? new Vector3(heldIngredientConfig.scale.x, heldIngredientConfig.scale.y, heldIngredientConfig.scale.z)
          : defaultScale

        if (this.holdingPlate && this.plateMesh) {
          ingredientScale = new Vector3(ingredientScale.x / 0.5, ingredientScale.y / 0.5, ingredientScale.z / 0.5)
        }

        this.currentIngredientMesh.scaling = ingredientScale

        const positionOffset = contextConfig?.positionOffset
          ? new Vector3(contextConfig.positionOffset.x, contextConfig.positionOffset.y, contextConfig.positionOffset.z)
          : Vector3.Zero()
        this.currentIngredientMesh.position = basePosition.add(positionOffset)

        this.currentIngredientMesh.rotationQuaternion = contextConfig?.rotationOffset
          ? new Quaternion(
              contextConfig.rotationOffset.x,
              contextConfig.rotationOffset.y,
              contextConfig.rotationOffset.z,
              contextConfig.rotationOffset.w,
            )
          : Quaternion.Identity()

        this.currentIngredientMesh.isPickable = false
        this.currentIngredientMesh.getChildMeshes().forEach((m) => (m.isPickable = false))
      }
    }
  }

  dropIngredient() {
    this.ingredient = Ingredient.None
    this.updateHeldItemVisuals()
  }

  dropPlate() {
    if (!this.holdingPlate) return
    this.holdingPlate = false
    // If dropping plate also drops ingredient on it
    if (this.ingredient !== Ingredient.None) {
      const itemDef = getItemDefinition(this.ingredient)
      if (itemDef?.isFinal) {
        // Only results sit on plates typically
        this.ingredient = Ingredient.None
      }
    }
    this.updateHeldItemVisuals() // Update visuals after dropping
  }

  pickupIngredient(ingredient: Ingredient) {
    if (this.ingredient) {
      return
    }

    const ingredient_def = getItemDefinition(ingredient)

    if (this.holdingPlate && !ingredient_def?.isFinal) {
      return
    }

    this.forceSetIngredient(ingredient)
  }

  forceSetIngredient(ingredient: Ingredient) {
    if (this.ingredient === ingredient) return
    this.ingredient = ingredient
    this.updateHeldItemVisuals()
  }

  pickupPlate() {
    const currentIngredient = this.ingredient
    const currentIngredientIsFinal = currentIngredient !== Ingredient.None && !!getItemDefinition(currentIngredient)?.isFinal
    if (currentIngredient !== Ingredient.None && !currentIngredientIsFinal) {
      console.warn('Client: Cannot pick up plate while holding non-final.')
      return
    }

    this.forcePickupPlate()
  }

  forcePickupPlate() {
    if (this.holdingPlate) return
    this.holdingPlate = true
    this.updateHeldItemVisuals()
  }

  get holdedIngredient() {
    return this.ingredient
  }

  get isHoldingPlate() {
    return this.holdingPlate
  }

  set isHoldingPlate(value: boolean) {
    if (value && !this.holdingPlate) {
      this.pickupPlate()
    } else if (!value && this.holdingPlate) {
      this.dropPlate()
    }
  }

  get position() {
    return this.impostorMesh.position
  }

  get rotation() {
    return this.impostorMesh.rotationQuaternion
  }

  get getTargetAnim() {
    return this.targetAnim
  }

  public getTransform() {
    return this.impostorMesh
  }

  public setPosition(position: Vector3) {
    this.impostorMesh.position = position
  }

  public setRotation(rotation: Quaternion) {
    this.impostorMesh.rotationQuaternion = rotation
  }

  public setRotationY(y: number) {
    this.impostorMesh.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), y)
  }

  public update(_deltaSeconds: number): void {
    return
  }

  public dispose() {
    this.clearHeldItemVisuals()
    this.holdAttachmentPoint.dispose()
    this.impostorMesh.dispose()
    this.model.dispose()
    this.physicsAggregate.dispose()
  }

  /**
   * Performs animation blending based on the current state.
   * @param deltaTime Time elapsed since the last frame.
   */
  protected updateAnimations(deltaTime: number): void {
    // Determine target animation based on the current state
    let targetAnim: AnimationGroup = this.idleAnim // Default to idle
    switch (this.currentState) {
      case CharacterState.IDLE:
        targetAnim = this.idleAnim
        break
      case CharacterState.WALKING:
        targetAnim = this.walkAnim
        break
      case CharacterState.JUMPING:
        targetAnim = this.jumpAnim
        break
      case CharacterState.FALLING:
        targetAnim = this.fallingAnim
        break
      case CharacterState.LANDING:
        targetAnim = this.landingAnim
        break
      case CharacterState.DANCING:
        targetAnim = this.sambaDanceAnim
        break
    }

    // Blending logic
    let weightSum = 0 // Keep track of the weight used by non-idle animations
    for (const anim of this.nonIdleAnimations) {
      if (anim === targetAnim) {
        // Smoothly blend weight towards 1.0 for the target animation
        anim.weight = moveTowards(anim.weight, 1.0, this.animationBlendSpeed * deltaTime)
        // Ensure the animation is playing if its weight is significant
        if (!anim.isPlaying && anim.weight > 0.01) {
          // Play only if weight is noticeable
          // Determine if the target animation should loop based on its type
          const shouldLoop = anim === this.fallingAnim || anim === this.walkAnim || anim === this.sambaDanceAnim
          anim.play(shouldLoop) // Play with looping enabled only if necessary

          // If the animation is not set to loop (e.g., Jump, Land),
          // explicitly reset it to the beginning frame each time it starts playing.
          // This prevents it from resuming mid-animation if played again quickly.
          if (!shouldLoop) {
            anim.goToFrame(0)
          }
        }
      } else {
        // Smoothly blend weight towards 0.0 for non-target animations
        anim.weight = moveTowards(anim.weight, 0.0, this.animationBlendSpeed * deltaTime)
        // Pause the animation if its weight becomes negligible to save resources
        if (anim.weight < 0.01 && anim.isPlaying) {
          anim.pause()
        }
      }
      // Accumulate the weight used by this non-idle animation
      weightSum += anim.weight
    }

    // The idle animation takes up the remaining weight (1.0 - weightSum)
    // Ensures a smooth transition back to idle when no other animation is fully active.
    this.idleAnim.weight = moveTowards(this.idleAnim.weight, Math.max(1.0 - weightSum, 0.0), this.animationBlendSpeed * deltaTime)

    // Play or pause the idle animation based on its weight
    if (this.idleAnim.weight > 0 && !this.idleAnim.isPlaying) {
      this.idleAnim.play(true) // Idle animation always loops
    } else if (this.idleAnim.weight <= 0 && this.idleAnim.isPlaying) {
      // Pause idle if its weight drops to zero (another animation has taken over)
      this.idleAnim.pause()
    }
  }
}
