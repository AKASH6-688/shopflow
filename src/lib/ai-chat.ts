import OpenAI from "openai";
import prisma from "./prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAIResponse(
  storeId: string,
  customerMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  customerPhone?: string
) {
  // Fetch store products for context
  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: {
      name: true,
      description: true,
      price: true,
      comparePrice: true,
      category: true,
      benefits: true,
      inventoryItems: { select: { quantity: true } },
    },
    take: 50,
  });

  const productCatalog = products
    .map((p) => {
      const stock = p.inventoryItems.reduce((sum, i) => sum + i.quantity, 0);
      const compare = p.comparePrice ? ` (Other brands: $${p.comparePrice})` : "";
      const benefits = p.benefits.length > 0 ? `\nBenefits: ${p.benefits.join(", ")}` : "";
      return `- ${p.name}: $${p.price}${compare} | ${p.category || "General"} | Stock: ${stock > 0 ? "In Stock" : "Out of Stock"}${benefits}\n  ${p.description || ""}`;
    })
    .join("\n");

  // Check if customer is blacklisted
  let blacklistInfo = "";
  if (customerPhone) {
    const customer = await prisma.customer.findFirst({
      where: { storeId, phone: customerPhone },
    });
    if (customer?.isBlacklisted) {
      blacklistInfo = `\n\nNOTE: This customer is flagged with ${customer.nonReceivedCount} non-received orders. Be polite but note this internally.`;
    }
  }

  const systemPrompt = `You are a helpful customer support assistant for an online store. Your job is to:
1. Answer questions about products (pricing, benefits, comparisons, availability)
2. Help with order inquiries
3. Provide shipping information
4. Be friendly, concise, and helpful
5. If you don't know something specific, politely suggest the customer contact the seller directly
6. Never make up information about products not in the catalog

Product Catalog:
${productCatalog}
${blacklistInfo}

Keep responses concise and helpful. Use emojis sparingly for a friendly tone.`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: customerMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";
}
