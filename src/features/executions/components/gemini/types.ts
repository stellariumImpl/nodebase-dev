/**
 * Shared types and constants for Gemini integration
 * 
 * Note: Model availability depends on your Google AI API access level.
 * Refer to https://ai.google.dev/gemini-api/docs/models/gemini for the latest models.
 * 
 * Recommended models (in order):
 * - gemini-1.5-flash: Fast and efficient, best for most use cases
 * - gemini-1.5-pro: More capable, better for complex tasks
 * - gemini-2.0-flash-exp: Experimental, newest features but may be unstable
 */

export const AVAILABLE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-2.0-flash-exp",
  "gemini-1.0-pro",
] as const;

export type GeminiModel = (typeof AVAILABLE_MODELS)[number];

export type GeminiNodeData = {
  variableName?: string;
  model?: GeminiModel;
  systemPrompt?: string;
  userPrompt?: string;
};
