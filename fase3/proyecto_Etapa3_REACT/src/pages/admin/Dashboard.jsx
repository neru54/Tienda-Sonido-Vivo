import { Link } from 'react-router-dom'
import { boletasApi } from '../../api/boletas'
import { productosApi } from '../../api/productos'
import { usuariosApi } from '../../api/usuarios'
import EstadoCarga from '../../components/EstadoCarga'
import StatCard from '../../components/StatCard'
import { useColeccion } from '../../hooks/useColeccion'
import { formatearCLP } from '../../utils/formato'

/* Dashboard (solo Administrador): métricas desde la API (3 llamadas en paralelo) + accesos rápidos. */
export default function Dashboard() {
  const { datos, cargando, error, recargar } = useColeccion(
    () => Promise.all([boletasApi.listar(), productosApi.listar(), usuariosApi.listar()])
      .then(([ordenes, productos, usuarios]) => ({ ordenes, productos, usuarios })),
    [],
  )

  return (
    <>
      <h1 className="h3 mb-4">Dashboard</h1>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {datos && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <StatCard titulo="Compras" valor={datos.ordenes.length} detalle={`Total vendido: ${formatearCLP(datos.ordenes.reduce((a, o) => a + o.total, 0))}`} enlace="/admin/ordenes" />
          </div>
          <div className="col-12 col-md-4">
            <StatCard titulo="Productos" valor={datos.productos.length} detalle={`${datos.productos.filter((p) => p.critico).length} en stock crítico`} enlace="/admin/productos" />
          </div>
          <div className="col-12 col-md-4">
            <StatCard titulo="Usuarios" valor={datos.usuarios.length} detalle="Administradores, vendedores y clientes" enlace="/admin/usuarios" />
          </div>
        </div>
      )}
      <h2 className="h5">Accesos rápidos</h2>
      <div className="d-flex flex-wrap gap-2">
        <Link to="/admin/productos/nuevo" className="btn btn-outline-primary">Nuevo producto</Link>
        <Link to="/admin/productos/criticos" className="btn btn-outline-primary">Productos críticos</Link>
        <Link to="/admin/categorias/nueva" className="btn btn-outline-primary">Nueva categoría</Link>
        <Link to="/admin/usuarios/nuevo" className="btn btn-outline-primary">Nuevo usuario</Link>
        <Link to="/admin/reportes" className="btn btn-outline-primary">Reportes</Link>
      </div>
    </>
  )
}
