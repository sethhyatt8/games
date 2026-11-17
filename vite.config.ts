import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages keeps relative assets (`./`) so the existing project-site deploy
// still works. A root-domain build (Hostinger) sets VITE_BASE_PATH=/ or passes
// `vite build --base /`. See README.
function viteBase() {
  const raw = process.env.VITE_BASE_PATH?.trim()
  if (!raw) return './'
  return raw.endsWith('/') ? raw : `${raw}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: viteBase(),
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
