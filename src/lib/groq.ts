export async function getAIBenefits(name: string, ingredients: string) {
  const res = await fetch(
    "https://pvlvcqdhdwpgmurkqywe.supabase.co/functions/v1/groq-ai",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, ingredients }),
    }
  );

  const data = await res.json();
  return data.text;
}