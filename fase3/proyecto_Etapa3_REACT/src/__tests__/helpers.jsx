import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { CLAVE_TOKEN } from '../api/cliente'
import { CartProvider, CLAVE_CARRITO } from '../context/CartContext'
import { CLAVE_SESION, SessionProvider } from '../context/SessionContext'
import { servidor } from './servidorFalso'

/* Utilidades compartidas por las pruebas (esta carpeta está excluida de la cobertura). */

export const ADMIN = { run: '11111111-1', nombre: 'María', apellidos: 'Pérez Soto', correo: 'maria.perez@gmail.com', tipoUsuario: 'Administrador', region: 'Región de Valparaíso', comuna: 'Viña del Mar', direccion: 'Av. Libertad 1234' }
export const VENDEDOR = { run: '22222222-2', nombre: 'Carlos', apellidos: 'Muñoz Rojas', correo: 'carlos.munoz@duoc.cl', tipoUsuario: 'Vendedor', region: 'Región de Valparaíso', comuna: 'Valparaíso', direccion: 'Calle Condell 456' }
export const CLIENTE = { run: '33333333-3', nombre: 'Camila', apellidos: 'Rojas Vera', correo: 'camila.rojas@gmail.com', tipoUsuario: 'Cliente', region: 'Región Metropolitana de Santiago', comuna: 'Providencia', direccion: 'Av. Providencia 100' }

/** Deja una sesión iniciada como si se hubiera hecho login (token + usuario en sessionStorage). */
export function iniciarSesionComo(usuario) {
  sessionStorage.setItem(CLAVE_TOKEN, servidor.tokenDe(usuario.run))
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario))
}

export function cargarCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items))
}

/** Renderiza la app completa (router + sesión + carrito) en una ruta dada. */
export function renderApp(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SessionProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </SessionProvider>
    </MemoryRouter>,
  )
}

/** Renderiza un componente suelto dentro de un router (para los que usan <Link>). */
export function renderConRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

/** Boleta de ejemplo para preparar escenarios del panel. */
export const boletaDe = (extra = {}) => ({
  fecha: '2026-05-01T10:00:00.000Z', total: 20000,
  cliente: { run: '33333333-3', nombre: 'Camila', apellidos: 'Rojas', correo: 'camila.rojas@gmail.com' },
  direccion: { calle: 'Calle 1', departamento: '', region: 'Región de Valparaíso', comuna: 'Quilpué', indicaciones: '' },
  items: [{ codigo: 'GA001', nombre: 'Guitarra Acústica Folk', precio: 10000, cantidad: 2 }],
  ...extra,
})
