export async function getAIBenefits(drinkName: string, ingredients?: string): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Health benefits of the drink "${drinkName}"${ingredients ? ` made with: ${ingredients}` : ""}. Give 2-3 sentences, friendly and positive.`,
        }],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Could not load benefits.";
  } catch {
    return "Could not load AI benefits.";
  }
}

export async function getUpsellSuggestion(cartItems: string[]): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 60,
        messages: [{
          role: "user",
          content: `Customer ordered: ${cartItems.join(", ")}. Suggest ONE complementary drink in 15 words. Start with "Try adding..."`,
        }],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}
