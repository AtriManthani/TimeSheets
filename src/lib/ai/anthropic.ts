import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export async function callAI(
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number = 1024
): Promise<AIResponse> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";

  return {
    content,
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };
}

export async function callAIWithRetry(
  systemPrompt: string,
  messages: AIMessage[],
  maxTokens: number = 1024,
  retries: number = 2
): Promise<AIResponse> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await callAI(systemPrompt, messages, maxTokens);
    } catch (err) {
      lastError = err as Error;
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

export function parseJsonFromAI<T>(content: string): T | null {
  // Extract JSON from markdown code blocks or raw JSON
  const jsonMatch =
    content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    content.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1].trim()) as T;
  } catch {
    return null;
  }
}
