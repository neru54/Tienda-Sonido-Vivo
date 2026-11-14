/*
  Artículos del blog. Son contenido estático de la tienda: no forman parte del modelo de datos
  de la Evaluación 3 (USUARIO, BOLETA, DETALLE_BOLETA, PRODUCTO, CATEGORIA), así que se quedan
  en el frontend en vez de pedirse a la API.
*/
export const BLOGS = [
  {
    "id": "1",
    "titulo": "Por qué las guitarras Fender llevan ese nombre",
    "resumen": "Un dato curioso sobre el origen de una de las marcas más reconocidas por los guitarristas.",
    "parrafos": [
      "Leo Fender, el fundador de la marca, nunca aprendió a tocar guitarra. Su formación era en electrónica y reparación de radios, no en música. Sin embargo, esa mirada de técnico — más preocupado por la fiabilidad y la facilidad de reparación que por seguir las tradiciones de la lutería clásica — es lo que lo llevó a diseñar guitarras con cuerpos sólidos, atornillados y fáciles de intervenir, muy distintas a los instrumentos artesanales de la época.",
      "Ese enfoque práctico dio origen a modelos icónicos como la Stratocaster y la Telecaster, que hoy siguen siendo algunas de las guitarras eléctricas más vendidas del mundo, y que también encontrarás en nuestro catálogo."
    ],
    "categoria": "Guitarras Eléctricas"
  },
  {
    "id": "2",
    "titulo": "Cuidados básicos para tu primer instrumento",
    "resumen": "Pequeños hábitos que alargan la vida útil de tu guitarra, bajo o teclado recién comprado.",
    "parrafos": [
      "Los instrumentos de madera, como guitarras acústicas y bajos, son sensibles a los cambios bruscos de humedad y temperatura. Evita dejarlos cerca de ventanas con sol directo o en el maletero del auto por tiempo prolongado: la madera se puede deformar y afectar la afinación.",
      "Después de cada uso, limpia las cuerdas con un paño seco para quitar la grasa de los dedos — esto retrasa la oxidación y hace que el juego de cuerdas dure más. Si tu instrumento tiene componentes electrónicos, como pastillas o preamplificadores, evita golpes y guarda las pilas fuera cuando no lo vayas a usar por varios días.",
      "Y algo simple pero clave: usa siempre una funda o estuche para transportarlo, incluso en trayectos cortos."
    ],
    "categoria": "Accesorios"
  }
]

export function buscarBlog(id) {
  return BLOGS.find((b) => b.id === String(id)) ?? null
}
