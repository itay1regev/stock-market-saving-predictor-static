import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Static build only -- no backend, so no dev-server proxy is needed.
export default defineConfig({
  base: '/stock-market-saving-predictor-static/',
  plugins: [react(), tailwindcss()],
})
