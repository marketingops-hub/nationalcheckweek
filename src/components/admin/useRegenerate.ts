"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface RegenerateResult {
  updated: Record<string, unknown>;
  log: { section_key: string; status: string }[];
}

/**
 * Hook that calls POST /api/admin/generate and returns the generated content.
 * The caller is responsible for merging the results into form state.
 */
export function useRegenerate() {
  const [busy, setBusy]     = useState<string | null>(null); // section_key being generated, or "all"
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function generate(
    pageType: "state" | "area",
    recordId: string,
    sectionKeys?: string[],
  ): Promise<RegenerateResult | null> {
    if (!recordId) {
      setError("Save the record first before generating content.");
      return null;
    }
    const key = sectionKeys && sectionKeys.length === 1 ? sectionKeys[0] : "all";
    setBusy(key); setError(""); setSuccess("");

    try {
      // Get current session token to pass to the proxy
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) {
        setError("Not authenticated — please sign in again.");
        return null;
      }

      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ page_type: pageType, record_id: recordId, section_keys: sectionKeys }),
      });

      const json = await res.json() as RegenerateResult & { error?: string };

      if (!res.ok || json.error) {
        setError(json.error ?? "Generation failed — please try again.");
        return null;
      }

      const failedSections = json.log?.filter(l => l.status === "error").map(l => l.section_key);
      if (failedSections && failedSections.length > 0) {
        setError(`Some sections failed: ${failedSections.join(", ")}`);
      } else {
        const count = Object.keys(json.updated ?? {}).length;
        setSuccess(`Generated ${count} section${count !== 1 ? "s" : ""}. Review and click Save to persist.`);
      }

      return json;
    } catch {
      setError("Network error — please try again.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  return { generate, busy, error, setError, success, setSuccess };
}
