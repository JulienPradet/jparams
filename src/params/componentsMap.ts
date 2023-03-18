import { ParamTypes } from './defineParams';
import { InputParamComponent } from './InputParamComponent';

export const componentsMap: {
	[Key in keyof ParamTypes]: () => Promise<InputParamComponent<ParamTypes[Key]>>;
} = {
	int: async () => (await import('./IntParam.svelte')).default,
	// string: async () => (await import('./StringParam.svelte')).default,
	color: async () => (await import('./ColorParam.svelte')).default,
	select: async () => (await import('./SelectParam.svelte')).default
};

export type ComponentsMap = typeof componentsMap;

export type InputComponents = {
	[key in keyof ParamTypes]: Awaited<ReturnType<(typeof componentsMap)[key]>>;
};

export type InputComponent<Type extends keyof ParamTypes> = InputComponents[Type];
