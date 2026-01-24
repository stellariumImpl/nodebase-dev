export const AVAILABLE_MODELS = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
] as const;

export type AnthropicModel = (typeof AVAILABLE_MODELS)[number];

export const normalizeAnthropicModel = (model?: string): AnthropicModel => {
  if (model && AVAILABLE_MODELS.includes(model as AnthropicModel)) {
    return model as AnthropicModel;
  }
  return "claude-3-5-sonnet-20241022"; // 默认使用最新的模型
};

export type AnthropicNodeData = {
  variableName?: string;
  model?: AnthropicModel;
  systemPrompt?: string;
  userPrompt?: string;
};