/**
 * psicologos-dashboard.js
 * Lógica completa para el dashboard del psicólogo
 */

// ============================================
// DATA & STATE MANAGEMENT
// ============================================

let dashboardState = {
  currentUser: null,
  pacientes: [],
  notas: [],
  comunicacion: [],
  solicitudes: [],
  citas: [],
  currentMonth: new Date(),
  currentWeek: new Date(),
  currentDay: new Date(),
  currentModule: 'agenda',
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
});

async function initializeDashboard() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  dashboardState.currentUser = user;
  updateUserDisplay();
  
  // Cargar datos
  await loadAllData();
  
  // Inicializar módulos
  initializeModuleNavigation();
  initializeQuickActions();
  initializeDailySummary();
  initializeAgenda();
  initializePatients();
  initializeNotes();
  initializeCommunication();
  
  // Inicializar modales
  initializeModals();
}

function updateUserDisplay() {
  const firstName = dashboardState.currentUser.name.split(' ')[0];
  document.getElementById('welcomeTitle').textContent = `Bienvenido, ${firstName} 🩺`;
  document.getElementById('userDisplay').textContent = firstName;
}

async function loadAllData() {
  try {
    // Cargar pacientes
    const pacientesRes = await fetch('src/data/pacientes.json');
    dashboardState.pacientes = await pacientesRes.json();
    
    // Cargar notas
    const notasRes = await fetch('src/data/notas-sesion.json');
    dashboardState.notas = await notasRes.json();
    
    // Cargar comunicación
    const comRes = await fetch('src/data/comunicacion.json');
    dashboardState.comunicacion = await comRes.json();
    
    // Cargar solicitudes
    const solicRes = await fetch('src/data/solicitudes-cancelacion.json');
    dashboardState.solicitudes = await solicRes.json();
    
    // Cargar citas
    const citasRes = await fetch('src/data/citas.json');
    dashboardState.citas = await citasRes.json();
    
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// MODULE NAVIGATION
// ============================================

function initializeModuleNavigation() {
  document.querySelectorAll('.module-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const module = tab.dataset.module;
      switchModule(module);
    });
  });
}

function switchModule(moduleName) {
  // Hide all modules
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));
  
  // Show selected module
  const moduleId = `${moduleName}-module`;
  const moduleEl = document.getElementById(moduleId);
  if (moduleEl) {
    moduleEl.classList.add('active');
  }
  
  // Mark tab as active
  document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');
  
  dashboardState.currentModule = moduleName;
}

// ============================================
// QUICK ACTIONS
// ============================================

function initializeQuickActions() {
  document.getElementById('btnNewSession').addEventListener('click', () => {
    openModal('createNoteModal');
  });
  
  document.getElementById('btnNewAppointment').addEventListener('click', () => {
    alert('Función: Agendar cita (se integrará con el backend)');
  });
  
  document.getElementById('btnSearchPatient').addEventListener('click', () => {
    switchModule('pacientes');
    document.getElementById('patientSearchInput').focus();
  });
  
  document.getElementById('btnSendMessage').addEventListener('click', () => {
    switchModule('comunicacion');
  });
}

// ============================================
// DAILY SUMMARY
// ============================================

function initializeDailySummary() {
  updateStatistics();
  updateDailySummary();
}

function updateStatistics() {
  const today = new Date().toISOString().split('T')[0];
  const citasHoy = dashboardState.citas.filter(c => c.fecha === today).length;
  const solicitudesPendientes = dashboardState.solicitudes.filter(s => s.estado === 'pendiente').length;
  const mensajesPendientes = dashboardState.comunicacion.filter(m => !m.leido).length;
  
  document.getElementById('statPacientesActivos').textContent = dashboardState.pacientes.length;
  document.getElementById('statCitasHoy').textContent = citasHoy;
  document.getElementById('statSolicitudesPendientes').textContent = solicitudesPendientes;
  document.getElementById('statMensajesPendientes').textContent = mensajesPendientes;
}

