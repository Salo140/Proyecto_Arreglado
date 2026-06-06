const fs = require('fs');
const path = require('path');
const ruta = path.join(__dirname, '../data/horarios.json');

const leer = () => {
  const contenido = fs.readFileSync(ruta, 'utf-8');
  return JSON.parse(contenido);
};

const guardar = (horarios) => {
  fs.writeFileSync(ruta, JSON.stringify(horarios, null, 2));
};

module.exports = { leer, guardar };