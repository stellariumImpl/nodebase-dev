// NOTE: self-modified, 处理 localStorage + system theme + class 切换

export type Theme = "light" | "dark" | "system";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  localStorage.setItem("theme", theme);
}
