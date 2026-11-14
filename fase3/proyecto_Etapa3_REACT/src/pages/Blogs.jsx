import { Link } from 'react-router-dom'
import { BLOGS } from '../data/blogs'

/* Blogs: lista de artículos (contenido estático en data/blogs.js), una `card` por artículo. */
export default function Blogs() {
  const blogs = BLOGS
  return (
    <>
      <h1 className="h3 mb-2">Noticias importantes</h1>
      <p className="text-muted mb-4">Datos curiosos e historias sobre instrumentos y equipos musicales.</p>
      <div className="row row-cols-1 row-cols-md-2 g-4">
        {blogs.map((b) => (
          <div className="col" key={b.id}>
            <article className="card h-100">
              <div className="card-body">
                <h2 className="h5">Caso curioso #{b.id}: {b.titulo}</h2>
                <p>{b.resumen}</p>
                <Link to={`/blogs/${b.id}`} className="btn btn-outline-primary">Ver caso</Link>
              </div>
            </article>
          </div>
        ))}
      </div>
    </>
  )
}
