import { useState } from 'react'
import { mensajeDeError } from '../../api/cliente'
import { usuariosApi } from '../../api/usuarios'
import AlertMessage from '../../components/AlertMessage'
import EstadoCarga from '../../components/EstadoCarga'
import UsuarioForm from '../../components/UsuarioForm'
import { useSession } from '../../context/SessionContext'
import { useColeccion } from '../../hooks/useColeccion'
import { vacioANull } from '../../utils/formularios'

/*
  Perfil: la persona con sesión edita sus propios datos (GET/PUT /usuarios/me).
  Reutiliza UsuarioForm bloqueando RUN, correo y tipo de usuario; además el endpoint /me
  ni siquiera acepta esos campos, así que no hay forma de auto-asignarse otro rol.
*/
export default function Perfil() {
  const { actualizarUsuario } = useSession()
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { datos: registro, cargando, error: errorCarga, recargar } = useColeccion(() => usuariosApi.miPerfil(), [])

  if (errorCarga?.response?.status === 404) return <AlertMessage tipo="warning" mensaje="Inicia sesión para ver tu perfil." />
  if (cargando || errorCarga) return <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />

  const guardar = async ({ nombre, apellidos, password, fechaNacimiento, region, comuna, direccion }) => {
    setError('')
    setGuardado(false)
    setGuardando(true)
    try {
      const actualizado = await usuariosApi.actualizarPerfil(
        vacioANull({ nombre, apellidos, password, fechaNacimiento, region, comuna, direccion }, ['password', 'fechaNacimiento']),
      )
      actualizarUsuario(actualizado) // refresca el nombre mostrado en navbar y sidebar
      setGuardado(true)
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo actualizar el perfil.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Mi perfil</h1>
      <AlertMessage tipo="success" mensaje={guardado ? 'Perfil actualizado correctamente.' : ''} />
      <UsuarioForm
        inicial={{ ...registro, fechaNacimiento: registro.fechaNacimiento ?? '' }}
        modoEdicion
        bloqueados={['run', 'correo', 'tipoUsuario']}
        onGuardar={guardar}
        errorGeneral={error}
        guardando={guardando}
        rutaCancelar="/admin"
      />
    </>
  )
}
