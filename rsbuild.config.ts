import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginBabel } from '@rsbuild/plugin-babel'

export default defineConfig({
  server: {
    base: process.env.GITHUB_ACTIONS ? '/Delixia/' : '/',
  },
  html: {
    template: './index.html',
  },
  source: {
    exclude: [/src\/server/],
    define: {
      'import.meta.env': {},
    },
    entry: {
      index: './src/client/main.tsx',
    },
  },
  plugins: [
    pluginReact(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift('babel-plugin-react-compiler')
      },
    }),
  ],
})
