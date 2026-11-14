import { NavLink } from 'react-router-dom'
import { puede } from '../utils/roles'

/*
  AdminSidebar: menú lateral del panel. Cada sección declara el permiso que exige y solo se
  muestran las que el rol del usuario tiene (el Vendedor ve únicamente Productos y Órdenes,
  como pide el enunciado). Bootstrap: `nav flex-column nav-pills` apila los enlaces.
*/
const SECCIONES = [
  ['/admin', 'Dashboard', 'dashboard'],
  ['/admin/ordenes', 'Órdenes / Boletas', 'ordenes.ver'],
  ['/admin/productos', 'Productos', 'productos.ver'],
  ['/admin/productos/criticos', 'Productos críticos', 'productos.criticos'],
  ['/admin/categorias', 'Categorías', 'categorias'],
  ['/admin/usuarios', 'Usuarios', 'usuarios'],
  ['/admin/reportes', 'Reportes', 'reportes'],
  ['/admin/perfil', 'Perfil', 'perfil'],
]

export default function AdminSidebar({ usuario }) {
  const visibles = SECCIONES.filter(([, , permiso]) => puede(usuario, permiso))
  return (
    <aside className="sv-sidebar p-3 h-100">
      <p className="sv-display text-light fs-5 mb-1">Sonido Vivo</p>
      {usuario && <p className="small text-secondary mb-3">{usuario.nombre} · {usuario.tipoUsuario}</p>}
      <nav aria-label="Menú del panel">
        <ul className="nav nav-pills flex-column gap-1">
          {visibles.map(([ruta, texto]) => (
            <li className="nav-item" key={ruta}>
              <NavLink className="nav-link" to={ruta} end>{texto}</NavLink>
            </li>
          ))}
          <li className="nav-item">
            <NavLink className="nav-link" to="/" end>Volver a la tienda</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
