import type { CanvasSketchUtilRandom } from 'canvas-sketch-util/random';
import { Color } from '../color/Color';

/* In order to add a new parameter type:
 * - add the type to ParamTypes and let Typescript guide you
 * - 🚩 take the new type into account in `getInitialValue`
 */

type Labellable = {
	label?: string;
};

export type IntParam = Labellable & {
	type: 'int';
	defaultValue?: number;
	value?: number;
};
// export type StringParam = Labellable & {
// 	type: 'string';
// 	defaultValue?: string;
// 	value?: string;
// };
export type ColorParam = Labellable & {
	type: 'color';
	defaultValue?: ReturnType<typeof Color>;
	value?: ReturnType<typeof Color>;
};
export type SelectParam<Option extends string> = Labellable & {
	type: 'select';
	options: Option[];
	defaultValue?: Option;
	value?: Option;
};

export type ParamTypes = {
	int: IntParam;
	// string: StringParam;
	color: ColorParam;
	select: SelectParam<string>;
};

type GetValuesTypes<Type> = Type extends { [key in keyof ParamTypes]: infer V } ? V : never;

export type Param = GetValuesTypes<ParamTypes>;

export type GroupParam = Labellable & {
	children: Param[];
};

export type InitialiazedParam<T extends Param> = Omit<T, 'value' | 'label'> &
	Required<Pick<T, 'value' | 'label'>>;

export type TypeofInitializedParam<IP extends InitialiazedParam<Param>> =
	IP extends InitialiazedParam<infer P> ? P : never;

export type ParamsDefinition = { [key in string]: Param };
export type Params<Definition extends ParamsDefinition> = {
	[key in keyof Definition]: InitialiazedParam<Definition[key]>;
};

/**
 * The goal is to make sure there is always an initial value by generating one if needed.
 * This method is not typesafe: if new type of param is added to ParamTypes, this method won't
 * throw at compile time, only at runtime.
 */
export function getInitialValue<T extends Param>(
	random: CanvasSketchUtilRandom,
	param: T
): InitialiazedParam<T>['value'] {
	if (param.type === 'int') {
		return random.value();
	} else if (param.type === 'color') {
		return Color(random.value(), random.value(), random.value(), 1);
	} else if (param.type === 'select') {
		return random.pick(param.options);
	}

	throw new Error('No value defined');
}

function resetParam<T extends Param>(
	random: CanvasSketchUtilRandom,
	key: string,
	param: T,
	force = true
): InitialiazedParam<T> {
	return {
		...param,
		value:
			force || typeof param.value === 'undefined' ? getInitialValue(random, param) : param.value,
		label: param.label || key
	};
}

export const defineParams = <
	Definition extends ParamsDefinition,
	ActualParams extends Params<Definition>
>(
	random: CanvasSketchUtilRandom,
	params: Definition
): ActualParams => {
	return resetAll<Definition, ActualParams>(random, params, null, false);
};

export const resetAll = <
	Definition extends ParamsDefinition,
	ActualParams extends Params<Definition>
>(
	random: CanvasSketchUtilRandom,
	params: ActualParams | Definition,
	includeKeys: (keyof ActualParams)[] | null = null,
	force = true
) => {
	return Object.entries(params).reduce((acc: ActualParams, [key, param]: [string, Param]) => {
		const updatedParam =
			includeKeys === null || includeKeys.includes(key) || typeof param.value === 'undefined'
				? resetParam(random, key as string, param, force)
				: param;

		return {
			...acc,
			[key]: updatedParam
		};
	}, {} as ActualParams);
};

export const resetKey = <
	Definition extends ParamsDefinition,
	ActualParams extends Params<Definition>
>(
	random: CanvasSketchUtilRandom,
	params: ActualParams,
	keyToReset: keyof ActualParams
) => {
	return Object.entries(params).reduce((acc, [key, value]) => {
		return {
			...acc,
			[key]: keyToReset === key ? resetParam(random, key, value) : value
		};
	}, {} as ActualParams);
};

export const getKeysFromParams = <
	Definition extends ParamsDefinition,
	ActualParams extends Params<Definition>
>(
	params: ActualParams | Definition
) => {
	return Object.keys(params);
};

type GetValueTypeFromParam<T extends Param> = Required<T>['value'];

type SerializableParam<T extends Param, V extends GetValueTypeFromParam<T>> = {
	parse: (value: any) => V;
	serialize: (value: V) => string | string[];
};

export const paramSerializer: {
	[Key in keyof ParamTypes]: SerializableParam<
		ParamTypes[Key],
		GetValueTypeFromParam<ParamTypes[Key]>
	>;
} = {
	int: {
		parse: (value: any) => Number(value),
		serialize: (value: number) => value.toString()
	},
	// string: {
	// 	parse: (value: any) => value,
	// 	serialize: (value: string) => value
	// },
	color: {
		parse: (value: [string, string, string, string]) =>
			Color(...(value.map((value) => Number(value) || 0) as [number, number, number, number])),
		serialize: (value: Color) => value.map((number) => number.toString())
	},
	select: {
		parse: (value: any) => value,
		serialize: (value: string) => value
	}
};
