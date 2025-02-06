import { PhysicsShapeType } from "@babylonjs/core";
import { MapModelConfig } from "../MapLoader.ts";

export const mapConfigs: MapModelConfig[] = [
	{
		fileName: "Table.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			// Table Gauche
			{
				position: { x: 5, y: 2.5, z: -5 },
				rotation: { y: Math.PI },
				scaling: { x: 1, y: 0.5, z: 1 },
			},

			// Table Droite
			{
				position: { x: -5, y: 2.5, z: -5 },
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

			// Table Coin Droite
			{
				position: { x: -8, y: 0, z: 0 },
				rotation: { y: Math.PI },
				scaling: { x: 1.25, y: 0.5, z: 1 },
			},

			// Table Coin Gauche
			{
				position: { x: 8, y: 0, z: 0 },
				rotation: { y: Math.PI },
				scaling: { x: 1.25, y: 0.5, z: 1 },
			},
		],
	},
	{
		fileName: "cloud1.glb",
		defaultScaling: { x: .2, y: .2, z: .2 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			// Chaise Coin Gauche
			{
				position: { x: 8, y: 0.4, z: -7 },
			},
			{
				position: { x: 7, y: 0.4, z: -8 },
				rotation: { y: Math.PI },
			},

			// Chaise Coin Droite
			{
				position: { x: -7, y: 0.4, z: -8 },
			},
			{
				position: { x: -8, y: 0.4, z: -7 },
				rotation: { y: Math.PI },
			},

			// Chaise Gauche
			{
				position: { x: 5, y: 2.5, z: -3.5 },
			},
			{
				position: { x: 5, y: 2.5, z: -6.5 },
			},{
				position: { x: 3.5, y: 2.5, z: -5 },
			},
			{
				position: { x: 6.5, y: 2.5, z: -5 },
			},

			// Chaise Droite
			{
				position: { x: -5, y: 2.5, z: -3.5 },
			},
			{
				position: { x: -5, y: 2.5, z: -6.5 },
			},{
				position: { x: -3.5, y: 2.5, z: -5 },
			},
			{
				position: { x: -6.5, y: 2.5, z: -5 },
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
		],
	},
	{
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
		fileName: "Fridge.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: 2, y: 0.1, z: 8.2 } },
		],
	},
	{
		fileName: "Fantasy Portal 3D LowPoly Model.glb",
		defaultScaling: { x: 1, y: 1, z: 1 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.MESH,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: 0, y: 0.2, z: -8 } },
		],
	},
	{
		fileName: "Oven.glb",
		defaultScaling: { x: 0.5, y: 0.5, z: 0.5 },
		defaultPhysics: {
			shapeType: PhysicsShapeType.BOX,
			mass: 0,
			friction: 0.8,
			restitution: 0.1,
		},
		instances: [
			{ position: { x: -2, y: 0.1, z: 8.2 } },
		],
	},
	{
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
