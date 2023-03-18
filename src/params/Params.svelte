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

	type T = $$Generic;
	type ActualParamsDefinition = T extends ParamsDefinition ? T : never;
	type ActualParams = Params<ActualParamsDefinition>;

	export let params: ActualParams;
	export let random: CanvasSketchUtilRandom;
	export let storage: Storage;

	let form: HTMLFormElement;

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

	const onUpdate = debounce(function onUpdate() {
		if (!form || isFirstUpdate) {
			return;
		}

		const data = new FormData(form);
		dispatch('change', data);
	}, 100);

	let isFirstUpdate = true;
	let inputsReady: { [key in keyof ActualParams]: boolean | undefined } = {} as {
		[key in keyof ActualParams]: boolean;
	};

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

	async function onResetAll() {
		const keys = getKeysFromParams(params);
		const unlockedKeys = keys.filter((key) => !lockContext.isLockedKey(key));
		if (unlockedKeys.length === 0) {
			return;
		}

		params = resetAll(random, params, unlockedKeys);
		await tick();
		onUpdate();
	}

	beforeUpdate(() => {
		isFirstUpdate = true;
		inputsReady = {} as {
			[key in keyof ActualParams]: boolean;
		};
	});
</script>

<div class="params">
	<header>
		<h1>Configure params</h1>
	</header>

	<button class="reset-all" type="button" on:click={onResetAll}>Reset all parameters</button>

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
	h1 {
		margin-top: 0;
		margin-bottom: 2rem;
		font-weight: normal;
	}

	:global(button) {
		color: currentColor;
		font-size: inherit;
		font-family: inherit;
	}

	.reset-all {
		background: none;
		border: 1px solid #fff;
		padding: 0.5rem 1rem;
		cursor: pointer;
	}

	form {
		margin-top: 1rem;
	}

	/**
    * Visually hide an element, but leave it available for screen readers
    * @link https://github.com/h5bp/html5-boilerplate/blob/49b7a124699d719b6bd5f0655225e7e8f471da3e/dist/css/style.css#L109
    * @link http://snook.ca/archives/html_and_css/hiding-content-for-accessibility
    */
	.params :global(.screen-reader) {
		appearance: none;
		border: 0;
		clip: rect(0 0 0 0);
		height: 1px;
		margin: -1px;
		overflow: hidden;
		padding: 0;
		position: absolute;
		white-space: nowrap;
		width: 1px;
	}
</style>
