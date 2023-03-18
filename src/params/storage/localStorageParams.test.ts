import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Storage } from '../Params.svelte';

describe('localStorageParams', () => {
	let localStorageParams: Storage;

	beforeEach(async () => {
		localStorageParams = (await import('./localStorageParams')).localStorageParams;
	});

	afterEach(() => {
		localStorage.removeItem('params_name_open');
		localStorage.removeItem('params_name_lock');
	});

	describe('open state', () => {
		it('should initialize the open state as true', () => {
			expect(localStorageParams.getInitialOpenState('name')).toBe(true);
		});

		it('should use the stored open state if one was already stored as true', () => {
			localStorage.setItem(`params_name_open`, 'true');
			expect(localStorageParams.getInitialOpenState('name')).toBe(true);
		});

		it('should use the stored open state if one was already stored as false', () => {
			localStorage.setItem(`params_name_open`, 'false');
			expect(localStorageParams.getInitialOpenState('name')).toBe(false);
		});

		it('should change the stored value to false upon calling onOpenUpdate', () => {
			localStorageParams.onOpenUpdate('name', false);
			expect(localStorage.getItem(`params_name_open`)).toBe('false');
		});

		it('should change the stored value to true upon calling onOpenUpdate', () => {
			localStorageParams.onOpenUpdate('name', true);
			expect(localStorage.getItem(`params_name_open`)).toBe('true');
		});
	});

	describe('lock state', () => {
		it('should initialize the lock state as false', () => {
			expect(localStorageParams.getInitialLockState('name')).toBe(false);
		});

		it('should use the stored lock state if one was already stored as true', () => {
			localStorage.setItem(`params_name_lock`, 'true');
			expect(localStorageParams.getInitialLockState('name')).toBe(true);
		});

		it('should use the stored lock state if one was already stored as false', () => {
			localStorage.setItem(`params_name_lock`, 'false');
			expect(localStorageParams.getInitialLockState('name')).toBe(false);
		});

		it('should change the stored value to false upon calling onLockUpdate', () => {
			localStorageParams.onLockUpdate('name', false);
			expect(localStorage.getItem(`params_name_lock`)).toBe('false');
		});

		it('should change the stored value to true upon calling onLockUpdate', () => {
			localStorageParams.onLockUpdate('name', true);
			expect(localStorage.getItem(`params_name_lock`)).toBe('true');
		});
	});
});
