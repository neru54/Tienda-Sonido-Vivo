import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoriasApi } from '../../api/categorias'
import { esNoEncontrado, mensajeDeError } from '../../api/cliente'
import { productosApi } from '../../api/productos'
import AlertMessage from '../../components/AlertMessage'
import EstadoCarga from '../../components/EstadoCarga'
import ProductoForm from '../../components/ProductoForm'
import { useColeccion } from '../../hooks/useColeccion'
import { productoAValores, valoresAProducto } from '../../utils/productos'
import { opcionesCategorias } from './ProductoNuevo'

/* ProductoEditar: carga producto y categorías (GET), rellena el formulario y guarda con PUT /productos/:codigo. */
export default function ProductoEditar() {
  const { codigo } = useParams()
  const navegar = useNavigate()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { datos, cargando, error: errorCarga, recargar } = useColeccion(
    () => Promise.all([productosApi.obtener(codigo), categoriasApi.listar()]).then(([producto, categorias]) => ({ producto, categorias })),
    [codigo],
  )

  if (esNoEncontrado(errorCarga)) {
    return (
      <>
        <AlertMessage tipo="warning" mensaje="No se encontró el producto solicitado." />
        <Link to="/admin/productos">Volver al listado</Link>
      </>
    )
  }
  if (cargando || errorCarga) return <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />

  const guardar = async (valores) => {
    setError('')
    setGuardando(true)
    try {
      await productosApi.actualizar(codigo, valoresAProducto(valores))
      navegar('/admin/productos')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar el producto.'))
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Editar producto</h1>
      <ProductoForm
        inicial={productoAValores(datos.producto)}
        modoEdicion
        categorias={opcionesCategorias(datos.categorias)}
        onGuardar={guardar}
        errorGeneral={error}
        guardando={guardando}
      />
    </>
  )
}
