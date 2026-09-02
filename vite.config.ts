import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/cerveza-tools-lab/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
}))
