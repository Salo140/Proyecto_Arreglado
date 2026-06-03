/**
 * login.js — Lógica del formulario de login y registro de Âme
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

// Base de datos simulada de usuarios registrados
let registeredUsers = JSON.parse(localStorage.getItem('ame_users')) || [];

// ============= ELEMENTOS DEL DOM - LOGIN =============
const roleButtons    = document.querySelectorAll('.role-button:not(.register-role)');
const selectedRole   = document.getElementById('selectedRole');
const roleInfo       = document.getElementById('roleInfo');
const demoBox        = document.getElementById('demoCredentials');
const loginMessage   = document.getElementById('loginMessage');
const loginForm      = document.getElementById('loginForm');
const usernameInput  = document.getElementById('username');

// ============= ELEMENTOS DEL DOM - REGISTRO =============
const authTabs           = document.querySelectorAll('.auth-tab-button');
const authTabContents    = document.querySelectorAll('.auth-tab-content');
const registerRoleButtons = document.querySelectorAll('.register-role');
const registerRole       = document.getElementById('registerRole');
const registerRoleInfo   = document.getElementById('registerRoleInfo');
const registerMessage    = document.getElementById('registerMessage');
const registerForm       = document.getElementById('registerForm');
const registerNameInput  = document.getElementById('registerName');
const registerEmailInput = document.getElementById('registerEmail');
const registerPwdInput   = document.getElementById('registerPassword');
const registerConfirmPwd = document.getElementById('registerConfirmPassword');
const registerCertificateInput = document.getElementById('registerCertificate');
const registerSpecialtyInput = document.getElementById('registerSpecialty');
const registerExperienceInput = document.getElementById('registerExperience');
const registerInstitutionInput = document.getElementById('registerInstitution');
const registerDocsInput = document.getElementById('registerDocs');
const psychologistFields = document.getElementById('psychologistFields');

// ============= FUNCIONES PARA LOGIN =============
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

// ============= FUNCIONES PARA REGISTRO =============
function updateRegisterRole(role) {
  registerRoleButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.role === role));
  registerRole.value = role;
  const cfg = roleConfig[role];
  registerRoleInfo.textContent = cfg.info;

  if (role === 'psicologos') {
    psychologistFields.classList.remove('hidden');
  } else {
    psychologistFields.classList.add('hidden');
  }
}

function showRegisterMessage(text, isSuccess = false) {
  registerMessage.textContent = text;
  registerMessage.className   = 'alert' + (isSuccess ? ' success' : '');
  registerMessage.classList.remove('hidden');
}

function hideRegisterMessage() {
  registerMessage.textContent = '';
  registerMessage.classList.add('hidden');
}

function switchAuthTab(tab) {
  // Ocultar todos los tabs
  authTabContents.forEach(content => content.classList.remove('active'));
  authTabs.forEach(button => button.classList.remove('active'));

  // Mostrar el tab seleccionado
  document.getElementById(`${tab}-tab`).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Limpiar mensajes
  hideMessage();
  hideRegisterMessage();
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function checkEmailExists(email) {
  return registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
}

function registerUser(name, email, password, role, details = {}) {
  const isPsychologist = role === 'psicologos';
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password, // En producción, esto debería estar hasheado
    role,
    verified: !isPsychologist,
    status: isPsychologist ? 'pending' : 'active',
    rejected: false,
    reviewNotes: '',
    createdAt: new Date().toISOString(),
    ...details,
  };

  registeredUsers.push(newUser);
  localStorage.setItem('ame_users', JSON.stringify(registeredUsers));
  return newUser;
}

function loginUser(email, password, role) {
  // Primero verificar con las credenciales demo
  const cfg = roleConfig[role];
  if (email === cfg.demo && password === cfg.password) {
    return { isValid: true, isDemo: true, role };
  }

  // Luego buscar en usuarios registrados
  const user = registeredUsers.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password && 
    u.role === role
  );

  if (!user) {
    return { isValid: false };
  }

  if (role === 'psicologos') {
    if (user.rejected) {
      return { isValid: false, reason: 'rejected', user };
    }
    if (!user.verified) {
      return { isValid: false, reason: 'pending', user };
    }
  }

  return { isValid: true, isDemo: false, role, user };
}

// ============= EVENT LISTENERS - TABS AUTH =============
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    switchAuthTab(tab.dataset.tab);
  });
});

// ============= EVENT LISTENERS - LOGIN =============
roleButtons.forEach(btn => {
  btn.addEventListener('click', () => updateRole(btn.dataset.role));
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const role     = selectedRole.value;
  const username = usernameInput.value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showMessage('Por favor completa usuario y contraseña.');
    return;
  }

  const result = loginUser(username, password, role);

  if (!result.isValid) {
    if (result.reason === 'pending') {
      showMessage('Tu cuenta de psicólogo está pendiente de aprobación. El administrador debe verificar tus documentos antes de permitir el acceso.');
    } else if (result.reason === 'rejected') {
      showMessage('Tu solicitud de psicólogo ha sido rechazada. Contacta con el administrador para más información.');
    } else {
      showMessage(`Usuario o contraseña incorrectos para ${roleConfig[role].label}.`);
    }
    return;
  }

  showMessage(`¡Bienvenido, ${roleConfig[role].label}! Redirigiendo...`, true);
  
  // Guardar usuario actual en localStorage
  const currentUser = {
    email: username,
    name: result.user ? result.user.name : `${roleConfig[role].label} (Demo)`,
    role: role,
    isDemo: result.isDemo,
    verified: result.user ? result.user.verified : true,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  setTimeout(() => { window.location.href = roleConfig[role].page; }, 700);
});

// ============= EVENT LISTENERS - REGISTRO =============
registerRoleButtons.forEach(btn => {
  btn.addEventListener('click', () => updateRegisterRole(btn.dataset.role));
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  hideRegisterMessage();

  const name = registerNameInput.value.trim();
  const email = registerEmailInput.value.trim();
  const password = registerPwdInput.value.trim();
  const confirmPassword = registerConfirmPwd.value.trim();
  const role = registerRole.value;

  // Validaciones
  if (!name || !email || !password || !confirmPassword) {
    showRegisterMessage('Por favor completa todos los campos.');
    return;
  }

  if (!validateEmail(email)) {
    showRegisterMessage('Por favor ingresa un correo electrónico válido.');
    return;
  }

  if (!validatePassword(password)) {
    showRegisterMessage('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  if (password !== confirmPassword) {
    showRegisterMessage('Las contraseñas no coinciden.');
    return;
  }

  if (checkEmailExists(email)) {
    showRegisterMessage('Este correo electrónico ya está registrado.');
    return;
  }

  const registrationDetails = role === 'psicologos' ? {
    certificate: registerCertificateInput.value.trim(),
    specialty: registerSpecialtyInput.value.trim(),
    experience: registerExperienceInput.value.trim(),
    institution: registerInstitutionInput.value.trim(),
    docs: registerDocsInput.value.trim(),
  } : {};

  if (role === 'psicologos') {
    if (!registrationDetails.certificate || !registrationDetails.specialty || !registrationDetails.experience || !registrationDetails.institution) {
      showRegisterMessage('Completa todos los campos de verificación para psicólogos.');
      return;
    }
  }

  // Registrar usuario
  try {
    const newUser = registerUser(name, email, password, role, registrationDetails);
    const msg = role === 'psicologos'
      ? `¡Solicitud enviada! Tu registro será revisado por el administrador antes de activar tu cuenta.`
      : `¡Bienvenido ${name}! Tu cuenta ha sido creada exitosamente. Redirigiendo al login...`;

    showRegisterMessage(msg, true);

    setTimeout(() => {
      // Limpiar el formulario y cambiar a login
      registerForm.reset();
      switchAuthTab('login');
      // Rellenar el login con el email registrado
      usernameInput.value = email;
      updateRole(role);
      if (role === 'psicologos') {
        registerRoleButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.role === 'cliente'));
        registerRole.value = 'cliente';
        updateRegisterRole('cliente');
      }
    }, 1500);
  } catch (error) {
    showRegisterMessage('Ocurrió un error al registrar la cuenta. Intenta de nuevo.');
    console.error('Error en registro:', error);
  }
});

function clearCurrentUserSession() {
  localStorage.removeItem('currentUser');
}

// ============= INICIALIZACIÓN =============
window.addEventListener('DOMContentLoaded', () => {
  clearCurrentUserSession();
  updateRole('cliente');
  updateRegisterRole('cliente');
});
