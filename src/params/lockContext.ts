import { getContext, setContext } from 'svelte';
import { writable, Writable } from 'svelte/store';

const lockKey = Symbol();

export type GetInitialLockState = (name: string) => boolean;
export type LockUpdateHandler = (name: string, value: boolean) => void;

type LockContext = {
	getInitialLockState: GetInitialLockState;
	onLockUpdate: LockUpdateHandler;
};

export const getLock$ = (name: string) => {
	const lockContext = getContext<LockContext>(lockKey);

	let storeValue = lockContext.getInitialLockState(name);
	let store = writable(storeValue);

	const set = (value: boolean) => {
		storeValue = value;
		store.set(value);
		lockContext.onLockUpdate(name, value);
	};

	return {
		subscribe: store.subscribe,
		set: set,
		update: (fn) => set(fn(storeValue))
	} as Writable<boolean>;
};

export const setLockContext = (
	getInitialValue: LockContext['getInitialLockState'],
	onUpdate: LockContext['onLockUpdate']
) => {
	setContext<LockContext>(lockKey, {
		getInitialLockState: getInitialValue,
		onLockUpdate: onUpdate
	});
};
