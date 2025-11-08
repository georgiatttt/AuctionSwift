// Vite configuration - build tool settings
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configure Vite with React plugin for fast development
export default defineConfig({
  plugins: [react()], // Enable React support with fast refresh
})
