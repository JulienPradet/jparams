import { Color } from './Color';
import { hsvToRgb } from './hsvToRgb';

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c: number): string {
	var hex = c.toString(16);
	return hex.length == 1 ? '0' + hex : hex;
}

export const hex = (hsv: Color): string => {
	const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
	return `#${componentToHex(rgb[0])}${componentToHex(rgb[1])}${componentToHex(
		rgb[2]
	)}${componentToHex(Math.round(hsv[3] * 255))}`;
};
