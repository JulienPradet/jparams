<script lang="ts">
	import { clamp } from 'canvas-sketch-util/math';
	import { afterUpdate, beforeUpdate, createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { throttle } from '../util/throttle';

	export let name: string;
	export let label: string;
	export let prefix: string = '';
	export let value: string;
	export let maxPrecision: number = 10;
	export let disabled: boolean = false;

	let progress: number;
	let clickTarget: HTMLSpanElement;
	let wrapper: HTMLElement;
	let dragging: boolean = false;

	let startRangeBefore: number | undefined = undefined;
	let endRangeBefore: number | undefined = undefined;

	function onDragStart(event: MouseEvent | TouchEvent) {
		if (!contentEditable) {
			return;
		}

		if (document.activeElement === contentEditable) {
			startRangeBefore = window.getSelection()?.getRangeAt(0).startOffset || undefined;
			endRangeBefore = window.getSelection()?.getRangeAt(0).endOffset || undefined;
			contentEditable.blur();
		} else {
			startRangeBefore = undefined;
			endRangeBefore = undefined;
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
		}

		dragging = true;
		onClick(event);

		window.addEventListener('mousemove', onClick);
		window.addEventListener('mouseup', onDragEnd);
		window.addEventListener('touchmove', onClick, { passive: false });
		window.addEventListener('touchend', onDragEnd, { passive: false });
	}

	function onDragEnd(event: MouseEvent | TouchEvent) {
		onClick(event);

		window.removeEventListener('mousemove', onClick);
		window.removeEventListener('mouseup', onDragEnd);
		window.removeEventListener('touchmove', onClick);
		window.removeEventListener('touchend', onDragEnd);

		requestAnimationFrame(() => {
			setRange(startRangeBefore, endRangeBefore);
			dragging = false;
		});
	}

	let lastPosition = 0;
	function getPosition(event: MouseEvent | TouchEvent) {
		if ('touches' in event) {
			if (event.touches.length > 0) {
				return event.touches[0].clientX;
			}
			return lastPosition;
		} else {
			return event.clientX;
		}
	}

	function onClick(event: MouseEvent | TouchEvent) {
		event.preventDefault();

		const bb = clickTarget.getBoundingClientRect();
		const minX = bb.left;
		const maxX = bb.right;
		const position = (lastPosition = getPosition(event));

		value = clamp((position - minX) / (maxX - minX), 0, 1).toFixed(maxPrecision);
	}

	const updateFromScroll = throttle((event: WheelEvent) => {
		const step = event.shiftKey ? 0.02 : 0.001;

		event.preventDefault();
		if (event.deltaY < 0) {
			value = clamp(Number(value) + step, 0, 1).toFixed(maxPrecision);
		} else {
			value = clamp(Number(value) - step, 0, 1).toFixed(maxPrecision);
		}

		requestAnimationFrame(() => {
			setRange();
		});
	}, 50);

	const onScroll = function onScroll(event: WheelEvent) {
		if (!wrapper.contains(document.activeElement)) {
			return;
		}

		event.preventDefault();
		updateFromScroll(event);
	};

	let input: HTMLTextAreaElement | null = null;
	let contentEditable: HTMLElement | null = null;

	/* Using this technique not to have non passive events on the page as long
    as the input is not focused */
	onMount(() => {
		if (!disabled) {
			input = wrapper.querySelector('textarea');
			contentEditable = wrapper.querySelector('[contenteditable]');

			input?.addEventListener('focus', onFocus);
			contentEditable?.addEventListener('focus', onFocus);
		}
	});

	afterUpdate(() => {
		input?.removeEventListener('focus', onFocus);
		contentEditable?.removeEventListener('focus', onFocus);

		if (!disabled) {
			input = wrapper.querySelector('textarea');
			contentEditable = wrapper.querySelector('[contenteditable]');
			input?.addEventListener('focus', onFocus);
			contentEditable?.addEventListener('focus', onFocus);
		}
	});

	onDestroy(() => {
		input?.removeEventListener('focus', onFocus);
		contentEditable?.addEventListener('focus', onFocus);
	});

	const setRange = (start?: number, end?: number) => {
		if (!contentEditable) {
			return;
		}

		if (typeof start === 'undefined') {
			start = contentEditable.textContent?.length || 0;
		}
		if (typeof end === 'undefined') {
			end = start;
		}

		const range = document.createRange();
		const contentText = contentEditable.firstChild;
		if (contentText) {
			range.setStart(contentText, start);
			range.setEnd(contentText, end);

			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
				selection.addRange(range);
			}
		} else {
			contentEditable.focus();
		}
	};

	const setSelection = () => {
		if (!contentEditable || document.activeElement === contentEditable) {
			return;
		}

		if (input && document.activeElement === input) {
			requestAnimationFrame(() => {
				if (!contentEditable) {
					return;
				}

				if (input) {
					setRange(input.selectionStart, input.selectionEnd);
				} else {
					setRange();
				}
			});
		} else {
			setRange();
		}
	};

	const onFocus = function onFocus(this: HTMLElement, event: FocusEvent) {
		if (!contentEditable) {
			return;
		}

		setSelection();

		contentEditable.addEventListener('keyup', onChange);
		wrapper.addEventListener('wheel', onScroll);
		contentEditable.addEventListener('blur', () => {
			if (contentEditable) {
				wrapper.removeEventListener('wheel', onScroll);
				contentEditable.removeEventListener('keyup', onChange);
			}
		});
	};

	const onChange = function onChange(event: Event) {
		if (!contentEditable) {
			return;
		}

		const newValue = contentEditable.textContent || '';
		if (Number.isNaN(Number(newValue))) {
			let rangePosition = Math.min(value.length, newValue.replace(/[^\.\d].+/, '').length);
			contentEditable.textContent = value;
			requestAnimationFrame(() => {
				setRange(rangePosition, rangePosition);
			});
		} else {
			value = newValue;
		}
	};

	$: {
		progress = Number(value) * 100;
	}

	const id = Math.random().toString().slice(2);
