/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Em desenvolvimento, /api é encaminhado para o Spring Boot (evita CORS).
      proxy: {
        '/api': { target: env.DEV_API_PROXY ?? 'http://localhost:8080', changeOrigin: true },
      },
    },
    test: {
      globals: true,
      environment: 'node',
    },
  }
})
