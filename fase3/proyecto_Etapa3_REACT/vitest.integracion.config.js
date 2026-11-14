import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/* Solo la prueba de integración contra la API real (requiere el backend levantado). */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    include: ['src/__tests__/integracion/**/*.test.js'],
    testTimeout: 20000,
    fileParallelism: false,
  },
})
