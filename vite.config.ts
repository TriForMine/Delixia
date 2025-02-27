import {defineConfig, normalizePath} from 'vite'
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react-swc'
import {viteStaticCopy} from "vite-plugin-static-copy";
import * as path from "node:path";
import {denyImports} from "vite-env-only"

// https://vite.dev/config/
export default defineConfig({
	base: process.env.GITHUB_ACTIONS ? "/Delixia/" : "/",
	optimizeDeps: {
		exclude: ['@babylonjs/havok'],
	},
	server: {
		watch: {
			ignored: [
				"**/server/**",
				".devmode.json"
			]
		}
	},
	resolve: {
		alias: {
			'@client': path.resolve(__dirname, './src/client'),
			'@shared': path.resolve(__dirname, './src/shared')
		}
	},
	plugins: [
		tailwindcss(),
		viteStaticCopy({
			targets: [
				{
					src: normalizePath(path.resolve(__dirname, './node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm')),
					dest: normalizePath(path.resolve(__dirname, './public'))
				},
			]
		}),
		react(),
		denyImports({
			client: {
				specifiers: ["@server/*"],
				files: ["**/server/**"],
			},
		})
	],
})
