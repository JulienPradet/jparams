import { Storage } from './Params.svelte';

export const localStorageParams: Storage = {
	getInitialLockState: (name) => {
		return Boolean(JSON.parse(localStorage.getItem(`params_${name}_locked`) || 'false'));
	},
	onLockUpdate: (name, isLocked) => {
		localStorage.setItem(`params_${name}_locked`, JSON.stringify(isLocked));
	},
	getInitialOpenState: (name) => {
		return Boolean(JSON.parse(localStorage.getItem(`params_${name}_open`) || 'true'));
	},
	onOpenUpdate: (name, isLocked) => {
		localStorage.setItem(`params_${name}_open`, JSON.stringify(isLocked));
	}
};
