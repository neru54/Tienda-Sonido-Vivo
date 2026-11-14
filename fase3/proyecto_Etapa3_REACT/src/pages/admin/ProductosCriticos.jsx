import { productosApi } from '../../api/productos'
import EstadoCarga from '../../components/EstadoCarga'
import ProductosTabla from '../../components/ProductosTabla'
import { useColeccion } from '../../hooks/useColeccion'

/* ProductosCriticos (solo Administrador): GET /productos/criticos, el backend filtra stock <= stock crítico. */
export default function ProductosCriticos() {
  const { datos, cargando, error, recargar } = useColeccion(() => productosApi.criticos(), [])
  return (
    <>
      <h1 className="h3 mb-3">Productos críticos</h1>
      <p className="text-muted">Productos cuyo stock es menor o igual a su stock crítico.</p>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {datos && <ProductosTabla productos={datos} />}
    </>
  )
}