function updateDailySummary() {
  // Próximas citas
  const proximasCitas = dashboardState.citas
    .filter(c => new Date(c.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 3);
  
  const proximasEl = document.getElementById('summaryUpcomingAppointments');
  proximasEl.innerHTML = proximasCitas.length > 0 
    ? proximasCitas.map(c => `<li>📅 ${c.cliente} - ${c.fecha} ${c.hora}</li>`).join('')
    : '<li class="empty-state">No hay citas próximas</li>';
  
  // Recordatorios (solicitudes pendientes)
  const recordatorios = dashboardState.solicitudes.filter(s => s.estado === 'pendiente');
  const recordatoriosEl = document.getElementById('summaryReminders');
  recordatoriosEl.innerHTML = recordatorios.length > 0
    ? recordatorios.map(r => `<li>⏰ ${r.paciente} - ${r.motivoCancelacion}</li>`).join('')
    : '<li class="empty-state">No hay recordatorios</li>';
  
  // Mensajes sin leer
  const mensajesSinLeer = dashboardState.comunicacion.filter(m => !m.leido);
  const mensajesEl = document.getElementById('summaryMessages');
  mensajesEl.innerHTML = mensajesSinLeer.length > 0
    ? mensajesSinLeer.map(m => `<li>💬 ${m.remitente.nombre}</li>`).join('')
    : '<li class="empty-state">Todos los mensajes leídos</li>';
}

// ============================================
// AGENDA CLÍNICA
// ============================================

function initializeAgenda() {
  // Event listeners para cambio de vista
  document.getElementById('viewMonth').addEventListener('click', () => showCalendarView('month'));
  document.getElementById('viewWeek').addEventListener('click', () => showCalendarView('week'));
  document.getElementById('viewDay').addEventListener('click', () => showCalendarView('day'));
  
  // Controles de navegación
  document.getElementById('prevMonth').addEventListener('click', () => {
    dashboardState.currentMonth.setMonth(dashboardState.currentMonth.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    dashboardState.currentMonth.setMonth(dashboardState.currentMonth.getMonth() + 1);
    renderCalendar();
  });
  
  document.getElementById('prevWeek').addEventListener('click', () => {
    dashboardState.currentWeek.setDate(dashboardState.currentWeek.getDate() - 7);
    renderWeekView();
  });
  
  document.getElementById('nextWeek').addEventListener('click', () => {
    dashboardState.currentWeek.setDate(dashboardState.currentWeek.getDate() + 7);
    renderWeekView();
  });
  
  document.getElementById('prevDay').addEventListener('click', () => {
    dashboardState.currentDay.setDate(dashboardState.currentDay.getDate() - 1);
    renderDayView();
  });
  
  document.getElementById('nextDay').addEventListener('click', () => {
    dashboardState.currentDay.setDate(dashboardState.currentDay.getDate() + 1);
    renderDayView();
  });
  
  renderCalendar();
  renderUpcomingAppointments();
}

function showCalendarView(view) {
  // Hide all views
  document.getElementById('calendarView').classList.remove('active');
  document.getElementById('weekView').classList.remove('active');
  document.getElementById('dayView').classList.remove('active');
  
  // Remove active from buttons
  document.querySelectorAll('.view-toggle').forEach(btn => btn.classList.remove('active'));
  
  // Show selected view
  if (view === 'month') {
    document.getElementById('calendarView').classList.add('active');
    document.getElementById('viewMonth').classList.add('active');
    renderCalendar();
  } else if (view === 'week') {
    document.getElementById('weekView').classList.add('active');
    document.getElementById('viewWeek').classList.add('active');
    renderWeekView();
  } else if (view === 'day') {
    document.getElementById('dayView').classList.add('active');
    document.getElementById('viewDay').classList.add('active');
    renderDayView();
  }
}

function renderCalendar() {
  const month = dashboardState.currentMonth.getMonth();
  const year = dashboardState.currentMonth.getFullYear();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // Update header
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
  
  // Render calendar grid
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  // Day headers
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  dayNames.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendar.appendChild(header);
  });
  
  // Days
  let currentDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (currentDate.getMonth() !== month) {
      dayEl.classList.add('other-month');
    }
    
    const today = new Date();
    if (currentDate.toDateString() === today.toDateString()) {
      dayEl.classList.add('today');
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayAppointments = dashboardState.citas.filter(c => c.fecha === dateStr);
    if (dayAppointments.length > 0) {
      dayEl.classList.add('has-appointments');
    }
    
    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = currentDate.getDate();
    dayEl.appendChild(dayNum);
    
    dayEl.addEventListener('click', () => {
      dashboardState.currentDay = new Date(currentDate);
      showCalendarView('day');
    });
    
    calendar.appendChild(dayEl);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function renderWeekView() {
  const week = getWeekDates(dashboardState.currentWeek);
  const weekStart = week[0];
  const weekEnd = week[6];
  
  document.getElementById('currentWeek').textContent = 
    `Semana del ${weekStart.getDate()}-${weekEnd.getDate()} de ${getMonthName(weekEnd.getMonth())}`;
  
  const weekGrid = document.getElementById('weekGrid');
  weekGrid.innerHTML = '';
  
  week.forEach(date => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'week-day';
    
    const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
    dayDiv.innerHTML = `<div class="week-day-header">${dayName} ${date.getDate()}</div>`;
    
    const dateStr = date.toISOString().split('T')[0];
    const dayAppointments = dashboardState.citas.filter(c => c.fecha === dateStr);
    
    const eventsDiv = document.createElement('div');
    eventsDiv.className = 'week-day-events';
    
    dayAppointments.forEach(apt => {
      const eventEl = document.createElement('div');
      eventEl.className = 'day-event';
      eventEl.textContent = `${apt.hora} - ${apt.cliente.split(' ')[0]}`;
      eventEl.addEventListener('click', () => showAppointmentDetail(apt));
      eventsDiv.appendChild(eventEl);
    });
    
    dayDiv.appendChild(eventsDiv);
    weekGrid.appendChild(dayDiv);
  });
}

function renderDayView() {
  const dayStr = dashboardState.currentDay.toLocaleDateString('es-CO', 
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('currentDay').textContent = dayStr;
  
  const dateStr = dashboardState.currentDay.toISOString().split('T')[0];
  const dayAppointments = dashboardState.citas.filter(c => c.fecha === dateStr);
  
  const dayGrid = document.getElementById('dayGrid');
  dayGrid.innerHTML = '';
  
  // Generate time slots (6:00 - 20:00)
  for (let hour = 6; hour <= 20; hour++) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'day-time-slot';
    
    const timeLabel = document.createElement('div');
    timeLabel.className = 'day-time-label';
    timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
    slotDiv.appendChild(timeLabel);
    
    const eventsDiv = document.createElement('div');
    eventsDiv.className = 'day-time-events';
    
    const slotAppointments = dayAppointments.filter(apt => {
      const [aptHour] = apt.hora.split(':').map(Number);
      return aptHour === hour;
    });
    
    if (slotAppointments.length === 0) {
      eventsDiv.style.justifyContent = 'center';
      eventsDiv.style.color = '#ccc';
      eventsDiv.textContent = '—';
    } else {
      slotAppointments.forEach(apt => {
        const aptEl = document.createElement('div');
        aptEl.className = 'day-appointment';
        aptEl.innerHTML = `<strong>${apt.hora}</strong><br>${apt.cliente}`;
        aptEl.addEventListener('click', () => showAppointmentDetail(apt));
        eventsDiv.appendChild(aptEl);
      });
    }
    
    slotDiv.appendChild(eventsDiv);
    dayGrid.appendChild(slotDiv);
  }
}

function renderUpcomingAppointments() {
  const upcoming = dashboardState.citas
    .filter(c => new Date(c.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 5);
  
  const list = document.getElementById('upcomingAppointments');
  list.innerHTML = upcoming.length > 0
    ? upcoming.map(apt => `
        <li class="appointment-item" onclick="showAppointmentDetail(${JSON.stringify(apt).replace(/"/g, '&quot;')})">
          <div class="appointment-patient">${apt.cliente}</div>
          <div class="appointment-time">${apt.fecha} ${apt.hora}</div>
          <span class="appointment-status status-${(apt.estado || 'confirmada').toLowerCase()}">${apt.estado || 'Confirmada'}</span>
        </li>
      `).join('')
    : '<li class="empty-state">No hay citas próximas</li>';
}

function getWeekDates(date) {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay();
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(curr.setDate(first + i)));
  }
  return days;
}

