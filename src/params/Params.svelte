<svelte:options accessors />

<script context="module" lang="ts">
	export type Storage = {
		getInitialLockState: GetInitialLockState;
		onLockUpdate: LockUpdateHandler;
		getInitialOpenState: GetInitialLockState;
		onOpenUpdate: LockUpdateHandler;
	};
</script>

<script lang="ts">
	import { CanvasSketchUtilRandom } from 'canvas-sketch-util/random';
	import { createEventDispatcher, tick, beforeUpdate } from 'svelte';
	import debounce from '../util/debounce';
	import { throttle } from '../util/throttle';
	import { componentsMap, InputComponent, InputComponents } from './componentsMap';
	import {
		Params,
		ParamsDefinition,
		ParamTypes,
		InitialiazedParam,
		resetAll,
		getKeysFromParams,
		Param
	} from './defineParams';
	import InputRenderer from './InputRenderer.svelte';
	import { GetInitialLockState, LockUpdateHandler, setLockContext } from './lockContext';
	import { setOpenContext } from './openContext';
	import { setRandomContext } from './randomContext';

	type ActualParamsDefinition = $$Generic<ParamsDefinition>;
	type ActualParams = Params<ActualParamsDefinition>;

	export let params: ActualParams;
	export let random: CanvasSketchUtilRandom;
	export let storage: Storage;

	let form: HTMLFormElement;
	let opened = false;

	let isFirstUpdate = true;
	let inputsReady: { [key in keyof ActualParams]: boolean | undefined } = {} as {
		[key in keyof ActualParams]: boolean;
	};

	setRandomContext(random);
	const lockContext = setLockContext(storage.getInitialLockState, storage.onLockUpdate);
	setOpenContext(storage.getInitialOpenState, storage.onOpenUpdate);

	let componentsPromise: Promise<InputComponents>;
	componentsPromise = Promise.all(
		Object.values(params).map(
			async <Type extends keyof ActualParams>(param: ActualParams[Type]) => {
				const type = param.type;
				return {
					type: type,
					component: await componentsMap[type]()
				};
			}
		)
	).then((components) => {
		return components.reduce((acc, { type, component }) => {
			return { ...acc, [type]: component };
		}, {} as InputComponents);
	});

	function getEntries(params: ActualParams): {
		name: string;
		label: string;
		param: InitialiazedParam<Param>;
		component: Promise<InputComponent<keyof ParamTypes>>;
	}[] {
		type Entry = {
			name: string;
			label: string;
			param: InitialiazedParam<Param>;
			component: Promise<InputComponent<keyof ParamTypes>>;
		};

		let entries: Array<Entry> = [];

		for (let key in params) {
			const param = params[key];
			entries.push({
				name: key,
				label: param.label || key,
				param: param as InitialiazedParam<Param>,
				component: componentsPromise.then((components) => components[param.type])
			});
		}

		return entries;
	}

	const dispatch = createEventDispatcher<{
		change: FormData;
		init: FormData;
	}>();

	const onUpdate = throttle(function onUpdate() {
		if (!form || isFirstUpdate) {
			return;
		}

		const data = new FormData(form);
		dispatch('change', data);
	}, 30);

	function onReady(event: { detail: string }) {
		if (!isFirstUpdate) {
			return;
		}

		if (!(event.detail in params)) {
			return;
		}
		const key = event.detail as keyof ActualParams;

		inputsReady[key] = true;

		if (Object.keys(params).every((key) => inputsReady[key])) {
			isFirstUpdate = false;
			const data = new FormData(form);
			dispatch('init', data);
			return;
		}
	}

	export async function onResetAll() {
		const keys = getKeysFromParams(params);
		const unlockedKeys = keys.filter((key) => !lockContext.isLockedKey(key));
		if (unlockedKeys.length === 0) {
			return;
		}

		params = resetAll(random, params, unlockedKeys);
		await tick();
		onUpdate();
	}

	$: {
		if (params) {
			isFirstUpdate = true;
			inputsReady = {} as {
				[key in keyof ActualParams]: boolean;
			};
		}
	}
</script>

<div class={`params ${opened ? '' : 'closed'}`}>
	<header>
		<h1>Configure params</h1>

		<button
			class="toggle"
			on:click={() => (opened = !opened)}
			title={opened ? 'Close' : 'Open'}
			aria-label={opened ? 'Close' : 'Open'}
		/>
	</header>

	<div class="actions">
		<button class="reset-all" type="button" on:click={onResetAll}>Reset all parameters</button>
	</div>

	<form method="get" action="." data-testid="form-params" bind:this={form}>
		{#each getEntries(params) as { name, label, param, component }}
			{#await component}
				<!-- <p>Loading...</p> -->
			{:then component}
				<InputRenderer {name} {label} {param} {component} on:ready={onReady} on:update={onUpdate} />
			{:catch error}
				{@debug error}
			{/await}
		{/each}
	</form>
</div>

<style>
	.params {
		position: relative;
		--padding-left: 1rem;
		--padding-right: 1.25rem;
		padding: 0 var(--padding-right) 4rem var(--padding-left);
	}

	@media (max-width: 799px) {
		.params {
			max-height: 55vh;
		}
		.params.closed {
			height: 3.75rem;
			max-height: 100%;
			padding-bottom: 0;
		}
	}

	header {
		position: sticky;
		top: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem var(--padding-right) 1rem var(--padding-left);
		margin-left: calc(-1 * var(--padding-left));
		margin-right: calc(-1 * var(--padding-right));
		background: #202a34;
		z-index: 2;
	}
	h1 {
		margin-top: 0;
		margin-bottom: 0;
		font-weight: normal;
		font-size: 1.3rem;
	}
	@media (min-width: 800px) {
		.header {
			padding-top: 1.5rem;
		}
		h1 {
			font-size: 1.5rem;
		}
	}
	.toggle {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		width: 1rem;
		height: 1rem;
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

	.params.closed .toggle::after {
		transform: translateY(-50%) rotate(90deg);
	}

	@media (max-width: 799px) {
		.params.closed header ~ * {
			display: none;
		}
	}

	@media (min-width: 800px) {
		.toggle {
			display: none;
		}
	}

	.actions {
		margin-top: 0rem;
	}

	.reset-all {
		background: none;
		border: 1px solid #fff;
		padding: 0.5rem 1rem;
		cursor: pointer;
		border-radius: 2px;
	}

	form {
		position: relative;
		z-index: 0;
		margin-top: 1.5rem;
	}
</style>
