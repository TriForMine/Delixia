import type { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import type { Ingredient, InteractType } from './enums.ts'

export interface PhysicsConfig {
  shapeType: PhysicsShapeType
  mass?: number
  restitution?: number
  friction?: number
}

export interface InteractionConfig {
  id: number
  interactType: InteractType
  ingredient?: Ingredient
}

export interface MapModelConfig {
  map: string
  fileName: string
  defaultScaling?: { x?: number; y?: number; z?: number }

  billboardOffset?: {
    x: number
    y: number
    z: number
  }

  /** Default physics if no per-instance physics is specified */
  defaultPhysics?: PhysicsConfig

  instances: Array<{
    position: { x: number; y: number; z: number }
    rotation?: { x?: number; y?: number; z?: number }
    scaling?: { x?: number; y?: number; z?: number }

    /** Optional override for physics */
    physics?: PhysicsConfig
    interaction?: InteractionConfig
  }>
}
