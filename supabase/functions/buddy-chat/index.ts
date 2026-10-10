import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AI_MODELS, callOpenAI, getAiConfig } from '../_shared/openai.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const METHOD_PROMPTS: Record<string, (subject: string) => string> = {
  socratic: (s) => `You are Acad's Socratic Study Buddy for ${s}. Guide through questions, not direct answers. Use markdown sparingly.`,
  direct: (s) => `You are Acad's Study Buddy for ${s}. Give clear, structured explanations. Be concise. Use markdown sparingly.`,
  feynman: (s) => `You are Acad's Feynman-style Study Buddy for ${s}. Ask the student to explain simply and use analogies. Use markdown sparingly.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: getCorsHeaders(req) });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: getCorsHeaders(req) });
    }

    const aiConfig = getAiConfig();
    if (!aiConfig) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503, headers: getCorsHeaders(req) });
    }

    const { messages, subject = 'General', method = 'socratic' } = await req.json();
    const systemPrompt = (METHOD_PROMPTS[method] || METHOD_PROMPTS.socratic)(subject);
    const apiMessages = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const { text: reply, error } = await callOpenAI({
      apiKey: aiConfig.apiKey,
      baseUrl: aiConfig.baseUrl,
      model: AI_MODELS[aiConfig.provider].buddy,
      maxTokens: 512,
      messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
    });

    if (!reply) {
      return new Response(JSON.stringify({ error: 'AI request failed', detail: error }), {
        status: 502,
        headers: getCorsHeaders(req),
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: getCorsHeaders(req),
    });
  }
});
