import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { InteractableObject } from './InteractableObject.ts'

/**
 * A spatial grid for efficient spatial partitioning of interactable objects.
 * This helps optimize queries for finding nearby objects by dividing the world
 * into cells and only checking objects in relevant cells.
 */
export class SpatialGrid {
  private cells: Map<string, InteractableObject[]> = new Map();
  private readonly cellSize: number;

  /**
   * Creates a new spatial grid with the specified cell size.
   * @param cellSize The size of each cell in the grid. Larger cells mean fewer cells but more objects per cell.
   */
  constructor(cellSize: number = 5) {
    this.cellSize = cellSize;
  }

  /**
   * Get cell key from position
   * @param position The position to get the cell key for
   * @returns A string key representing the cell containing the position
   */
  private getCellKey(position: Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${z}`;
  }

  /**
   * Add object to grid
   * @param object The interactable object to add to the grid
   */
  public addObject(object: InteractableObject): void {
    const key = this.getCellKey(object.mesh.position);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(object);
  }

  /**
   * Clear the grid
   */
  public clear(): void {
    this.cells.clear();
  }

  /**
   * Rebuild the grid with new objects
   * @param objects The array of interactable objects to populate the grid with
   */
  public rebuild(objects: InteractableObject[]): void {
    this.clear();
    for (const obj of objects) {
      this.addObject(obj);
    }
  }

  /**
   * Get objects near a position within maxDistance
   * @param position The position to search around
   * @param maxDistance The maximum distance to search
   * @returns An array of interactable objects within the specified distance
   */
  public getNearbyObjects(position: Vector3, maxDistance: number): InteractableObject[] {
    const result: InteractableObject[] = [];
    const cellRadius = Math.ceil(maxDistance / this.cellSize);
    const centerKey = this.getCellKey(position);
    const [centerX, centerZ] = centerKey.split(',').map(Number);

    // Check cells in a square around the position
    for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
      for (let z = centerZ - cellRadius; z <= centerZ + cellRadius; z++) {
        const key = `${x},${z}`;
        const cellObjects = this.cells.get(key);
        if (cellObjects) {
          for (const obj of cellObjects) {
            const dist = Vector3.Distance(obj.mesh.position, position);
            if (dist <= maxDistance) {
              result.push(obj);
            }
          }
        }
      }
    }

    return result;
  }
}