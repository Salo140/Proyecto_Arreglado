/**
 * IA-CHAT.JS — Lógica completa del chat IA de Âme
 *
 * ✅ Funciona sin Supabase ni APIs externas (modo local)
 * ✅ Compatible con GitHub Pages (sin variables de entorno)
 * ✅ Usa la Anthropic API si se provee HF_TOKEN como variable global
 * ✅ Detecta crisis y muestra líneas de emergencia
 * ✅ Guarda historial en localStorage
 * ✅ Funciona tanto en modal flotante (index) como inline (dashboard)
 */

// =============================================
// CONFIGURACIÓN
// Se puede inyectar desde el HTML antes de cargar este script:
//   <script>window.AME_HF_TOKEN = 'hf_...';</script>
// =============================================
const HF_TOKEN = window.AME_HF_TOKEN || null;
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// =============================================
// PALABRAS CLAVE DE CRISIS
// =============================================
const CRISIS_KEYWORDS = [
  'suicidio', 'suicidarme', 'me quiero matar', 'quiero morir',
  'autolesión', 'autolesiones', 'cortarme', 'hacerme daño',
  'desaparecer para siempre', 'no quiero vivir', 'mejor muerto',
  'me voy a matar', 'adiós a todos', 'último día', 'terminar con todo',
  'lastimar', 'herirme', 'quitarme la vida', 'ya no aguanto',
  'no tiene sentido vivir'
];

// =============================================
// RESPUESTAS DE FALLBACK (sin API)
// =============================================
const RESPONSES = {
  crisis: [
    '💙 Veo que estás pasando por un momento muy difícil. No estás solo/a. Por favor, contacta a las líneas de emergencia que aparecen arriba. Ellos están capacitados para ayudarte.',
    '🚨 Tu vida importa. Lo que sientes ahora es temporal, pero necesitas apoyo profesional AHORA. Llama a los números que ves arriba.',
    '❤️ No estás solo/a en esto. Pedir ayuda es un acto de valentía. Usa los números de emergencia que se muestran para hablar con alguien capacitado.',
  ],
  sad: [
    '😔 Entiendo que te sientas así. Es válido sentir tristeza. ¿Quieres contarme qué te está pasando?',
    '😔 La tristeza es una emoción que merece ser atendida. Estoy aquí para escucharte, sin prisa.',
    '😔 Lamento que estés pasando un momento difícil. A veces poner en palabras lo que sentimos ayuda mucho. Te escucho.',
  ],
  anxious: [
    '😰 La ansiedad puede ser muy abrumadora. Prueba esto: inhala lentamente por 4 segundos, aguanta 4, exhala 4. ¿Mejor? Cuéntame qué te preocupa.',
    '😰 Entiendo ese peso de la ansiedad. Estoy aquí contigo. ¿Quieres hablar de lo que lo está generando?',
    '😰 La ansiedad es temporal aunque se sienta eterna. Respira profundo. ¿Puedes contarme qué está pasando?',
  ],
  happy: [
    '😊 ¡Me alegra mucho escucharlo! Esos momentos son valiosos. ¿Qué te hizo sentir bien hoy?',
    '🌟 ¡Qué buena noticia! La alegría merece ser celebrada. Cuéntame más.',
    '😊 ¡Eso es maravilloso! Mantén ese sentimiento cerca. ¿Qué pasó?',
  ],
  greeting: [
    '👋 ¡Hola! Soy Âme, tu asistente empático. Estoy aquí para escucharte. ¿Cómo te sientes hoy?',
    '👋 ¡Hola! Me alegra que estés aquí. ¿En qué puedo acompañarte hoy?',
  ],
  neutral: [
    '💙 Gracias por compartir eso conmigo. ¿Hay algo más que quieras explorar o contarme?',
    '💙 Te escucho. ¿Cómo te sientes en este momento?',
    '💙 Aprecio que confíes en mí. ¿Hay algo específico en lo que pueda ayudarte?',
    '💙 Estoy aquí para acompañarte. ¿Quieres contarme algo más?',
  ],
};

