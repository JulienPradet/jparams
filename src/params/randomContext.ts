import { CanvasSketchUtilRandom } from 'canvas-sketch-util/random';
import { getContext, setContext } from 'svelte';

const randomKey = Symbol();

export const getRandomContext = () => {
	return getContext<CanvasSketchUtilRandom>(randomKey);
};

export const setRandomContext = (random: CanvasSketchUtilRandom) => {
	return setContext<CanvasSketchUtilRandom>(randomKey, random);
};
