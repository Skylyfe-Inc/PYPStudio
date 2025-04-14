import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// https://vitejs.dev/guide/dep-pre-bundling.html - important for builds.
export default defineConfig({
  plugins: [react()],
  commonjsOptions: {
    esmExternals: true 
 },

})
