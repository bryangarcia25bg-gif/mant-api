const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// GET /health
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', servicio: 'mant-api', version: '2.0.0', db: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'error', db: 'disconnected', detail: e.message });
  }
});

// GET /equipos
app.get('/equipos', async (req, res) => {
  const { estado } = req.query;
  try {
    const query = estado
      ? { text: 'SELECT * FROM equipos WHERE estado = $1 ORDER BY id', values: [estado] }
      : { text: 'SELECT * FROM equipos ORDER BY id' };
    const result = await pool.query(query);
    res.json({ total: result.rowCount, equipos: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /equipos/resumen
app.get('/equipos/resumen', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int                                            AS total,
        COUNT(*) FILTER (WHERE estado = 'operativo')::int        AS operativos,
        COUNT(*) FILTER (WHERE estado = 'en_mantenimiento')::int AS en_mantenimiento,
        COUNT(*) FILTER (WHERE estado = 'fuera_de_servicio')::int AS fuera_de_servicio,
        ROUND(
          COUNT(*) FILTER (WHERE estado = 'operativo') * 100.0 / NULLIF(COUNT(*),0)
        )::int AS disponibilidad_pct
      FROM equipos
    `);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /equipos/:id
app.get('/equipos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipos WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Equipo no encontrado', id: req.params.id });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /equipos
app.post('/equipos', async (req, res) => {
  const { codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion } = req.body;
  if (!codigo || !nombre)
    return res.status(400).json({ error: 'Los campos codigo y nombre son requeridos' });
  try {
    const result = await pool.query(
      `INSERT INTO equipos (codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [codigo, nombre, area || 'Sin área', estado || 'operativo',
       ultimo_mantenimiento || null, proximo_mantenimiento || null, horas_operacion || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ error: 'El código de equipo ya existe' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
