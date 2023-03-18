import { getContext, setContext } from 'svelte';
import { writable, Writable } from 'svelte/store';

const openKey = Symbol();

export type GetInitialOpenState = (name: string) => boolean;
export type OpenUpdateHandler = (name: string, value: boolean) => void;

type OpenContext = {
	getInitialOpenState: GetInitialOpenState;
	onOpenUpdate: OpenUpdateHandler;
};

export const getOpen$ = (name: string) => {
	const openContext = getContext<OpenContext>(openKey);

	let storeValue = openContext.getInitialOpenState(name);
	let store = writable(storeValue);

	const set = (value: boolean) => {
		storeValue = value;
		store.set(value);
		openContext.onOpenUpdate(name, value);
	};

	return {
		subscribe: store.subscribe,
		set: set,
		update: (fn) => set(fn(storeValue))
	} as Writable<boolean>;
};

export const setOpenContext = (
	getInitialValue: OpenContext['getInitialOpenState'],
	onUpdate: OpenContext['onOpenUpdate']
) => {
	const openContext = {
		getInitialOpenState: getInitialValue,
		onOpenUpdate: onUpdate
	};
	setContext<OpenContext>(openKey, openContext);

	return openContext;
};
