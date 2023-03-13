<script lang="ts">
	import BaseInput from './BaseInput.svelte';
	import { getInitialValue, IntParam, InitialiazedParam } from './defineParams';
	import DraggableInput from './DraggableInput.svelte';
	import { getRandomContext } from './randomContext';

	export let name: string;
	export let param: InitialiazedParam<IntParam>;
	export let disabled: boolean;

	let value = param.value;
	let stringifiedValue = value.toString();

	function onChange(event: CustomEvent<{ value: string }>) {
		const newValue = Number(event.detail.value);

		if (Number.isNaN(newValue)) {
			value = value;
			stringifiedValue = stringifiedValue;
		} else {
			stringifiedValue = event.detail.value;
			value = newValue;
		}
	}

	const random = getRandomContext();

	export const onReset = () => {
		value = getInitialValue(random, name, param);
		stringifiedValue = value.toString();
	};
</script>

<div class="wrapper">
	<DraggableInput {disabled} on:update={onChange} value={stringifiedValue}>
		<BaseInput
			label={param.label}
			{name}
			value={stringifiedValue}
			{disabled}
			on:change={onChange}
			--border="none"
		/>
		<svelte:fragment slot="text"
			><span contenteditable="true">{stringifiedValue}</span></svelte:fragment
		>
	</DraggableInput>
</div>

<style>
	.wrapper {
		border: 1px solid #000000;
	}
</style>
