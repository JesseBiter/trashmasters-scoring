import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name so asset URLs resolve on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/trashmasters-scoring/',
})
