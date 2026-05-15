"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * useFocusTrap — small, dependency-free focus-trap hook for modals.
 *
 * Two responsibilities:
 *   1. Move focus into the container when the trap activates, remembering
 *      the previously-focused element so we can restore it on close.
 *   2. While active, intercept Tab / Shift+Tab to cycle focus between the
 *      first and last tabbable descendants, so keyboard users can't
 *      tab out of the modal into the document behind it.
 *
 * We intentionally do NOT lock page scroll or manage aria-hidden on the
 * rest of the document — the Content Creator admin doesn't ship with a
 * design-system modal primitive, and adding either of those here would
 * be out of scope. If a future screen needs both, wrap this hook in a
 * <Modal> component that adds them once.
 *
 * Usage:
 *   const ref = useFocusTrap(isOpen);
 *   return isOpen ? <div ref={ref} role="dialog">…</div> : null;
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";

/** CSS selector for every element that can receive keyboard focus.
 *  Deliberately narrow — we don't trap into contentEditable or audio/video
 *  controls. Matches the de-facto industry list (MDN, Radix, Reach UI). */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;

    // Capture into a const so the closures below keep the non-null
    // narrowing TS needs across the keyboard handler. ref.current itself
    // is T | null and could in principle change between calls.
    const node: T = ref.current!;
    if (!node) return;

    // Remember so we can restore focus on unmount. Cast because the
    // spec types this as Element but DOM callers often want an
    // HTMLElement (.focus()).
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the container. Prefer the first natively-tabbable
    // child; fall back to the container itself (which must be tabbable
    // via tabindex={-1} for this to take focus).
    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        // Hidden / zero-sized elements can match the selector but aren't
        // reachable by keyboard. offsetParent===null covers display:none
        // ancestors in all browsers except Safari old-style, which is
        // close enough for an admin panel.
        .filter((el) => el.offsetParent !== null || el === document.activeElement);

    const first = focusables()[0];
    (first ?? node).focus();

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) {
        // No tabbable children — keep focus on the container.
        e.preventDefault();
        node.focus();
        return;
      }

      const firstEl = list[0];
      const lastEl  = list[list.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        // Shift+Tab on the first element wraps to the last.
        if (activeEl === firstEl || !node.contains(activeEl)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab on the last element wraps to the first.
        if (activeEl === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Restore focus. Skip if the element was removed from the DOM
      // (e.g. the modal was opened from a row that got unmounted).
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return ref;
}
