import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import { type PluginOption, defineConfig, normalizePath } from 'vite'
import { denyImports } from 'vite-env-only'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Delixia/' : '/',
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
  build: {
    rollupOptions: {
      treeshake: true,
    },
  },
  server: {
    watch: {
      ignored: ['**/server/**', '.devmode.json'],
    },
  },
  resolve: {
    alias: {
      '@client': resolve(__dirname, './src/client'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  plugins: [
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(resolve(__dirname, './node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm')),
          dest: normalizePath(resolve(__dirname, './public')),
        },
      ],
    }),
    react(),
    denyImports({
      client: {
        specifiers: ['@server/*'],
        files: ['**/server/**'],
      },
    }),
    visualizer() as PluginOption,
  ],
})
