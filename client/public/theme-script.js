// This function runs BEFORE React hydrates to prevent theme flashing
function applyTheme() {
  const storageKey = "hr-theme";
  const theme = localStorage.getItem(storageKey) || "system";
  
  let resolvedTheme = theme;
  if (theme === "system") {
    resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
}

// Apply theme immediately (synchronous, blocking)
applyTheme();
