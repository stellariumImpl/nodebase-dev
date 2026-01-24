export const AVAILABLE_MODELS = [
  "deepseek-chat",
  "deepseek-reasoner",
] as const;

export type DeepSeekModel = (typeof AVAILABLE_MODELS)[number];

export const normalizeDeepSeekModel = (model?: string): DeepSeekModel => {
  if (model && AVAILABLE_MODELS.includes(model as DeepSeekModel)) {
    return model as DeepSeekModel;
  }
  return "deepseek-chat"; // 默认使用最稳定的模型
};

export type DeepSeekNodeData = {
  variableName?: string;
  model?: DeepSeekModel;
  systemPrompt?: string;
  userPrompt?: string;
};