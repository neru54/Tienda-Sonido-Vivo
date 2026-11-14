import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { esNoEncontrado, mensajeDeError } from '../../api/cliente'
import { usuariosApi } from '../../api/usuarios'
import AlertMessage from '../../components/AlertMessage'
import EstadoCarga from '../../components/EstadoCarga'
import UsuarioForm from '../../components/UsuarioForm'
import { useColeccion } from '../../hooks/useColeccion'
import { aUsuarioRequest } from '../../utils/formularios'

/* UsuarioEditar: PUT /usuarios/:run. Contraseña vacía = el backend conserva la anterior; el correo no puede repetirse (409). */
export default function UsuarioEditar() {
  const { run } = useParams()
  const navegar = useNavigate()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { datos: usuario, cargando, error: errorCarga, recargar } = useColeccion(() => usuariosApi.obtener(run), [run])

  if (esNoEncontrado(errorCarga)) {
    return (
      <>
        <AlertMessage tipo="warning" mensaje="No se encontró el usuario." />
        <Link to="/admin/usuarios">Volver al listado</Link>
      </>
    )
  }
  if (cargando || errorCarga) return <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />

  const guardar = async (valores) => {
    setError('')
    setGuardando(true)
    try {
      await usuariosApi.actualizar(run, aUsuarioRequest(valores))
      navegar('/admin/usuarios')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar el usuario.'))
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Editar usuario</h1>
      <UsuarioForm inicial={{ ...usuario, fechaNacimiento: usuario.fechaNacimiento ?? '' }} modoEdicion onGuardar={guardar} errorGeneral={error} guardando={guardando} />
    </>
  )
}