function getMonthName(month) {
  const names = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return names[month];
}

// ============================================
// PACIENTES ACTIVOS
// ============================================

function initializePatients() {
  document.getElementById('patientSearchInput').addEventListener('input', filterPatients);
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filterPatients();
    });
  });
  
  renderPatients();
}

function filterPatients() {
  const search = document.getElementById('patientSearchInput').value.toLowerCase();
  const filter = document.querySelector('.filter-btn.active').dataset.filter;
  
  const filtered = dashboardState.pacientes.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search) ||
                       p.email.toLowerCase().includes(search) ||
                       p.telefono.includes(search);
    const matchFilter = p.estado === filter;
    return matchSearch && matchFilter;
  });
  
  renderPatientTable(filtered);
}

function renderPatients() {
  const filtered = dashboardState.pacientes.filter(p => p.estado === 'activo');
  renderPatientTable(filtered);
}

function renderPatientTable(patients) {
  const tbody = document.getElementById('patientsTableBody');
  
  if (patients.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9" class="empty-state">No hay pacientes</td></tr>';
    return;
  }
  
  tbody.innerHTML = patients.map(p => `
    <tr>
      <td><div class="patient-photo">👤</div></td>
      <td><strong>${p.nombre}</strong></td>
      <td>${p.edad}</td>
      <td><a href="mailto:${p.email}" style="color: var(--green);">${p.email}</a></td>
      <td>${p.telefono}</td>
      <td>${new Date(p.fechaIngreso).toLocaleDateString('es-CO')}</td>
      <td>${p.proximaSesion ? new Date(p.proximaSesion).toLocaleDateString('es-CO') : '—'}</td>
      <td><span class="patient-status status-${p.estado}">${p.estado}</span></td>
      <td class="patient-actions">
        <button class="action-link" onclick="showPatientDetail(${p.id})">Ver</button>
        <button class="action-link" onclick="alert('Agendar cita')">Agendar</button>
      </td>
    </tr>
  `).join('');
}

