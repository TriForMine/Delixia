import { PhysicsShapeType } from "@babylonjs/core";
import {InteractType, MapModelConfig} from "../MapLoader.ts";

export const mapConfigs: MapModelConfig[] = [
	{
		map: 'japan',
		fileName: "Table.glb",
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
				position: { x: -8, y: 0, z: 0 },
				rotation: { y: Math.PI },
				scaling: { x: 1, y: 0.5, z: 1 },
			},

			// Table Sortie Gauche
			{
				position: { x: 8, y: 0, z: 0 },
				rotation: { y: Math.PI },
				scaling: { x: 1, y: 0.5, z: 1 },
			},
		],
	},
	{
		map: 'japan',
		fileName: "cloud1.glb",
		defaultScaling: { x: .2, y: .2, z: .2 },
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
			},
			{
				position: { x: 7, y: 0.4, z: -8 },
				rotation: { y: Math.PI },
			},

			// Chaise Coin Droite Devant
			{
				position: { x: -7, y: 0.4, z: -8 },
			},
			{
				position: { x: -8, y: 0.4, z: -7 },
				rotation: { y: Math.PI },
			},

			// Chaise Gauche Volant
			{
				position: { x: 5, y: 3.75, z: -3.5 },
			},
			{
				position: { x: 5, y: 3.75, z: -6.5 },
			},{
				position: { x: 3.5, y: 3.75, z: -5 },
			},
			{
				position: { x: 6.5, y: 3.75, z: -5 },
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
				scaling: { x: 0.1, y: 0.1, z: 0.1 }
			},
			{
				position: { x: -4.07, y: 3.5, z: -4.2 },
				scaling: { x: 0.1, y: 0.1, z: 0.1 }
			},
			{
				position: { x: -5.95, y: 3.5, z: -5.95 },
				scaling: { x: 0.1, y: 0.1, z: 0.1 }
			},
			{
				position: { x: -4.07, y: 3.5, z: -5.85 },
				scaling: { x: 0.1, y: 0.1, z: 0.1 }
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
				position: { x: -8, y: 0.4, z: 1.5 },
			},
			{
				position: { x: -6.5, y: 0.4, z: 0 },
				rotation: { y: Math.PI },
			},
			{
				position: { x: -8, y: 0.4, z: -1.5 },
			},

			// Chaise Sortie Gauche
			{
				position: { x: 8, y: 0.4, z: 1.5 },
			},
			{
				position: { x: 6.5, y: 0.4, z: 0 },
				rotation: { y: Math.PI },
			},
			{
				position: { x: 8, y: 0.4, z: -1.5 },
			},
		],
	},
	{
		map: 'japan',
		fileName: "Shoji Wall.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: -8, y: 0.1, z: 8 } },
			{ position: { x: -8, y: 0.1, z: 8 }, rotation: { y: - Math.PI / 2 } },

			{ position: { x: 8, y: 0.1, z: 8 } },
			{ position: { x: 8, y: 0.1, z: 8 }, rotation: { y: Math.PI / 2 } },

			{ position: { x: 8, y: 0.1, z: -8 }, rotation: { y: Math.PI / 2 } },
			{ position: { x: 8, y: 0.1, z: -8 }, rotation: { y: -Math.PI } },

			{ position: { x: -8, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
			{ position: { x: -8, y: 0.1, z: -8 }, rotation: { y: - Math.PI / 2 } },

			{ position: { x: 0, y: 0.1, z: 8 } },
			{ position: { x: 0, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
			{ position: { x: -8, y: 0.1, z: 0 }, rotation: { y: - Math.PI / 2 } },
			{ position: { x: 8, y: 0.1, z: 0 }, rotation: { y: Math.PI / 2 } },
		],
	},
	{
		map: 'japan',
		fileName: "Normal Wall.glb",
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
		fileName: "Wall with Shelves.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: 4, y: 0.1, z: 8 } },
			{ position: { x: -4, y: 0.1, z: 8 } },

			{ position: { x: 4, y: 0.1, z: -8 }, rotation: { y: Math.PI } },
			{ position: { x: -4, y: 0.1, z: -8 }, rotation: { y: Math.PI } },

			{ position: { x: -8, y: 0.1, z: 4 }, rotation: { y: - Math.PI / 2 } },
			{ position: { x: -8, y: 0.1, z: -4 }, rotation: { y: - Math.PI / 2 } },

			{ position: { x: 8, y: 0.1, z: 4 }, rotation: { y: Math.PI / 2 } },
			{ position: { x: 8, y: 0.1, z: -4 }, rotation: { y: Math.PI / 2 } },
		],
	},
	{
		map: 'japan',
		fileName: "Fridge.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		billboardOffset: {
			x: 0,
			y: 5,
			z: 0,
		},
		instances: [
			{
				position: { x: 2, y: 0.1, z: 8.2 },
				interactable: true,
				interactType: InteractType.Fridge,
			},
		],
	},
	{
		map: 'japan',
		fileName: "Oven.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		billboardOffset: {
			x: 0,
			y: 3,
			z: 0,
		},
		instances: [
			{
				interactable: true,
				interactType: InteractType.Oven,
				position: { x: -2, y: 0.1, z: 8.2 }
			},
		],
	},
	{
		map: 'japan',
		fileName: "Counter Straight.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: 2, y: 0.1, z: 2 } },
			{ position: { x: 0, y: 0.1, z: 2 }, rotation: { y: Math.PI } },

			{ position: { x: 4, y: 0.1, z: 6 }, rotation: { y: Math.PI / 2 } },
			{ position: { x: 4, y: 0.1, z: 8 }, rotation: { y: Math.PI / 2 } },
			{ position: { x: 4, y: 0.1, z: 3 }, rotation: { y: Math.PI / 2 } },

			{ position: { x: -4, y: 0.1, z: 6 }, rotation: { y: - Math.PI / 2 } },
			{ position: { x: -4, y: 0.1, z: 8 }, rotation: { y: - Math.PI / 2 } },
			{ position: { x: -4, y: 0.1, z: 3 }, rotation: { y: - Math.PI / 2 } },
		],
	},
	{
		map: 'japan',
		fileName: "Counter Corner.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.MESH,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: 4, y: 0.1, z: 2 }, rotation: { y: Math.PI /2 } },
			{ position: { x: -4, y: 0.1, z: 2 }, rotation: { y: Math.PI } },

		],
	},
	{
		map: 'japan',
		fileName: "Counter Sink.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.MESH,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: -2, y: 0.1, z: 2 }, rotation: { y: Math.PI } },
		],
	},
	{
		map: 'japan',
		fileName: "Wood Floor.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},

		instances: (() => {
			const floorTiles = [];
			for (let x = -4; x < 5; x++) {
				for (let z = -4; z < 5; z++) {
					floorTiles.push({
						position: { x: x * 2, y: 0.1, z: z * 2 },
					});
				}
			}
			return floorTiles;
		})(),
	},
];
