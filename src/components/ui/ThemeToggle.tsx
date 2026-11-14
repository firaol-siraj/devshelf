"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";

export interface ThemeToggleProps {
  className?: string;
}

const STORAGE_KEY = "devshelf-theme";

// Module-level in-memory preference fallback
let inMemoryPreference: ThemePreference = (function () {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const val = window.localStorage.getItem(STORAGE_KEY);
      if (val === "light" || val === "dark" || val === "system") {
        return val;
      }
    }
  } catch {
    // Gracefully handle storage access failure during initial module load
  }
  return "system";
})();

// Tracks whether the most recent localStorage write failed
let storageWriteFailed = false;

// Registry of same-window store listeners
const storeListeners = new Set<() => void>();

function notifySubscribers(): void {
  storeListeners.forEach((listener) => listener());
}

function subscribeToTheme(callback: () => void): () => void {
  storeListeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) {
      return;
    }

    storageWriteFailed = false;

    if (event.key === STORAGE_KEY) {
      const raw = event.newValue as ThemePreference | null;
      if (raw === "light" || raw === "dark" || raw === "system") {
        inMemoryPreference = raw;
        applyThemeToDocument(raw);
      } else {
        inMemoryPreference = "system";
        applyThemeToDocument("system");
      }
      callback();
    } else {
      // event.key === null indicates localStorage.clear() occurred in another context
      inMemoryPreference = "system";
      applyThemeToDocument("system");
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    storeListeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getThemeSnapshot(): ThemePreference {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const val = window.localStorage.getItem(STORAGE_KEY);
      if (val === "light" || val === "dark" || val === "system") {
        inMemoryPreference = val;
        return val;
      }
      // If storage is functional and key is unset or was cleared, reconcile to "system"
      if (val === null && !storageWriteFailed) {
        inMemoryPreference = "system";
        return "system";
      }
    }
  } catch {
    // localStorage read failed or is blocked; fall back to in-memory preference
    return inMemoryPreference;
  }
  return inMemoryPreference;
}

function getServerThemeSnapshot(): ThemePreference {
  return "system";
}

function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyThemeToDocument(preference: ThemePreference): void {
  if (typeof document === "undefined") return;
  const isDark = resolveIsDark(preference);
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}

function updateThemePreference(nextPreference: ThemePreference): void {
  // Always update in-memory state so subsequent snapshots agree immediately
  inMemoryPreference = nextPreference;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, nextPreference);
      storageWriteFailed = false;
    }
  } catch {
    // Flag failed storage write so in-memory preference remains authoritative
    storageWriteFailed = true;
  }

  applyThemeToDocument(nextPreference);
  notifySubscribers();
}

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "system", label: "System theme", icon: Monitor },
  { value: "dark", label: "Dark theme", icon: Moon },
];

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Synchronize document classes on theme change
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  // Handle dynamic OS preference changes when 'system' is selected
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      applyThemeToDocument("system");
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [theme]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let targetIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      targetIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      targetIndex =
        (currentIndex - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      updateThemePreference(THEME_OPTIONS[currentIndex].value);
      return;
    }

    if (targetIndex !== null) {
      const nextOption = THEME_OPTIONS[targetIndex];
      updateThemePreference(nextOption.value);
      buttonRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={[
        "inline-flex items-center rounded-lg border border-border bg-surface-secondary p-0.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {THEME_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;
        const tabIndex = isSelected ? 0 : -1;

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={tabIndex}
            aria-label={option.label}
            title={option.label}
            onClick={() => updateThemePreference(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors cursor-pointer select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isSelected
                ? "bg-surface text-foreground shadow-subtle border border-border/50"
                : "text-foreground-muted hover:text-foreground hover:bg-surface/50 border border-transparent",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Icon size={14} aria-hidden="true" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
