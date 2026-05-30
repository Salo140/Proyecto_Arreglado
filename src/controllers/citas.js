const citasService = require('../services/citas');

const obtenerTodos = (req, res) => {
  const citas = citasService.leer();
  res.json(citas);
};

const obtenerPorId = (req, res) => {
  const citas = citasService.leer();
  const id = Number(req.params.id);
  const cita = citas.find(c => c.id === id);

  if (!cita) {
    return res.status(404).json({ error: 'Cita no encontrada', id });
  }

  res.json(cita);
};

const crear = (req, res) => {
  const { cliente, psicologo, fecha, hora, motivo } = req.body;

  if (!cliente || !psicologo || !fecha || !hora) {
    return res.status(400).json({ error: 'cliente, psicologo, fecha y hora son obligatorios' });
  }

  const citas = citasService.leer();
  const nuevo = {
    id: citas.length > 0 ? Math.max(...citas.map(c => c.id)) + 1 : 1,
    cliente,
    psicologo,
    fecha,
    hora,
    motivo: motivo || '',
    disponible: true
  };

  citas.push(nuevo);
  citasService.guardar(citas);

  res.status(201).json(nuevo);
};

const actualizar = (req, res) => {
  const citas = citasService.leer();
  const id = Number(req.params.id);
  const indice = citas.findIndex(c => c.id === id);

  if (indice === -1) {
    return res.status(404).json({ error: 'Cita no encontrada', id });
  }

  const { cliente, psicologo, fecha, hora, motivo, disponible } = req.body;

  if (!cliente || !psicologo || !fecha || !hora) {
    return res.status(400).json({ error: 'cliente, psicologo, fecha y hora son obligatorios' });
  }

  citas[indice] = {
    id,
    cliente,
    psicologo,
    fecha,
    hora,
    motivo: motivo || '',
    disponible: typeof disponible === 'boolean' ? disponible : citas[indice].disponible
  };

  citasService.guardar(citas);
  res.json(citas[indice]);
};

const eliminar = (req, res) => {
  const citas = citasService.leer();
  const id = Number(req.params.id);
  const indice = citas.findIndex(c => c.id === id);

  if (indice === -1) {
    return res.status(404).json({ error: 'Cita no encontrada', id });
  }

  citas.splice(indice, 1);
  citasService.guardar(citas);
  res.status(204).send();
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
