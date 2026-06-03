const equipos = [
  {
    id: 1,
    codigo: "EQ-001",
    nombre: "Compresor Atlas Copco GA55",
    area: "Producción",
    estado: "operativo",
    ultimo_mantenimiento: "2026-05-10",
    proximo_mantenimiento: "2026-08-10",
    horas_operacion: 4320
  },
  {
    id: 2,
    codigo: "EQ-002",
    nombre: "Balanza Mettler Toledo ICS685",
    area: "Pesaje",
    estado: "en_mantenimiento",
    ultimo_mantenimiento: "2026-06-01",
    proximo_mantenimiento: "2026-09-01",
    horas_operacion: 2100
  },
  {
    id: 3,
    codigo: "EQ-003",
    nombre: "Faja Transportadora FT-12",
    area: "Almacén",
    estado: "operativo",
    ultimo_mantenimiento: "2026-04-15",
    proximo_mantenimiento: "2026-07-15",
    horas_operacion: 6800
  },
  {
    id: 4,
    codigo: "EQ-004",
    nombre: "Generador Cummins C500D5",
    area: "Subestación",
    estado: "fuera_de_servicio",
    ultimo_mantenimiento: "2026-03-20",
    proximo_mantenimiento: "2026-06-20",
    horas_operacion: 9100
  }
];

let nextId = 5;

function getAll() {
  return equipos;
}

function getById(id) {
  return equipos.find(e => e.id === parseInt(id)) || null;
}

function getByEstado(estado) {
  return equipos.filter(e => e.estado === estado);
}

function create(data) {
  const nuevo = {
    id: nextId++,
    codigo: data.codigo,
    nombre: data.nombre,
    area: data.area || "Sin área",
    estado: data.estado || "operativo",
    ultimo_mantenimiento: data.ultimo_mantenimiento || null,
    proximo_mantenimiento: data.proximo_mantenimiento || null,
    horas_operacion: data.horas_operacion || 0
  };
  equipos.push(nuevo);
  return nuevo;
}

function getResumen() {
  const total = equipos.length;
  const operativos = equipos.filter(e => e.estado === "operativo").length;
  const en_mantenimiento = equipos.filter(e => e.estado === "en_mantenimiento").length;
  const fuera_de_servicio = equipos.filter(e => e.estado === "fuera_de_servicio").length;
  const disponibilidad = Math.round((operativos / total) * 100);
  return { total, operativos, en_mantenimiento, fuera_de_servicio, disponibilidad_pct: disponibilidad };
}

module.exports = { getAll, getById, getByEstado, create, getResumen };
