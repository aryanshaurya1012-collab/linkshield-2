import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { linkshieldApiPlugin } from './server/apiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    linkshieldApiPlugin()
  ],
})
