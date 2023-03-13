import { CanvasSketchUtilRandom, createRandom } from 'canvas-sketch-util/random';
import { defineParams, Params, ParamsDefinition, paramSerializer } from './defineParams';

/**
 * This method is permissive: it won't throw errors in case of invalid URL construction
 * but do it's best to reconstruct as much params as possible.
 */
const set = (
	params: { [key in string]: any },
	key: string,
	value: string
): { [key in string]: any } => {
	if (key.length === 0) {
		return params;
	}

	if (/^[^\[\.]+$/.test(key)) {
		params[key] = value;
		return params;
	}

	const arrayMatch = key.match(/^([^\.\[]+)\[(\d*)\]/);
	if (arrayMatch) {
		const nestedKey = arrayMatch[1];
		const arrayKey = arrayMatch[2];

		const array = nestedKey in params && Array.isArray(params[nestedKey]) ? params[nestedKey] : [];

		if (arrayKey.length > 0) {
			array[Number(arrayKey)] = value;
		} else {
			array.push(value);
		}

		params[nestedKey] = array;
		return params;
	}

	return params;

	// const nestedKey = key.replace(/([^\[\.]+)\./g, '');
	// console.log(key, nestedKey, /^([^\.\[]+)\..*$/.test(key));
	// if (nestedKey.length > 0) {
	// 	console.log('here?');
	// 	const innerParams =
	// 		nestedKey in params && typeof params[nestedKey] === 'object' ? params[nestedKey] : ({} as P);
	// 	params[nestedKey] = set(innerParams, key.replace(/^[^\.]+\./, ''), value);
	// 	return params;
	// }
};

const setParamsValueFromUrl = <T extends ParamsDefinition>(
	random: CanvasSketchUtilRandom,
	params: Params<T>,
	url: URL
) => {
	const newParams = defineParams(random, params as ParamsDefinition);
	const searchParams = new URLSearchParams(url.search);
	const nestedParams = {};

	searchParams.forEach((value, key) => {
		set(nestedParams, key, value);
	});

	Object.entries(nestedParams).forEach(([key, value]) => {
		if (key in newParams) {
			try {
				const parsedValue = paramSerializer[newParams[key].type].parse(value);
				newParams[key].value = parsedValue;
			} catch (e) {
				if (process.env.NODE_ENV) {
					console.error(`Failed to initialize ${key} from ${url.search}`);
					console.error(newParams[key].value, value);
				}
			}
		}
	});

	return newParams as Params<T>;
};

export { setParamsValueFromUrl };
