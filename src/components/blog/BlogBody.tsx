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

    loadHubSpotScript().then(() => {
      embeds.forEach((el, i) => {
        const formId   = el.getAttribute("data-form-id") ?? "";
        const portalId = el.getAttribute("data-portal-id") || DEFAULT_PORTAL_ID;
        if (!formId || !portalId) return;

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
