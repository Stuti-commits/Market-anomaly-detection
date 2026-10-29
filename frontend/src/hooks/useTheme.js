import { useCallback, useEffect, useState } from "react";

function readStoredTheme() {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : null;
  } catch (error) {
    return null;
  }
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event) => setSystemDark(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      return;
    }
  }, [theme]);

  const isDark = theme ? theme === "dark" : systemDark;
  const toggle = useCallback(() => setTheme(isDark ? "light" : "dark"), [isDark]);

  return { isDark, toggle };
}
