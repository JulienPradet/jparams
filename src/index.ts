import { createRandom } from 'canvas-sketch-util/random';
import { ColorParam, IntParam } from './params/defineParams';
import { initParams } from './params/initParams';
import { hex } from './color/hex';

const random = createRandom();

const paramsContainer = document.querySelector('#params');

if (!paramsContainer) {
	throw new Error('Invalid');
}

const params = initParams({
	params: {
		size: {
			type: 'int',
			label: 'Size'
		} as IntParam,
		background: {
			type: 'color',
			label: 'Background'
		} as ColorParam,
		forground: {
			type: 'color',
			label: 'Foreground'
		} as ColorParam
	},
	paramsContainer,
	random
});

const container = document.querySelector('#container');
if (!container) {
	throw new Error('No container found to draw.');
}

const draw = () => {
	container.innerHTML = `
        <svg viewbox="0 0 150 150">
            <rect  x="0" y="0" width="150" height="150" fill="${hex(params.background)}" />
            <circle cx="75" cy="75" r="${params.size * 75}" fill="${hex(params.forground)}" />
        </svg>
    `;
};

draw();

params.onUpdate(() => {
	draw();
});
