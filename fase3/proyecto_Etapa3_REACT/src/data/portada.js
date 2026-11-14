/*
  Contenido visual de la portada: foto del hero y foto + lema de cada categoría.
  Va aparte de la semilla (seed.js) para no cambiar los datos que guarda db.js:
  una categoría creada desde el panel admin simplemente no tiene foto y la
  tarjeta usa su color de marca.

  Fotos: Unsplash (licencia libre) y fotos del propio catálogo, guardadas en
  public/img/portada para no depender de servidores externos.
  BASE_URL: '/' en local y '/Tienda-Sonido-Vivo/' en GitHub Pages (ver vite.config.js).
*/
const CARPETA = `${import.meta.env.BASE_URL}img/portada/`

export const IMAGEN_HERO = `${CARPETA}hero-concierto.jpg`

export const PORTADA_CATEGORIAS = {
  'guitarras-acusticas': { imagen: `${CARPETA}guitarras-acusticas.jpg`, lema: 'Cuerdas que cuentan historias' },
  'guitarras-electricas': { imagen: `${CARPETA}guitarras-electricas.jpg`, lema: 'Energía en cada riff' },
  'bajos-electricos': { imagen: `${CARPETA}bajos-electricos.jpg`, lema: 'El pulso de tu música' },
  baterias: { imagen: `${CARPETA}baterias.jpg`, lema: 'Marca el ritmo' },
  'teclados-y-pianos': { imagen: `${CARPETA}teclados-y-pianos.jpg`, lema: 'Ideas que cobran vida' },
  amplificadores: { imagen: `${CARPETA}amplificadores.jpg`, lema: 'Hazte escuchar' },
  microfonos: { imagen: `${CARPETA}microfonos.jpg`, lema: 'Captura cada detalle' },
  'pedales-de-efectos': { imagen: `${CARPETA}pedales-de-efectos.jpg`, lema: 'Experimenta sin límites' },
  accesorios: { imagen: `${CARPETA}accesorios.jpg`, lema: 'Los pequeños esenciales' },
  'estudio-y-grabacion': { imagen: `${CARPETA}estudio-y-grabacion.jpg`, lema: 'De la idea a la mezcla' },
}
