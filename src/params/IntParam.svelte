<script lang="ts">
	import { getInitialValue, InitialiazedParam, IntParam } from './defineParams';
	import DraggableInput from './DraggableInput.svelte';
	import { getRandomContext } from './randomContext';

	export let name: string;
	export let param: InitialiazedParam<IntParam>;
	export let disabled: boolean;
	export let value: number;
	export const onReset = () => {
		value = getInitialValue(random, param);
		stringifiedValue = value.toString();
	};

	let stringifiedValue = value.toString();

	$: {
		const newValue = Number(stringifiedValue);
		if (Number.isNaN(newValue)) {
			stringifiedValue = value.toString();
		} else {
			value = newValue;
		}
	}

	const random = getRandomContext();
</script>

<div class="wrapper">
	<DraggableInput label={param.label} {name} {disabled} bind:value={stringifiedValue} />
</div>

<style>
	.wrapper {
		border: 1px solid #000000;
	}
</style>
