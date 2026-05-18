export async function askGemini(prompt: string): Promise<string> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(
      'https://pvlvcqdhdwpgmurkqywe.supabase.co/functions/v1/ai-generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ prompt })
      }
    );
    const data = await res.json();
    return data.text || '';
  } catch (err: any) {
    console.error('AI failed:', err.message);
    return '';
  }
}
