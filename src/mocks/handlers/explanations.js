import { requireRole } from "../session";

/**
 * POST /api/explanations. The contract allows coordinators only; the mock also answers
 * the other roles so every role's Explain panel can be demoed.
 * Answers are canned, cite only stored-row labels, and refuse decision requests.
 */

const DECISION_WORDS = /\b(should|recommend|decide|open a|close a|approve)\b|هل يجب|أنصح|قرر/i;

const ANSWERS = [
  {
    match: /prereq|requisite|متطلب/i,
    answer:
      "Prerequisites are stored as requisite groups: rows in the same group must all be met (AND); different groups are alternatives (OR). The engine reads attempt_state, not the file label, to decide whether a requisite is passed.",
    citations: [
      { id: "requisite", label: "requisite table" },
      { id: "art-7", label: "Pass test §7" },
    ],
  },
  {
    match: /credit|cap|limit|load|ساعات/i,
    answer:
      "The maximum load is the matching credit_limit row with the lowest priority for the student's bylaw, term type, CGPA and situation. For the 2025 bylaw, CGPA 3.0 to below 3.3 has no stated maximum, so those students are counted as null-cap and the forecast is marked incomplete.",
    citations: [
      { id: "credit-limit-p6", label: "2025 Art. 10 · priority 6" },
      { id: "gap-1", label: "Data gap #1" },
    ],
  },
  {
    match: /headcount|forecast|demand|incomplete|تنبؤ/i,
    answer:
      "A predicted headcount is the sum of the remaining probabilities p across students, after the credit-cap walk. Unresolved pairs are not in the sum; they are counted separately and make the row incomplete.",
    citations: [
      { id: "offering-forecast", label: "offering_forecast row" },
      { id: "forecast-line", label: "forecast_line counts by rule" },
    ],
  },
];

export default [
  {
    method: "POST",
    path: "/explanations",
    handler: ({ body }) => {
      requireRole();
      const question = String(body?.question ?? "");
      if (DECISION_WORDS.test(question)) {
        return {
          refused: true,
          answer:
            "This panel explains stored rules and numbers. It does not make or recommend opening decisions.",
          citations: [],
        };
      }
      const hit = ANSWERS.find((entry) => entry.match.test(question));
      if (!hit) {
        return {
          refused: true,
          answer: "Could not ground an answer in the stored rules supplied for this question.",
          citations: [],
        };
      }
      return { refused: false, answer: hit.answer, citations: hit.citations };
    },
  },
];
