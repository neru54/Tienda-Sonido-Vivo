import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { productosApi } from '../../api/productos'
import AlertMessage from '../../components/AlertMessage'
import EstadoCarga from '../../components/EstadoCarga'
import ProductosTabla from '../../components/ProductosTabla'
import SearchBar from '../../components/SearchBar'
import { useSession } from '../../context/SessionContext'
import { useColeccion } from '../../hooks/useColeccion'
import { filtrarProductos } from '../../utils/productos'
import { puede } from '../../utils/roles'

/*
  ProductosAdmin: listado con búsqueda local (estado `texto`).
  - Administrador: "Nuevo producto", Editar y Eliminar (DELETE /productos/:codigo; si el backend
    responde 409 porque tiene ventas, se muestra el motivo).
  - Vendedor: solo lista y "Ver" (detalle), como pide el enunciado.
*/
export default function ProductosAdmin() {
  const { usuario } = useSession()
  const puedeEditar = puede(usuario, 'productos.editar')
  const { datos, cargando, error, recargar, setDatos } = useColeccion(() => productosApi.listar(), [])
  const [texto, setTexto] = useState('')
  const [errorAccion, setErrorAccion] = useState('')
  const visibles = filtrarProductos(datos ?? [], { texto })

  const borrar = async (codigo) => {
    setErrorAccion('')
    try {
      await productosApi.eliminar(codigo)
      setDatos((lista) => lista.filter((p) => p.codigo !== codigo))
    } catch (e) {
      setErrorAccion(mensajeDeError(e, 'No se pudo eliminar el producto.'))
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Productos</h1>
        {puedeEditar && <Link to="/admin/productos/nuevo" className="btn btn-primary">Nuevo producto</Link>}
      </div>
      <div className="mb-3" style={{ maxWidth: 420 }}><SearchBar value={texto} onCambio={setTexto} /></div>
      <AlertMessage tipo="danger" mensaje={errorAccion} />
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {datos && <ProductosTabla productos={visibles} puedeEditar={puedeEditar} onEliminar={puedeEditar ? borrar : undefined} />}
    </>
  )
}
