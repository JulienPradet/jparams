import matchers from '@testing-library/jest-dom/matchers';
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/svelte';

expect.extend(matchers);

afterEach(() => {
	cleanup();
});
