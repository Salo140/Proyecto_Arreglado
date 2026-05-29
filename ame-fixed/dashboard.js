/**
 * dashboard.js — Carga y renderiza las citas desde la API local
 *
 * ⚠️ Esta API solo funciona en desarrollo local (npm run dev).
 * En GitHub Pages, la sección de citas muestra un mensaje informativo.
 */

const API_URL = 'http://localhost:3000/api/citas';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const citasList   = document.getElementById('citasList');
  const citasMsg    = document.getElementById('citasMessage');

  // Si no hay elementos de citas en esta página, salir
  if (!citasList || !citasMsg) return;

  const bodyEl      = document.body;
  const role        = bodyEl.dataset.role        || '';
  const psicologoName = bodyEl.dataset.psicologo || '';

  const roleLabels = {
    cliente:        'cliente',
    administrativo: 'administrativo',
    psicologos:     'psicólogo',
  };

  function filterCitas(citas) {
    if (role === 'psicologos' && psicologoName) {
      return citas.filter(c => c.psicologo === psicologoName);
    }
    return citas;
  }

  function createCitaCard(cita) {
    const li = document.createElement('li');
    li.className = 'cita-card';
    li.innerHTML = `
      <strong>${cita.cliente || 'Sin nombre'} — ${cita.psicologo || 'Sin asignar'}</strong>
      <span><strong>Fecha:</strong> ${cita.fecha || '—'}</span>
      <span><strong>Hora:</strong> ${cita.hora || '—'}</span>
      <span><strong>Motivo:</strong> ${cita.motivo || 'No especificado'}</span>
      <span><strong>Estado:</strong> ${cita.disponible ? '✅ Confirmada' : '⏳ Por confirmar'}</span>
    `;
    return li;
  }

  function renderCitas(citas) {
    citasList.innerHTML = '';
    if (!citas || citas.length === 0) {
      citasMsg.textContent = 'No hay citas disponibles para este perfil en este momento.';
      return;
    }
    const filtered = filterCitas(citas);
    if (filtered.length === 0) {
      citasMsg.textContent = 'No tienes citas asignadas actualmente.';
      return;
    }
    filtered.forEach(c => citasList.appendChild(createCitaCard(c)));
    citasMsg.textContent = `Mostrando ${filtered.length} cita(s) para el perfil ${roleLabels[role] || 'seleccionado'}.`;
  }

  async function loadCitas() {
    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const citas = await response.json();
      renderCitas(citas);
    } catch (err) {
      citasList.innerHTML = '';
      if (err.name === 'AbortError') {
        citasMsg.innerHTML = '⚠️ El servidor de citas no está disponible. Ejecuta <code>npm run dev</code> en el backend para cargar las citas en local.';
      } else {
        citasMsg.innerHTML = '⚠️ No se pudo conectar con la API de citas. Asegúrate de tener el servidor corriendo en <code>http://localhost:3000</code>.';
      }
      console.warn('[Dashboard] API de citas no disponible:', err.message);
    }
  }

  loadCitas();
});
