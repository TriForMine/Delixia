import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import { Ingredient, InteractType } from '../types/enums.ts'
import {MapModelConfig, processMapConfigurations, validateMapConfigurations} from '../utils/mapUtils.ts'

// Define the raw map configurations without interaction IDs
const rawMapConfigs: MapModelConfig[] = [
  {
    map: 'japan',
    fileName: 'Table.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      // Table Gauche Volant
      {
        position: { x: 5, y: 3.5, z: -5 },
        rotation: { y: Math.PI },
        scaling: { x: 1, y: 0.5, z: 1 },
      },

      // Table Droite Volant
      {
        position: { x: -5, y: 3.5, z: -5 },
        rotation: { y: Math.PI },
        scaling: { x: 1, y: 0.5, z: 1 },
      },

      // Table Volant
      {
        position: { x: 0, y: 2, z: -2 },
        rotation: { y: Math.PI / 2 },
        scaling: { x: 2.5, y: 0.5, z: 0.75 },
      },

      // Table Coin Droite Devant
      {
        position: { x: -8, y: 0, z: -8 },
        rotation: { y: Math.PI },
        scaling: { x: 0.75, y: 0.5, z: 0.75 },
      },

      // Table Coin Gauche Devant
      {
        position: { x: 8, y: 0, z: -8 },
        rotation: { y: Math.PI },
        scaling: { x: 0.75, y: 0.5, z: 0.75 },
      },

      // Table Devant
      {
        position: { x: 0, y: 0, z: -7.85 },
        rotation: { y: Math.PI },
        scaling: { x: 1, y: 0.5, z: 1 },
      },

      // Table Coin Droite
      {
        position: { x: -8, y: 0, z: 8 },
        rotation: { y: Math.PI },
        scaling: { x: 0.75, y: 0.5, z: 0.75 },
      },

      // Table Coin Gauche
      {
        position: { x: 8, y: 0, z: 8 },
        rotation: { y: Math.PI },
        scaling: { x: 0.75, y: 0.5, z: 0.75 },
      },

      // Table Sortie Droite
      {
        position: { x: -7.85, y: 0, z: 0 },
        rotation: { y: Math.PI },
        scaling: { x: 1, y: 0.5, z: 1 },
      },

      // Table Sortie Gauche
      {
        position: { x: 7.85, y: 0, z: 0 },
        rotation: { y: Math.PI },
        scaling: { x: 1, y: 0.5, z: 1 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'cloud1.glb',
    defaultScaling: { x: 0.2, y: 0.2, z: 0.2 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      // Chaise Coin Gauche Devant
      {
        position: { x: 8, y: 0.4, z: -7 },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },
      {
        position: { x: 7, y: 0.4, z: -8 },
        rotation: { y: Math.PI },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },

      // Chaise Coin Droite Devant
      {
        position: { x: -7, y: 0.4, z: -8 },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },
      {
        position: { x: -8, y: 0.4, z: -7 },
        rotation: { y: Math.PI },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },

      // Chaise Gauche Volant
      {
        position: { x: 5, y: 3.75, z: -3.5 },
      },
      {
        position: { x: 5, y: 3.75, z: -6.5 },
      },
      {
        position: { x: 3.5, y: 3.75, z: -5 },
      },
      {
        position: { x: 6.5, y: 3.75, z: -5 },
      },
      // Sous Pied
      {
        position: { x: 5.95, y: 3.5, z: -4.2 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },
      {
        position: { x: 4.07, y: 3.5, z: -4.2 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },
      {
        position: { x: 5.95, y: 3.5, z: -5.95 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },
      {
        position: { x: 4.07, y: 3.5, z: -5.85 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },

      // Chaise Droite Volant
      {
        position: { x: -5, y: 3.75, z: -3.5 },
      },
      {
        position: { x: -5, y: 3.75, z: -6.5 },
      },
      {
        position: { x: -3.5, y: 3.75, z: -5 },
      },
      {
        position: { x: -6.5, y: 3.75, z: -5 },
      },
      // Sous Pied
      {
        position: { x: -5.95, y: 3.5, z: -4.2 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },
      {
        position: { x: -4.07, y: 3.5, z: -4.2 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },
      {
        position: { x: -5.95, y: 3.5, z: -5.95 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },
      {
        position: { x: -4.07, y: 3.5, z: -5.85 },
        scaling: { x: 0.1, y: 0.1, z: 0.1 },
      },

      // Chaise Volant
      {
        position: { x: 0, y: 2.25, z: -0.75 },
      },
      {
        position: { x: 0, y: 2.25, z: -3.2 },
      },
      {
        position: { x: -1.5, y: 2.25, z: -0.75 },
      },
      {
        position: { x: -1.5, y: 2.25, z: -3.2 },
      },
      {
        position: { x: 1.5, y: 2.25, z: -0.75 },
      },
      {
        position: { x: 1.5, y: 2.25, z: -3.2 },
      },
      // Sous Pied
      {
        position: { x: -2.2, y: 2, z: -1.3 },
        scaling: { x: 0.2, y: 0.1, z: 0.1 },
      },
      {
        position: { x: 2.1, y: 2, z: -1.3 },
        scaling: { x: 0.2, y: 0.1, z: 0.1 },
      },
      {
        position: { x: -2.2, y: 2, z: -2.7 },
        scaling: { x: 0.2, y: 0.1, z: 0.1 },
      },
      {
        position: { x: 2.1, y: 2, z: -2.7 },
        scaling: { x: 0.2, y: 0.1, z: 0.1 },
      },

      // Chaise Coin Gauche
      {
        position: { x: 8, y: 0.4, z: 7 },
      },
      {
        position: { x: 7, y: 0.4, z: 8 },
        rotation: { y: Math.PI },
      },

      // Chaise Coin Droite
      {
        position: { x: -7, y: 0.4, z: 8 },
      },
      {
        position: { x: -8, y: 0.4, z: 7 },
        rotation: { y: Math.PI },
      },

      // Chaise Sortie Droite
      {
        position: { x: -7.8, y: 0.4, z: 1.35 },
      },
      {
        position: { x: -6.5, y: 0.4, z: 0 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -7.8, y: 0.4, z: -1.35 },
      },

      // Chaise Sortie Gauche
      {
        position: { x: 7.8, y: 0.4, z: 1.35 },
      },
      {
        position: { x: 6.5, y: 0.4, z: 0 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 7.8, y: 0.4, z: -1.35 },
      },

      // Chaise Devant
      {
        position: { x: 1.35, y: 0.4, z: -7.8 },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },
      {
        position: { x: 0, y: 0.4, z: -6.5 },
        rotation: { y: Math.PI },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },
      {
        position: { x: -1.35, y: 0.4, z: -7.8 },
        interaction: {

          interactType: InteractType.ServingOrder,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Shoji Wall.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      { position: { x: -8, y: 0.1, z: 8 } },
      { position: { x: -8, y: 0.1, z: 8 }, rotation: { y: -Math.PI / 2 } },

      { position: { x: 8, y: 0.1, z: 8 } },
      { position: { x: 8, y: 0.1, z: 8 }, rotation: { y: Math.PI / 2 } },

      { position: { x: 8, y: 0.1, z: -8 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 8, y: 0.1, z: -8 }, rotation: { y: -Math.PI } },

      { position: { x: -8, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
      { position: { x: -8, y: 0.1, z: -8 }, rotation: { y: -Math.PI / 2 } },

      { position: { x: 0, y: 0.1, z: 8 } },
      { position: { x: 0, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
      { position: { x: -8, y: 0.1, z: 0 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: 8, y: 0.1, z: 0 }, rotation: { y: Math.PI / 2 } },
    ],
  },
  {
    map: 'japan',
    fileName: 'Normal Wall.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      { position: { x: 2, y: 0.1, z: 8 } },
      { position: { x: 6, y: 0.1, z: 8 } },
      { position: { x: -2, y: 0.1, z: 8 } },
      { position: { x: -6, y: 0.1, z: 8 } },

      { position: { x: 4, y: 0.1, z: 8 } },
      { position: { x: -4, y: 0.1, z: 8 } },

      { position: { x: 2, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
      { position: { x: 6, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
      { position: { x: -2, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
      { position: { x: -6, y: 0.1, z: -8 }, rotation: { y: Math.PI } },

      { position: { x: -8, y: 0.1, z: 2 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: -8, y: 0.1, z: 6 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: -8, y: 0.1, z: -2 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: -8, y: 0.1, z: -6 }, rotation: { y: -Math.PI / 2 } },

      { position: { x: 8, y: 0.1, z: 2 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 8, y: 0.1, z: 6 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 8, y: 0.1, z: -2 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 8, y: 0.1, z: -6 }, rotation: { y: Math.PI / 2 } },
    ],
  },
  {
    map: 'japan',
    fileName: 'Wall with Shelves.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      { position: { x: 4, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
      { position: { x: -4, y: 0.1, z: -8 }, rotation: { y: Math.PI } },

      { position: { x: -8, y: 0.1, z: 4 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: -8, y: 0.1, z: -4 }, rotation: { y: -Math.PI / 2 } },

      { position: { x: 8, y: 0.1, z: 4 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 8, y: 0.1, z: -4 }, rotation: { y: Math.PI / 2 } },
    ],
  },
  {
    map: 'japan',
    fileName: 'Plate.glb',
    defaultScaling: { x: 0.5, y: 1.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [{ position: { x: 2.9, y: 1.15, z: 8.6 } }],
  },
  {
    map: 'japan',
    fileName: 'Fridge.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 1.0,
      z: -0.8,
    },
    instances: [
      {
        position: { x: 2.9, y: 0.15, z: 8.6 },
        interaction: {
          interactType: InteractType.Fridge,
        },
      },
      {
        position: { x: -2.9, y: 0.15, z: 8.6 },
        interaction: {
          interactType: InteractType.Fridge,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Oven.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 1.5,
      z: 0,
    },
    instances: [
      {
        interaction: {

          interactType: InteractType.Oven,
        },
        position: { x: -1.75, y: 0.1, z: 8.5 },
      },
      {
        interaction: {

          interactType: InteractType.Oven,
        },
        position: { x: 1.75, y: 0.1, z: 8.5 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Nori.glb',
    defaultScaling: { x: 0.4, y: 0.4, z: 0.4 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 0.5,
      z: 0,
    },
    instances: [
      {
        interaction: {

          interactType: InteractType.Stock,
          ingredient: Ingredient.Nori,
        },
        position: { x: 4, y: 1.15, z: 6 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Rice Ball.glb',
    defaultScaling: { x: 0.4, y: 0.4, z: 0.4 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 0.5,
      z: 0,
    },
    instances: [
      {
        interaction: {

          interactType: InteractType.Stock,
          ingredient: Ingredient.Rice,
        },
        position: { x: 4, y: 1.15, z: 3 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Plate.glb',
    defaultScaling: { x: 0.7, y: 0.35, z: 0.7 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 0.5,
      z: 0,
    },
    instances: [
      {
        position: { x: 0, y: 1.05, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: 0, y: 1.09, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: 0, y: 1.13, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: 0, y: 1.17, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },

      {
        interaction: {

          interactType: InteractType.Stock,
          ingredient: Ingredient.Plate,
        },
        position: { x: 0, y: 1.21, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Chopping board.glb',
    defaultScaling: { x: 0.4, y: 0.4, z: 0.4 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 0.5,
      z: 0,
    },
    instances: [
      {
        position: { x: 0.5, y: 1.05, z: 8.5 },
        rotation: { x: 0, y: 0, z: 0 },
        interaction: {

          interactType: InteractType.ChoppingBoard,
        },
      },
      {
        position: { x: -0.5, y: 1.05, z: 8.5 },
        rotation: { x: 0, y: 0, z: 0 },
        interaction: {

          interactType: InteractType.ChoppingBoard,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Counter Straight.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      { position: { x: 0, y: 0.1, z: 2 }, rotation: { y: Math.PI } },

      { position: { x: 4, y: 0.1, z: 6 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 4, y: 0.1, z: 8 }, rotation: { y: Math.PI / 2 } },
      { position: { x: 4, y: 0.1, z: 3 }, rotation: { y: Math.PI / 2 } },

      { position: { x: -4, y: 0.1, z: 6 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: -4, y: 0.1, z: 8 }, rotation: { y: -Math.PI / 2 } },
      { position: { x: -4, y: 0.1, z: 3 }, rotation: { y: -Math.PI / 2 } },

      { position: { x: 0, y: 0.1, z: 8.6 }, rotation: { y: Math.PI }, scaling: { x: 0.75, y: 0.5, z: 0.6 } },

      { position: { x: 0, y: 0.1, z: 5.25 }, scaling: { x: 0.9, y: 0.5, z: 1.25 } },
    ],
  },
  {
    map: 'japan',
    fileName: 'Counter Corner.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      { position: { x: 4, y: 0.1, z: 2 }, rotation: { y: Math.PI / 2 } },
      { position: { x: -4, y: 0.1, z: 2 }, rotation: { y: Math.PI } },
    ],
  },
  {
    map: 'japan',
    fileName: 'Counter Sink.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 1.5,
      z: 0,
    },
    instances: [
      {
        position: { x: -2, y: 0.1, z: 2 },
        rotation: { y: Math.PI },
        interaction: {

          interactType: InteractType.Trash,
        },
      },
      {
        position: { x: 2, y: 0.1, z: 2 },
        rotation: { y: Math.PI },
        interaction: {

          interactType: InteractType.Trash,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Wood Floor.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },

    instances: (() => {
      const floorTiles = []
      for (let x = -4; x < 5; x++) {
        for (let z = -4; z < 5; z++) {
          floorTiles.push({
            position: { x: x * 2, y: 0.1, z: z * 2 },
          })
        }
      }
      return floorTiles
    })(),
  },
]

// Process the raw map configurations to automatically assign interaction IDs
// This ensures that interaction IDs are unique and deterministic
export const mapConfigs = validateMapConfigurations(processMapConfigurations(rawMapConfigs))