function showPatientDetail(patientId) {
  const patient = dashboardState.pacientes.find(p => p.id === patientId);
  if (!patient) return;
  
  const content = document.getElementById('patientDetailContent');
  
  const recentNotes = dashboardState.notas.filter(n => n.pacienteId === patientId).slice(-3);
  const nextAppointment = dashboardState.citas.find(c => c.cliente === patient.nombre);
  
  content.innerHTML = `
    <div class="patient-detail">
      <div class="detail-section">
        <h4>Información Personal</h4>
        <p><strong>Nombre:</strong> ${patient.nombre}</p>
        <p><strong>Edad:</strong> ${patient.edad} años</p>
        <p><strong>Email:</strong> ${patient.email}</p>
        <p><strong>Teléfono:</strong> ${patient.telefono}</p>
        <p><strong>Contacto de Emergencia:</strong> ${patient.contactoEmergencia.nombre} (${patient.contactoEmergencia.relacion}) - ${patient.contactoEmergencia.telefono}</p>
      </div>
      
      <div class="detail-section">
        <h4>Información Clínica</h4>
        <p><strong>Motivo de Consulta:</strong> ${patient.motivoConsulta}</p>
        <p><strong>Diagnóstico:</strong> ${patient.diagnostico}</p>
        <p><strong>Antecedentes:</strong> ${patient.antecedentes}</p>
        <p><strong>Objetivos Terapéuticos:</strong> ${patient.objetivosTerapeuticos}</p>
        <p><strong>Tratamiento Actual:</strong> ${patient.tratamiento}</p>
      </div>
      
      <div class="detail-section">
        <h4>Progreso</h4>
        <p><strong>Nivel de Bienestar:</strong> ${patient.nivelBienestar}/10</p>
        <p><strong>Cumplimiento de Objetivos:</strong> ${patient.cumplimientoObjetivos}%</p>
        <p><strong>Asistencia:</strong> ${patient.asistencia}%</p>
        <p><strong>Riesgos:</strong> ${patient.riesgosIdentificados}</p>
      </div>
      
      <div class="detail-section">
        <h4>Próxima Sesión</h4>
        ${nextAppointment ? `<p>${nextAppointment.fecha} ${nextAppointment.hora}</p>` : '<p>No hay cita agendada</p>'}
      </div>
      
      <div class="detail-section">
        <h4>Notas Recientes</h4>
        ${recentNotes.length > 0 ? `
          <ul style="list-style: none; padding: 0;">
            ${recentNotes.map(n => `<li style="margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
              <strong>${new Date(n.fecha).toLocaleDateString('es-CO')}</strong><br>
              ${n.objetivosTrabajados.substring(0, 100)}...
            </li>`).join('')}
          </ul>
        ` : '<p>No hay notas registradas</p>'}
      </div>
    </div>
  `;
  
  openModal('patientDetailModal');
}

