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

Esta implementación usa una función segura en Supabase y no expone la clave de Hugging Face en el frontend.

### 1. Crea el endpoint en Supabase

Dentro del proyecto crea una función de Supabase llamada `chat` y usa este código en `supabase/functions/chat/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const HF_TOKEN = Deno.env.get('HF_TOKEN');
const HF_MODEL = Deno.env.get('HF_MODEL') || 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(o => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('origin')),
    });
  }

  const origin = req.headers.get('origin');
  if (ALLOWED_ORIGINS.length > 0 && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...corsHeaders(null), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  if (!HF_TOKEN) {
    return new Response(JSON.stringify({ error: 'HF_TOKEN no configurado' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const systemPrompt = typeof body?.systemPrompt === 'string' && body.systemPrompt.trim()
    ? body.systemPrompt.trim()
    : 'Eres Âme, un asistente de apoyo emocional empático en español. Escucha activamente, valida emociones y ofrece apoyo cálido. No reemplazas la terapia profesional. Si detectas señales de crisis, deriva a líneas de emergencia. Responde en español de manera cálida y cercana.';

  if (!message) {
    return new Response(JSON.stringify({ error: 'El campo message es obligatorio' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  const history = Array.isArray(body?.history) ? body.history : [];
  const prompt = `${systemPrompt}\n\nHistorial:\n${history.map((item: any) => `${item.role === 'user' ? 'Usuario' : 'IA'}: ${item.content}`).join('\n')}\nUsuario: ${message}\nIA:`;

  try {
    const hfResponse = await fetch(HF_API_URL, {
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

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return new Response(JSON.stringify({ error: `Hugging Face API error: ${hfResponse.status} ${errorText}` }), {
        status: 502,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
      });
    }

    const data = await hfResponse.json();
    let text = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (typeof data.generated_text === 'string') {
      text = data.generated_text;
    } else if (data?.error) {
      throw new Error(data.error);
    }

    text = text.replace(/\[INST\].*?\[\/INST\]/gs, '').trim();
    text = text.replace(/^Âme:|^Asistente:/i, '').trim();

    return new Response(JSON.stringify({ reply: text || 'Lo siento, no pude generar una respuesta en este momento.' }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || 'Error inesperado' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }
});
```

### 2. Configura los secretos en Supabase

- `HF_TOKEN`: tu token de Hugging Face (no lo pongas en el frontend)
- `HF_MODEL` (opcional): `mistralai/Mistral-7B-Instruct-v0.2`
- `ALLOWED_ORIGINS` (opcional): `https://tudominio.github.io,https://otrositio.com`

### 3. Conecta el frontend

En tu HTML agrega antes de `ia-chat.js`:

```html
<script>
  window.AME_CHAT_FUNCTION_URL = 'https://<tu-proyecto>.functions.supabase.co/chat';
</script>
<script src="emergency-lines.js"></script>
<script src="ia-chat.js"></script>
```

### 4. Prueba localmente antes de desplegar

- El chat seguirá funcionando con respuestas locales si la función no está disponible.
- El proxy de Supabase será usado solo si `window.AME_CHAT_FUNCTION_URL` está definido.

### 5. Beneficios de esta arquitectura

- La API Key de Hugging Face queda en el backend de Supabase.
- GitHub Pages permanece como frontend estático.
- La seguridad es mucho mayor porque el navegador no maneja el token.
- El chat puede mantener lógica de fallback local estable.
