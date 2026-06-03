const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  test('responde 200 con status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.servicio).toBe('mant-api');
  });
});

describe('GET /equipos', () => {
  test('retorna lista de equipos con total', async () => {
    const res = await request(app).get('/equipos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('equipos');
    expect(Array.isArray(res.body.equipos)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  test('filtra equipos por estado=operativo', async () => {
    const res = await request(app).get('/equipos?estado=operativo');
    expect(res.statusCode).toBe(200);
    res.body.equipos.forEach(e => {
      expect(e.estado).toBe('operativo');
    });
  });

  test('filtra equipos por estado=en_mantenimiento', async () => {
    const res = await request(app).get('/equipos?estado=en_mantenimiento');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });
});

describe('GET /equipos/resumen', () => {
  test('retorna KPIs con disponibilidad_pct', async () => {
    const res = await request(app).get('/equipos/resumen');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('operativos');
    expect(res.body).toHaveProperty('disponibilidad_pct');
    expect(res.body.disponibilidad_pct).toBeGreaterThanOrEqual(0);
    expect(res.body.disponibilidad_pct).toBeLessThanOrEqual(100);
  });
});

describe('GET /equipos/:id', () => {
  test('retorna equipo existente por ID', async () => {
    const res = await request(app).get('/equipos/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body).toHaveProperty('codigo');
    expect(res.body).toHaveProperty('nombre');
  });

  test('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/equipos/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /equipos', () => {
  test('crea nuevo equipo correctamente', async () => {
    const res = await request(app)
      .post('/equipos')
      .send({ codigo: 'EQ-TEST', nombre: 'Equipo de prueba', area: 'Testing' });
    expect(res.statusCode).toBe(201);
    expect(res.body.codigo).toBe('EQ-TEST');
    expect(res.body).toHaveProperty('id');
  });

  test('retorna 400 si falta codigo', async () => {
    const res = await request(app)
      .post('/equipos')
      .send({ nombre: 'Sin codigo' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('retorna 400 si falta nombre', async () => {
    const res = await request(app)
      .post('/equipos')
      .send({ codigo: 'EQ-XX' });
    expect(res.statusCode).toBe(400);
  });
});
