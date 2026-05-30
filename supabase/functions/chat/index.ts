/// <reference path="./deno.d.ts" />

// @ts-ignore: Deno runtime globals are provided by Supabase Edge Functions
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const HF_TOKEN = Deno.env.get('HF_TOKEN');
const HF_MODEL = Deno.env.get('HF_MODEL') || 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((o: string) => o.trim()).filter(Boolean);

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Error inesperado';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json;charset=utf-8' },
    });
  }
});
