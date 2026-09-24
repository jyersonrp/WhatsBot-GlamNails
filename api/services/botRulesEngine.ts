import type { BotRule, BotConfiguration } from "@db/schema";
import { findAllBotRules } from "../queries/botRules";
import { getBotConfiguration } from "../queries/configuration";
import { env } from "../lib/env";

/**
 * Normalizes text by converting to lowercase, removing diacritics/tildes,
 * stripping excessive punctuation, and trimming extra spaces.
 * E.g., "¿Cuánto cuesta el acrílico?" -> "cuanto cuesta el acrilico"
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents and tildes
    .replace(/[¿?¡!.,;:()\-_'"]/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Match a user message against active bot rules.
 * Rules are evaluated by priority (ascending).
 * Keywords and phrases are checked using normalized string matching.
 */
const GREETING_KEYWORDS = new Set([
  "hola",
  "buenos dias",
  "buenas tardes",
  "buenas noches",
  "hey",
  "hi",
  "buenas",
  "saludos",
  "buen dia",
  "hello",
  "que tal",
]);

interface RuleCandidate {
  rule: BotRule;
  matchedKeyword: string;
  wordCount: number;
  charLength: number;
  isGreeting: boolean;
  priority: number;
}

export function matchRuleInMemory(
  message: string,
  rules: BotRule[]
): BotRule | null {
  const normMessage = normalizeText(message);
  if (!normMessage) return null;

  const paddedMessage = ` ${normMessage} `;
  const candidates: RuleCandidate[] = [];

  const activeRules = rules.filter((r) => r.isActive && r.triggerType !== "default");

  for (const rule of activeRules) {
    const triggerValue = rule.triggerValue || "";
    const isNamedGreeting =
      normalizeText(rule.name).includes("saludo") ||
      normalizeText(rule.name).includes("bienvenida");

    switch (rule.triggerType) {
      case "exact": {
        const normTrigger = normalizeText(triggerValue);
        if (normMessage === normTrigger) {
          const isGreeting = isNamedGreeting || GREETING_KEYWORDS.has(normTrigger);
          candidates.push({
            rule,
            matchedKeyword: normTrigger,
            wordCount: normTrigger.split(" ").filter(Boolean).length,
            charLength: normTrigger.length,
            isGreeting,
            priority: rule.priority ?? 50,
          });
        }
        break;
      }

      case "keyword": {
        const rawKeywords = triggerValue.split(/[,;]/).map((k) => k.trim());
        const keywords = rawKeywords
          .map((k) => normalizeText(k))
          .filter(Boolean)
          .sort((a, b) => b.length - a.length);

        for (const kw of keywords) {
          if (paddedMessage.includes(` ${kw} `)) {
            const isGreeting = isNamedGreeting || GREETING_KEYWORDS.has(kw);
            candidates.push({
              rule,
              matchedKeyword: kw,
              wordCount: kw.split(" ").filter(Boolean).length,
              charLength: kw.length,
              isGreeting,
              priority: rule.priority ?? 50,
            });
            break; // Record best match for this rule
          }
        }
        break;
      }

      case "contains": {
        const normTrigger = normalizeText(triggerValue);
        if (normMessage.includes(normTrigger)) {
          const isGreeting = isNamedGreeting || GREETING_KEYWORDS.has(normTrigger);
          candidates.push({
            rule,
            matchedKeyword: normTrigger,
            wordCount: normTrigger.split(" ").filter(Boolean).length,
            charLength: normTrigger.length,
            isGreeting,
            priority: rule.priority ?? 50,
          });
        }
        break;
      }

      case "regex": {
        try {
          const regex = new RegExp(triggerValue, "i");
          if (regex.test(message) || regex.test(normMessage)) {
            candidates.push({
              rule,
              matchedKeyword: triggerValue,
              wordCount: 1,
              charLength: triggerValue.length,
              isGreeting: false,
              priority: rule.priority ?? 50,
            });
          }
        } catch {
          // ignore invalid regex
        }
        break;
      }
    }
  }

  if (candidates.length === 0) {
    const defaultRule = rules.find((r) => r.triggerType === "default" && r.isActive);
    return defaultRule || null;
  }

  // Filter out greeting rules if ANY substantive business rule matched
  // (e.g. "Hola, necesito cancelar mi cita" -> "cancelar mi cita" takes precedence over "hola")
  const substantiveCandidates = candidates.filter((c) => !c.isGreeting);
  const eligibleCandidates = substantiveCandidates.length > 0 ? substantiveCandidates : candidates;

  // Sort eligible candidates by:
  // 1. Matched word count descending (e.g. "cancelar mi cita" [3 words] beats "cita" [1 word])
  // 2. Matched character length descending (longer phrase = higher specificity)
  // 3. Rule priority ascending (lower number = higher administrative priority)
  eligibleCandidates.sort((a, b) => {
    if (b.wordCount !== a.wordCount) {
      return b.wordCount - a.wordCount;
    }
    if (b.charLength !== a.charLength) {
      return b.charLength - a.charLength;
    }
    return a.priority - b.priority;
  });

  return eligibleCandidates[0].rule;
}

