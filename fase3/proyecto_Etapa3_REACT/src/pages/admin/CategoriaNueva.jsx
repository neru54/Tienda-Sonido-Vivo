import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriasApi } from '../../api/categorias'
import { mensajeDeError } from '../../api/cliente'
import CategoriaForm from '../../components/CategoriaForm'

/* CategoriaNueva: POST /categorias. El backend deriva el id del nombre (slug) y rechaza nombres repetidos (409). */
export default function CategoriaNueva() {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navegar = useNavigate()

  const guardar = async ({ nombre, descripcion }) => {
    setError('')
    setGuardando(true)
    try {
      await categoriasApi.crear({ nombre: nombre.trim(), descripcion: descripcion.trim() })
      navegar('/admin/categorias')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo crear la categoría.'))
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Nueva categoría</h1>
      <CategoriaForm onGuardar={guardar} errorGeneral={error} guardando={guardando} />
    </>
  )
}
