export async function askGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_HF_API_KEY;

  if (!apiKey) {
    console.warn('VITE_HF_API_KEY not set');
    return '';
  }

  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 150, return_full_text: false }
        })
      }
    );
    const data = await res.json();

    if (data.error) {
      console.error('HF error:', data.error);
      return '';
    }

    return data[0]?.generated_text?.trim() || '';
  } catch (err: any) {
    console.error('HF fetch failed:', err.message);
    return '';
  }
}
