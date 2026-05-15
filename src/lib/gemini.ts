import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function getDrinkBenefit(drinkName: string): Promise<string> {
  try {
    const result = await model.generateContent(
      `Explain the health benefits of "${drinkName}" in exactly 30 words. Be specific and positive.`
    );
    return result.response.text();
  } catch (error) {
    console.error("Gemini error:", error);
    return "";
  }
}

export async function getUpsellSuggestion(cartItems: string[]): Promise<string> {
  try {
    const list = cartItems.join(", ");
    const result = await model.generateContent(
      `A customer ordered: ${list}. Suggest ONE complementary drink in 20 words. Start with "Try adding..."`
    );
    return result.response.text();
  } catch (error) {
    console.error("Gemini upsell error:", error);
    return "";
  }
}
