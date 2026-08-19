import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

export function isOpenAIEnabled() {
  return !!process.env.OPENAI_API_KEY;
}
