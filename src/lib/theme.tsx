/**
 * theme.tsx
 * Gestion du thème (clair / sombre / système) et préférences utilisateur.
 * Stocké dans localStorage : invoicepro_prefs_v1
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";

export type UserPreferences = {
  theme: Theme;
  compactMode: boolean;
  showTTCByDefault: boolean;
  notificationsEnabled: boolean;
};

// ── Defaults & Storage ────────────────────────────────────────────────────────

const PREFS_KEY = "invoicepro_prefs_v1";

const DEFAULT_PREFS: UserPreferences = {
  theme: "system",
  compactMode: false,
  showTTCByDefault: false,
  notificationsEnabled: true,
};

export function loadPrefs(): UserPreferences {
  try {
    const stored = window.localStorage.getItem(PREFS_KEY);
    if (!stored) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(stored) as Partial<UserPreferences>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: UserPreferences): void {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ── Theme helpers ─────────────────────────────────────────────────────────────

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply the correct CSS class to <html> and return the resolved theme. */
function applyThemeClass(theme: Theme): "light" | "dark" {
  const resolved: "light" | "dark" = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  return resolved;
}

// ── Context ───────────────────────────────────────────────────────────────────

type PrefsCtx = {
  prefs: UserPreferences;
  /** Merge partial updates; persists immediately. */
  setPrefs: (update: Partial<UserPreferences>) => void;
  /** Resolved theme — never "system", always "light" or "dark". */
  resolvedTheme: "light" | "dark";
};

const PrefsContext = createContext<PrefsCtx>({
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
  resolvedTheme: "light",
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<UserPreferences>(DEFAULT_PREFS);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // ── Load on mount (client only) ──────────────────────────────────────────
  useEffect(() => {
    const loaded = loadPrefs();
    setPrefsState(loaded);
    const resolved = applyThemeClass(loaded.theme);
    setResolvedTheme(resolved);
  }, []);

  // ── Watch system preference when theme === "system" ──────────────────────
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = applyThemeClass("system");
      setResolvedTheme(resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs.theme]);

  // ── Updater ──────────────────────────────────────────────────────────────
  const setPrefs = (update: Partial<UserPreferences>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...update };
      savePrefs(next);
      if ("theme" in update && update.theme !== undefined) {
        const resolved = applyThemeClass(update.theme);
        setResolvedTheme(resolved);
      }
      return next;
    });
  };

  return (
    <PrefsContext.Provider value={{ prefs, setPrefs, resolvedTheme }}>
      {children}
    </PrefsContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Full preferences access. */
export function usePrefs() {
  return useContext(PrefsContext);
}

/** Convenience hook — theme only. */
export function useTheme() {
  const { prefs, setPrefs, resolvedTheme } = useContext(PrefsContext);
  return {
    theme: prefs.theme,
    setTheme: (t: Theme) => setPrefs({ theme: t }),
    resolvedTheme,
  };
}
