const BASE_URL =
  "https://pvlvcqdhdwpgmurkqywe.supabase.co/functions/v1/groq-ai";

/**
 * Drink detail AI
 */
export async function getAIBenefits(name: string, ingredients: string) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      ingredients,
    }),
  });

  const data = await res.json();
  return data.text;
}

/**
 * Checkout upsell AI (required for checkout page)
 */
export async function getUpsellSuggestion(items: string[]) {
  const prompt = `Suggest a short upsell combo for: ${items.join(", ")}. Keep it 1 sentence.`;

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: prompt,
      ingredients: "",
    }),
  });

  const data = await res.json();
  return data.text;
}