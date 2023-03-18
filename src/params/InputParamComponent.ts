import type { SvelteComponentTyped } from 'svelte';
import { InitialiazedParam, Param } from './defineParams';

export type InputParamComponentProps<P extends Param> = {
	name: string;
	param: InitialiazedParam<P>;
	disabled: boolean;
	value: Required<P>['value'];
	onReset?: () => void;
};

export type InputParamComponent<P extends Param> = typeof SvelteComponentTyped<
	InputParamComponentProps<P>
>;
