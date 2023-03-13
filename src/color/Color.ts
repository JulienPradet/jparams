export type Color = [number, number, number, number];

export const Color = (h: number, s: number, v: number, a: number = 1) => [h, s, v, a] as Color;
