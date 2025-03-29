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

export class CharacterController {
  private readonly ingredientLoader: IngredientLoader
  private currentIngredientMesh: Mesh | undefined = undefined
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

  protected constructor(characterMesh: AbstractMesh, scene: Scene, ingredientLoader: IngredientLoader, animationGroups: AnimationGroup[]) {
    this.scene = scene
    this.ingredientLoader = ingredientLoader

    this.impostorMesh = MeshBuilder.CreateCapsule('CharacterTransform', { height: 1.5, radius: 0.3 }, scene)
    this.impostorMesh.visibility = 0
    this.impostorMesh.rotationQuaternion = Quaternion.Identity()
    this.impostorMesh.position.y = 1
    this.impostorMesh.position.x = 0
    this.impostorMesh.position.z = 5
    this.impostorMesh.isPickable = false

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

  dropIngredient() {
    if (this.currentIngredientMesh) {
      this.currentIngredientMesh.dispose()
      this.currentIngredientMesh = undefined
    }
    this.ingredient = Ingredient.None
  }

  pickupIngredient(ingredient: Ingredient) {
    if (this.ingredient) {
        return
    }

    this.forceSetIngredient(ingredient)
  }

  forceSetIngredient(ingredient: Ingredient) {
    if (ingredient === Ingredient.None) {
      if (this.currentIngredientMesh) {
        this.currentIngredientMesh.dispose()
      }
      return
    }

    this.ingredient = ingredient

    if (this.ingredientLoader) {
      if (this.currentIngredientMesh) {
        this.currentIngredientMesh.dispose()
      }
      this.currentIngredientMesh = this.ingredientLoader.getIngredientMesh(ingredient)
      this.currentIngredientMesh.parent = this.model
      this.currentIngredientMesh.position = new Vector3(0, 0.5, 1)
      this.currentIngredientMesh.rotationQuaternion = Quaternion.Identity()
      this.currentIngredientMesh.scaling = new Vector3(0.5, 0.5, 0.5)
      this.currentIngredientMesh.isPickable = false
    }
  }

  get holdedIngredient() {
    return this.ingredient
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
    this.impostorMesh.dispose()
    this.model.dispose()
    this.physicsAggregate.dispose()
  }

  /**
   * Performs animation blending based on the current state.
   * @param deltaTime Time elapsed since the last frame.
   */
  protected updateAnimations(deltaTime: number): void {
    // Determine target animation
    let targetAnim: AnimationGroup = this.idleAnim
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
    this.targetAnim = targetAnim

    // Blend logic
    let weightSum = 0
    for (const anim of this.nonIdleAnimations) {
      if (anim === targetAnim) {
        // Smoothly blend up
        anim.weight = moveTowards(anim.weight, 1.0, this.animationBlendSpeed * deltaTime)
        // Ensure it's playing if not already
        if (!anim.isPlaying) {
          const shouldLoop = anim === this.fallingAnim || anim === this.walkAnim || anim === this.sambaDanceAnim
          anim.play(shouldLoop)
        }
      } else {
        // Smoothly blend down
        anim.weight = moveTowards(anim.weight, 0.0, this.animationBlendSpeed * deltaTime)
        if (anim.weight === 0 && anim.isPlaying) {
          anim.pause()
        }
      }
      weightSum += anim.weight
    }

    // Idle animation blends up for leftover weight
    this.idleAnim.weight = moveTowards(this.idleAnim.weight, Math.max(1.0 - weightSum, 0.0), this.animationBlendSpeed * deltaTime)
    if (this.idleAnim.weight > 0 && !this.idleAnim.isPlaying) {
      this.idleAnim.play(true) // Idle loops
    }
  }
}
