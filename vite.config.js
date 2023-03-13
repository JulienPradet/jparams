import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
	base: './',
	build: {
		assetsDir: '.'
	},
	plugins: [svelte({})].concat(
		// Hack to make sure that svelte components are not executed in SSR mode in tests
		process.env.NODE_ENV === 'test'
			? [
					{
						name: 'force-svelte-internal',
						config: async (config) => {
							return {
								...config,
								resolve: {
									...config.resolve,
									alias: (config.resolve.alias || []).concat({
										find: /^svelte$/,
										replacement: path.join(process.cwd(), 'node_modules/svelte/internal')
									})
								}
							};
						}
					}
			  ]
			: []
	),
	server: {
		port: 3000,
		host: '0.0.0.0',
		strictPort: true
	},
	test: {
		include: ['src/**/*.{test,spec}.ts'],
		environment: 'jsdom',
		setupFiles: ['config/vitest/svelteSetup.ts']
	}
});
