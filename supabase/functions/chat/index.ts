/// <reference path="./deno.d.ts" />

// @ts-ignore: Deno runtime globals are provided by Supabase Edge Functions
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const HF_TOKEN = Deno.env.get('HF_TOKEN');
const HF_MODEL = Deno.env.get('HF_MODEL') || 'meta-llama/Llama-3.3-70B-Instruct';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((o: string) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Construye el prompt en formato [INST]...[/INST] que requiere Mistral-Instruct.
 * Sin este formato, el modelo ignora el system prompt y genera texto incoherente.
 */
function buildMistralPrompt(systemPrompt: string, history: Array<{role: string, content: string}>, message: string): string {
  let prompt = '';

  // El primer turno siempre lleva el system prompt dentro del [INST]
  const firstUserMsg = history.find(h => h.role === 'user');
  const historyWithoutFirst = firstUserMsg ? history.slice(history.indexOf(firstUserMsg) + 1) : history;

  if (history.length === 0) {
    // Sin historial: solo el mensaje actual con system prompt
    prompt = `<s>[INST] ${systemPrompt}\n\n${message} [/INST]`;
  } else {
    // Primer mensaje del historial lleva el system prompt
    let isFirst = true;
    for (const turn of history) {
      if (turn.role === 'user') {
        if (isFirst) {
          prompt += `<s>[INST] ${systemPrompt}\n\n${turn.content} [/INST]`;
          isFirst = false;
        } else {
          prompt += `[INST] ${turn.content} [/INST]`;
        }
      } else if (turn.role === 'assistant') {
        prompt += ` ${turn.content} </s>`;
      }
    }
    // Mensaje actual
    if (isFirst) {
      prompt += `<s>[INST] ${systemPrompt}\n\n${message} [/INST]`;
    } else {
      prompt += `[INST] ${message} [/INST]`;
    }
  }

  return prompt;
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
    return new Response(JSON.stringify({ error: 'HF_TOKEN no configurado en Supabase Secrets' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  let body: any;
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
    : 'Eres Âme, un asistente de apoyo emocional empático en español. Escucha activamente, valida emociones y ofrece apoyo cálido. No reemplazas la terapia profesional. Si detectas señales de crisis, deriva a líneas de emergencia. Responde SIEMPRE en español, de manera cálida, cercana y concisa (máximo 3 oraciones).';

  if (!message) {
    return new Response(JSON.stringify({ error: 'El campo message es obligatorio' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  const history = Array.isArray(body?.history) ? body.history : [];

  // ✅ FIX PRINCIPAL: Usar formato [INST]...[/INST] requerido por Mistral-Instruct
  const prompt = buildMistralPrompt(systemPrompt, history, message);

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
          max_new_tokens: 250,
          temperature: 0.75,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,   // ✅ Solo devuelve el texto generado, no repite el prompt
          stop: ["[INST]", "</s>"],  // ✅ Detiene antes de que el modelo alucine otro turno
        },
      }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      // Detectar modelo cargándose (503 es normal en HF, el modelo está "cold")
      if (hfResponse.status === 503) {
        return new Response(JSON.stringify({ error: 'El modelo está cargando, intenta en 20 segundos' }), {
          status: 503,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      return new Response(JSON.stringify({ error: `Hugging Face API error: ${hfResponse.status} — ${errorText}` }), {
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
      // HF a veces devuelve 200 con { error: "..." } cuando el modelo aún carga
      throw new Error(data.error);
    }

    // Limpiar artefactos residuales del formato Mistral
    text = text.replace(/\[INST\].*?\[\/INST\]/gs, '').trim();
    text = text.replace(/^(Âme:|Asistente:|IA:)\s*/i, '').trim();
    text = text.replace(/<\/s>$/, '').trim();

    if (!text) {
      throw new Error('El modelo devolvió texto vacío');
    }

    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Error inesperado';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }
});
