import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { usuariosApi } from '../../api/usuarios'
import UsuarioForm from '../../components/UsuarioForm'
import { aUsuarioRequest } from '../../utils/formularios'

/* UsuarioNuevo: POST /usuarios. Los duplicados de RUN o correo los detecta el backend (409). */
export default function UsuarioNuevo() {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navegar = useNavigate()

  const guardar = async (valores) => {
    setError('')
    setGuardando(true)
    try {
      await usuariosApi.crear(aUsuarioRequest(valores))
      navegar('/admin/usuarios')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo crear el usuario.'))
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Nuevo usuario</h1>
      <UsuarioForm onGuardar={guardar} errorGeneral={error} guardando={guardando} />
    </>
  )
}
