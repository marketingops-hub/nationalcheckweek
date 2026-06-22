"use client";

import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HubSpotWindow = Window & { hbspt?: any };
const win = (): HubSpotWindow => window as HubSpotWindow;

const HS_SCRIPT_ID = "hs-forms-script";
const DEFAULT_PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? "";

function loadHubSpotScript(): Promise<void> {
  return new Promise((resolve) => {
    if (win().hbspt) { resolve(); return; }
    if (document.getElementById(HS_SCRIPT_ID)) {
      const interval = setInterval(() => {
        if (win().hbspt) { clearInterval(interval); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = HS_SCRIPT_ID;
    script.src = "//js-ap1.hsforms.net/forms/embed/v2.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

interface Props {
  html: string;
  className?: string;
}

export default function BlogBody({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const embeds = container.querySelectorAll<HTMLElement>("div.hs-form-embed");
    if (!embeds.length) return;

    // Show loading placeholder in each embed slot while HubSpot script loads
    embeds.forEach((el) => {
      el.innerHTML = `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:24px 20px;text-align:center;background:#f9fafb;color:#6b7280;font-size:14px;">
          <svg style="display:inline-block;margin-bottom:8px;animation:spin 1s linear infinite" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <div>Loading form…</div>
        </div>
        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
      `;
    });

    loadHubSpotScript().then(() => {
      embeds.forEach((el, i) => {
        const formId   = el.getAttribute("data-form-id") ?? "";
        const portalId = el.getAttribute("data-portal-id") || DEFAULT_PORTAL_ID;
        if (!formId || !portalId) {
          el.innerHTML = `<div style="border:1px dashed #d1d5db;border-radius:8px;padding:24px 20px;text-align:center;background:#f9fafb;color:#9ca3af;font-size:13px;">Form unavailable — missing form ID or portal ID.</div>`;
          return;
        }

        // Give each embed div a unique target id
        const targetId = `hs-form-target-${i}-${formId.slice(0, 8)}`;
        el.id = targetId;
        el.innerHTML = "";

        win().hbspt.forms.create({
          region:   "ap1",
          portalId,
          formId,
          target:   `#${targetId}`,
        });
      });
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