// =============================================
// CLASE PRINCIPAL DEL CHAT
// =============================================
class AmeChat {
  /**
   * @param {Object} config
   * @param {string} config.messagesId      - ID del contenedor de mensajes
   * @param {string} config.inputId         - ID del input de texto
   * @param {string} config.sendBtnId       - ID del botón enviar
   * @param {string} config.countrySelectId - ID del select de país
   * @param {string} config.crisisAlertId   - ID del div de crisis
   * @param {string} config.emergencyLinesId - ID del contenedor de líneas de emergencia
   * @param {string} [config.toggleBtnId]   - ID del botón flotante (solo modal)
   * @param {string} [config.modalId]       - ID del modal (solo modal flotante)
   * @param {string} [config.closeBtnId]    - ID del botón cerrar (solo modal)
   * @param {string} [config.storageKey]    - Clave localStorage
   */
  constructor(config) {
    this.cfg = config;

    // Elementos del DOM
    this.messagesEl     = document.getElementById(config.messagesId);
    this.inputEl        = document.getElementById(config.inputId);
    this.sendBtn        = document.getElementById(config.sendBtnId);
    this.countrySelect  = document.getElementById(config.countrySelectId);
    this.crisisAlert    = document.getElementById(config.crisisAlertId);
    this.emergencyLines = document.getElementById(config.emergencyLinesId);

    // Elementos opcionales (modal flotante)
    this.toggleBtn = config.toggleBtnId ? document.getElementById(config.toggleBtnId) : null;
    this.modal     = config.modalId     ? document.getElementById(config.modalId)     : null;
    this.closeBtn  = config.closeBtnId  ? document.getElementById(config.closeBtnId)  : null;

    // Estado
    this.isLoading       = false;
    this.conversationHistory = [];
    this.storageKey      = config.storageKey || 'ame_chat_history';
    this.userCountry     = localStorage.getItem('ame_country') || 'colombia';

    // Verificar que los elementos críticos existan
    if (!this.messagesEl || !this.inputEl || !this.sendBtn) {
      console.warn('[AmeChat] Elementos del DOM no encontrados. Verifica los IDs:', config);
      return;
    }

    this._init();
    console.log('[AmeChat] ✅ Chat inicializado correctamente');
  }

