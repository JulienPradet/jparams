import { inMemoryStorageParams } from './inMemoryStorageParams';
import { Storage } from '../Params.svelte';

function isLocalStorageAvailable() {
	var test = 'test';
	try {
		window.localStorage.setItem(test, test);
		window.localStorage.removeItem(test);
		return true;
	} catch (e) {
		return false;
	}
}

export const localStorageParams: Storage = isLocalStorageAvailable()
	? {
			getInitialLockState: (name) => {
				return Boolean(JSON.parse(localStorage.getItem(`params_${name}_lock`) || 'false'));
			},
			onLockUpdate: (name, isLocked) => {
				localStorage.setItem(`params_${name}_lock`, JSON.stringify(isLocked));
			},
			getInitialOpenState: (name) => {
				return Boolean(JSON.parse(localStorage.getItem(`params_${name}_open`) || 'true'));
			},
			onOpenUpdate: (name, isLocked) => {
				localStorage.setItem(`params_${name}_open`, JSON.stringify(isLocked));
			}
	  }
	: inMemoryStorageParams;
