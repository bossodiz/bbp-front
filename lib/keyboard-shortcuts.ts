"use client";

import { useEffect } from "react";

// ============================================================================
// KEYBOARD SHORTCUTS - Global keyboard command handling
// ============================================================================

export type KeyboardShortcutCallback = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Win on Windows
  callback: KeyboardShortcutCallback;
  description: string;
}

// Global shortcuts registry
const shortcuts: Map<string, ShortcutConfig> = new Map();

/**
 * Register a keyboard shortcut
 * @example
 * registerShortcut({
 *   key: 'k',
 *   meta: true,
 *   callback: () => openSearchModal(),
 *   description: 'Open search'
 * });
 */
export function registerShortcut(config: ShortcutConfig) {
  const shortcutId = generateShortcutId(config);
  shortcuts.set(shortcutId, config);
  return () => shortcuts.delete(shortcutId);
}

/**
 * Unregister a keyboard shortcut
 */
export function unregisterShortcut(config: ShortcutConfig) {
  const shortcutId = generateShortcutId(config);
  shortcuts.delete(shortcutId);
}

/**
 * Get all registered shortcuts
 */
export function getAllShortcuts(): ShortcutConfig[] {
  return Array.from(shortcuts.values());
}

/**
 * Get shortcut help text
 */
export function getShortcutText(config: ShortcutConfig): string {
  const parts: string[] = [];

  if (config.meta) {
    parts.push(isMac() ? "⌘" : "Win");
  }
  if (config.ctrl) {
    parts.push("Ctrl");
  }
  if (config.alt) {
    parts.push("Alt");
  }
  if (config.shift) {
    parts.push("Shift");
  }

  parts.push(config.key.toUpperCase());
  return parts.join(" + ");
}

/**
 * Hook to register a shortcut within a component
 */
export function useKeyboardShortcut(config: ShortcutConfig) {
  useEffect(() => {
    const unregister = registerShortcut(config);
    return () => {
      unregister();
    };
  }, [config]);
}

/**
 * Global keyboard event listener
 */
function handleKeyboardEvent(event: KeyboardEvent) {
  shortcuts.forEach((config) => {
    const matches =
      event.key.toLowerCase() === config.key.toLowerCase() &&
      (config.ctrl ?? false) === event.ctrlKey &&
      (config.shift ?? false) === event.shiftKey &&
      (config.alt ?? false) === event.altKey &&
      (config.meta ?? false) === event.metaKey;

    if (matches) {
      // Don't trigger if target is a form input (unless explicitly handling it)
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      event.preventDefault();
      config.callback(event);
    }
  });
}

/**
 * Initialize global keyboard listener
 */
export function initializeKeyboardShortcuts() {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyboardEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyboardEvent);
    };
  }
}

// ============================================================================
// COMMON SHORTCUTS PRESETS
// ============================================================================

export const commonShortcuts = {
  /**
   * Search/Command Palette (Cmd+K on Mac, Ctrl+K on Windows/Linux)
   */
  search: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "k",
    meta: true,
    ctrl: false,
    callback,
    description: "Open search / command palette",
  }),

  /**
   * Focus search input (Cmd+/ on Mac, Ctrl+/ on Windows/Linux)
   */
  focusSearch: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "/",
    meta: true,
    callback,
    description: "Focus search",
  }),

  /**
   * Help menu (Cmd+? on Mac, Ctrl+? on Windows/Linux)
   */
  help: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "?",
    meta: true,
    shift: true,
    callback,
    description: "Show help",
  }),

  /**
   * New item (Cmd+N on Mac, Ctrl+N on Windows/Linux)
   */
  new: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "n",
    meta: true,
    callback,
    description: "Create new item",
  }),

  /**
   * Save (Cmd+S on Mac, Ctrl+S on Windows/Linux)
   */
  save: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "s",
    meta: true,
    callback,
    description: "Save",
  }),

  /**
   * Edit (Cmd+E on Mac, Ctrl+E on Windows/Linux)
   */
  edit: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "e",
    meta: true,
    callback,
    description: "Edit item",
  }),

  /**
   * Delete (Backspace)
   */
  delete: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "Delete",
    callback,
    description: "Delete item",
  }),

  /**
   * Escape key
   */
  escape: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "Escape",
    callback,
    description: "Close modal / Cancel action",
  }),

  /**
   * Go to dashboard (Cmd+H on Mac, Ctrl+H on Windows/Linux)
   */
  goHome: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "h",
    meta: true,
    callback,
    description: "Go to dashboard",
  }),

  /**
   * Refresh (Cmd+R on Mac, Ctrl+R on Windows/Linux)
   */
  refresh: (callback: KeyboardShortcutCallback): ShortcutConfig => ({
    key: "r",
    meta: true,
    callback,
    description: "Refresh",
  }),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateShortcutId(config: ShortcutConfig): string {
  return `${config.meta ? "meta+" : ""}${config.ctrl ? "ctrl+" : ""}${config.alt ? "alt+" : ""}${config.shift ? "shift+" : ""}${config.key}`;
}

function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Format shortcut key for display
 * @example
 * getShortcutDisplay({ key: 'k', meta: true })
 * // Returns "⌘K" on Mac, "Win+K" on Windows
 */
export function getShortcutDisplay(config: ShortcutConfig): string {
  const isApple = isMac();
  const parts: string[] = [];

  if (config.meta) {
    parts.push(isApple ? "⌘" : "Win");
  }
  if (config.ctrl) {
    parts.push(isApple ? "⌃" : "Ctrl");
  }
  if (config.alt) {
    parts.push(isApple ? "⌥" : "Alt");
  }
  if (config.shift) {
    parts.push(isApple ? "⇧" : "Shift");
  }

  const keyDisplay = getKeyDisplay(config.key);
  parts.push(keyDisplay);

  return parts.join(isApple ? "" : "+");
}

function getKeyDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    Escape: "Esc",
    Enter: "↵",
    Tab: "⇥",
    Backspace: "⌫",
    Delete: "Del",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    " ": "Space",
  };

  return keyMap[key] || key.toUpperCase();
}

/**
 * Create a keyboard shortcut menu component data
 */
export function createShortcutMenuItems(): Array<{
  key: string;
  shortcut: string;
  description: string;
}> {
  return getAllShortcuts().map((config) => ({
    key: config.description,
    shortcut: getShortcutDisplay(config),
    description: config.description,
  }));
}
