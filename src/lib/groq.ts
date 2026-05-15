export async function getUpsellSuggestion(items: string[]) {
  const prompt = `Suggest a short upsell or combo idea for these drinks: ${items.join(", ")}. Keep it under 1 sentence.`;

  const res = await fetch(
    "https://pvlvcqdhdwpgmurkqywe.supabase.co/functions/v1/groq-ai",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: prompt,
        ingredients: "",
      }),
    }
  );

  const data = await res.json();
  return data.text;
}