declare module 'canvas-sketch-util/random' {
	export type CanvasSketchUtilRandom = {
		getRandomSeed: () => number;
		setSeed: (n: number, opt?: {}) => void;
		getSeed: () => number;
		value: () => number;
		shuffle: <T>(array: Array<T>) => Array<T>;
		pick: <T>(array: Array<T>) => T;
		gaussian: (mean: number, standardDerivation: number) => number;
		onSphere: (radius?: number) => [number, number, number];
		noise1D: (x: number, frequency?: number, amplitude?: number) => number;
		noise2D: (x: number, y: number, frequency?: number, amplitude?: number) => number;
		noise3D: (x: number, y: number, z: number, frequency?: number, amplitude?: number) => number;
		noise4D: (
			x: number,
			y: number,
			z: number,
			w: number,
			frequency?: number,
			amplitude?: number
		) => number;
	};
	export const createRandom: (seed?: number) => CanvasSketchUtilRandom;
	export const getRandomSeed: () => number;
	export const setSeed: (n: number, opt?: {}) => void;
	export const getSeed: () => number;
	export const value: () => number;
}

declare module 'canvas-sketch-util/math' {
	export const clamp: (value: number, min: number, max: number) => number;
	export const mapRange: (
		input: number,
		inputMin: number,
		inputMax: number,
		outputMin: number,
		outputMax: number
	) => number;
}
