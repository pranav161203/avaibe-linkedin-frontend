import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const src = path.resolve(import.meta.dirname, './src')

export default defineConfig(({ mode }) => {
  const sampleData = ['development', 'sample', 'mock'].includes(mode)
  return {
    plugins: [react(), tailwindcss()],
    define: { __SAMPLE_DATA__: JSON.stringify(sampleData) },
    resolve: {
      alias: [
        // npm run dev / build:sample: the same api functions, answered from sample data in the browser
        ...(sampleData ? [{ find: /^@\/lib\/api$/, replacement: path.join(src, 'sample-data/api.ts') }] : []),
        { find: '@', replacement: src },
      ],
    },
    server: {
      allowedHosts: process.env.TUNNEL_HOSTS ? process.env.TUNNEL_HOSTS.split(',') : undefined,
      proxy: {
        '/api': process.env.API_TARGET ?? 'http://127.0.0.1:8000',
        '/admin': process.env.API_TARGET ?? 'http://127.0.0.1:8000',
        '/static': process.env.API_TARGET ?? 'http://127.0.0.1:8000',
      },
    },
  }
})
