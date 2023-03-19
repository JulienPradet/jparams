import { localStorageParams } from './storage/localStorageParams';
import ParamsComponent from './Params.svelte';
import { CanvasSketchUtilRandom } from 'canvas-sketch-util/random';
import {
	defineParams,
	getKeysFromParams,
	InitialiazedParam,
	Param,
	Params,
	ParamsDefinition,
	paramSerializer
} from './defineParams';
import { setParamsValueFromUrl } from './setParamsValueFromUrl';

export const initParams = <Definition extends ParamsDefinition>({
	params,
	paramsContainer,
	random
}: {
	params: Definition;
	paramsContainer: Element;
	random: CanvasSketchUtilRandom;
}) => {
	let updateListeners = new Array<() => void>();

	let initializedParams = defineParams(random, params);
	initializedParams = setParamsValueFromUrl(
		random,
		initializedParams,
		new URL(window.location.href)
	);

	const paramsComponent = new ParamsComponent({
		target: paramsContainer,
		props: {
			random,
			params: initializedParams,
			storage: localStorageParams
		}
	});

	const getSearchParamsFromFormData = (previousParams: Params<Definition>, formData: FormData) => {
		const searchParams = new URLSearchParams();

		for (let [key, param] of Object.entries(previousParams) as [string, Param][]) {
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
		}

		formData.forEach((value, key) => {
			searchParams.set(key, value.toString());
		});

		return searchParams;
	};

	paramsComponent.$on('init', (event) => {
		const formData = event.detail;
		const searchParams = getSearchParamsFromFormData(initializedParams, formData);

		if (window.location.search.slice(1) !== searchParams.toString()) {
			window.history.pushState(document.title, '', `?${searchParams.toString()}`);
			initializedParams = setParamsValueFromUrl(
				random,
				initializedParams,
				new URL(window.location.href)
			);
			updateListeners.forEach((listener) => listener());
		}
	});

	paramsComponent.$on('change', (event) => {
		const formData = event.detail;
		const searchParams = getSearchParamsFromFormData(initializedParams, formData);

		if (window.location.search.slice(1) !== searchParams.toString()) {
			window.history.pushState(document.title, '', `?${searchParams.toString()}`);
			initializedParams = setParamsValueFromUrl(
				random,
				initializedParams,
				new URL(window.location.href)
			);
			updateListeners.forEach((listener) => listener());
		}
	});

	window.addEventListener('popstate', (event) => {
		event.preventDefault();
		initializedParams = setParamsValueFromUrl<Definition>(
			random,
			initializedParams,
			new URL(window.location.href)
		);
		paramsComponent.$set({ params: initializedParams });
	});

	window.addEventListener('keydown', (event) => {
		console.log(event);
		if (event.key.toLowerCase() === 'z' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			if (event.shiftKey) {
				window.history.forward();
			} else {
				window.history.back();
			}
		} else if (event.code === 'Space') {
			paramsComponent.onResetAll();
		}
	});

	window.addEventListener('click', (event) => {
		if (event.target && !paramsContainer.contains(event.target)) {
			paramsComponent.onResetAll();
		}
	});

	/* Using a proxy to enable hotreload */
	return new Proxy(
		{
			onUpdate: (listener: () => void): (() => void) => {
				updateListeners.push(listener);
				return () => {
					updateListeners = updateListeners.filter((item) => item !== listener);
				};
			}
		},
		{
			get: (target, key: string) => {
				if (key === 'onUpdate') {
					return target.onUpdate;
				}

				if (!(key in initializedParams)) {
					throw new Error(
						`Key does not exist in defined params. Available keys: ${JSON.stringify(
							getKeysFromParams(initializedParams)
						)}`
					);
				}

				return initializedParams[key].value;
			}
		}
	) as {
		[Key in keyof Params<Definition>]: Params<Definition>[Key]['value'];
	} & {
		onUpdate: (listener: () => void) => () => void;
	};
};
