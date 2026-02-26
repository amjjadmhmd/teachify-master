
import { GoogleGenAI } from "@google/genai";

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3-flash-preview",
];

type AssistantLang = "en" | "ar";

const getGeminiApiKey = (): string => {
  const viteKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  const legacyKey =
    (typeof process !== "undefined" && (process as any)?.env?.API_KEY) ||
    (typeof process !== "undefined" && (process as any)?.env?.GEMINI_API_KEY);

  return String(viteKey || legacyKey || "").trim();
};

const extractResponseText = async (response: any): Promise<string> => {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  if (typeof response?.text === "function") {
    const maybeText = await response.text();
    if (typeof maybeText === "string" && maybeText.trim()) {
      return maybeText.trim();
    }
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const merged = parts
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (merged) return merged;
  }

  return "";
};

const detectLanguage = (text: string): AssistantLang =>
  /[\u0600-\u06FF]/.test(text) ? "ar" : "en";

const buildSystemInstruction = (context: string, lang: AssistantLang): string => {
  const languageRule =
    lang === "ar"
      ? "Respond in Arabic only, using clear and natural wording."
      : "Respond in English only, using clear and natural wording.";

  return `You are "Geo Top Assistant", the official AI helper for Geo Top LMS.
Current page context: ${context}

Brand rules:
- Always use the brand name "Geo Top".
- Never mention Teachify, WhiteLab, or any other platform name.
- Keep terminology aligned with Geo Top sections:
  Dashboard/Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…, Courses/Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª, Exams/Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª, Certifications/Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª.

Response rules:
1. ${languageRule}
2. Give concise, practical answers for navigation, learning, and platform usage.
3. If steps are needed, use numbered steps (1. 2. 3.).
4. Avoid noisy symbols or mixed formatting such as repeated *, ?, or broken punctuation.
5. Keep the answer short and easy to scan.`;
};

const normalizeAssistantText = (text: string): string =>
  text
    .replace(/\bTeachify\b/gi, "Geo Top")
    .replace(/\bWhiteLab\b/gi, "Geo Top")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const geminiService = {
  /**
   * General AI Assistant for Geo Top
   */
  chat: async (
    userMessage: string,
    context: string = "Dashboard",
    lang?: AssistantLang
  ) => {
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey || apiKey.includes("CHANGE_ME") || apiKey.includes("REPLACE_WITH")) {
        return "AI is not configured yet. Set VITE_GEMINI_API_KEY in frontend/skill/.env and restart the app.";
      }

      const ai = new GoogleGenAI({ apiKey });
      const resolvedLang = lang || detectLanguage(userMessage);
      const systemInstruction = buildSystemInstruction(context, resolvedLang);

      let lastError: unknown = null;

      for (const model of MODEL_CANDIDATES) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userMessage,
            config: {
              systemInstruction,
            },
          });

          const text = await extractResponseText(response);
          if (text) return normalizeAssistantText(text);
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw lastError;
      }

      return "The AI response was empty. Please try again.";
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return "I encountered a synchronization error. Please verify AI key/config and try again.";
    }
  },

  /**
   * Specific tutor for course content
   */
  askTutor: async (lessonTitle: string, question: string) => {
     return geminiService.chat(question, `Learning Course Lesson: ${lessonTitle}`);
  }
};

