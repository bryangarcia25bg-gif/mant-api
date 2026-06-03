-- Migración inicial: tabla de equipos industriales
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

-- Datos iniciales (solo si la tabla está vacía)
INSERT INTO equipos (codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion)
SELECT * FROM (VALUES
  ('EQ-001', 'Compresor Atlas Copco GA55',      'Producción',   'operativo',          '2026-05-10', '2026-08-10', 4320),
  ('EQ-002', 'Balanza Mettler Toledo ICS685',   'Pesaje',       'en_mantenimiento',   '2026-06-01', '2026-09-01', 2100),
  ('EQ-003', 'Faja Transportadora FT-12',       'Almacén',      'operativo',          '2026-04-15', '2026-07-15', 6800),
  ('EQ-004', 'Generador Cummins C500D5',        'Subestación',  'fuera_de_servicio',  '2026-03-20', '2026-06-20', 9100)
) AS datos(codigo, nombre, area, estado, ultimo_mantenimiento, proximo_mantenimiento, horas_operacion)
WHERE NOT EXISTS (SELECT 1 FROM equipos LIMIT 1);
