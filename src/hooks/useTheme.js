/**
 * REQ 12 — Dark Mode / Light Mode
 */
import { useState, useEffect } from "react";

const THEME_KEY = "pr_theme";

export default function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = (t) => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => prev === "dark" ? "light" : "dark");

  return { theme, setTheme, toggleTheme };
}
