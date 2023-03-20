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

	export let container: HTMLElement | null = null;

	let form: HTMLFormElement;
	let opened = window.matchMedia('(min-width: 800px)').matches ? true : false;

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

<div class={`canvas-page ${opened ? '' : 'closed'}`}>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="canvas-page__canvas" bind:this={container} on:click={onResetAll} />
	<aside class="canvas-page__params">
		<button
			class="toggle"
			on:click={() => (opened = !opened)}
			title={opened ? 'Close' : 'Open'}
			aria-label={opened ? 'Close' : 'Open'}
		/>
		<div class="params">
			<header>
				<h1>Configure params</h1>
			</header>

			<div class="actions">
				<button class="reset-all" type="button" on:click={onResetAll}>Reset all parameters</button>
			</div>

			<form method="get" action="." data-testid="form-params" bind:this={form}>
				{#each getEntries(params) as { name, label, param, component }}
					{#await component}
						<!-- <p>Loading...</p> -->
					{:then component}
						<InputRenderer
							{name}
							{label}
							{param}
							{component}
							on:ready={onReady}
							on:update={onUpdate}
						/>
					{:catch error}
						{@debug error}
					{/await}
				{/each}
			</form>
		</div>
	</aside>
</div>

<style>
	.canvas-page {
		display: grid;
		height: 100vh;
		max-height: 100vh;
		max-height: 100dvh;
		width: 100vw;
		overflow: hidden;
		transition: grid-template-rows 0.3s ease-in-out, grid-template-columns 0.3s ease-in-out;
	}

	.canvas-page__canvas {
		grid-area: Canvas;
		max-width: 100vw;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		color: #2c3e50;
		user-select: none;
		overflow: hidden;
	}

	.canvas-page__params {
		position: relative;
		grid-area: Params;
	}

	.canvas-page__canvas > :global(*) {
		display: block;
		max-width: 100%;
		max-height: 100%;
		width: 100%;
		height: auto;
		transform: none !important;
	}

	.params {
		position: relative;
		overflow: auto;
		--padding-left: 1rem;
		--padding-right: 1.25rem;
		color: #fff;
		padding: 0 var(--padding-right) 4rem var(--padding-left);
		background: linear-gradient(180deg, #202a34, #17212b);
		opacity: 1;
		transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
	}

	.closed .params {
		opacity: 0;
		pointer-events: none;
	}

	.toggle {
		position: absolute;
		top: -2rem;
		height: 2rem;
		left: 0;
		right: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.toggle::before {
		content: '';
		position: absolute;
		top: 1rem;
		left: 50%;
		transform: translate(-50%, -50%);
		height: 4px;
		width: 4rem;
		background: #202a34;
		transition: transform 0.3s cubic-bezier(1, 0, 0, 1);
		margin: 0;
		border-radius: 2px;
	}

	@media (max-width: 799px) {
		.canvas-page {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr 55vh;
			grid-template-areas:
				'Canvas'
				'Params';
			transition: grid-template-rows 0.3s ease-in-out;
		}

		.closed.canvas-page {
			grid-template-rows: 1fr 0;
		}
		.params {
			height: 55vh;
		}
		.closed .params {
			transform: translateY(100%);
		}
	}

	@media (min-width: 800px) {
		.canvas-page {
			grid-template-areas: 'Params Canvas';
			grid-template-columns: 20rem 1fr;
			grid-template-rows: 1fr;
			transition: grid-template-columns 0.3s ease-in-out;
		}

		.canvas-page.closed {
			grid-template-columns: 0 1fr;
		}

		.canvas-page__params {
			width: 20rem;
		}

		.params {
			height: 100%;
			width: 20rem;
		}

		.closed .params {
			transform: translateX(-50%);
		}

		.toggle {
			top: 0;
			bottom: 0;
			left: auto;
			right: -2rem;
			width: 2rem;
			height: 100%;
			transition: right 0.2s ease-in-out;
		}

		.toggle::before {
			height: 4rem;
			width: 4px;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}

		.closed .toggle {
			right: calc(100% - 2rem);
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
