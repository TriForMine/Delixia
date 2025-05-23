import { Ingredient, InteractType } from '../types/enums.ts'
import { z } from 'zod'
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import { sha256 } from 'js-sha256'

/**
 * Generates an SHA-256 hash for a map configuration.
 *
 * @param mapConfigs The map configurations to hash.
 * @returns A hexadecimal SHA-256 hash string.
 */
export function generateMapHash(mapConfigs: any[]): string {
  // Create a deterministic string representation of the map configs.
  // Skip the "hash" property so that we don't include an already generated hash.
  const stringifiedConfig = JSON.stringify(mapConfigs, (_key, value) => {
    if (_key === 'hash') {
      return undefined // Omit the hash property
    }
    if (Array.isArray(value)) {
      // Sort array elements deterministically.
      return value.slice().sort((a, b) => {
        const aStr = JSON.stringify(a)
        const bStr = JSON.stringify(b)
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      })
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      // Create a new object with sorted keys.
      const ordered: any = {}
      Object.keys(value)
        .sort()
        .forEach((key) => {
          ordered[key] = value[key]
        })
      return ordered
    }
    return value
  })

  // Generate and return the hash using js-sha256.
  return sha256(stringifiedConfig)
}

/**
 * Generates a deterministic, unique ID for an interaction based on its properties.
 * The ID is composed of:
 * - InteractType (0-999) * 1000000
 * - Ingredient (0-999) * 1000
 * - Index (0-999)
 *
 * This gives us a unique ID for each interaction that is:
 * - Deterministic (same input = same output)
 * - Unique across different interaction types and ingredients
 * - Supports up to 1000 instances of the same interaction type + ingredient combination
 *
 * @param interactType The type of interaction
 * @param ingredient The ingredient type (if applicable)
 * @param index The index of this interaction (for multiple instances of the same type)
 * @returns A unique, deterministic ID
 */
export function generateInteractionId(interactType: InteractType, ingredient: Ingredient = Ingredient.None, index: number = 0): number {
  // Ensure index is within bounds (0-999)
  const safeIndex = Math.min(Math.max(index, 0), 999)

  // Generate a unique ID based on the interaction type, ingredient, and index
  return (interactType + 1) * 1000000 + ingredient * 1000 + safeIndex
}

/**
 * Processes map configurations to automatically assign interaction IDs and generate a hash.
 * This function modifies the input configurations in place.
 *
 * @param mapConfigs The map configurations to process
 * @returns The processed map configurations with hash
 */
export function processMapConfigurations(mapConfigs: MapModelConfig[]): MapModelConfig[] {
  // Create counters for each interaction type + ingredient combination
  const counters: Record<string, number> = {}

  // Process each map configuration
  for (const config of mapConfigs) {
    // Process instances with interactions
    for (const instance of config.instances) {
      if (instance.interaction ?? config.interaction) {
        if (config.interaction && !instance.interaction) {
          instance.interaction = {
            ...config.interaction,
          }
        }

        if (!instance.interaction) continue

        const interactType = instance.interaction.interactType
        const ingredient = instance.interaction.ingredient ?? Ingredient.None

        // Create a key for this combination
        const key = `${interactType}_${ingredient}`

        // Initialize counter if it doesn't exist
        if (!counters[key]) {
          counters[key] = 0
        }

        // Generate a deterministic ID
        instance.interaction.id = generateInteractionId(interactType, ingredient, counters[key])

        // Increment the counter
        counters[key]++
      }
    }
  }

  // Generate a hash for the processed configurations
  const mapHash = generateMapHash(mapConfigs)

  // Add the hash to each configuration
  for (const config of mapConfigs) {
    config.hash = mapHash
  }

  return mapConfigs
}

/**
 * Zod schema for validating interaction configurations
 */
export const InteractionConfigSchema = z.object({
  id: z.number().optional(), // ID is optional as it will be generated
  interactType: z.nativeEnum(InteractType),
  ingredient: z.nativeEnum(Ingredient).optional(),
})

export type InteractionConfig = z.infer<typeof InteractionConfigSchema>

/**
 * Zod schema for validating map model configurations
 */
export const MapModelConfigSchema = z.object({
  map: z.string(),
  fileName: z.string(),
  defaultScaling: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    })
    .optional(),
  billboardOffset: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  defaultPhysics: z
    .object({
      shapeType: z.nativeEnum(PhysicsShapeType),
      mass: z.number().optional(),
      friction: z.number().optional(),
      restitution: z.number().optional(),
    })
    .optional(),
  interaction: InteractionConfigSchema.optional(),
  instances: z.array(
    z.object({
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      rotation: z
        .object({
          x: z.number().optional(),
          y: z.number().optional(),
          z: z.number().optional(),
        })
        .optional(),
      scaling: z
        .object({
          x: z.number().optional(),
          y: z.number().optional(),
          z: z.number().optional(),
        })
        .optional(),
      physics: z
        .object({
          shapeType: z.number(),
          mass: z.number().optional(),
          friction: z.number().optional(),
          restitution: z.number().optional(),
        })
        .optional(),
      interaction: InteractionConfigSchema.optional(),
    }),
  ),
  hash: z.string().optional(), // Hash of the map configuration for version verification
})

export type MapModelConfig = z.infer<typeof MapModelConfigSchema>

/**
 * Validates map configurations using Zod schemas.
 *
 * @param mapConfigs The map configurations to validate
 * @returns The validated map configurations
 * @throws If validation fails
 */
export function validateMapConfigurations(mapConfigs: MapModelConfig[]): MapModelConfig[] {
  // Validate each map configuration
  for (const config of mapConfigs) {
    MapModelConfigSchema.parse(config)
  }

  return mapConfigs
}