  _init() {
    // Restaurar país guardado
    if (this.countrySelect) {
      this.countrySelect.value = this.userCountry;
    }

    // Eventos: enviar mensaje
    this.sendBtn.addEventListener('click', () => this._handleSend());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });

    // Evento: cambio de país
    if (this.countrySelect) {
      this.countrySelect.addEventListener('change', (e) => {
        this.userCountry = e.target.value;
        localStorage.setItem('ame_country', this.userCountry);
      });
    }

    // Eventos: modal flotante
    if (this.toggleBtn && this.modal) {
      this.toggleBtn.addEventListener('click', () => this._toggleModal());
    }
    if (this.closeBtn && this.modal) {
      this.closeBtn.addEventListener('click', () => this._closeModal());
    }

    // Cerrar modal al hacer clic fuera
    if (this.modal) {
      document.addEventListener('click', (e) => {
        if (
          this.modal.classList.contains('is-open') &&
          !this.modal.contains(e.target) &&
          this.toggleBtn && !this.toggleBtn.contains(e.target)
        ) {
          this._closeModal();
        }
      });
    }
  }

  // ---- MODAL ----
  _toggleModal() {
    if (!this.modal) return;
    this.modal.classList.contains('is-open')
      ? this._closeModal()
      : this._openModal();
  }

  _openModal() {
    this.modal.classList.add('is-open');
    this.inputEl.focus();
  }

  _closeModal() {
    this.modal.classList.remove('is-open');
  }

  // ---- ENVÍO ----
  async _handleSend() {
    if (this.isLoading) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    this.sendBtn.disabled = true;
    this.isLoading = true;

    // Mensaje del usuario
    this._addMessage(text, 'user');

    // Detectar crisis
    const isCrisis = this._detectCrisis(text);
    if (isCrisis) {
      this._showCrisisAlert();
    } else {
      this._hideCrisisAlert();
    }

    // Indicador de carga
    const loadingEl = this._showLoading();

    try {
      const response = await this._getResponse(text, isCrisis);
      this._removeLoading(loadingEl);
      this._addMessage(response, 'bot');
    } catch (err) {
      this._removeLoading(loadingEl);
      this._addMessage('💙 Hubo un problema de conexión. Aquí estoy para escucharte de todas formas. ¿Qué te pasa?', 'bot');
      console.error('[AmeChat] Error:', err);
    }

    this.sendBtn.disabled = false;
    this.isLoading = false;
    this.inputEl.focus();
  }

  // ---- OBTENER RESPUESTA ----
  async _getResponse(message, isCrisis) {
    // Las crisis siempre usan respuesta local (más confiable)
    if (isCrisis) {
      return this._localResponse(message, isCrisis);
    }

    // Si hay token de Hugging Face, usar la API real
    if (HF_TOKEN) {
      try {
        return await this._callHuggingFace(message);
      } catch (e) {
        console.warn('[AmeChat] HF API falló, usando respuesta local:', e.message);
        return this._localResponse(message, isCrisis);
      }
    }

    // Fallback local
    return this._localResponse(message, isCrisis);
  }

  // ---- API DE HUGGING FACE ----
  async _callHuggingFace(message) {
    const systemPrompt = `Eres Âme, un asistente de apoyo emocional empático en español. 
Tu rol es escuchar activamente, validar emociones y ofrecer apoyo emocional cálido. 
IMPORTANTE: Siempre recuerda al usuario que no reemplazas la terapia profesional.
Si detectas señales de crisis, deriva siempre a líneas de emergencia.
Responde de forma concisa (máximo 3 oraciones), cálida y en español.`;

    const prompt = `<s>[INST] ${systemPrompt}

Usuario: ${message} [/INST]`;

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HF API ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // HF devuelve un array o un objeto
    let text = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (data.generated_text) {
      text = data.generated_text;
    } else if (data.error) {
      throw new Error(data.error);
    }

    // Limpiar el texto (a veces trae el prompt o etiquetas)
    text = text.replace(/\[INST\].*?\[\/INST\]/gs, '').trim();
    text = text.replace(/^Âme:|^Asistente:/i, '').trim();

    return text || this._localResponse('', false);
  }

  // ---- RESPUESTA LOCAL (fallback) ----
  _localResponse(message, isCrisis) {
    if (isCrisis) {
      return this._pick(RESPONSES.crisis);
    }

    const lower = message.toLowerCase();

    const isSad = ['triste', 'deprimido', 'deprimida', 'mal', 'horrible', 'pésimo', 'terrible', 'llorando', 'llorar', 'soledad', 'solo', 'sola'].some(k => lower.includes(k));
    const isAnxious = ['ansioso', 'ansiosa', 'ansiedad', 'nervioso', 'nerviosa', 'miedo', 'asustado', 'asustada', 'pánico', 'preocupado', 'preocupada', 'estrés', 'estres'].some(k => lower.includes(k));
    const isHappy = ['feliz', 'bien', 'bueno', 'buena', 'excelente', 'maravilloso', 'alegre', 'contento', 'contenta', 'genial'].some(k => lower.includes(k));
    const isGreeting = ['hola', 'buenas', 'hey', 'buen día', 'buenos días'].some(k => lower.includes(k));

    if (isGreeting)  return this._pick(RESPONSES.greeting);
    if (isSad)       return this._pick(RESPONSES.sad);
    if (isAnxious)   return this._pick(RESPONSES.anxious);
    if (isHappy)     return this._pick(RESPONSES.happy);
    return this._pick(RESPONSES.neutral);
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---- MENSAJES EN EL DOM ----
  _addMessage(text, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = `ia-message ia-${sender}-message`;

    const p = document.createElement('p');
    p.textContent = text;
    wrapper.appendChild(p);

    this.messagesEl.appendChild(wrapper);
    this._scrollToBottom();

    // Guardar en historial
    this.conversationHistory.push({ sender, text, ts: Date.now() });
    this._saveHistory();
  }

  _showLoading() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ia-message ia-bot-message ia-loading-msg';
    wrapper.innerHTML = `
      <div class="ia-loading-dots">
        <span></span><span></span><span></span>
      </div>`;
    this.messagesEl.appendChild(wrapper);
    this._scrollToBottom();
    return wrapper;
  }

  _removeLoading(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  _scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  // ---- CRISIS ----
  _detectCrisis(message) {
    const lower = message.toLowerCase();
    return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
  }

  _showCrisisAlert() {
    if (!this.crisisAlert || !this.emergencyLines) return;

    this.crisisAlert.classList.add('is-visible');
    this.emergencyLines.innerHTML = '';

    const lines = this._getEmergencyLines(this.userCountry);
    lines.forEach(line => {
      const div = document.createElement('div');
      div.className = 'ia-emergency-line';
      div.innerHTML = `
        <strong>📞 ${line.country}</strong><br>
        ${line.type}: <strong>${line.phone}</strong><br>
        <a href="tel:${line.phone.replace(/\D/g, '')}" style="font-size:0.85rem;">→ Llamar ahora</a>
      `;
      this.emergencyLines.appendChild(div);
    });
  }

  _hideCrisisAlert() {
    if (this.crisisAlert) this.crisisAlert.classList.remove('is-visible');
  }

  _getEmergencyLines(country) {
    // Usa el archivo emergency-lines.js si está cargado
    if (typeof getEmergencyLinesByCountry === 'function') {
      return getEmergencyLinesByCountry(country);
    }
    // Fallback mínimo
    return [
      { country: 'Colombia 🇨🇴',    type: 'Línea PAS',  phone: '01 800 112 757' },
      { country: 'Internacional 🌍', type: 'Befrienders', phone: 'www.befrienders.org' },
    ];
  }

  // ---- HISTORIAL ----
  _saveHistory() {
    try {
      // Guardar solo los últimos 100 mensajes
      const toSave = this.conversationHistory.slice(-100);
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    } catch (e) {
      // localStorage puede fallar en privado / sin permisos
      console.warn('[AmeChat] No se pudo guardar historial:', e);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    try { localStorage.removeItem(this.storageKey); } catch (e) {}
    // Limpiar DOM (excepto mensaje de bienvenida si existe)
    const messages = this.messagesEl.querySelectorAll('.ia-message:not(.ia-welcome)');
    messages.forEach(m => m.remove());
  }
}

// =============================================
// INICIALIZACIÓN — espera a que el DOM esté listo
// =============================================
document.addEventListener('DOMContentLoaded', () => {

  // 1. MODAL FLOTANTE (en index.html y otras páginas sin login)
  const hasModal = document.getElementById('ia-modal');
  if (hasModal) {
    window.ameChatModal = new AmeChat({
      messagesId:      'ia-messages',
      inputId:         'ia-input',
      sendBtnId:       'ia-send-btn',
      countrySelectId: 'ia-country',
      crisisAlertId:   'ia-crisis-alert',
      emergencyLinesId:'ia-emergency-lines',
      toggleBtnId:     'ia-toggle-btn',
      modalId:         'ia-modal',
      closeBtnId:      'ia-close-btn',
      storageKey:      'ame_modal_chat',
    });
  }

  // 2. CHAT INLINE (dentro del dashboard del cliente)
  const hasInline = document.getElementById('ia-inline-messages');
  if (hasInline) {
    window.ameChatInline = new AmeChat({
      messagesId:      'ia-inline-messages',
      inputId:         'ia-inline-input',
      sendBtnId:       'ia-inline-send',
      countrySelectId: 'ia-inline-country',
      crisisAlertId:   'ia-inline-crisis',
      emergencyLinesId:'ia-inline-emergency-lines',
      storageKey:      'ame_inline_chat',
    });
  }
});
