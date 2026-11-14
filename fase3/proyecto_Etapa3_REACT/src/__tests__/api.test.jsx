import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { authApi } from '../api/auth'
import { CLAVE_TOKEN, EVENTO_SESION_EXPIRADA, URL_API, api, esNoEncontrado, estadoHttp, mensajeDeError } from '../api/cliente'
import { productosApi } from '../api/productos'
import { useColeccion } from '../hooks/useColeccion'
import { servidor } from './servidorFalso'

describe('Cliente axios (api/cliente.js)', () => {
  it('apunta a la API versionada /api/v1', () => {
    expect(URL_API).toMatch(/\/api\/v1$/)
    expect(api.defaults.baseURL).toBe(URL_API)
  })

  it('el interceptor agrega el token de la sesión solo si existe', async () => {
    await productosApi.listar()
    expect(servidor.peticiones.at(-1).token).toBeNull()
    sessionStorage.setItem(CLAVE_TOKEN, 'abc123')
    await productosApi.listar()
    expect(servidor.peticiones.at(-1).token).toBe('Bearer abc123')
  })

  it('los servicios devuelven directamente el JSON y envían los filtros como query string', async () => {
    const lista = await productosApi.listar({ oferta: true })
    expect(Array.isArray(lista)).toBe(true)
    expect(lista.every((p) => p.oferta)).toBe(true)
    const login = await authApi.login(' maria.perez@gmail.com ', 'admin123')
    expect(login).toMatchObject({ tipo: 'Bearer', usuario: { tipoUsuario: 'Administrador' } })
    expect(servidor.peticiones.at(-1).cuerpo.correo).toBe('maria.perez@gmail.com')
  })

  it('un 401 con token emite el evento de sesión expirada; sin token no', async () => {
    const oyente = vi.fn()
    window.addEventListener(EVENTO_SESION_EXPIRADA, oyente)
    await expect(authApi.yo()).rejects.toMatchObject({ response: { status: 401 } })
    expect(oyente).not.toHaveBeenCalled()
    sessionStorage.setItem(CLAVE_TOKEN, 'vencido')
    await expect(authApi.yo()).rejects.toBeTruthy()
    expect(oyente).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_SESION_EXPIRADA, oyente)
  })

  it('mensajeDeError usa el mensaje del backend, avisa si no hay conexión y tiene un texto por defecto', async () => {
    const e404 = await productosApi.obtener('NOPE').catch((e) => e)
    expect(mensajeDeError(e404)).toBe('No se encontró el producto solicitado.')
    expect(estadoHttp(e404)).toBe(404)
    expect(esNoEncontrado(e404)).toBe(true)

    servidor.caerse()
    const sinRed = await productosApi.listar().catch((e) => e)
    expect(mensajeDeError(sinRed)).toMatch(/No se pudo conectar con el servidor/)

    expect(mensajeDeError({ response: { status: 500, data: {} } }, 'Falló')).toBe('Falló')
    expect(mensajeDeError(new Error('raro'))).toBe('raro')
    expect(mensajeDeError(undefined)).toMatch(/inesperado/)
  })
})

describe('useColeccion', () => {
  it('pasa por cargando -> datos', async () => {
    const { result } = renderHook(() => useColeccion(() => Promise.resolve([1, 2]), []))
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.datos).toEqual([1, 2])
    expect(result.current.error).toBeNull()
  })

  it('pasa por cargando -> error, y recargar() reintenta', async () => {
    const cargar = vi.fn().mockRejectedValueOnce(new Error('caído')).mockResolvedValueOnce(['ok'])
    const { result } = renderHook(() => useColeccion(cargar, [], { inicial: [] }))
    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.datos).toEqual([])
    act(() => result.current.recargar())
    await waitFor(() => expect(result.current.datos).toEqual(['ok']))
    expect(cargar).toHaveBeenCalledTimes(2)
  })

  it('vuelve a cargar cuando cambian las dependencias y descarta respuestas viejas', async () => {
    let resolverLenta
    const cargar = (id) => (id === 'lenta' ? new Promise((r) => { resolverLenta = r }) : Promise.resolve(`dato-${id}`))
    const { result, rerender } = renderHook(({ id }) => useColeccion(() => cargar(id), [id]), { initialProps: { id: 'lenta' } })
    rerender({ id: 'rapida' })
    await waitFor(() => expect(result.current.datos).toBe('dato-rapida'))
    await act(async () => resolverLenta('dato-lenta'))
    expect(result.current.datos).toBe('dato-rapida')
  })

  it('setDatos permite actualizar la lista localmente (p. ej. tras eliminar)', async () => {
    const { result } = renderHook(() => useColeccion(() => Promise.resolve([1, 2, 3]), []))
    await waitFor(() => expect(result.current.datos).toHaveLength(3))
    act(() => result.current.setDatos((l) => l.filter((x) => x !== 2)))
    expect(result.current.datos).toEqual([1, 3])
  })
})
