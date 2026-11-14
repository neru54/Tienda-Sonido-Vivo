import { validarFormulario } from './validaciones'

/*
  Ayuda PURA para los formularios.
  Cada formulario guarda su propio estado con useState:
    const [valores, setValores] = useState(INICIAL)
    const [enviado, setEnviado] = useState(false)
    const { campo, hayErrores } = prepararFormulario(valores, setValores, ESQUEMA, enviado)

  - campo('correo') devuelve las props de <FormField>: id, value, onChange y error.
  - Un error se ve cuando el campo ya tiene algo escrito o cuando se intentó enviar.
  - hayErrores es true si algún campo (visible o no) no cumple sus reglas.
*/
export function prepararFormulario(valores, setValores, esquema, enviado) {
  const errores = validarFormulario(valores, esquema)

  const campo = (nombre) => ({
    id: nombre,
    value: valores[nombre] ?? '',
    onChange: (e) => setValores((v) => ({ ...v, [nombre]: e.target.value })),
    error: enviado || valores[nombre] ? errores[nombre] ?? '' : '',
  })

  return { campo, hayErrores: Object.keys(errores).length > 0 }
}

/** Copia el objeto cambiando '' por null en los campos indicados (la API espera null en lo opcional, p. ej. fechas). */
export function vacioANull(valores, campos) {
  const copia = { ...valores }
  for (const c of campos) {
    if (String(copia[c] ?? '').trim() === '') copia[c] = null
  }
  return copia
}

/** Valores del UsuarioForm -> cuerpo de POST/PUT /api/v1/usuarios (UsuarioRequest). */
export function aUsuarioRequest(valores) {
  return vacioANull(
    {
      run: String(valores.run).trim().toUpperCase(),
      nombre: valores.nombre.trim(),
      apellidos: valores.apellidos.trim(),
      correo: valores.correo.trim(),
      password: valores.password ?? '',
      fechaNacimiento: valores.fechaNacimiento ?? '',
      tipoUsuario: valores.tipoUsuario,
      region: valores.region,
      comuna: valores.comuna,
      direccion: valores.direccion.trim(),
    },
    ['password', 'fechaNacimiento'],
  )
}
