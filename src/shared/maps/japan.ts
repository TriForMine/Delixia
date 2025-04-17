import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin'
import { Ingredient, InteractType } from '../types/enums.ts'
import { type MapModelConfig, processMapConfigurations, validateMapConfigurations } from '../utils/mapUtils.ts'

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
    interaction: {
      interactType: InteractType.ServingOrder,
    },
    instances: [
      // Chaise Coin Gauche Devant
      {
        position: { x: 8, y: 0.4, z: -7 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 7, y: 0.4, z: -8 },
        rotation: { y: Math.PI / 2 },
      },

      // Chaise Coin Droite Devant
      {
        position: { x: -7, y: 0.4, z: -8 },
        rotation: { y: -Math.PI / 2 },
      },
      {
        position: { x: -8, y: 0.4, z: -7 },
        rotation: { y: Math.PI },
      },

      // Chaise Gauche Volant
      {
        position: { x: 5, y: 3.9, z: -3.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 5, y: 3.9, z: -6.5 },
      },
      {
        position: { x: 3.5, y: 3.9, z: -5 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 6.5, y: 3.9, z: -5 },
        rotation: { y: -Math.PI / 2 },
      },

      // Chaise Droite Volant
      {
        position: { x: -5, y: 3.9, z: -3.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -5, y: 3.9, z: -6.5 },
      },
      {
        position: { x: -3.5, y: 3.9, z: -5 },
        rotation: { y: -Math.PI / 2 },
      },
      {
        position: { x: -6.5, y: 3.9, z: -5 },
        rotation: { y: Math.PI / 2 },
      },

      // Chaise Volant
      {
        position: { x: 0, y: 2.4, z: -0.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 0, y: 2.4, z: -3.2 },
      },
      {
        position: { x: -1.5, y: 2.4, z: -0.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -1.5, y: 2.4, z: -3.2 },
      },
      {
        position: { x: 1.5, y: 2.4, z: -0.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 1.5, y: 2.4, z: -3.2 },
      },

      // Chaise Coin Gauche
      {
        position: { x: 8, y: 0.4, z: 7 },
      },
      {
        position: { x: 7, y: 0.4, z: 8 },
        rotation: { y: Math.PI / 2 },
      },

      // Chaise Coin Droite
      {
        position: { x: -7, y: 0.4, z: 8 },
        rotation: { y: -Math.PI / 2 },
      },
      {
        position: { x: -8, y: 0.4, z: 7 },
      },

      // Chaise Sortie Droite
      {
        position: { x: -7.8, y: 0.4, z: 1.35 },
        rotation: { y: -Math.PI },
      },
      {
        position: { x: -6.5, y: 0.4, z: 0 },
        rotation: { y: -Math.PI / 2 },
      },
      {
        position: { x: -7.8, y: 0.4, z: -1.35 },
      },

      // Chaise Sortie Gauche
      {
        position: { x: 7.8, y: 0.4, z: 1.35 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 6.5, y: 0.4, z: 0 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 7.8, y: 0.4, z: -1.35 },
      },

      // Chaise Devant
      {
        position: { x: 1.35, y: 0.4, z: -7.8 },
        rotation: { y: -Math.PI / 2 },
      },
      {
        position: { x: 0, y: 0.4, z: -6.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -1.35, y: 0.4, z: -7.8 },
        rotation: { y: Math.PI / 2 },
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
        position: { x: 3, y: 0.15, z: 8.6 },
        interaction: {
          interactType: InteractType.Fridge,
        },
      },
      {
        position: { x: -3, y: 0.15, z: 8.6 },
        interaction: {
          interactType: InteractType.Fridge,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Oven.glb',
    defaultScaling: { x: 0.375, y: 0.3, z: 0.5 },
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
        position: { x: -2, y: 0.1, z: 8.57 },
      },
      {
        interaction: {
          interactType: InteractType.Oven,
        },
        position: { x: 2, y: 0.1, z: 8.57 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Cupcake.glb',
    defaultScaling: { x: 0.65, y: 0.65, z: 0.65 },
    instances: [
      {
        position: { x: 0, y: 0.67, z: 2 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 4, y: 0.67, z: 6.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -4, y: 0.67, z: 6.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 1.25, y: 0.67, z: 8.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -1.25, y: 0.67, z: 8.5 },
        rotation: { y: Math.PI },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Lollipop 2.glb',
    defaultScaling: { x: 0.024, y: 0.024, z: 0.024 },
    instances: [
      {
        position: { x: 0, y: 2.7, z: 9 },
        rotation: { x: -Math.PI / 2 },
      },
      {
        position: { x: 0, y: 2.7, z: -9 },
        rotation: { x: -Math.PI / 2 },
      },
      {
        position: { x: 9, y: 2.7, z: 0 },
        rotation: { x: -Math.PI / 2 },
      },
      {
        position: { x: -9, y: 2.7, z: 0 },
        rotation: { x: -Math.PI / 2 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Dango.glb',
    defaultScaling: { x: 1.75, y: 1.75, z: 1.75 },
    instances: [
      {
        position: { x: 1.875, y: 3.25, z: 9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -1.875, y: 3.25, z: 9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 1.875, y: 3.25, z: -9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -1.875, y: 3.25, z: -9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 9, y: 3.25, z: 1.875 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 9, y: 3.25, z: -1.875 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -9, y: 3.25, z: 1.875 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -9, y: 3.25, z: -1.875 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 5.625, y: 3.25, z: 9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -5.625, y: 3.25, z: 9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 5.625, y: 3.25, z: -9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -5.625, y: 3.25, z: -9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 9, y: 3.25, z: 5.625 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 9, y: 3.25, z: -5.625 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -9, y: 3.25, z: 5.625 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -9, y: 3.25, z: -5.625 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 9, y: 3.25, z: 9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: 9, y: 3.25, z: -9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -9, y: 3.25, z: -9 },
        rotation: { z: Math.PI / 2 },
      },
      {
        position: { x: -9, y: 3.25, z: 9 },
        rotation: { z: Math.PI / 2 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Platform.glb',
    defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      {
        position: { x: 6, y: 1.9, z: 2.75 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -6, y: 1.9, z: 2.75 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 4.3, y: 1.9, z: 0.75 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -4.3, y: 1.9, z: 0.75 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 5, y: 3.8, z: 0 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -5, y: 3.8, z: 0 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 5, y: 3.8, z: -1.5 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -5, y: 3.8, z: -1.5 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 6.4, y: 3.8, z: -2.6 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -6.4, y: 3.8, z: -2.6 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 3.7, y: 3.8, z: -2.6 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -3.7, y: 3.8, z: -2.6 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 2.1, y: 3.8, z: -5.8 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -2.1, y: 3.8, z: -5.8 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 2.1, y: 1, z: -5.5 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -2.1, y: 1, z: -5.5 },
        rotation: { y: Math.PI / 2 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Grass Platform.glb',
    defaultScaling: { x: 2, y: 2, z: 2 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.BOX,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      {
        position: { x: 7, y: 0.75, z: 4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -7, y: 0.75, z: 4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 5.8, y: 2.5, z: 1.25 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -5.8, y: 2.5, z: 1.25 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 2.65, y: 1.6, z: 0.25 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -2.65, y: 1.6, z: 0.25 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -0.9, y: 1.6, z: 0.25 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 0.9, y: 1.6, z: 0.25 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 7.7, y: 3.5, z: -4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -7.7, y: 3.5, z: -4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 2.3, y: 3.5, z: -4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -2.3, y: 3.5, z: -4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 0.85, y: 1.6, z: -4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -0.85, y: 1.6, z: -4 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 3.3, y: 3.5, z: -7.3 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -3.3, y: 3.5, z: -7.3 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 0, y: 2.5, z: -7.3 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 0, y: 2.5, z: -5.5 },
        rotation: { y: Math.PI / 2 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Donut.glb',
    defaultScaling: { x: 1, y: 1, z: 1 },
    instances: [
      {
        position: { x: 4, y: 0.6, z: 2 },
      },
      {
        position: { x: -4, y: 0.6, z: 2 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Candy cane.glb',
    defaultScaling: { x: 0.01, y: 0.01, z: 0.01 },
    instances: [
      {
        position: { x: 0.5, y: 0.5, z: 0.5 },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Lollipop.glb',
    defaultScaling: { x: 0.25, y: 0.25, z: 0.25 },
    instances: [
      {
        position: { x: 7.5, y: 2.7, z: 9 },
        rotation: { y: Math.PI / 2 },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },
      {
        position: { x: 3.75, y: 2.7, z: 9 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -7.5, y: 2.7, z: 9 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -3.75, y: 2.7, z: 9 },
        rotation: { y: Math.PI / 2 },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },
      {
        position: { x: 3.75, y: 2.7, z: -9 },
        rotation: { y: Math.PI / 2 },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },
      {
        position: { x: 7.5, y: 2.7, z: -9 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: -3.75, y: 2.7, z: -9 },
        rotation: { y: Math.PI / 2 },
      },

      {
        position: { x: -7.5, y: 2.7, z: -9 },
        rotation: { y: Math.PI / 2 },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },
      {
        position: { x: 9, y: 2.7, z: 3.75 },
        rotation: { y: Math.PI },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },
      {
        position: { x: 9, y: 2.7, z: 7.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 9, y: 2.7, z: -3.75 },
        rotation: { y: Math.PI },
      },

      {
        position: { x: 9, y: 2.7, z: -7.75 },
        rotation: { y: Math.PI },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },

      {
        position: { x: -9, y: 2.7, z: 7.5 },
        rotation: { y: Math.PI },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
      },
      {
        position: { x: -9, y: 2.7, z: 3.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -9, y: 2.7, z: -7.5 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -9, y: 2.7, z: -3.75 },
        rotation: { y: Math.PI },
        scaling: { x: 0.2, y: 0.2, z: 0.2 },
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
        position: { x: -1.05, y: 0.72, z: 4.65 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        interaction: {
          interactType: InteractType.Stock,
          ingredient: Ingredient.Nori,
        },
        position: { x: -1.05, y: 0.77, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: -1.05, y: 0.72, z: 4.85 },
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
        position: { x: 1.05, y: 0.77, z: 4.75 },
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
        position: { x: 0, y: 0.67, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: 0, y: 0.71, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: 0, y: 0.75, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        position: { x: 0, y: 0.79, z: 4.75 },
        rotation: { x: 0, y: 0, z: 0 },
      },

      {
        interaction: {
          interactType: InteractType.Stock,
          ingredient: Ingredient.Plate,
        },
        position: { x: 0, y: 0.83, z: 4.75 },
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
        position: { x: 0.5, y: 0.67, z: 8.5 },
        rotation: { x: 0, y: 0, z: 0 },
        interaction: {
          interactType: InteractType.ChoppingBoard,
        },
      },
      {
        position: { x: -0.5, y: 0.67, z: 8.5 },
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
    defaultScaling: { x: 0.5, y: 0.3, z: 0.5 },
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

      { position: { x: 0, y: 0.1, z: 8.6 }, rotation: { y: Math.PI }, scaling: { x: 0.8, y: 0.3, z: 0.6 } },

      { position: { x: 0, y: 0.1, z: 5.25 }, scaling: { x: 0.9, y: 0.3, z: 1.25 } },
    ],
  },
  {
    map: 'japan',
    fileName: 'Counter Corner.glb',
    defaultScaling: { x: 0.5, y: 0.3, z: 0.5 },
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
    defaultScaling: { x: 0.5, y: 0.3, z: 0.5 },
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
    map: 'fastfood',
    fileName: 'Crate.glb',
    defaultScaling: { x: 0.35, y: 0.3, z: 0.35 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      {
        position: { x: 1.05, y: 0.67, z: 4.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -1.05, y: 0.67, z: 4.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -1.05, y: 0.67, z: 5.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 0, y: 0.67, z: 5.75 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 1.05, y: 0.67, z: 5.75 },
        rotation: { y: Math.PI },
      },
    ],
  },
  {
    map: 'fastfood',
    fileName: 'Pot A.glb',
    defaultScaling: { x: 0.5, y: 0.7, z: 0.5 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    instances: [
      {
        position: { x: 2, y: 0.77, z: 8.4 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -2, y: 0.77, z: 8.4 },
        rotation: { y: Math.PI },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Salmon.glb',
    defaultScaling: { x: 0.65, y: 0.5, z: 0.6 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
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
        position: { x: 0.05, y: 0.67, z: 5.77 },
        rotation: { y: Math.PI },
        interaction: {
          interactType: InteractType.Stock,
          ingredient: Ingredient.Salmon,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Sea Urchin.glb',
    defaultScaling: { x: 0.35, y: 0.35, z: 0.35 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
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
        position: { x: 1.17, y: 0.77, z: 5.85 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 0.93, y: 0.77, z: 5.85 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 1.05, y: 0.77, z: 5.66 },
        rotation: { y: Math.PI },
        interaction: {
          interactType: InteractType.Stock,
          ingredient: Ingredient.SeaUrchin,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Ebi.glb',
    defaultScaling: { x: 0.75, y: 0.75, z: 0.75 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
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
        position: { x: -1.17, y: 0.67, z: 5.85 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -0.93, y: 0.67, z: 5.85 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: -1.05, y: 0.67, z: 5.66 },
        rotation: { y: Math.PI },
        interaction: {
          interactType: InteractType.Stock,
          ingredient: Ingredient.Ebi,
        },
      },
    ],
  },
  {
    map: 'japan',
    fileName: 'Board.glb',
    defaultScaling: { x: 0.15, y: 0.05, z: 0.25 },
    defaultPhysics: {
      shapeType: PhysicsShapeType.MESH,
      mass: 0,
      friction: 0.8,
      restitution: 0.1,
    },
    billboardOffset: {
      x: 0,
      y: 0.5,
      z: 0,
    },
    interaction: {
      interactType: InteractType.ServingBoard,
    },
    instances: [
      {
        position: { x: -4, y: 0.67, z: 5.85 },
        rotation: { y: Math.PI },
      },
      {
        position: { x: 4, y: 0.67, z: 5.85 },
        rotation: { x: Math.PI },
      },
      {
        position: { x: -4, y: 0.67, z: 7.15 },
        rotation: { y: -Math.PI },
      },
      {
        position: { x: 4, y: 0.67, z: 7.15 },
        rotation: { x: -Math.PI },
      },
      {
        position: { x: -0.65, y: 0.67, z: 2 },
        scaling: { x: 0.25, y: 0.05, z: 0.15 },
        rotation: { y: Math.PI / 2 },
      },
      {
        position: { x: 0.65, y: 0.67, z: 2 },
        scaling: { x: 0.25, y: 0.05, z: 0.15 },
        rotation: { y: Math.PI / 2 },
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