// ============================================
// NOTAS DE SESIÓN
// ============================================

function initializeNotes() {
  document.getElementById('btnCreateNote').addEventListener('click', () => {
    openModal('createNoteModal');
    populatePatientSelect();
    document.getElementById('notaFecha').valueAsDate = new Date();
  });
  
  document.getElementById('createNoteForm').addEventListener('submit', saveNote);
  document.getElementById('btnSaveDraft').addEventListener('click', () => saveDraft());
  
  document.getElementById('notasSearchInput').addEventListener('input', filterNotes);
  document.getElementById('notasFilterEstado').addEventListener('change', filterNotes);
  
  renderNotes();
}

function populatePatientSelect() {
  const select = document.getElementById('notaPaciente');
  select.innerHTML = '<option value="">Selecciona un paciente</option>' +
    dashboardState.pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

function filterNotes() {
  const search = document.getElementById('notasSearchInput').value.toLowerCase();
  const estado = document.getElementById('notasFilterEstado').value;
  
  const filtered = dashboardState.notas.filter(n => {
    const matchSearch = n.pacienteNombre.toLowerCase().includes(search);
    const matchEstado = !estado || n.estado === estado;
    return matchSearch && matchEstado;
  });
  
  renderNotesList(filtered);
}

function renderNotes() {
  renderNotesList(dashboardState.notas);
}

function renderNotesList(notes) {
  const notesList = document.getElementById('notasList');
  
  if (notes.length === 0) {
    notesList.innerHTML = '<div class="empty-state">No hay notas de sesión</div>';
    return;
  }
  
  notesList.innerHTML = notes.map(n => `
    <div class="note-item">
      <div class="note-header">
        <span class="note-patient">${n.pacienteNombre}</span>
        <span class="note-date">${new Date(n.fecha).toLocaleDateString('es-CO')}</span>
      </div>
      <div class="note-preview">${n.objetivosTrabajados.substring(0, 100)}...</div>
      <div class="note-footer">
        <span class="note-tipo">${n.tipoSesion}</span>
        <span class="note-estado estado-${n.estado}">${n.estado.charAt(0).toUpperCase() + n.estado.slice(1)}</span>
      </div>
    </div>
  `).join('');
}

function saveNote(e) {
  e.preventDefault();
  
  const pacienteId = parseInt(document.getElementById('notaPaciente').value);
  const paciente = dashboardState.pacientes.find(p => p.id === pacienteId);
  
  const newNote = {
    id: dashboardState.notas.length + 1,
    pacienteId: pacienteId,
    pacienteNombre: paciente.nombre,
    fecha: document.getElementById('notaFecha').value,
    tipoSesion: document.getElementById('notaTipoSesion').value,
    duracion: 60,
    objetivosTrabajados: document.getElementById('notaObjetivos').value,
    temasAbordados: document.getElementById('notaTemas').value,
    observacionesClinicas: document.getElementById('notaObservaciones').value,
    conductasObservadas: '',
    estadoEmocional: document.getElementById('notaEstadoEmocional').value,
    riesgosDetectados: document.getElementById('notaRiesgos').value,
    escalaAnsiedad: parseInt(document.getElementById('notaAnsiedad').value) || 5,
    escalaEstres: parseInt(document.getElementById('notaEstres').value) || 5,
    escalaEstadoAnimo: parseInt(document.getElementById('notaAnimo').value) || 5,
    escalaMotivacion: parseInt(document.getElementById('notaMotivacion').value) || 5,
    tareasAsignadas: document.getElementById('notaTareas').value,
    recomendaciones: document.getElementById('notaRecomendaciones').value,
    objetivosProximaSesion: document.getElementById('notaObjetivosProxima').value,
    adjuntos: [],
    estado: 'finalizada'
  };
  
  dashboardState.notas.push(newNote);
  renderNotes();
  closeModal('createNoteModal');
  document.getElementById('createNoteForm').reset();
  showNotification('Nota de sesión guardada correctamente', 'success');
}

function saveDraft() {
  const pacienteId = parseInt(document.getElementById('notaPaciente').value);
  const paciente = dashboardState.pacientes.find(p => p.id === pacienteId);
  
  const draftNote = {
    id: dashboardState.notas.length + 1,
    pacienteId: pacienteId,
    pacienteNombre: paciente.nombre,
    fecha: document.getElementById('notaFecha').value,
    tipoSesion: document.getElementById('notaTipoSesion').value,
    objetivosTrabajados: document.getElementById('notaObjetivos').value,
    temasAbordados: document.getElementById('notaTemas').value,
    observacionesClinicas: document.getElementById('notaObservaciones').value,
    estadoEmocional: document.getElementById('notaEstadoEmocional').value,
    riesgosDetectados: document.getElementById('notaRiesgos').value,
    escalaAnsiedad: parseInt(document.getElementById('notaAnsiedad').value) || 5,
    escalaEstres: parseInt(document.getElementById('notaEstres').value) || 5,
    escalaEstadoAnimo: parseInt(document.getElementById('notaAnimo').value) || 5,
    escalaMotivacion: parseInt(document.getElementById('notaMotivacion').value) || 5,
    tareasAsignadas: document.getElementById('notaTareas').value,
    recomendaciones: document.getElementById('notaRecomendaciones').value,
    objetivosProximaSesion: document.getElementById('notaObjetivosProxima').value,
    adjuntos: [],
    estado: 'borrador'
  };
  
  dashboardState.notas.push(draftNote);
  renderNotes();
  closeModal('createNoteModal');
  document.getElementById('createNoteForm').reset();
  showNotification('Nota guardada como borrador', 'info');
}

// ============================================
// COMUNICACIÓN
// ============================================

function initializeCommunication() {
  // Canal buttons
  document.querySelectorAll('.canal-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const canal = this.dataset.canal;
      switchCommunicationChannel(canal);
    });
  });
  
  // Send buttons
  document.querySelectorAll('.btn-send').forEach(btn => {
    btn.addEventListener('click', function() {
      sendMessage(this);
    });
  });
  
  renderCommunicationChannels();
  updateCommunicationBadges();
}

