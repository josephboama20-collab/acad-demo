import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenAI } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUDDY_MODEL = 'gpt-4.1-nano';

const METHOD_PROMPTS: Record<string, (subject: string) => string> = {
  socratic: (s) => `You are Acad's Socratic Study Buddy for ${s}. Guide through questions, not direct answers. Use markdown sparingly.`,
  direct: (s) => `You are Acad's Study Buddy for ${s}. Give clear, structured explanations. Be concise. Use markdown sparingly.`,
  feynman: (s) => `You are Acad's Feynman-style Study Buddy for ${s}. Ask the student to explain simply and use analogies. Use markdown sparingly.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503, headers: corsHeaders });
    }

    const { messages, subject = 'General', method = 'socratic' } = await req.json();
    const systemPrompt = (METHOD_PROMPTS[method] || METHOD_PROMPTS.socratic)(subject);
    const apiMessages = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const { text: reply, error } = await callOpenAI({
      apiKey: openaiKey,
      model: BUDDY_MODEL,
      maxTokens: 512,
      messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
    });

    if (!reply) {
      return new Response(JSON.stringify({ error: 'AI request failed', detail: error }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
