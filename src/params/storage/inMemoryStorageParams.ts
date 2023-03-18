import { Storage } from '../Params.svelte';

let lockStorage = new Map<string, boolean>();
let openStorage = new Map<string, boolean>();

export const inMemoryStorageParams: Storage = {
	getInitialLockState: (name) => {
		if (!lockStorage.has(name)) {
			lockStorage.set(name, false);
		}

		return lockStorage.get(name) as boolean;
	},
	onLockUpdate: (name, isLocked) => {
		lockStorage.set(name, isLocked);
	},
	getInitialOpenState: (name) => {
		if (!openStorage.has(name)) {
			openStorage.set(name, true);
		}

		console.log(openStorage);

		return openStorage.get(name) as boolean;
	},
	onOpenUpdate: (name, isOpened) => {
		openStorage.set(name, isOpened);
	}
};
