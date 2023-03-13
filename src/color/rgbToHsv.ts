export function hexToRgb(hex: string) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
	if (!result) {
		throw new Error('Not an Hex representation of RGB(A).');
	}

	return [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16),
		result[4] ? parseInt(result[4], 16) : 1
	];
}
/**
 * https://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  red     The red color value [0,255]
 * @param   Number  green   The green color value [0,255]
 * @param   Number  blue    The blue color value [0,255]
 * @return  Array           The HSV representation
 */
export function rgbToHsv(red: number, green: number, blue: number): [number, number, number] {
	(red = red / 255), (green = green / 255), (blue = blue / 255);
	var max = Math.max(red, green, blue),
		min = Math.min(red, green, blue);
	var hue: number,
		saturation: number,
		value: number = max;

	var d = max - min;
	saturation = max == 0 ? 0 : d / max;

	if (max == min) {
		hue = 0; // achromatic
	} else {
		switch (max) {
			case red:
				hue = (green - blue) / d + (green < blue ? 6 : 0);
				break;
			case green:
				hue = (blue - red) / d + 2;
				break;
			default:
			case blue:
				hue = (red - green) / d + 4;
				break;
		}
		hue /= 6;
	}

	return [hue, saturation, value];
}