</script>

<div
	class={`wrapper ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
	style={`--progress: ${progress.toFixed(1)}%; --input-width: ${maxPrecision + 5}ch`}
	bind:this={wrapper}
>
	<div class="input">
		<label for={id} aria-label={label} class={prefix ? '' : 'screen-reader'}>{prefix}</label>
		<textarea {...$$props} {disabled} {name} {id} bind:value />
	</div>
	<div class="hover">
		<span class="hover-inner">
			{#if prefix}<span>{prefix}</span>{/if}
			<span contenteditable="true">{value}</span>
		</span>
	</div>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<span
		class="cursor"
		on:mousedown={disabled ? () => {} : onDragStart}
		on:touchstart|passive={disabled ? () => {} : onDragStart}
		bind:this={clickTarget}
	/>
</div>

<style>
	.wrapper {
		position: relative;
		display: flex;
		align-items: center;
		overscroll-behavior: none;
		background: linear-gradient(
			90deg,
			var(--color, #fff) var(--progress),
			transparent var(--progress)
		);
	}

	.wrapper.disabled {
		pointer-events: none;
	}

	.input {
		width: var(--input-width);
	}

	.hover {
		position: absolute;
		pointer-events: none;
		z-index: 5;
		top: 0;
		bottom: 0;
		left: 0;
		width: var(--progress);
		display: flex;
		align-items: center;
		white-space: nowrap;
		overflow: hidden;
		color: var(--text-color, #000);
		transition: color 0.3s ease-in-out;
		border-right: 2px solid #000;
	}
	.wrapper.disabled .hover {
		color: var(--text-color, rgba(0 0 0 / 0.6));
	}
	.hover::before {
		position: absolute;
		content: '';
		top: 1px;
		left: 1px;
		bottom: 1px;
		right: 2px;
		background: var(--color, #fff);
	}

	.hover:focus-within {
		z-index: 30;
	}

	.wrapper:focus-within .hover,
	.wrapper.dragging .hover {
		border-color: #fff;
	}

	.hover-inner {
		pointer-events: none;
		position: absolute;
	}
	.hover-inner:focus-within {
		background: var(--color, #fff);
	}
	.hover-inner:focus-within {
		pointer-events: all;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		outline: none;
		background: var(--color, #fff);
	}
	.hover-inner [contenteditable]:focus {
		outline: none;
	}

	.wrapper:focus-within::before,
	.wrapper.dragging::before {
		content: '';
		position: absolute;
		z-index: 2;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		border: 1px solid #fff;
	}

	.wrapper:focus-within .hover {
		overflow: visible;
	}

	.wrapper:focus-within textarea {
		opacity: 0;
	}

	.cursor {
		cursor: pointer;
		position: absolute;
		z-index: 10;
		display: block;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		height: 50%;
	}
	.cursor::after {
		content: '';
		position: absolute;
		left: var(--input-width);
		top: -100%;
		right: 0;
		bottom: 0;
	}

	textarea {
		display: block;
		width: 100%;
		height: 1.6rem;
		line-height: 1.6rem;
		padding: 1px 0 0;
		background: transparent;
		border: none;
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

	.input,
	.hover-inner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: 0.5rem;
	}
</style>
