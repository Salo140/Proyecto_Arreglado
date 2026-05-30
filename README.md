# Âme — Plataforma de Bienestar Emocional
# Proyecto
Proyecto curso de Programación Web

**Integrantes**
Vanessa Ospina Ibarra
Salomé Caicedo Santamaría


## Estructura del proyecto

```
ame/
├── index.html          ← Landing page + chat modal flotante
├── login.html          ← Pantalla de login con roles
├── cliente.html        ← Dashboard cliente + chat IA inline ✅
├── administrativo.html ← Dashboard administrativo
├── psicologos.html     ← Dashboard psicólogos
├── meditaciones.html
├── sesiones.html
├── comunidad.html
│
├── styles.css          ← Estilos globales (incluye chat IA)
├── login.js            ← Lógica del formulario de login
├── dashboard.js        ← Carga de citas desde API local
├── emergency-lines.js  ← Base de datos de líneas de emergencia
├── ia-chat.js          ← ⭐ Lógica completa del chat IA
│
└── src/                ← API backend Express (Node.js)
    ├── index.js
    ├── app.js
    ├── routes/citas.js
    ├── services/citas.js
    └── data/citas.json
```

---

## 🚀 Cómo usar

### 1. Abrir en el navegador (sin backend)

Simplemente abre `index.html` en tu navegador.  
El chat IA funciona inmediatamente con respuestas empáticas predefinidas.

### 2. Con IA real (Hugging Face)

Añade esta línea **antes** de cargar `ia-chat.js` en cualquier HTML:

```html
<script>window.AME_HF_TOKEN = 'hf_TU_TOKEN_AQUI';</script>
<script src="emergency-lines.js"></script>
<script src="ia-chat.js"></script>
```

> ⚠️ Para GitHub Pages, no expongas el token directamente.  
> En ese caso, usa un proxy (Cloudflare Workers, Supabase Edge Function, etc.)

### 3. Con backend de citas (local)

```bash
npm install
npm run dev
```

La API estará en `http://localhost:3000/api/citas`.  
Las citas aparecerán automáticamente en los dashboards.

---

## 🔑 Cuentas de prueba

| Rol            | Correo              | Contraseña  |
|----------------|---------------------|-------------|
| Cliente        | cliente@ame.com     | cliente123  |
| Administrativo | admin@ame.com       | admin123    |
| Psicólogo      | psicologo@ame.com   | psico123    |

---

## 🐛 Problemas resueltos

### ❌ El chat no respondía / botones desaparecidos
**Causa**: El archivo `ia-logic.js` fue movido a la subcarpeta `Proyecto/` pero el
`index.html` raíz lo buscaba en la raíz. El archivo simplemente no existía en la ubicación correcta.

**Solución**: Se reescribió completamente como `ia-chat.js` con detección automática
de instancias (modal flotante + inline en dashboard).

### ❌ `display: flex` rompía el modal oculto
**Causa**: El CSS definía `.ia-modal { display: flex; }` siempre, haciendo que el
modal apareciera al cargar la página, y luego al hacer `display: none` con JS, el modal quedaba invisible pero sin la estructura flex necesaria.

**Solución**: Se usa `.ia-modal { display: none; }` por defecto y `.ia-modal.is-open { display: flex; }` para mostrarlo, manejado por la clase CSS.

### ❌ CORS / Supabase / HF API fallaban en producción
**Causa**: Las API keys estaban en el frontend, Supabase no tenía la función Edge
correctamente configurada, y el modelo de HF tardaba en "calentarse".

**Solución**: El chat siempre tiene respuestas locales de fallback. La API de HF
es opcional. Si falla, el chat sigue funcionando normalmente.

### ❌ GitHub Pages: rutas rotas
**Causa**: Rutas absolutas (`/styles.css`) fallan en GitHub Pages si el repo no
está en la raíz. 

**Solución**: Todas las rutas son relativas (`./styles.css` o `styles.css`).

---

## 🌐 Despliegue en GitHub Pages

1. Sube todos los archivos al repositorio.
2. Ve a Settings → Pages → Source: `main` branch, carpeta `/` (root).
3. **No uses rutas absolutas** (`/styles.css` → usa `styles.css`).
4. Los archivos de la API (`src/`) no se ejecutan en Pages, solo el frontend funciona.

---

## 📝 Para agregar IA real sin exponer el token

Crea una **Supabase Edge Function** llamada `chat`:

```typescript
// supabase/functions/chat/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { mensaje } = await req.json()
  
  const hfRes = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("HF_TOKEN")}` },
      body: JSON.stringify({ inputs: mensaje, parameters: { max_new_tokens: 200 } })
    }
  )
  
  const data = await hfRes.json()
  const respuesta = data[0]?.generated_text || "Estoy aquí para escucharte."
  
  return new Response(JSON.stringify({ respuesta }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  })
})
```

Luego, en tu HTML:
```html
<script>
  window.AME_HF_TOKEN = null; // No token en frontend
  // El chat usa respuestas locales de fallback
</script>
```
