const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citas');

router.get('/', citasController.obtenerTodos);
router.get('/:id', citasController.obtenerPorId);
router.post('/', citasController.crear);
router.put('/:id', citasController.actualizar);
router.delete('/:id', citasController.eliminar);

module.exports = router;
