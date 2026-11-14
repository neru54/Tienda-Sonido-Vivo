// Se ejecuta antes de cada archivo de pruebas: agrega matchers como toBeInTheDocument()
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { instalarServidorFalso, servidor } from './__tests__/servidorFalso'

// Todas las llamadas axios de la app las responde el servidor falso en memoria
instalarServidorFalso()

beforeEach(() => servidor.reiniciar()) // cada prueba parte con la "base" inicial

afterEach(() => {
  cleanup() // desmonta lo renderizado
  localStorage.clear() // carrito
  sessionStorage.clear() // token y sesión
})
