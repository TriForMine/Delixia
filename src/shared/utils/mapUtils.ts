import { Ingredient, InteractType } from '../types/enums.ts'
import { z } from 'zod'
import {PhysicsShapeType} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

/**
 * A simple string hash function that works in both Node.js and browser environments.
 * Based on the djb2 algorithm.
 * 
 * @param str The string to hash
 * @returns A hexadecimal hash string
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // (hash * 33) ^ char
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }

  // Convert to unsigned 32-bit integer and then to hex string
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0');
}

/**
 * Generates a hash for a map configuration to ensure client and server have the same version.
 * 
 * @param mapConfigs The map configurations to hash
 * @returns A string hash representing the map configuration
 */
export function generateMapHash(mapConfigs: MapModelConfig[]): string {
  // Create a deterministic string representation of the map configs
  // Sort and stringify the configs to ensure the same hash regardless of object order
  const stringifiedConfig = JSON.stringify(mapConfigs, (_key, value) => {
    // Sort arrays to ensure deterministic order
    if (Array.isArray(value)) {
      return [...value].sort();
    }
    // Sort object keys to ensure deterministic order
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.keys(value).sort().reduce((result, key) => {
        result[key] = value[key];
        return result;
      }, {} as any);
    }
    return value;
  });

  // Generate a hash from the stringified config using our browser-compatible function
  const hash = simpleHash(stringifiedConfig);

  // Return the hash
  return hash;
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
export function generateInteractionId(
  interactType: InteractType,
  ingredient: Ingredient = Ingredient.None,
  index: number = 0
): number {
  // Ensure index is within bounds (0-999)
  const safeIndex = Math.min(Math.max(index, 0), 999)

  // Generate a unique ID based on the interaction type, ingredient, and index
  return interactType * 1000000 + ingredient * 1000 + safeIndex
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
      if (instance.interaction) {
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
  const mapHash = generateMapHash(mapConfigs);

  // Add the hash to each configuration
  for (const config of mapConfigs) {
    config.hash = mapHash;
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
  defaultScaling: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    z: z.number().optional(),
  }).optional(),
  billboardOffset: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  defaultPhysics: z.object({
    shapeType: z.nativeEnum(PhysicsShapeType),
    mass: z.number().optional(),
    friction: z.number().optional(),
    restitution: z.number().optional(),
  }).optional(),
  interaction: InteractionConfigSchema.optional(),
  instances: z.array(z.object({
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    rotation: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    }).optional(),
    scaling: z.object({
      x: z.number().optional(),
      y: z.number().optional(),
      z: z.number().optional(),
    }).optional(),
    physics: z.object({
      shapeType: z.number(),
      mass: z.number().optional(),
      friction: z.number().optional(),
      restitution: z.number().optional(),
    }).optional(),
    interaction: InteractionConfigSchema.optional(),
  })),
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
