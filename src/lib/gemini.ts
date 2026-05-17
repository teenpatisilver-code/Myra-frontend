export async function askGemini(prompt: string): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (data.error) {
      console.error('AI error:', data.error);
      return '';
    }
    return data.text || '';
  } catch (err: any) {
    console.error('AI failed:', err.message);
    return '';
  }
}
