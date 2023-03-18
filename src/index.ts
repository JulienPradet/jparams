import { createRandom } from 'canvas-sketch-util/random';
import {
	ColorParam,
	defineParams,
	IntParam,
	paramSerializer,
	SelectParam
} from './params/defineParams';
import { localStorageParams } from './params/storage/localStorageParams';
import Params from './params/Params.svelte';
import { setParamsValueFromUrl } from './params/setParamsValueFromUrl';

const random = createRandom();

enum Palette {
	blackAndWhite = 'Black & White',
	ice = 'Ice'
}

let params = defineParams(random, {
	number: {
		type: 'int',
		label: 'Random number'
	} as IntParam,
	palette: {
		type: 'select',
		label: 'Palette',
		options: Object.values(Palette)
	} as SelectParam<Palette>,
	background: {
		type: 'color',
		label: 'Background'
	} as ColorParam,
	background2: {
		type: 'color',
		label: 'Color 1'
	} as ColorParam,
	background3: {
		type: 'color',
		label: 'Color 2'
	} as ColorParam,
	background4: {
		type: 'color',
		label: 'Color 3'
	} as ColorParam,
	background5: {
		type: 'color',
		label: 'Color 4'
	} as ColorParam
});
params = setParamsValueFromUrl(random, params, new URL(window.location.href));

const paramsContainer = document.querySelector('#params');

if (!paramsContainer) {
	throw new Error('Invalid');
}

const paramsComponent = new Params({
	target: paramsContainer,
	props: {
		random,
		params,
		storage: localStorageParams
	}
});

const getSearchParamsFromFormData = (previousParams: typeof params, formData: FormData) => {
	const searchParams = new URLSearchParams();
	Object.entries(previousParams).forEach(([key, param]) => {
		const type = param.type;
		const value = param.value;
		const serialize = paramSerializer[type].serialize;

		// @ts-ignore
		const serializedValue = serialize(value);

		if (Array.isArray(serializedValue)) {
			serializedValue.forEach((value, index) => {
				searchParams.set(`${key}[${index}]`, value);
			});
		} else {
			searchParams.set(key, serializedValue);
		}
	});
	formData.forEach((value, key) => {
		searchParams.set(key, value.toString());
	});
	return searchParams;
};

paramsComponent.$on('init', (event) => {
	const formData = event.detail;
	const searchParams = getSearchParamsFromFormData(params, formData);

	if (window.location.search.slice(1) !== searchParams.toString()) {
		window.history.pushState(document.title, '', `?${searchParams.toString()}`);
	}
});

paramsComponent.$on('change', (event) => {
	const formData = event.detail;
	const searchParams = getSearchParamsFromFormData(params, formData);

	window.history.pushState(document.title, '', `?${searchParams.toString()}`);
});

window.addEventListener('popstate', (event) => {
	event.preventDefault();
	params = setParamsValueFromUrl(random, params, new URL(window.location.href));
	paramsComponent.$set({ params });
});

window.addEventListener('keydown', (event) => {
	if (event.key.toLowerCase() === 'z' && (event.metaKey || event.ctrlKey)) {
		event.preventDefault();
		if (event.shiftKey) {
			window.history.forward();
		} else {
			window.history.back();
		}
	}
});
