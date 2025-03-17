import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get base path from environment or use default for local development
const base = process.env.NODE_ENV === 'production' 
  ? process.env.VITE_BASE_PATH || '/TaskFlow-Web-App/' 
  : '/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: base,
  server: {
    port: 7000,
    proxy: {
      "/api": {
        target: "http://localhost:7007",
        changeOrigin: true,
      }
    }
  }
})
