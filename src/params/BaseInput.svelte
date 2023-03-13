<script lang="ts">
	import { afterUpdate, createEventDispatcher } from 'svelte';

	export let label: string;
	export let value: string;
	export let name: string;
	export let disabled: boolean = false;

	let input: HTMLTextAreaElement;
	let previouslySentValue: string = value;

	const dispatch = createEventDispatcher();

	function dispatchChange(value: string) {
		dispatch('change', {
			value: value
		});
		input.closest('form')?.dispatchEvent(
			new CustomEvent('programmaticChange', {
				bubbles: true,
				cancelable: true
			})
		);
	}

	function onChange(event: { currentTarget: EventTarget & HTMLTextAreaElement }) {
		dispatchChange(event.currentTarget.value);
	}

	afterUpdate(() => {
		if (input.value !== previouslySentValue) {
			previouslySentValue = input.value;
			dispatchChange(previouslySentValue);
		}
	});
</script>

<label class="screen-reader" for={name}>{label}</label>
<textarea
	{...$$props}
	{disabled}
	{name}
	id={name}
	on:keyup={disabled ? () => {} : onChange}
	on:change={disabled ? () => {} : onChange}
	bind:this={input}
	bind:value
/>

<style>
	textarea {
		display: block;
		width: 100%;
		height: 1.6rem;
		line-height: 1.6rem;
		padding: 1px 0 0;
		background: transparent;
		border: var(--border, 1px solid #fff);
		color: #fff;
		font-family: inherit;
		font-size: 1em;
		resize: none;
		overflow: hidden;
	}

	textarea:disabled {
		pointer-events: none;
		color: rgba(255 255 255 / 0.6);
	}

	textarea:focus {
		outline: none;
	}

	textarea[type='number']::-webkit-outer-spin-button,
	textarea[type='number']::-webkit-inner-spin-button {
		appearance: none;
		margin: 0;
	}
</style>
