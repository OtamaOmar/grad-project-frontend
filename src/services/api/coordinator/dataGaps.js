import { http } from "@/services/http";

/**
 * GET /data-gaps (CONTRACT). Recorded holes in the source data; status is open|resolved.
 * @param {{ status?: "open"|"resolved", category?: string, severity?: string,
 *   affected_entity?: string, q?: string, sort?: string, page?: number,
 *   page_size?: number }} [query] Filters beyond the contract are mock conveniences.
 * @returns {Promise<{ items: Array<{ id: number, category: string, severity: string,
 *   affected_entity: string, status: "open"|"resolved", description: string,
 *   source_reference: string, notes: string|null, created_at: string,
 *   updated_at: string }>, total: number, page: number, page_size: number,
 *   open_count: number, resolved_count: number }>}
 */
export function listDataGaps(query) {
  return http.get("/data-gaps", { query });
}
