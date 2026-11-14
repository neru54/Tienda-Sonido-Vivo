/*
  Roles y permisos de la INTERFAZ (regla única para Navbar, Login, AdminSidebar, AdminLayout y rutas).
  Espejo de las reglas del backend (SeguridadConfig.java): aquí solo se decide qué se muestra;
  aunque alguien fuerce una URL, la API responde 403.

  Enunciado: Administrador = acceso total; Vendedor = ver lista y detalle de productos y de órdenes,
  y nada más debe aparecer en su vista; Cliente = solo la tienda.
*/
export const ROLES = { ADMIN: 'Administrador', VENDEDOR: 'Vendedor', CLIENTE: 'Cliente' }

export const ROLES_PANEL = [ROLES.ADMIN, ROLES.VENDEDOR]

/** Permisos del panel por rol. */
export const PERMISOS = {
  [ROLES.ADMIN]: ['dashboard', 'productos.ver', 'productos.editar', 'productos.criticos', 'ordenes.ver',
    'categorias', 'usuarios', 'reportes', 'perfil'],
  [ROLES.VENDEDOR]: ['productos.ver', 'ordenes.ver'],
  [ROLES.CLIENTE]: [],
}

export function tieneAccesoAlPanel(usuario) {
  return ROLES_PANEL.includes(usuario?.tipoUsuario)
}

export function puede(usuario, permiso) {
  return (PERMISOS[usuario?.tipoUsuario] ?? []).includes(permiso)
}

/** Primera página del panel según el rol (el vendedor no tiene dashboard). */
export function inicioDelPanel(usuario) {
  return puede(usuario, 'dashboard') ? '/admin' : '/admin/productos'
}
