const express = require('express');
const router = express.Router();
const service = require('../services/horarios');

// GET /api/horarios/:psicologo — obtener horario de un psicólogo
router.get('/:psicologo', (req, res) => {
  try {
    const todos = service.leer();
    const entrada = todos.find(h => h.psicologo === req.params.psicologo);
    res.json(entrada ? entrada.schedule : []);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer horarios', detalle: err.message });
  }
});

// POST /api/horarios/:psicologo — guardar horario de un psicólogo
router.post('/:psicologo', (req, res) => {
  try {
    const { schedule } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: 'El campo schedule debe ser un array' });
    }

    const todos = service.leer();
    const index = todos.findIndex(h => h.psicologo === req.params.psicologo);
    const entrada = { psicologo: req.params.psicologo, schedule };

    if (index === -1) {
      todos.push(entrada);
    } else {
      todos[index] = entrada;
    }

    service.guardar(todos);
    res.json({ ok: true, psicologo: req.params.psicologo, schedule });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar horario', detalle: err.message });
  }
});

module.exports = router;