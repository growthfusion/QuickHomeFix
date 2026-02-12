import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      jpg: { quality: 70 },
      jpeg: { quality: 70 },
      png: { quality: 75 },
      webp: { quality: 75 },
      svg: { multipass: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://autopolicypro.us',
        changeOrigin: true,
        secure: true,
      },
      '/zipapi': {
        target: 'https://api.zippopotam.us',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zipapi/, ''),
        secure: true,
      },
    },
  },
})
