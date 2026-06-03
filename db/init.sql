CREATE TABLE IF NOT EXISTS equipos (
  id                    SERIAL PRIMARY KEY,
  codigo                VARCHAR(20)  UNIQUE NOT NULL,
  nombre                VARCHAR(100) NOT NULL,
  area                  VARCHAR(50)  NOT NULL DEFAULT 'Sin área',
  estado                VARCHAR(30)  NOT NULL DEFAULT 'operativo'
                        CHECK (estado IN ('operativo','en_mantenimiento','fuera_de_servicio')),
  ultimo_mantenimiento  DATE,
  proximo_mantenimiento DATE,
  horas_operacion       INTEGER      NOT NULL DEFAULT 0,
  creado_en             TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO equipos (codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion)
SELECT * FROM (VALUES
  ('EQ-001', 'Compresor Atlas Copco GA55',        'Producción',   'operativo',         '2026-05-10', '2026-08-10', 4320),
  ('EQ-002', 'Balanza Mettler Toledo ICS685',     'Pesaje',       'en_mantenimiento',  '2026-06-01', '2026-09-01', 2100),
  ('EQ-003', 'Faja Transportadora FT-12',         'Almacén',      'operativo',         '2026-04-15', '2026-07-15', 6800),
  ('EQ-004', 'Generador Cummins C500D5',          'Subestación',  'fuera_de_servicio', '2026-03-20', '2026-06-20', 9100),
  ('EQ-005', 'Bomba Hidráulica Grundfos CM10',    'Producción',   'operativo',         '2026-05-20', '2026-08-20', 3200),
  ('EQ-006', 'Montacargas Toyota 8FGU25',         'Almacén',      'operativo',         '2026-04-28', '2026-07-28', 5400),
  ('EQ-007', 'Caldero Cleaver Brooks CB-200',     'Servicios',    'en_mantenimiento',  '2026-05-30', '2026-08-30', 7800),
  ('EQ-008', 'Compresor de Tornillo Kaeser SK19', 'Producción',   'operativo',         '2026-05-05', '2026-08-05', 2900),
  ('EQ-009', 'Transformador ABB 500KVA',          'Subestación',  'operativo',         '2026-03-10', '2026-09-10', 11200),
  ('EQ-010', 'Banda Transportadora BT-07',        'Almacén',      'fuera_de_servicio', '2026-02-15', '2026-05-15', 14300)
) AS d(codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion)
WHERE NOT EXISTS (SELECT 1 FROM equipos LIMIT 1);