function switchCommunicationChannel(canal) {
  // Hide all channels
  document.querySelectorAll('.canal-content').forEach(ch => ch.classList.remove('active'));
  document.querySelectorAll('.canal-btn').forEach(btn => btn.classList.remove('active'));
  
  // Show selected channel
  const channelId = canal === 'administracion' ? 'adminChannel' :
                    canal === 'paciente' ? 'pacientesChannel' :
                    canal === 'finanzas' ? 'finanzasChannel' : 'notificacionesChannel';
  
  const channel = document.getElementById(channelId);
  if (channel) {
    channel.classList.add('active');
  }
  
  document.querySelector(`[data-canal="${canal}"]`).classList.add('active');
}

function renderCommunicationChannels() {
  const adminMsgs = dashboardState.comunicacion.filter(m => m.canal === 'administracion');
  const pacienteMsgs = dashboardState.comunicacion.filter(m => m.canal === 'paciente');
  const finanzasMsgs = dashboardState.comunicacion.filter(m => m.canal === 'finanzas');
  const notifMsgs = dashboardState.comunicacion.filter(m => m.canal === 'sistema');
  
  renderChannelMessages('adminMessages', adminMsgs);
  renderChannelMessages('pacientesMessages', pacienteMsgs);
  renderChannelMessages('finanzasMessages', finanzasMsgs);
  renderChannelMessages('notificacionesMessages', notifMsgs);
}

function renderChannelMessages(containerId, messages) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = messages.length > 0
    ? messages.map(m => `
        <div class="chat-message ${m.remitente.rol === 'psicologos' ? 'message-sender' : 'message-receiver'}">
          <div class="message-bubble">${m.mensaje}</div>
          <div class="message-time">${m.remitente.nombre} - ${new Date(m.fecha).toLocaleString('es-CO')}</div>
        </div>
      `).join('')
    : '<div class="empty-state" style="margin-top: 20px;">No hay mensajes</div>';
}

