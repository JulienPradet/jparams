<script lang="ts">
	import { clamp } from 'canvas-sketch-util/math';
	import { Color } from '../color/Color';
	import { hsvToRgb } from '../color/hsvToRgb';
	import { hexToRgb, rgbToHsv } from '../color/rgbToHsv';
	import BaseInput from './BaseInput.svelte';
	import { ColorParam, getInitialValue, InitialiazedParam } from './defineParams';
	import DraggableInput from './DraggableInput.svelte';
	import { getRandomContext } from './randomContext';

	export let name: string;
	export let param: InitialiazedParam<ColorParam>;
	export let disabled: boolean = false;

	let wrapper: HTMLElement;
	let copied = false;
	let value = param.value;
	let stringifiedValue = [
		valueToInput(value[0]),
		valueToInput(value[1]),
		valueToInput(value[2]),
		valueToInput(value[3])
	];

	function getRgba(value: Color) {
		let rgb = hsvToRgb(value[0], value[1], value[2]);
		return `rgba(${rgb[0]} ${rgb[1]} ${rgb[2]} / ${value[3]})`;
	}

	function getTextDiffRgba(value: Color) {
		if (value[1] > 0.8 || value[2] < 0.75 || value[3] < 0.4) {
			return `rgb(255 255 255 / ${disabled ? '0.6' : '1'})`;
		} else {
			return `rgb(0 0 0 / ${disabled ? '0.6' : '1'})`;
		}
	}

	function onChange(index: number, event: CustomEvent<{ value: string }>) {
		const newValue = clamp(Number(event.detail.value), 0, 1);
		if (Number.isNaN(newValue)) {
			value[index] = value[index];
			stringifiedValue[index] = stringifiedValue[index];
		} else {
			stringifiedValue[index] = event.detail.value;
			value[index] = newValue;
			copied = false;
		}
	}

	const random = getRandomContext();

	export const onReset = () => {
		value = getInitialValue(random, name, param);
		stringifiedValue = [
			valueToInput(value[0]),
			valueToInput(value[1]),
			valueToInput(value[2]),
			valueToInput(value[3])
		];
		copied = false;
	};

	function roundDecimal(value: number) {
		return Math.round(value * 1000) / 1000;
	}

	function valueToInput(value: number) {
		if ((value * 10) % 1 !== 0) {
			return roundDecimal(value).toString();
		} else {
			return value.toString();
		}
	}

	function hueToCode(value: number) {
		return `${Math.round(value * 360)} / 360`;
	}

	async function copy() {
		let code: string;
		if (value[3] === 1) {
			code = `Color(${hueToCode(value[0])}, ${roundDecimal(value[1])}, ${roundDecimal(value[2])})`;
		} else {
			code = `Color(${hueToCode(value[0])}, ${roundDecimal(value[1])}, ${roundDecimal(
				value[2]
			)}, ${roundDecimal(value[3])})`;
		}

		await navigator.clipboard.writeText(code);
		copied = true;
	}

	function updateFromPasteText(paste: string): boolean {
		let updatedColor: Color | undefined;
		const hsvMatch =
			/Color\((\d*\.?\d*)( ?\/ ?360)?, ?(\d*\.?\d*), ?(\d*\.?\d*)(, ?(\d*\.?\d*))?\)/.exec(paste);

		if (/#[0-9a-fA-F]{6}/.test(paste) || /#[0-9a-fA-F]{8}/.test(paste)) {
			const rgb = hexToRgb(paste);
			updatedColor = Color(...rgbToHsv(rgb[0], rgb[1], rgb[2]), rgb[3] / 255);
		} else if (hsvMatch) {
			const hue = hsvMatch[2] ? Number(hsvMatch[1]) / 360 : Number(hsvMatch[1]);
			const saturation = Number(hsvMatch[3]);
			const value = Number(hsvMatch[4]);
			const alpha = hsvMatch[6] ? Number(hsvMatch[6]) : 1;

			if (
				!Number.isNaN(hue) &&
				!Number.isNaN(saturation) &&
				!Number.isNaN(value) &&
				!Number.isNaN(alpha)
			) {
				updatedColor = Color(hue, saturation, value, alpha);
			}
		}

		if (updatedColor) {
			value = updatedColor;

			wrapper.closest('form')?.dispatchEvent(
				new Event('programmaticChange', {
					bubbles: true,
					cancelable: true
				})
			);
			return true;
		}

		return false;
	}

	async function paste() {
		const paste = await navigator.clipboard.readText();
		updateFromPasteText(paste);
	}

	function onPaste(event: ClipboardEvent) {
		let paste = event.clipboardData?.getData('text')?.trim();
		if (event.type !== 'paste' || !paste) {
			return;
		}

		const hasUpdated = updateFromPasteText(paste);
		if (hasUpdated) {
			event.preventDefault();
		}
	}
