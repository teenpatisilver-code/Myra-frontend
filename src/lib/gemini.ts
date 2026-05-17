export async function askGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    alert('ERROR: VITE_GEMINI_API_KEY is not set!');
    return '';
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await res.json();
    
    if (data.error) {
      alert('Gemini error: ' + data.error.message);
      return '';
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err: any) {
    alert('Gemini fetch failed: ' + err.message);
    return '';
  }
}
