<script lang="ts">
	import { createEventDispatcher, onMount, afterUpdate, SvelteComponentTyped } from 'svelte';
	import { getLock$ } from './lockContext';
	import HiddenInputs from './HiddenInputs.svelte';
	import { InitialiazedParam, Param, ParamTypes } from './defineParams';
	import type { InputComponent } from './componentsMap';
	import { getOpen$ } from './openContext';

	type ParamType = $$Generic<keyof ParamTypes>;

	export let name: string;
	export let label: string;
	export let param: InitialiazedParam<ParamTypes[ParamType]>;
	export let component: InputComponent<ParamType>;

	let onReset: () => void;

	let open = getOpen$(name);
	let lock = getLock$(name);

	function onToggle() {
		open.update((opened) => !opened);
	}

	function onLockToggle() {
		$lock = !$lock;

		if ($lock) {
			open.set(false);
		} else {
			open.set(true);
		}
	}

	let value = param.value;
	let previousValue = value;

	const dispatch = createEventDispatcher<{ ready: string; update: any }>();

	onMount(() => {
		dispatch('ready', name);
	});

	afterUpdate(() => {
		if (value !== previousValue) {
			dispatch('update', value);
			previousValue = value;
		}
	});
</script>

<div class={`row ${$open ? 'opened' : ''} ${$lock ? 'disabled' : ''}`}>
	<div class="label-row">
		<button
			type="button"
			class={`toggle ${$open ? 'opened' : ''}`}
			on:click={onToggle}
			title={$open ? 'Close' : 'Open'}
			aria-label={`${$open ? 'Close' : 'Open'} ${label}`}
		>
			{label}
		</button>
		<button class="reset" type="button" on:click={onReset || (() => {})}>Reset</button>
		<button
			class="lock"
			type="button"
			on:click={onLockToggle}
			title={$lock ? 'Unlock' : 'Lock'}
			aria-label={$lock ? 'Unlock' : 'Lock'}
		/>
	</div>
	{#if $open}
		<div class="input">
			<svelte:component this={component} {name} {param} disabled={$lock} bind:value bind:onReset />
		</div>
	{:else}
		<HiddenInputs {name} {param} {value} />
	{/if}
</div>

<style>
	.row:nth-child(n + 2) {
		margin-top: 1rem;
	}

	.label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.reset {
		background: none;
		border: 1px solid #fff;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		opacity: 1;
		transition: opacity 0.1s ease-in-out;
		border-radius: 2px;
	}

	.row:not(.opened) .reset,
	.row.disabled .reset {
		visibility: hidden;
		opacity: 0;
	}

	.row.disabled .label-row {
		opacity: 0.6;
	}

	.lock {
		align-self: stretch;
		position: relative;
		width: 2rem;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.lock::after {
		content: '';
		position: absolute;
		top: calc(50% + 0.2rem);
		left: calc(50%);
		transform: translateY(-50%);
		height: 0.35rem;
		width: 0.5rem;
		border: 2px solid #fff;
		border-radius: 2px;
	}
	.lock::before {
		content: '';
		position: absolute;
		top: calc(50% - 0.55rem);
		left: calc(50% + 0.1rem);
		height: 0.5rem;
		width: 0.3rem;
		border: 2px solid #fff;
		border-bottom: none;
		border-radius: 0.5rem;
		clip-path: polygon(0% 0%, 0% 50%, 50% 50%, 50% 50%, 100% 50%, 100% 0%);
		transition: transform 0.1s ease-out;
	}
	.row.disabled .lock::before {
		transform: translateY(3px);
	}

	.toggle {
		flex: 1;
		align-self: stretch;
		position: relative;
		background: none;
		border: none;
		padding: 0 0 0 1.5rem;
		cursor: pointer;
		font-size: 1.2rem;
		text-align: left;
	}

	.toggle::before,
	.toggle::after {
		content: '';
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		left: 0;
		height: 2px;
		width: 0.5rem;
		background: #fff;
		transition: transform 0.3s cubic-bezier(1, 0, 0, 1);
		margin: 0 0.25rem;
		border-radius: 2px;
	}

	.toggle.opened::after {
		transform: translateY(-50%) rotate(-90deg);
	}

	.input {
		margin-top: 0.5rem;
	}
</style>