/**
 * Check if a given date/time falls within salon business hours.
 * Glam Nails Maturín: Tuesday to Saturday, 09:00 - 17:00
 */
export function isWithinBusinessHours(
  date: Date = new Date(),
  config?: BotConfiguration | null
): boolean {
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = daysOfWeek[date.getDay()];

  let allowedDays = ["tuesday", "wednesday", "thursday", "friday", "saturday"];
  if (config?.businessDays) {
    try {
      allowedDays = JSON.parse(config.businessDays);
    } catch {
      // fallback
    }
  }

  if (!allowedDays.includes(dayName)) {
    return false;
  }

  const startStr = config?.businessHoursStart || "09:00";
  const endStr = config?.businessHoursEnd || "17:00";

  const [startHour, startMin] = startStr.split(":").map(Number);
  const [endHour, endMin] = endStr.split(":").map(Number);

  const currentHour = date.getHours();
  const currentMin = date.getMinutes();

  const currentTotal = currentHour * 60 + currentMin;
  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;

  return currentTotal >= startTotal && currentTotal <= endTotal;
}

/**
 * Optional AI fallback using Google Gemini Flash.
 * Answers in friendly Glam Nails receptionist persona when no static rule matches.
 */
export async function generateGeminiFallbackResponse(userMessage: string): Promise<string | null> {
  const apiKey = env.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `Eres Sofía, la recepcionista virtual de "Glam Nails Maturín", un salón de belleza y estética de uñas ubicado en Maturín, Monagas (C.C. Plaza Girasol, local 12).
Tu tono es cálido, profesional, venezolano y muy amable (usa emojis como 💅 ✨).
Información del salón:
- Servicios y precios: Manicure clásica ($6), Manicure spa ($9), Esmaltado semipermanente ($10), Uñas acrílicas esculpidas ($18), Uñas en gel ($16), Pedicure spa ($10), Nail art ($1+).
- Horario: Martes a Sábado de 9:00 am a 5:00 pm. Domingo y Lunes cerrado.
- Pagos: Aceptamos Pago Móvil, efectivo ($ y Bs a tasa BCV) y transferencias.
- Para citas: Se solicita nombre, servicio deseado y horario preferido. Las citas se confirman con un anticipo por Pago Móvil.
- Fuera de horario o dudas complejas: Si no estás segura o requieren atención humana, ofrece comunicarlas con una asesora.

Responde al siguiente mensaje del cliente de forma concisa, educada y en menos de 3 oraciones:
Cliente: "${userMessage}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("Gemini API call returned status:", response.status);
      return null;
    }

    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return candidateText || null;
  } catch (error) {
    console.error("Gemini Fallback Error:", error);
    return null;
  }
}

/**
 * Process an incoming user message through the complete bot rules pipeline.
 */
export async function processBotMessage(
  message: string
): Promise<{
  responseContent: string;
  matchedRuleName: string;
  source: "rule" | "ai" | "away" | "default";
}> {
  const [config, rules] = await Promise.all([
    getBotConfiguration(),
    findAllBotRules(true),
  ]);

  const matched = matchRuleInMemory(message, rules);

  if (matched && matched.triggerType !== "default") {
    return {
      responseContent: matched.responseContent,
      matchedRuleName: matched.name,
      source: "rule",
    };
  }

  // Check business hours: if outside operating hours and away message is configured
  if (!isWithinBusinessHours(new Date(), config) && config?.awayMessage) {
    return {
      responseContent: config.awayMessage,
      matchedRuleName: "Mensaje fuera de horario",
      source: "away",
    };
  }

  // If no specific rule matched and within business hours, try Gemini Flash if API key configured
  const aiResponse = await generateGeminiFallbackResponse(message);
  if (aiResponse) {
    return {
      responseContent: aiResponse,
      matchedRuleName: "Gemini AI Fallback",
      source: "ai",
    };
  }

  // Default response
  if (matched) {
    return {
      responseContent: matched.responseContent,
      matchedRuleName: matched.name,
      source: "default",
    };
  }

  const defaultRule = rules.find((r) => r.triggerType === "default" && r.isActive);
  if (defaultRule) {
    return {
      responseContent: defaultRule.responseContent,
      matchedRuleName: defaultRule.name,
      source: "default",
    };
  }

  return {
    responseContent:
      "No logré comprender del todo tu mensaje 😅. Puedes escribir palabras como *catálogo*, *precios*, *horario*, *ubicación*, *pago móvil*, *agendar cita* o *cancelar cita*. O escribe *asesora* para que una chica del salón te responda directamente 💅.",
    matchedRuleName: "Respuesta de orientación",
    source: "default",
  };
}