</script>

<div
	class="wrapper"
	style={`--color: ${getRgba(value)}; --text-color: ${getTextDiffRgba(value)}`}
	bind:this={wrapper}
	on:paste={disabled ? () => {} : onPaste}
>
	<div class="inputs">
		<DraggableInput
			on:mount
			on:update={onChange.bind(null, 0)}
			value={stringifiedValue[0]}
			maxPrecision={3}
			{disabled}
		>
			<div class="inline">
				<label for={`${name}[0]`}>h:</label>
				<BaseInput
					label={`${param.label} hue`}
					name={`${name}[0]`}
					type="number"
					step="0.001"
					value={stringifiedValue[0]}
					{disabled}
					on:change={onChange.bind(null, 0)}
					--border="none"
				/>
			</div>
			<svelte:fragment slot="text">
				h:<span contenteditable="true">{stringifiedValue[0]}</span>
			</svelte:fragment>
		</DraggableInput>

		<DraggableInput
			on:update={onChange.bind(null, 1)}
			value={stringifiedValue[1]}
			maxPrecision={3}
			{disabled}
		>
			<div class="inline">
				<label for={`${name}[0]`}>s:</label>
				<BaseInput
					label={`${param.label} saturation`}
					name={`${name}[1]`}
					type="number"
					step="0.001"
					value={stringifiedValue[1]}
					{disabled}
					on:change={onChange.bind(null, 1)}
					--border="none"
				/>
			</div>
			<svelte:fragment slot="text">
				s:<span contenteditable="true">{stringifiedValue[1]}</span>
			</svelte:fragment>
		</DraggableInput>

		<DraggableInput
			on:update={onChange.bind(null, 2)}
			value={stringifiedValue[2]}
			maxPrecision={3}
			{disabled}
		>
			<div class="inline">
				<label for={`${name}[0]`}>v:</label>
				<BaseInput
					label={`${param.label} value`}
					name={`${name}[2]`}
					type="number"
					step="0.001"
					value={stringifiedValue[2]}
					{disabled}
					on:change={onChange.bind(null, 2)}
					--border="none"
				/>
			</div>
			<svelte:fragment slot="text">
				v:<span contenteditable="true">{stringifiedValue[2]}</span>
			</svelte:fragment>
		</DraggableInput>

		<DraggableInput on:update={onChange.bind(null, 3)} value={stringifiedValue[3]} {disabled}>
			<div class="inline">
				<label for={`${name}[0]`}>a:</label>
				<BaseInput
					label={`${param.label} alpha`}
					name={`${name}[3]`}
					type="number"
					step="0.001"
					value={stringifiedValue[3]}
					{disabled}
					on:change={onChange.bind(null, 3)}
					--border="none"
				/>
			</div>
			<svelte:fragment slot="text">
				a:<span contenteditable="true">{stringifiedValue[3]}</span>
			</svelte:fragment>
		</DraggableInput>
	</div>
	<div class="preview">
		<button class="clipboard-button" type="button" on:click={copy}>
			{copied ? 'Done' : 'Copy'}
		</button>
		<button class="clipboard-button" type="button" on:click={paste} {disabled}>Paste</button>
	</div>
</div>

<style>
	.wrapper {
		display: grid;
		grid-template-columns: 4fr 1fr;
		grid-template-rows: 1fr;
		grid-template-areas: 'Inputs Preview';

		border: 1px solid #000000;
	}

	.inputs {
		grid-area: Inputs;
	}

	.inputs > :global(* + *) {
		border-top: 1px solid #17212b;
	}

	.inline {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	label {
		color: #fff;
	}

	.preview {
		position: relative;
		grid-area: Preview;
		border-left: 1px solid #17212b;
		background-color: #707070;
		background-image: linear-gradient(45deg, #606060 25%, transparent 25%),
			linear-gradient(-45deg, #606060 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #606060 75%),
			linear-gradient(-45deg, transparent 75%, #606060 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		border-left: 1px solid #000;
	}

	.preview::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background: var(--color);
	}

	.clipboard-button {
		position: relative;
		border: none;
		background: none;
		color: var(--text-color);
		transition: color 0.3s ease-in-out;
		/* mix-blend-mode: difference; */
	}
	.clipboard-button:hover,
	.clipboard-button:focus {
		cursor: pointer;
	}

	.clipboard-button[disabled] {
		opacity: 0.6;
	}
</style>
