'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const HUBSPOT_SCRIPT_URL = '//js-ap1.hsforms.net/forms/embed/v2.js';

interface HubSpotFormProps {
  portalId: string;
  formId: string;
  region?: string;
  /** DOM id for the container div; defaults to `hubspot-form-${formId}` */
  containerId?: string;
  /** Called once the HubSpot form iframe is ready */
  onFormReady?: ($form: HTMLFormElement) => void;
  /** Called when the form is submitted */
  onFormSubmit?: ($form: HTMLFormElement, data: Record<string, unknown>) => void;
  /** Lazy-load: only initialise the form when it scrolls into view */
  lazy?: boolean;
  /** IntersectionObserver rootMargin for lazy loading (default "100px") */
  lazyMargin?: string;
}

/**
 * Shared HubSpot form embed component.
 *
 * Handles script loading (idempotent), cleanup, loading/error states,
 * and optional lazy-loading via IntersectionObserver.
 */
export default function HubSpotForm({
  portalId,
  formId,
  region = 'ap1',
  containerId,
  onFormReady,
  onFormSubmit,
  lazy = false,
  lazyMargin = '100px',
}: HubSpotFormProps) {
  const targetId = containerId ?? `hubspot-form-${formId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialised = useRef(false);
  const readyFired = useRef(false);

  // Single source of truth: mark the form as loaded and trigger lsgo_ac.
  // Uses a ref guard so it only fires once even if both the HubSpot
  // onFormReady callback AND the MutationObserver detect the form.
  const markReady = useCallback(($form?: HTMLFormElement | null) => {
    if (readyFired.current) return;
    readyFired.current = true;
    setLoading(false);
    onFormReady?.($form as HTMLFormElement);
    if (window.lsgoACinit) {
      setTimeout(window.lsgoACinit, 300);
    }
  }, [onFormReady]);

  const createForm = useCallback(() => {
    if (initialised.current) return;
    if (!window.hbspt) return;

    initialised.current = true;
    window.hbspt.forms.create({
      portalId,
      formId,
      region,
      target: `#${targetId}`,
      onFormReady: ($form: HTMLFormElement) => markReady($form),
      onFormSubmit: onFormSubmit as HubSpotFormConfig['onFormSubmit'],
    });
  }, [portalId, formId, region, targetId, markReady, onFormSubmit]);

  // Fallback: watch for HubSpot injecting content into the target div
  // in case onFormReady doesn't fire (observed in production).
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const mo = new MutationObserver(() => {
      if (target.querySelector('iframe, form, .hs-form')) {
        mo.disconnect();
        markReady(target.querySelector('form'));
      }
    });
    mo.observe(target, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, [targetId, markReady]);

  useEffect(() => {
    initialised.current = false;
    readyFired.current = false;
    // Intentional reset when form props change — not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');

    const loadAndCreate = () => {
      // Script already loaded globally — reuse it
      if (window.hbspt) {
        createForm();
        return;
      }

      const script = document.createElement('script');
      script.src = HUBSPOT_SCRIPT_URL;
      script.charset = 'utf-8';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = createForm;
      script.onerror = () => {
        setLoading(false);
        setError('Form failed to load. Please refresh or contact us directly.');
      };
      document.body.appendChild(script);
    };

    if (!lazy) {
      loadAndCreate();
      return;
    }

    // Lazy: wait until the container is in view
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          loadAndCreate();
        }
      },
      { rootMargin: lazyMargin },
    );
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [portalId, formId, region, lazy, lazyMargin, createForm]);

  return (
    <div ref={containerRef}>
      {error && (
        <p style={{ color: '#DC2626', fontSize: '0.875rem', padding: '1rem', background: '#FEF2F2', borderRadius: 8 }}>
          {error}
        </p>
      )}
      {loading && !error && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
          Loading form…
        </div>
      )}
      <div id={targetId} />
    </div>
  );
}
