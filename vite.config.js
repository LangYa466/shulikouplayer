import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // ensure relative asset paths for static/subpath deploys
  server: {
    proxy: {
      // Avoid CORS in dev: fetch '/mir6/api/...' and proxy to real API
      '/mir6': {
        target: 'https://api.mir6.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/mir6/, ''),
      },
    },
  },
})