function sendMessage(btn) {
  const input = btn.parentElement.querySelector('.message-text');
  const text = input.value.trim();
  
  if (!text) return;
  
  // Get current channel
  const activeChannel = document.querySelector('.canal-btn.active').dataset.canal;
  
  const newMessage = {
    id: dashboardState.comunicacion.length + 1,
    tipo: 'mensaje',
    remitente: {
      nombre: dashboardState.currentUser.name,
      rol: 'psicologos'
    },
    asunto: '',
    mensaje: text,
    fecha: new Date().toISOString(),
    leido: true,
    canal: activeChannel
  };
  
  dashboardState.comunicacion.push(newMessage);
  input.value = '';
  renderCommunicationChannels();
  updateCommunicationBadges();
  showNotification('Mensaje enviado', 'success');
}

function updateCommunicationBadges() {
  const adminCount = dashboardState.comunicacion.filter(m => m.canal === 'administracion' && !m.leido).length;
  const pacientesCount = dashboardState.comunicacion.filter(m => m.canal === 'paciente' && !m.leido).length;
  const finanzasCount = dashboardState.comunicacion.filter(m => m.canal === 'finanzas' && !m.leido).length;
  const notifCount = dashboardState.comunicacion.filter(m => m.canal === 'sistema' && !m.leido).length;
  
  document.getElementById('badgeAdmon').textContent = adminCount;
  document.getElementById('badgePacientes').textContent = pacientesCount;
  document.getElementById('badgeFinanzas').textContent = finanzasCount;
  document.getElementById('badgeNotificaciones').textContent = notifCount;
}

// ============================================
// APPOINTMENTS
// ============================================

function showAppointmentDetail(appointment) {
  const content = document.getElementById('appointmentDetailContent');
  const patient = dashboardState.pacientes.find(p => p.nombre === appointment.cliente);
  
  content.innerHTML = `
    <div class="appointment-detail">
      <p><strong>Paciente:</strong> ${appointment.cliente}</p>
      <p><strong>Fecha:</strong> ${new Date(appointment.fecha).toLocaleDateString('es-CO')}</p>
      <p><strong>Hora:</strong> ${appointment.hora}</p>
      <p><strong>Motivo:</strong> ${appointment.motivo}</p>
      <p><strong>Estado:</strong> <span class="patient-status status-${(appointment.estado || 'confirmada').toLowerCase()}">${appointment.estado || 'Confirmada'}</span></p>
      
      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button class="btn-primary" onclick="openModal('createNoteModal')">Registrar Nota</button>
        <button class="btn-secondary" onclick="openCancelRequest(${appointment.id}, '${appointment.cliente}', '${appointment.fecha} ${appointment.hora}')">Solicitar Cancelación</button>
      </div>
    </div>
  `;
  
  openModal('appointmentDetailModal');
}

function openCancelRequest(appointmentId, patientName, dateTime) {
  document.getElementById('cancelPaciente').value = patientName;
  document.getElementById('cancelFecha').value = dateTime;
  openModal('cancelRequestModal');
}

// ============================================
// MODALES
// ============================================

function initializeModals() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      closeModal(modal.id);
    });
  });
  
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      closeModal(modal.id);
    });
  });
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });
  
  document.getElementById('cancelRequestForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitCancelRequest();
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function submitCancelRequest() {
  const motivo = document.getElementById('cancelMotivo').value;
  const comentarios = document.getElementById('cancelComentarios').value;
  
  if (!motivo) {
    showNotification('Por favor selecciona un motivo', 'error');
    return;
  }
  
  const newRequest = {
    id: dashboardState.solicitudes.length + 1,
    psicologoEmail: dashboardState.currentUser.email,
    citaId: Math.floor(Math.random() * 100),
    paciente: document.getElementById('cancelPaciente').value,
    fechaCita: document.getElementById('cancelFecha').value,
    horaCita: document.getElementById('cancelFecha').value.split(' ')[1],
    motivoCancelacion: motivo,
    comentarios: comentarios,
    fechaSolicitud: new Date().toISOString().split('T')[0],
    estado: 'pendiente'
  };
  
  dashboardState.solicitudes.push(newRequest);
  closeModal('cancelRequestModal');
  updateStatistics();
  showNotification('Solicitud de cancelación enviada', 'success');
  document.getElementById('cancelRequestForm').reset();
}

// ============================================
// UTILITIES
// ============================================

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Implementar toast notification si es necesario
}
