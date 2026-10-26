import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/contrast-palette/' : '/',
  test: { include: ['src/**/*.test.ts'] },
})
