import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Served from /ping-post on the QuickHomeFix site, so assets must be
  // requested from there rather than the domain root. Dev stays at / so
  // `npm run dev` is unchanged.
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5180,
    // /api goes to the backend through Vite, so the browser only ever
    // talks to one origin. That removes the CORS setup entirely and
    // means a wrong VITE_API_URL cannot break the app.
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
