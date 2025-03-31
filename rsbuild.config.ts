import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  server: {
    base: process.env.GITHUB_ACTIONS ? '/Delixia/' : '/',
  },
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/client/main.tsx',
    },
  },
  output: {
    copy: [
      {
        from: './node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm',
        to: '../public',
      },
    ],
  },
  plugins: [pluginReact()],
})
