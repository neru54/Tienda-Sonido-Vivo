import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ADMIN, VENDEDOR, iniciarSesionComo, renderApp } from './helpers'

describe('Enrutado y layouts', () => {
  it('la tienda muestra el navbar con "Iniciar sesión" cuando no hay sesión', () => {
    renderApp('/')
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('/admin sin sesión pide iniciar sesión', () => {
    renderApp('/admin')
    expect(screen.getByText(/solo para administradores/)).toBeInTheDocument()
  })

  it('un usuario sin token (sesión vieja de la Etapa 2) no entra al panel', () => {
    sessionStorage.setItem('sonidoVivoSesion', JSON.stringify(ADMIN)) // usuario, pero sin JWT
    renderApp('/admin')
    expect(screen.getByText(/solo para administradores/)).toBeInTheDocument()
  })

  it('/admin con sesión de vendedor redirige a Productos (el vendedor no tiene dashboard)', async () => {
    iniciarSesionComo(VENDEDOR)
    renderApp('/admin')
    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('/admin con sesión de administrador muestra el dashboard con su sidebar', async () => {
    iniciarSesionComo(ADMIN)
    renderApp('/admin')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a la tienda' })).toBeInTheDocument()
  })
})
