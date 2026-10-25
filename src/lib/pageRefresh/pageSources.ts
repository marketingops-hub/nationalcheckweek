import { createClient } from "@/lib/supabase/server";
import type { EntityType } from "./entities";
import type { VaultSourceRow } from "./mergeSources";

/**
 * Vault documents a page was refreshed from (citation fields only, http(s)
 * links only). Never throws: a footer list must not break the page, e.g.
 * before the migration has been applied.
 */
export async function getPageSourceRows(entityType: EntityType, entityKey: string): Promise<VaultSourceRow[]> {
  try {
    const sb = await createClient();
    const { data, error } = await sb.rpc("get_page_sources", {
      p_entity_type: entityType,
      p_entity_key: entityKey,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as VaultSourceRow[];
  } catch (err) {
    console.warn("[page sources]", err instanceof Error ? err.message : err);
    return [];
  }
}
