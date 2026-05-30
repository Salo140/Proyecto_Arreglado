/**
 * dashboard.js — Carga y renderiza las citas desde la API local
 *
 * ⚠️ Esta API solo funciona en desarrollo local (npm run dev).
 * En GitHub Pages, la sección de citas muestra un mensaje informativo.
 */

const API_URL = 'http://localhost:3000/api/citas';
const STATIC_CITAS_PATH = 'src/data/citas.json';

function getStaticCitasUrl() {
  return new URL(STATIC_CITAS_PATH, window.location.href).href;
}

function isLocalHost() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const citasList   = document.getElementById('citasList');
  const citasMsg    = document.getElementById('citasMessage');

  // Si no hay elementos de citas en esta página, salir
  if (!citasList || !citasMsg) return;

  const bodyEl        = document.body;
  const role          = bodyEl.dataset.role        || '';
  const psicologoName = bodyEl.dataset.psicologo || '';
  const useApi        = isLocalHost();

  const roleLabels = {
    cliente:        'cliente',
    administrativo: 'administrativo',
    psicologos:     'psicólogo',
  };

  const isCliente = role === 'cliente';
  const canManageCitas = () => useApi && isCliente;

  function filterCitas(citas) {
    if (role === 'cliente') {
      const clienteName = bodyEl.dataset.cliente || '';
      return citas.filter(c => c.cliente === clienteName);
    }

    if (role === 'psicologos' && psicologoName) {
      return citas.filter(c => c.psicologo === psicologoName);
    }

    return citas;
  }

  function cancelarCita(id) {
    if (!useApi) {
      alert('Cancelar citas solo está disponible cuando el backend local está ejecutándose. Ejecuta npm run dev.');
      return;
    }

    const confirmar = confirm('¿Estás seguro de que quieres cancelar esta cita?');
    if (!confirmar) return;

    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return loadCitas();
      })
      .catch(err => {
        console.error('[Dashboard] Error al cancelar cita:', err);
        alert('No se pudo cancelar la cita. Asegúrate de tener el servidor local corriendo.');
      });
  }

  async function reagendarCita(cita) {
    if (!useApi) {
      alert('Reagendar citas solo está disponible cuando el backend local está ejecutándose. Ejecuta npm run dev.');
      return;
    }

    const nuevaFecha = prompt('Nueva fecha (YYYY-MM-DD):', cita.fecha);
    if (!nuevaFecha) return;

    const nuevaHora = prompt('Nueva hora (HH:MM):', cita.hora);
    if (!nuevaHora) return;

    const payload = {
      cliente: cita.cliente,
      psicologo: cita.psicologo,
      fecha: nuevaFecha,
      hora: nuevaHora,
      motivo: cita.motivo,
      disponible: cita.disponible
    };

    try {
      const response = await fetch(`${API_URL}/${cita.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadCitas();
      alert('La cita se reagendó correctamente.');
    } catch (err) {
      console.error('[Dashboard] Error al reagendar cita:', err);
      alert('No se pudo reagendar la cita. Verifica el servidor local y los datos ingresados.');
    }
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

    if (canManageCitas()) {
      const actions = document.createElement('div');
      actions.className = 'cita-actions';
      actions.innerHTML = `
        <button class="cita-btn cita-btn-cancelar" data-id="${cita.id}">Cancelar</button>
        <button class="cita-btn cita-btn-reagendar" data-id="${cita.id}">Reagendar</button>
      `;
      actions.querySelector('.cita-btn-cancelar').addEventListener('click', () => cancelarCita(cita.id));
      actions.querySelector('.cita-btn-reagendar').addEventListener('click', () => reagendarCita(cita));
      li.appendChild(actions);
    }

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
    const useApi = isLocalHost();

    if (useApi) {
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const citas = await response.json();
        renderCitas(citas);
        return;
      } catch (err) {
        console.warn('[Dashboard] API local no disponible:', err.message);
      }
    }

    try {
      const response = await fetch(getStaticCitasUrl());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const citas = await response.json();
      renderCitas(citas);
      if (!useApi) {
        citasMsg.textContent += ' (Estás en GitHub Pages / sitio estático; aquí se muestran datos de ejemplo.)';
      } else {
        citasMsg.textContent += ' (No se pudo conectar con la API local, se muestran datos de ejemplo.)';
      }
      return;
    } catch (err) {
      citasList.innerHTML = '';
      if (!useApi) {
        citasMsg.innerHTML = '⚠️ La página no puede conectarse a la API local desde GitHub Pages. Los datos de citas solo funcionan al ejecutar <code>npm run dev</code> en local.';
      } else {
        citasMsg.innerHTML = '⚠️ No se pudo cargar la API de citas ni los datos de ejemplo. En local, ejecuta <code>npm run dev</code> y recarga la página.';
      }
      console.warn('[Dashboard] Fallback de citas no disponible:', err.message);
    }
  }

  loadCitas();
});
