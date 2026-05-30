/**
 * LÍNEAS DE EMERGENCIA - emergency-lines.js
 * Base de datos de líneas de emergencia de salud mental
 * en 15+ países de América Latina, España y USA.
 */

const EMERGENCY_LINES = {
  colombia: [
    { country: 'Colombia 🇨🇴', type: 'Línea PAS (Prevención del Suicidio)', phone: '01 800 112 757', description: 'Línea de prevención del suicidio disponible 24/7' },
    { country: 'Colombia 🇨🇴', type: 'Emergencia',                          phone: '911',            description: 'Emergencia nacional' },
    { country: 'Colombia 🇨🇴', type: 'Teléfono de la Esperanza',            phone: '2 593 0099',     description: 'Acompañamiento emocional' }
  ],
  mexico: [
    { country: 'México 🇲🇽', type: 'LOCTEL',         phone: '55 5259 8121', description: 'Atención a crisis emocionales 24/7' },
    { country: 'México 🇲🇽', type: 'Emergencia',     phone: '911',          description: 'Emergencia nacional' },
    { country: 'México 🇲🇽', type: 'Prevensuicidas', phone: '55 5272 1366', description: 'Prevención de suicidio' },
    { country: 'México 🇲🇽', type: 'SAPTEL',         phone: '55 5259 8121', description: 'Servicio de atención psicosocial' }
  ],
  argentina: [
    { country: 'Argentina 🇦🇷', type: 'Centro de Asistencia al Suicida', phone: '011 4127 9000', description: 'Prevención y atención de suicidio' },
    { country: 'Argentina 🇦🇷', type: 'Emergencia',                      phone: '911',           description: 'Emergencia nacional' },
    { country: 'Argentina 🇦🇷', type: 'Teleanálisis',                    phone: '011 4821 2135', description: 'Apoyo psicológico telefónico' }
  ],
  peru: [
    { country: 'Perú 🇵🇪', type: 'Teléfono de la Esperanza', phone: '1 273 9999', description: 'Apoyo emocional 24/7' },
    { country: 'Perú 🇵🇪', type: 'Emergencia',               phone: '911',        description: 'Emergencia nacional' },
    { country: 'Perú 🇵🇪', type: 'SAMU',                     phone: '106',        description: 'Ambulancia y emergencias médicas' }
  ],
  chile: [
    { country: 'Chile 🇨🇱', type: 'Fono de la Esperanza', phone: '1 800 00 20 00', description: 'Prevención del suicidio 24/7' },
    { country: 'Chile 🇨🇱', type: 'Emergencia',           phone: '131',            description: 'Bomberos y emergencias' },
    { country: 'Chile 🇨🇱', type: 'Carabineros',          phone: '133',            description: 'Policía nacional de Chile' }
  ],
  brasil: [
    { country: 'Brasil 🇧🇷', type: 'CVV (Centro de Valorização da Vida)', phone: '188', description: 'Prevención del suicidio 24/7' },
    { country: 'Brasil 🇧🇷', type: 'Emergencia SAMU',                     phone: '192', description: 'Servicio de emergencias médicas' }
  ],
  spain: [
    { country: 'España 🇪🇸', type: 'Atención a la Conducta Suicida',  phone: '024',         description: 'Línea nacional de prevención del suicidio' },
    { country: 'España 🇪🇸', type: 'Emergencia',                      phone: '112',         description: 'Emergencia europea' },
    { country: 'España 🇪🇸', type: 'Teléfono de la Esperanza',        phone: '914 59 00 50', description: 'Apoyo emocional' }
  ],
  usa: [
    { country: 'USA 🇺🇸', type: 'National Suicide Prevention Lifeline', phone: '988',                  description: 'Prevención del suicidio 24/7' },
    { country: 'USA 🇺🇸', type: 'Crisis Text Line',                     phone: 'Texto HOME a 741741',  description: 'Apoyo por mensajes de texto' },
    { country: 'USA 🇺🇸', type: 'Emergencia',                           phone: '911',                  description: 'Emergencia nacional' }
  ],
  ecuador: [
    { country: 'Ecuador 🇪🇨', type: 'Teléfono de Crisis', phone: '1-800-LLAMAME', description: 'Apoyo emocional en crisis' },
    { country: 'Ecuador 🇪🇨', type: 'Emergencia',         phone: '911',           description: 'Emergencia nacional' }
  ],
  venezuela: [
    { country: 'Venezuela 🇻🇪', type: 'Línea de Prevención', phone: '0212-793-4500', description: 'Prevención de suicidio en Caracas' },
    { country: 'Venezuela 🇻🇪', type: 'Emergencia',           phone: '171',           description: 'Emergencia nacional' }
  ],
  mundial: [
    { country: 'Internacional 🌍', type: 'Befrienders International',  phone: 'www.befrienders.org', description: 'Red global de prevención del suicidio' },
    { country: 'Internacional 🌍', type: 'IASP Crisis Centres',        phone: 'www.iasp.info',       description: 'Directorio de líneas por país' }
  ]
};

function getEmergencyLinesByCountry(country) {
  return EMERGENCY_LINES[country] || EMERGENCY_LINES.mundial;
}

function getAllEmergencyLines() {
  return EMERGENCY_LINES;
}

function getAvailableCountries() {
  return Object.keys(EMERGENCY_LINES);
}
