const fs = require('fs');
const path = require('path');
const ruta = path.join(__dirname, '../data/citas.json');

const leer = () => {
  const contenido = fs.readFileSync(ruta, 'utf-8');
  return JSON.parse(contenido);
};

const guardar = citas => {
  fs.writeFileSync(ruta, JSON.stringify(citas, null, 2));
};

module.exports = { leer, guardar };
