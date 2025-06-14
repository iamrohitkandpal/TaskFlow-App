import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get base path from environment or use default for local development
// This allows the app to be served from a subdirectory for GitHub Pages
const base = process.env.NODE_ENV === 'production' 
  ? process.env.VITE_BASE_PATH || '/TaskFlow-Web-App/' 
  : '/'

// Vite configuration for TaskFlow frontend
export default defineConfig({
  plugins: [react()],
  base: base,
  server: {
    port: 7000, // Development server port
    proxy: {
      // Proxy API requests to backend during development
      "/api": {
        target: "http://localhost:7007",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
