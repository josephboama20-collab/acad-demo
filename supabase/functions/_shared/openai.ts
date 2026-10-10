/** OpenAI Chat Completions helper for Supabase edge functions. */

export function getOpenAIApiKey(): string | undefined {
  return Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('OPENAI_API_KEY_FOR_ACAD') ?? undefined;
}

export async function callOpenAI(options: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens: number;
}): Promise<{ text: string | null; error: string | null }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
