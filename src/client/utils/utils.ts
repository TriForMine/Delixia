import {Quaternion, Vector3} from "@babylonjs/core";

/**
 * Moves a number towards a target by a maximum delta.
 * @param current The current value.
 * @param target The target value.
 * @param maxDelta The maximum change.
 * @returns The new value.
 */
export function moveTowards(current: number, target: number, maxDelta: number): number {
	if (Math.abs(target - current) <= maxDelta) {
		return target;
	}
	return current + Math.sign(target - current) * maxDelta;
}

/**
 * Linearly interpolates between two Vector3 instances.
 * @param start The start vector.
 * @param end The end vector.
 * @param t The interpolation factor (0 to 1).
 * @returns The interpolated Vector3.
 */
export function lerpVector3(start: Vector3, end: Vector3, t: number): Vector3 {
	return Vector3.Lerp(start, end, t);
}

/**
 * Spherically interpolates between two Quaternions.
 * @param start The start quaternion.
 * @param end The end quaternion.
 * @param t The interpolation factor (0 to 1).
 * @returns The interpolated Quaternion.
 */
export function lerpQuaternion(start: Quaternion, end: Quaternion, t: number): Quaternion {
	return Quaternion.Slerp(start, end, t);
}