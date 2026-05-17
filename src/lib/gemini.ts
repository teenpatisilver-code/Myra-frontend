export async function askGemini(prompt: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ prompt: prompt })
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.text || '';
    } catch {
      console.error('Parse error:', text);
      return '';
    }
  } catch (err: any) {
    console.error('AI failed:', err.message);
    return '';
  }
}
