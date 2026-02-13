
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: mode === 'development'
      ? true // Allow ALL hosts during development
      : ['petedefense.com', 'www.petedefense.com', 'localhost']
  },
}))
