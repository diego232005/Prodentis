export function notFound(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' })
}

export function errorHandler(err, _req, res, _next) {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    details: err.details,
  })
}
