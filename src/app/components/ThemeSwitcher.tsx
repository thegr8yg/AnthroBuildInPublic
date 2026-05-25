"use client";

import { useEffect, useState } from "react";

export type ThemeId = "aurora" | "editorial" | "brutalist" | "midnight" | "kinetic" | "paper" | "terminal";

export const THEMES: { id: ThemeId; label: string; emoji: string }[] = [
  { id: "aurora", label: "Aurora", emoji: "✦" },
  { id: "editorial", label: "Editorial", emoji: "◈" },
  { id: "brutalist", label: "Brutalist", emoji: "▣" },
  { id: "midnight", label: "Midnight", emoji: "◉" },
  { id: "kinetic", label: "Kinetic", emoji: "◐" },
  { id: "paper", label: "Paper", emoji: "✎" },
  { id: "terminal", label: "Terminal", emoji: "⌘" },
];

const STORAGE_KEY = "anthro_theme";

export function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "aurora";
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  if (stored && THEMES.some((t) => t.id === stored)) return stored;
  return "aurora";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => getInitialTheme());
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);
  return { theme, setTheme };
}

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="theme-switcher">
      <button
        className="theme-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change theme"
        title="Change theme"
      >
        <span className="theme-current">
          {THEMES.find((t) => t.id === theme)?.emoji}
        </span>
        <span className="theme-label">{THEMES.find((t) => t.id === theme)?.label}</span>
      </button>
      {open && (
        <div className="theme-menu" role="listbox">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === theme}
              className={`theme-option${t.id === theme ? " active" : ""}`}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
            >
              <span className="theme-emoji">{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
