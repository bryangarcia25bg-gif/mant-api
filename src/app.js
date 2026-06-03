const express = require('express');
const db = require('./data');

const app = express();
app.use(express.json());

// GET /health — health check para Jenkins y Docker
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'mant-api', version: '1.0.0' });
});

// GET /equipos — listar todos los equipos
app.get('/equipos', (req, res) => {
  const { estado } = req.query;
  if (estado) {
    const resultado = db.getByEstado(estado);
    return res.json({ total: resultado.length, equipos: resultado });
  }
  const todos = db.getAll();
  res.json({ total: todos.length, equipos: todos });
});

// GET /equipos/resumen — KPIs generales
app.get('/equipos/resumen', (req, res) => {
  res.json(db.getResumen());
});

// GET /equipos/:id — obtener equipo por ID
app.get('/equipos/:id', (req, res) => {
  const equipo = db.getById(req.params.id);
  if (!equipo) {
    return res.status(404).json({ error: 'Equipo no encontrado', id: req.params.id });
  }
  res.json(equipo);
});

// POST /equipos — registrar nuevo equipo
app.post('/equipos', (req, res) => {
  const { codigo, nombre } = req.body;
  if (!codigo || !nombre) {
    return res.status(400).json({ error: 'Los campos codigo y nombre son requeridos' });
  }
  const nuevo = db.create(req.body);
  res.status(201).json(nuevo);
});

module.exports = app;
