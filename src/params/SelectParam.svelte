<script lang="ts">
	import { getInitialValue, InitialiazedParam, SelectParam } from './defineParams';
	import { getRandomContext } from './randomContext';

	type T = $$Generic;
	type ActualSelectParam = T extends SelectParam<infer Option> ? SelectParam<Option> : never;
	type Option = Required<ActualSelectParam>['value'];

	export let name: string;
	export let param: InitialiazedParam<ActualSelectParam>;
	export let disabled: boolean = false;
	export let value: Option;

	let select: HTMLSelectElement;

	function onChange(event: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
		const newValue = event.currentTarget.value;
		value = newValue;

		select.closest('form')?.dispatchEvent(
			new Event('programmaticChange', {
				bubbles: true,
				cancelable: true
			})
		);
	}

	const random = getRandomContext();

	export const onReset = () => {
		value = getInitialValue(random, name, param);
		select.closest('form')?.dispatchEvent(
			new Event('programmaticChange', {
				bubbles: true,
				cancelable: true
			})
		);
	};
</script>

<select {name} {value} {disabled} on:change={onChange} bind:this={select}>
	{#each param.options as option}
		<option>{option}</option>
	{/each}
</select>

<style>
	select {
		width: 100%;
		appearance: none;
		height: calc(1.6rem + 2px);
		padding: 1px 0.5rem 0;
		background: transparent;
		border: 1px solid #000;
	}

	select:focus {
		outline: none;
		border-color: #fff;
	}

	option {
		color: #000;
		background: transparent;
	}
</style>
