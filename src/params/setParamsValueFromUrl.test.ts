import { createRandom } from 'canvas-sketch-util/random';
import { describe, expect, it, vi } from 'vitest';
import { defineParams } from './defineParams';
import { setParamsValueFromUrl } from './setParamsValueFromUrl';

describe('setParamsValueFromUrl', () => {
	const random = createRandom();

	it('should parse a simple URL query', () => {
		let params = defineParams(random, {
			name: {
				type: 'int'
			}
		});

		params = setParamsValueFromUrl(random, params, new URL('https://localhost/?name=0.1'));

		expect(params.name.value).toEqual(0.1);
	});

	it('should not throw if a value is not available in the URL', () => {
		const random = createRandom();
		random.value = vi.fn(() => 0.5);
		let params = defineParams(random, {
			name: {
				type: 'int'
			}
		});

		params = setParamsValueFromUrl(random, params, new URL('https://localhost/.foo=bar'));

		expect(params.name.value).toEqual(0.5);
	});

	it('should parse be able to parse multiple parameters in a single URL', () => {
		let params = defineParams(random, {
			name: {
				type: 'int'
			},
			foo: {
				type: 'int'
			}
		});

		params = setParamsValueFromUrl(random, params, new URL('https://localhost/?name=0.1&foo=0.2'));

		expect(params.name.value).toEqual(0.1);
		expect(params.foo.value).toEqual(0.2);
	});

	it('should be able to set int parameters from a URL', () => {
		let params = defineParams(random, {
			number: {
				type: 'int'
			}
		});
		params = setParamsValueFromUrl(random, params, new URL('https://localhost/?number=0.25'));
		expect(params.number.value).toEqual(0.25);
	});

	it('should be able to set color parameters from a URL', () => {
		let params = defineParams(random, {
			background: {
				type: 'color'
			}
		});
		params = setParamsValueFromUrl(
			random,
			params,
			new URL(
				'https://localhost/?background[0]=0.1&background[1]=0.2&background[2]=0.3&background[3]=0.4'
			)
		);

		expect(params.background.value).toEqual([0.1, 0.2, 0.3, 0.4]);
	});

	it('should be able to set select parameters from a URL', () => {
		enum Palette {
			blackAndWhite = 'Black & White',
			ice = 'Ice'
		}

		let params = defineParams(random, {
			palette: {
				type: 'select',
				options: Object.values(Palette)
			}
		});
		params = setParamsValueFromUrl(random, params, new URL('https://localhost/?palette=Ice'));

		expect(params.palette.value).toEqual(Palette.ice);
	});
});
