const request = require('supertest');

// Mock del pool de PostgreSQL — los tests no necesitan BD real
jest.mock('../src/db', () => {
  const equipos = [
    { id:1, codigo:'EQ-001', nombre:'Compresor Atlas Copco GA55',    area:'Producción',  estado:'operativo',         horas_operacion:4320 },
    { id:2, codigo:'EQ-002', nombre:'Balanza Mettler Toledo ICS685', area:'Pesaje',      estado:'en_mantenimiento',  horas_operacion:2100 },
    { id:3, codigo:'EQ-003', nombre:'Faja Transportadora FT-12',     area:'Almacén',     estado:'operativo',         horas_operacion:6800 },
    { id:4, codigo:'EQ-004', nombre:'Generador Cummins C500D5',      area:'Subestación', estado:'fuera_de_servicio', horas_operacion:9100 },
  ];
  let nextId = 5;
  return {
    query: jest.fn(async (q, params) => {
      const sql = typeof q === 'string' ? q : q.text;
      const values = typeof q === 'string' ? (params || []) : (q.values || []);

      if (sql === 'SELECT 1') return { rows: [{ '?column?': 1 }] };

      if (sql.includes('COUNT(*)')) {
        const ops = equipos.filter(e => e.estado === 'operativo').length;
        const total = equipos.length;
        return { rows: [{ total, operativos: ops, en_mantenimiento: 1, fuera_de_servicio: 1,
          disponibilidad_pct: Math.round(ops * 100 / total) }] };
      }

      if (sql.includes('WHERE estado')) {
        const rows = equipos.filter(e => e.estado === values[0]);
        return { rows, rowCount: rows.length };
      }

      if (sql.includes('WHERE id')) {
        const rows = equipos.filter(e => e.id === parseInt(values[0]));
        return { rows, rowCount: rows.length };
      }

      if (sql.includes('INSERT')) {
        const nuevo = { id: nextId++, codigo: values[0], nombre: values[1],
          area: values[2], estado: values[3], horas_operacion: values[6] || 0 };
        equipos.push(nuevo);
        return { rows: [nuevo], rowCount: 1 };
      }

      return { rows: equipos, rowCount: equipos.length };
    })
  };
});

const app = require('../src/app');

describe('GET /health', () => {
  test('responde 200 con status ok y db connected', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });
});

describe('GET /equipos', () => {
  test('retorna lista de equipos con total', async () => {
    const res = await request(app).get('/equipos');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(4);
    expect(Array.isArray(res.body.equipos)).toBe(true);
  });

  test('filtra por estado=operativo', async () => {
    const res = await request(app).get('/equipos?estado=operativo');
    expect(res.statusCode).toBe(200);
    res.body.equipos.forEach(e => expect(e.estado).toBe('operativo'));
  });

  test('filtra por estado=en_mantenimiento', async () => {
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
  });

  test('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/equipos/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /equipos', () => {
  test('crea nuevo equipo correctamente', async () => {
    const res = await request(app).post('/equipos')
      .send({ codigo: 'EQ-TEST', nombre: 'Equipo de prueba', area: 'Testing' });
    expect(res.statusCode).toBe(201);
    expect(res.body.codigo).toBe('EQ-TEST');
    expect(res.body).toHaveProperty('id');
  });

  test('retorna 400 si falta codigo', async () => {
    const res = await request(app).post('/equipos').send({ nombre: 'Sin codigo' });
    expect(res.statusCode).toBe(400);
  });

  test('retorna 400 si falta nombre', async () => {
    const res = await request(app).post('/equipos').send({ codigo: 'EQ-XX' });
    expect(res.statusCode).toBe(400);
  });
});
