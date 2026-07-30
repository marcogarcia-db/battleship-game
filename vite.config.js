import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the project at https://<user>.github.io/battleship-game/
export default defineConfig({
  base: '/battleship-game/',
  plugins: [react()],
})
