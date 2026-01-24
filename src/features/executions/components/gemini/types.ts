export const AVAILABLE_MODELS = [
  // "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
] as const;

export type GeminiModel = (typeof AVAILABLE_MODELS)[number];

export const normalizeGeminiModel = (model?: string): GeminiModel => {
  if (model && AVAILABLE_MODELS.includes(model as GeminiModel)) {
    return model as GeminiModel;
  }
  return "gemini-2.0-flash"; // 默认使用最稳定的 ID
};
export type GeminiNodeData = {
  variableName?: string;
  model?: GeminiModel;
  systemPrompt?: string;
  userPrompt?: string;
};
