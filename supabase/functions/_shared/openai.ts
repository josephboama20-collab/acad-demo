/** OpenAI-compatible chat completions helper (supports DeepSeek + OpenAI). */

type Provider = 'deepseek' | 'openai';

interface AiConfig {
  apiKey: string;
  baseUrl: string;
  provider: Provider;
}

/** Model per provider for each task tier. */
export const AI_MODELS: Record<Provider, { profile: string; buddy: string }> = {
  deepseek: { profile: 'deepseek-chat', buddy: 'deepseek-chat' },
  openai: { profile: 'gpt-4.1-mini', buddy: 'gpt-4.1-nano' },
};

/**
 * Resolve the active AI provider from secrets. DeepSeek takes priority when
 * DEEPSEEK_API_KEY is set; otherwise falls back to OpenAI. Returns null when
 * neither is configured.
 */
export function getAiConfig(): AiConfig | null {
  const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (deepseekKey) {
    return {
      apiKey: deepseekKey,
      baseUrl: 'https://api.deepseek.com/chat/completions',
      provider: 'deepseek',
    };
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('OPENAI_API_KEY_FOR_ACAD');
  if (openaiKey) {
    return {
      apiKey: openaiKey,
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      provider: 'openai',
    };
  }

  return null;
}

/** @deprecated use getAiConfig(). Kept for backward compatibility. */
export function getOpenAIApiKey(): string | undefined {
  return getAiConfig()?.apiKey;
}

export async function callOpenAI(options: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens: number;
  baseUrl?: string;
}): Promise<{ text: string | null; error: string | null }> {
  const res = await fetch(options.baseUrl ?? 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens,
      messages: options.messages,
    }),
  });

  if (!res.ok) {
    return { text: null, error: await res.text() };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text: text || null, error: null };
}
