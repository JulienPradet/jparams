<svelte:options accessors />

<script lang="ts">
	import { CanvasSketchUtilRandom } from 'canvas-sketch-util/random';
	import { createEventDispatcher, onDestroy, onMount, beforeUpdate } from 'svelte';
	import { SvelteComponentTyped } from 'svelte/internal';
	import debounce from '../util/debounce';
	import { Params, ParamsDefinition, ParamTypes, InitialiazedParam } from './defineParams';
	import InputRenderer from './InputRenderer.svelte';
	import { setRandomContext } from './randomContext';

	type T = $$Generic;
	type ActualParamsDefinition = T extends ParamsDefinition ? T : never;
	type ActualParams = Params<ActualParamsDefinition>;

	export let params: ActualParams;
	export let random: CanvasSketchUtilRandom;

	let form: HTMLFormElement;

	const componentsMap = {
		int: async () => (await import('./IntParam.svelte')).default,
		string: async () => (await import('./StringParam.svelte')).default,
		color: async () => (await import('./ColorParam.svelte')).default,
		select: async () => (await import('./SelectParam.svelte')).default
	};

	type InputComponents = {
		[key in keyof ParamTypes]: Awaited<ReturnType<(typeof componentsMap)[key]>>;
	};

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

	async function getInputRendererProps<
		Key extends keyof ActualParamsDefinition,
		Param extends ActualParams[Key],
		Type extends ActualParamsDefinition[Key]['type']
	>(component: InputComponents[Type], name: Key, param: Param) {
		type Props = InputComponents[Type] extends typeof SvelteComponentTyped<
			infer P extends Record<string, any>
		>
			? P
			: never;

		return {
			component: component,
			props: {
				name: name,
				param: param
			} as any as Props
		};
	}

	function getEntries(params: Params<ActualParamsDefinition>) {
		type EntryPropsFunction<Key extends keyof ActualParamsDefinition> =
			typeof getInputRendererProps<
				Key,
				InitialiazedParam<ActualParamsDefinition[Key]>,
				ActualParamsDefinition[Key]['type']
			>;

		type Entry<Key extends keyof ActualParamsDefinition> = {
			name: string;
			label: string;
			props: ReturnType<EntryPropsFunction<Key>>;
		};

		let entries: Array<Entry<keyof ActualParamsDefinition>> = [];

		for (let key in params) {
			const param = params[key];
			entries.push({
				name: key,
				label: param.label || key,
				props: componentsPromise.then((components) =>
					getInputRendererProps(components[param.type], key, param)
				)
			});
		}

		return entries;
	}

	const dispatch = createEventDispatcher<{
		change: FormData;
		init: FormData;
		reset: keyof ActualParams;
		resetAll: undefined;
	}>();

	const listenChanges = debounce(function listenChanges(form: HTMLFormElement | null) {
		if (!form || isFirstUpdate) {
			return;
		}

		const data = new FormData(form);
		dispatch('change', data);
	}, 100);

	const listenProgrammaticFormChanges = (event: Event) => {
		listenChanges(event.target as HTMLFormElement);
	};

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

	function onResetAll() {
		dispatch('resetAll');
	}

	setRandomContext(random);

	onMount(() => {
		if (form) {
			form.addEventListener('programmaticChange', listenProgrammaticFormChanges);
		}
	});

	beforeUpdate(() => {
		isFirstUpdate = true;
		inputsReady = {} as {
			[key in keyof ActualParams]: boolean;
		};
	});

	onDestroy(() => {
		if (form) {
			form.removeEventListener('programmaticChange', listenProgrammaticFormChanges);
		}
	});
</script>

<div class="params">
	<header>
		<h1>Configure params</h1>
	</header>

	<button class="reset-all" type="button" on:click={onResetAll}>Reset all parameters</button>

	<form
		method="get"
		action="."
		data-testid="form-params"
		on:change={(event) => listenChanges(event.currentTarget)}
		bind:this={form}
	>
		{#each getEntries(params) as { name, label, props }}
			{#await props}
				<!-- <p>Loading...</p> -->
			{:then props}
				<InputRenderer {name} {label} {props} on:ready={onReady} />
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
