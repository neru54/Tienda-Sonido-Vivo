import { api, datos } from './cliente'

/*
  Servicio de boletas: /api/v1/boletas (microservicio pedidos, a través del Gateway).
  crear() es público (se puede comprar sin cuenta); si hay sesión el interceptor manda el token
  y el backend asocia la boleta al usuario. Solo se envían códigos y cantidades: el backend
  calcula precios, descuento y total.

  idempotencyKey (opcional): una clave por intento de compra. Si la red se corta y el checkout
  reintenta con la MISMA clave, el backend devuelve la boleta ya creada en vez de cobrar dos veces.
*/
export const boletasApi = {
  crear: (pedido, idempotencyKey) =>
    datos(api.post('/boletas', pedido, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined)),
  listar: () => datos(api.get('/boletas')),
  obtener: (id) => datos(api.get(`/boletas/${encodeURIComponent(id)}`)),
}

/**
 * Clave aleatoria para Idempotency-Key. crypto.randomUUID solo existe en contextos seguros (HTTPS o
 * localhost); el sitio web de S3 es HTTP, así que se usa getRandomValues, disponible en ambos.
 */
export function nuevaClaveCompra() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
