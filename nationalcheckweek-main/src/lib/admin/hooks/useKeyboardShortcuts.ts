"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          metaMatch &&
          shiftMatch &&
          altMatch
        ) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Global admin keyboard shortcuts
 */
export function useAdminKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    // Cmd/Ctrl + S to save (prevent default browser save)
    {
      key: 's',
      meta: true,
      action: () => {
        const saveButton = document.querySelector<HTMLButtonElement>(
          'button[type="submit"], button[data-save="true"]'
        );
        if (saveButton) saveButton.click();
      },
      description: 'Save current form',
    },
    // Cmd/Ctrl + N to create new
    {
      key: 'n',
      meta: true,
      action: () => {
        const newButton = document.querySelector<HTMLAnchorElement>(
          'a[href*="/new"], button[data-new="true"]'
        );
        if (newButton) newButton.click();
      },
      description: 'Create new item',
    },
    // Cmd/Ctrl + / to search
    {
      key: '/',
      meta: true,
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"]'
        );
        if (searchInput) searchInput.focus();
      },
      description: 'Focus search',
    },
    // Cmd/Ctrl + E to go to events
    {
      key: 'e',
      meta: true,
      shift: true,
      action: () => router.push('/admin/events'),
      description: 'Go to Events',
    },
    // Cmd/Ctrl + B to go to blog
    {
      key: 'b',
      meta: true,
      shift: true,
      action: () => router.push('/admin/blog'),
      description: 'Go to Blog',
    },
    // Cmd/Ctrl + H to go to home
    {
      key: 'h',
      meta: true,
      shift: true,
      action: () => router.push('/admin'),
      description: 'Go to Dashboard',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
