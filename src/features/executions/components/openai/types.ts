export const AVAILABLE_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
] as const;

export type OpenAIModel = (typeof AVAILABLE_MODELS)[number];

export const normalizeOpenAIModel = (model?: string): OpenAIModel => {
  if (model && AVAILABLE_MODELS.includes(model as OpenAIModel)) {
    return model as OpenAIModel;
  }
  return "gpt-4o-mini"; // 默认使用性价比最高的模型
};

export type OpenAINodeData = {
  variableName?: string;
  model?: OpenAIModel;
  systemPrompt?: string;
  userPrompt?: string;
};