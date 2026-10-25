import { http } from "@/services/http";

/**
 * POST /api/explanations (docs/api-contract.md). Node builds the context from stored rows;
 * the browser only sends the kind and the question (max 500 chars).
 * Response shape is assumed until contracts/ai-explain.md is published:
 * { answer: string, citations: [{ id, label }], refused: boolean }
 */
export const EXPLAIN_QUESTION_MAX = 500;

export function askExplanation({ kind = "rule", question, context }) {
  return http.post("/explanations", { kind, question, ...context });
}
