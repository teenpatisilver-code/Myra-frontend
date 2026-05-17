export async function askGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_HF_API_KEY;

  if (!apiKey) {
    alert('HF API key not set!');
    return '';
  }

  try {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-base',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );
    const data = await res.json();

    if (data.error) {
      alert('HF error: ' + data.error);
      return '';
    }

    return data[0]?.generated_text?.trim() || '';
  } catch (err: any) {
    alert('Failed: ' + err.message);
    return '';
  }
}
