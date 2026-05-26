import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: { // previous method
  //   proxy: {
  //     '/spat_decoded': 'http://129.114.36.77:8080'
  //   }
  // }
})
