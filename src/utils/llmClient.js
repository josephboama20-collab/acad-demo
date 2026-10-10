/** OpenAI-compatible chat completion (DeepSeek). Skipped when Supabase edge handles AI. */
export async function callDeepSeek(messages, systemPrompt, maxTokens = 1024) {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
