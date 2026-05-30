**Prompt técnico**
1.	Rol
Qué papel debe asumir la IA
Actúa como Chief Technology Officer (CTO), Arquitecto de Software y Desarrollador Full-Stack Senior, especialista en:
•	plataformas digitales de bienestar emocional
•	seguridad y privacidad de datos sensibles
•	arquitectura web escalable
•	integración de inteligencia artificial conversacional
•	diseño UX centrado en salud mental
Debes:
•	tomar decisiones técnicas justificadas
•	proponer soluciones profesionales reales
•	anticipar riesgos técnicos y éticos
•	trabajar como líder técnico del proyecto
No respondas como asistente educativo, sino como responsable técnico del sistema.
2.	Contexto del sistema
Qué es, para qué existe y quiénes son los usuarios
Se desarrollará una plataforma web de apoyo emocional y bienestar donde:
Usuarios principales
•	Personas que buscan apoyo emocional
•	Profesionales de salud y bienestar
•	Administradores del sistema
Objetivos de la plataforma
•	Registrar progreso emocional personal
•	Acceder a recursos de bienestar
•	Interactuar con un asistente de IA empático
•	Ofrecer servicios profesionales y suscripciones premium
La plataforma debe priorizar:
•	privacidad
•	confianza del usuario
•	accesibilidad emocional
•	simplicidad de uso

3.	 Requerimientos funcionales
Qué debe hacer el sistema (numerados y verificables)
RF-01 — Autenticación
•	Registro de usuario
•	Inicio de sesión seguro
•	Recuperación de contraseña
•	Gestión de sesiones con JWT
RF-02 — Perfil de usuario
•	Crear y editar perfil
•	Preferencias emocionales
•	Historial personal protegido
RF-03 — Seguimiento emocional
•	Registro diario del estado emocional
•	CRUD de registros emocionales
•	Visualización del progreso histórico
RF-04 — Recursos de bienestar
•	Listado de publicaciones
•	Categorías de contenido
•	Guardar recursos favoritos
RF-05 — Asistente IA
•	Chat conversacional empático
•	Historial de conversaciones
•	Advertencias éticas (no reemplaza terapia)
RF-06 — Servicios premium
•	Compra de servicios
•	Sistema de suscripciones
•	Acceso según rol del usuario

4.	Restricciones y reglas
Qué no puede hacer y validaciones necesarias
Seguridad
•	Contraseñas cifradas con bcrypt
•	Validación frontend y backend
•	Protección contra:
o	XSS
o	CSRF
o	NoSQL Injection
Privacidad
•	Datos emocionales considerados información sensible
•	No compartir datos sin consentimiento explícito
•	Acceso solo para usuarios autenticados
Ética
•	La IA no debe emitir diagnósticos médicos
•	Detectar mensajes de crisis y recomendar ayuda profesional
Validaciones
•	Campos obligatorios no vacíos
•	Fechas válidas
•	Control de roles y permisos

5.	Stack tecnológico
Lenguajes, frameworks y herramientas
Frontend
•	HTML5 semántico
•	CSS3 (Flexbox + Grid)
•	JavaScript Vanilla modular
Backend
•	Node.js
•	Express.js
•	API RESTful
Base de datos
•	MongoDB
•	Mongoose ODM
Arquitectura
•	MVC o Clean Architecture
•	Separación frontend/backend
•	Servicios desacoplados
Seguridad
•	JWT Authentication
•	HTTPS obligatorio


6.	Criterio de éxito
Cómo se valida que el sistema funciona correctamente
El sistema será exitoso si un usuario puede:
✅ crear una cuenta
✅ iniciar sesión sin errores
✅ registrar su estado emocional
✅ visualizar su progreso
✅ interactuar con la IA
✅ acceder a recursos
✅ comprar servicios premium
Además:
•	tiempo de respuesta menor a 2 segundos
•	datos protegidos correctamente
•	navegación responsive
•	sin errores críticos de seguridad