/**
 * login.js — Lógica del formulario de login de Âme
 */

const roleConfig = {
  cliente: {
    label: 'Cliente',
    info: 'Acceso para clientes que quieren gestionar su bienestar mental y recursos.',
    page: 'cliente.html',
    demo: 'cliente@ame.com',
    password: 'cliente123',
  },
  administrativo: {
    label: 'Administrativo',
    info: 'Acceso para personal administrativo. Gestión de usuarios y citas.',
    page: 'administrativo.html',
    demo: 'admin@ame.com',
    password: 'admin123',
  },
  psicologos: {
    label: 'Psicólogos',
    info: 'Acceso para psicólogos. Gestión de clientes y seguimiento clínico.',
    page: 'psicologos.html',
    demo: 'psicologo@ame.com',
    password: 'psico123',
  },
};

// Elementos del DOM
const roleButtons    = document.querySelectorAll('.role-button');
const selectedRole   = document.getElementById('selectedRole');
const roleInfo       = document.getElementById('roleInfo');
const demoBox        = document.getElementById('demoCredentials');
const loginMessage   = document.getElementById('loginMessage');
const loginForm      = document.getElementById('loginForm');
const usernameInput  = document.getElementById('username');

function updateRole(role) {
  roleButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.role === role));
  selectedRole.value = role;
  const cfg = roleConfig[role];
  roleInfo.textContent = cfg.info;
  demoBox.textContent  = `Cuenta demo: ${cfg.demo}  |  Contraseña: ${cfg.password}`;
  hideMessage();
}

function showMessage(text, isSuccess = false) {
  loginMessage.textContent = text;
  loginMessage.className   = 'alert' + (isSuccess ? ' success' : '');
  loginMessage.classList.remove('hidden');
}

function hideMessage() {
  loginMessage.textContent = '';
  loginMessage.classList.add('hidden');
}

// Eventos de pestañas
roleButtons.forEach(btn => {
  btn.addEventListener('click', () => updateRole(btn.dataset.role));
});

// Envío del formulario
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const role     = selectedRole.value;
  const username = usernameInput.value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showMessage('Por favor completa usuario y contraseña.');
    return;
  }

  const cfg = roleConfig[role];

  if (username !== cfg.demo || password !== cfg.password) {
    showMessage(`Usuario o contraseña incorrectos para ${cfg.label}. Usa los datos demo mostrados.`);
    return;
  }

  showMessage(`¡Bienvenido, ${cfg.label}! Redirigiendo...`, true);
  setTimeout(() => { window.location.href = cfg.page; }, 700);
});

// Inicializar con rol "cliente"
updateRole('cliente');
