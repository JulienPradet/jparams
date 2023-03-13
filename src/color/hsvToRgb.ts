/**
 * https://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  hue       The hue
 * @param   Number  saturation       The saturation
 * @param   Number  value       The value
 * @return  Array           The RGB representation
 */
export function hsvToRgb(hue: number, saturation: number, value: number): [number, number, number] {
	var red: number, green: number, blue: number;

	var i = Math.floor(hue * 6);
	var f = hue * 6 - i;
	var p = value * (1 - saturation);
	var q = value * (1 - f * saturation);
	var t = value * (1 - (1 - f) * saturation);

	switch (i % 6) {
		case 0:
			(red = value), (green = t), (blue = p);
			break;
		case 1:
			(red = q), (green = value), (blue = p);
			break;
		case 2:
			(red = p), (green = value), (blue = t);
			break;
		case 3:
			(red = p), (green = q), (blue = value);
			break;
		case 4:
			(red = t), (green = p), (blue = value);
			break;
		default:
		case 5:
			(red = value), (green = p), (blue = q);
			break;
	}

	return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];
}
