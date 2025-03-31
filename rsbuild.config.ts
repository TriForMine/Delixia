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
    define: {
      'import.meta.env': {},
    },
    entry: {
      index: './src/client/main.tsx',
    },
  },
  plugins: [pluginReact()],
})
