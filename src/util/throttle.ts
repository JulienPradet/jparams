export type ThrottledFunction<T extends (...args: any) => any> = (
	...args: Parameters<T>
) => ReturnType<T>;

export function throttle<F extends (...params: any[]) => void>(func: F, limit: number): F {
	let inThrottle: boolean = false;

	return function (this: any, ...args: any[]): void {
		if (!inThrottle) {
			inThrottle = true;

			setTimeout(() => (inThrottle = false), limit);
			func.apply(this, args);
		}
	} as F;
}
