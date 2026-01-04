import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../../',  // Read .env from repo root (apps/frontend is 2 levels deep)
  server: {
    port: 5173,
    strictPort: false,
  },
})
