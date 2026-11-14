import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ruta base: '/' en local; en GitHub Pages el workflow define BASE_PATH=/Tienda-Sonido-Vivo/
  base: process.env.BASE_PATH || '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    // La prueba contra el backend real se corre aparte: npm run test:integracion
    exclude: [...configDefaults.exclude, 'src/__tests__/integracion/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/__tests__/**'],
    },
  },
})
