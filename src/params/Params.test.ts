import Params from './Params.svelte';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/svelte';
import { defineParams } from './defineParams';
import { createRandom } from 'canvas-sketch-util/random';
import { describe, expect, it, vi } from 'vitest';

async function sleep(duration: number) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, duration);
	});
}

describe('Params.svelte', () => {
	it('should render an int parameter', async () => {
		const random = createRandom();

		const params = defineParams(random, {
			name: {
				type: 'int',
				label: 'Name',
				value: 0.5
			}
		});

		render(Params<typeof params>, {
			props: {
				random,
				params
			}
		});

		expect(await screen.findByLabelText('Name')).toBeInTheDocument();
		expect(await screen.findByTestId('form-params')).toHaveFormValues({ name: '0.5' });
	});

	describe('events', () => {
		it('should trigger an init event once Params has finished rendering', async () => {
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			const { component } = render(Params<typeof params>, {
				props: {
					random,
					params
				}
			});

			const initMock = vi.fn();
			component.$on('init', initMock);

			expect(await screen.findByLabelText('Name')).toBeInTheDocument();

			expect(initMock).toHaveBeenCalledOnce();

			const formData: FormData = initMock.mock.calls[0][0].detail;
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.5'
			});
		});

		it('should trigger a change event if the user changes a value', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			const { component, container } = render(Params<typeof params>, {
				props: {
					random,
					params
				}
			});

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			const textarea = await screen.findByLabelText('Name');

			await user.click(textarea);
			await user.keyboard('6');

			await sleep(100);

			expect(changeMock).toHaveBeenCalledOnce();

			const formData: FormData = changeMock.mock.calls[0][0].detail;
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.56'
			});
		});

		it.skip('should not trigger a change event if the user changes a value with an invalid one', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			const { component, container } = render(Params<typeof params>, {
				props: {
					random,
					params
				}
			});

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			const textarea = await screen.findByLabelText('Name');

			await user.click(textarea);
			await user.keyboard('a');

			await sleep(100);

			expect(changeMock).toHaveBeenCalledOnce();

			const formData: FormData = changeMock.mock.calls[0][0].detail;
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.5'
			});
		});

		it('should trigger a resetAll event upon reset click', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			const { component, container } = render(Params<typeof params>, {
				props: {
					random,
					params
				}
			});

			const resetAllMock = vi.fn();
			component.$on('resetAll', resetAllMock);

			await screen.findByLabelText('Name');

			await user.click(await screen.findByText('Reset all parameters'));

			expect(resetAllMock).toHaveBeenCalledOnce();
		});
	});

	describe('open/close', () => {
		it('should hide input and reset button if one clicks on the Close button of a field', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			render(Params<typeof params>, {
				props: {
					random,
					params
				}
			});

			await user.click(
				await screen.findByRole('button', {
					name: 'Close Name'
				})
			);

			await waitFor(async () => {
				expect(await screen.queryByLabelText('Name')).not.toBeInTheDocument();
			});

			await user.click(
				await screen.findByRole('button', {
					name: 'Open Name'
				})
			);

			expect(await screen.findByLabelText('Name')).toBeInTheDocument();
		});
	});

	describe('reset specific field', () => {
		it('should hide input and reset button if one clicks on the Close button of a field', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			random.value = vi.fn(() => 0.2);

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			const { component } = render(Params<typeof params>, {
				props: {
					random,
					params
				}
			});

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			await user.click(
				await screen.findByRole('button', {
					name: 'Reset'
				})
			);

			await sleep(100);

			const formData: FormData = changeMock.mock.calls[0][0].detail;
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.2'
			});
		});
	});
});

function extractFormData(formData: FormData) {
	const data: {
		[key in string]: any;
	} = {};
	formData.forEach((value, key) => {
		data[key] = value;
	});
	return data;
}
