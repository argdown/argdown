import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'unplugin-dts/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), dts({ tsconfigPath: './tsconfig.app.json', bundleTypes: true })],
	build: {
		lib: {
			entry: 'src/main.ts',
			name: 'ArgdownMap',
			fileName: 'argdown-map',
			formats: ['es', 'umd']
		}
	}
});
