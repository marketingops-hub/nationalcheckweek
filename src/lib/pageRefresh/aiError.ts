/**
 * The AI wrapper reduces every HTTP 400 to a generic "Invalid request". Dig
 * the real reason out of the original API error so staff can act on it
 * (out of credit, wrong model name, key problems, prompt too long...).
 */
export function describeAiError(err: unknown): string {
  const details = (err as { details?: { originalError?: unknown } } | null)?.details;
  const orig = (details?.originalError ?? err) as
    | { status?: number; message?: string; error?: { error?: { message?: string } } }
    | undefined;
  const reason = orig?.error?.error?.message ?? orig?.message ?? (err instanceof Error ? err.message : "");
  console.error("[page-refresh] AI call failed:", orig?.status ?? "", reason);

  const r = reason.toLowerCase();
  if (r.includes("credit balance")) {
    return "The AI account has run out of credit. Top up the Anthropic billing balance, then try again.";
  }
  if (r.includes("model") && (r.includes("not found") || r.includes("not_found") || r.includes("invalid"))) {
    return `The AI model is not available to this API key (${reason}).`;
  }
  if (orig?.status === 401 || r.includes("api key") || r.includes("authentication")) {
    return "The AI API key is missing or invalid. Check ANTHROPIC_API_KEY in the hosting environment settings.";
  }
  if (r.includes("prompt is too long") || r.includes("too many tokens")) {
    return "The vault excerpts were too long for the AI. Try again, or ask a developer to lower the excerpt limit.";
  }
  if (orig?.status === 429) return "The AI service is busy or rate limited. Wait a minute and try again.";
  if (orig?.status === 529) return "The AI service is overloaded right now. Try again shortly.";
  return reason ? `The AI request failed: ${reason}` : "The AI request failed. Please try again.";
}
