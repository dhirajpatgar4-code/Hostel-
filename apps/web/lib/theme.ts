"use client";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(stored);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      const isDark =
        theme === "dark" ||
        (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", isDark);
      setResolved(isDark ? "dark" : "light");
    }
    apply();
    if (theme === "system") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  function setTheme(t: Theme) {
    localStorage.setItem("theme", t);
    setThemeState(t);
  }

  function toggle() {
    setTheme(resolved === "dark" ? "light" : "dark");
  }

  return { theme, resolved, setTheme, toggle };
}
