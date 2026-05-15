const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function getAIBenefits(name: string, ingredients: string) {
  const prompt = `You are a health expert. Describe benefits of ${name} made with ${ingredients}. Keep it short.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}