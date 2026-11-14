import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriasApi } from '../../api/categorias'
import { mensajeDeError } from '../../api/cliente'
import { productosApi } from '../../api/productos'
import EstadoCarga from '../../components/EstadoCarga'
import ProductoForm from '../../components/ProductoForm'
import { useColeccion } from '../../hooks/useColeccion'
import { valoresAProducto } from '../../utils/productos'

export const opcionesCategorias = (categorias) => categorias.map((c) => ({ valor: c.id, texto: c.nombre }))

/*
  ProductoNuevo: el formulario valida en el navegador; la página hace POST /productos.
  Si el backend responde 409 (código repetido) o 400, se muestra su mensaje.
*/
export default function ProductoNuevo() {
  const { datos: categorias, cargando, error: errorCarga, recargar } = useColeccion(() => categoriasApi.listar(), [])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navegar = useNavigate()

  const guardar = async (valores) => {
    setError('')
    setGuardando(true)
    try {
      await productosApi.crear(valoresAProducto(valores))
      navegar('/admin/productos')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo crear el producto.'))
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Nuevo producto</h1>
      <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />
      {categorias && <ProductoForm categorias={opcionesCategorias(categorias)} onGuardar={guardar} errorGeneral={error} guardando={guardando} />}
    </>
  )
}
