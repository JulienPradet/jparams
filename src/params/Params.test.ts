import Params, { Storage } from './Params.svelte';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/svelte';
import { defineParams } from './defineParams';
import { createRandom } from 'canvas-sketch-util/random';
import { describe, beforeEach, expect, it, vi, Mock, ArgumentsType } from 'vitest';

async function sleep(duration: number) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, duration);
	});
}

function extractFormData(formData: FormData) {
	const data: {
		[key in string]: any;
	} = {};
	formData.forEach((value, key) => {
		data[key] = value;
	});
	return data;
}

describe('Params.svelte', () => {
	let mockStorage: {
		[Key in keyof Storage]: Mock<ArgumentsType<Storage[Key]>, ReturnType<Storage[Key]>>;
	};

	beforeEach(() => {
		mockStorage = {
			getInitialLockState: vi.fn((name: string) => false),
			onLockUpdate: vi.fn((name: string, value: boolean) => {}),
			getInitialOpenState: vi.fn((name: string) => true),
			onOpenUpdate: vi.fn((name: string, value: boolean) => {})
		};
	});

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
				params,
				storage: mockStorage
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
					params,
					storage: mockStorage
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

			const { component } = render(Params<typeof params>, {
				props: {
					random,
					params,
					storage: mockStorage
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

		it('should not trigger a change event if the user changes a value with an invalid one', async () => {
			const user = userEvent.setup();
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
					params,
					storage: mockStorage
				}
			});

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			const textarea = await screen.findByLabelText('Name');

			await user.click(textarea);
			await user.keyboard('a');

			await sleep(100);

			expect(changeMock).not.toHaveBeenCalled();
			expect(textarea.closest('form')).toHaveFormValues({ name: '0.5' });
		});

		it('should trigger a change event upon reset all click', async () => {
			const user = userEvent.setup();
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
					params,
					storage: mockStorage
				}
			});

			random.value = vi.fn(() => 0.2);

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			await screen.findByLabelText('Name');

			await user.click(await screen.findByText('Reset all parameters'));

			await sleep(100);

			expect(changeMock).toHaveBeenCalledOnce();

			const formData: FormData = changeMock.mock.calls[0][0].detail;
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.2'
			});
		});

		it('should not trigger any change if all parameters are locked when clicking on reset all', async () => {
			const user = userEvent.setup();
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
					params,
					storage: mockStorage
				}
			});
			mockStorage.getInitialLockState.mockImplementation(() => true);

			const input = await screen.findByLabelText('Name');

			random.value = vi.fn(() => 0.2);

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			await user.click(await screen.findByText('Reset all parameters'));

			await sleep(100);

			expect(random.value).not.toHaveBeenCalled();
			expect(changeMock).not.toHaveBeenCalled();

			const formData = new FormData(input.closest('form') || undefined);
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.5'
			});
		});

		it('should  trigger if at least one parameter is not locked', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				},
				unlockedName: {
					type: 'int',
					label: 'Unlocked Name',
					value: 0.5
				}
			});

			const { component } = render(Params<typeof params>, {
				props: {
					random,
					params,
					storage: mockStorage
				}
			});
			mockStorage.getInitialLockState.mockImplementation((name) =>
				name === 'name' ? true : false
			);

			const input = await screen.findByLabelText('Name');

			random.value = vi.fn(() => 0.2);

			const changeMock = vi.fn();
			component.$on('change', changeMock);

			await user.click(await screen.findByText('Reset all parameters'));

			await sleep(100);

			expect(changeMock).toHaveBeenCalled();

			const formData: FormData = changeMock.mock.calls[0][0].detail;
			const data = extractFormData(formData);

			expect(data).toEqual({
				name: '0.5',
				unlockedName: '0.2'
			});
		});
	});

	describe('reset specific field', () => {
		it('should change param value if one clicked on reset button', async () => {
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
					params,
					storage: mockStorage
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
					params,
					storage: mockStorage
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
			expect(mockStorage.onOpenUpdate).toHaveBeenCalledWith('name', false);
			mockStorage.onOpenUpdate.mockReset();

			await user.click(
				await screen.findByRole('button', {
					name: 'Open Name'
				})
			);

			expect(await screen.findByLabelText('Name')).toBeInTheDocument();
			expect(mockStorage.onOpenUpdate).toHaveBeenCalledWith('name', true);
		});

		it('should initialize the field as closed if the storage returned false initially', async () => {
			const user = userEvent.setup();
			const random = createRandom();

			const params = defineParams(random, {
				name: {
					type: 'int',
					label: 'Name',
					value: 0.5
				}
			});

			mockStorage.getInitialOpenState.mockImplementation(() => false);
			render(Params<typeof params>, {
				props: {
					random,
					params,
					storage: mockStorage
				}
			});

			await screen.findByRole('button', {
				name: 'Open Name'
			});
			expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
		});
	});

	describe('lock', () => {
		it('should hide input upon locking a param', async () => {
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

			const onLockUpdateMock = vi.fn();
			render(Params<typeof params>, {
				props: {
					random,
					params,
					storage: mockStorage
				}
			});

			await user.click(
				await screen.findByRole('button', {
					name: 'Lock'
				})
			);

			await waitFor(async () => {
				expect(await screen.queryByLabelText('Name')).not.toBeInTheDocument();
			});

			expect(mockStorage.onLockUpdate).toHaveBeenCalledWith('name', true);
		});

		it('should start with unlock button if the param was initially locked', async () => {
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

			mockStorage.getInitialLockState.mockImplementationOnce(() => true);
			render(Params<typeof params>, {
				props: {
					random,
					params,
					storage: mockStorage
				}
			});

			await screen.findByRole('button', {
				name: 'Unlock'
			});
		});
	});
});
