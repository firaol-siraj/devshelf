"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import Button, { type ButtonVariant, type ButtonSize } from "@/components/ui/Button";

export async function copySnippetCode(
  code: string,
): Promise<{ success: boolean; error?: string }> {
  if (
    typeof window === "undefined" ||
    !navigator?.clipboard ||
    typeof navigator.clipboard.writeText !== "function"
  ) {
    return {
      success: false,
      error: "Clipboard API is unavailable in this environment",
    };
  }

  try {
    await navigator.clipboard.writeText(code);
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Unable to copy. Select the code manually.",
    };
  }
}

export type CopyStatus = "idle" | "copying" | "success" | "error";

export interface CopyCodeButtonProps {
  code: string;
  snippetTitle?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  initialStatus?: CopyStatus;
  initialError?: string;
}

export default function CopyCodeButton({
  code,
  snippetTitle,
  variant = "ghost",
  size = "sm",
  className,
  initialStatus = "idle",
  initialError = "",
}: CopyCodeButtonProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string>(initialError);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (copyStatus === "copying") return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setCopyStatus("copying");
    setErrorMessage("");

    const result = await copySnippetCode(code);

    if (result.success) {
      setCopyStatus("success");
      timerRef.current = setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } else {
      setCopyStatus("error");
      setErrorMessage(
        result.error ?? "Unable to copy. Select the code manually.",
      );
      timerRef.current = setTimeout(() => {
        setCopyStatus("idle");
        setErrorMessage("");
      }, 3500);
    }
  };

  const label = snippetTitle
    ? `Copy code for ${snippetTitle}`
    : "Copy code to clipboard";

  return (
    <div className="relative inline-flex items-center">
      <Button
        type="button"
        variant={copyStatus === "success" ? "secondary" : variant}
        size={size}
        onClick={handleCopy}
        disabled={copyStatus === "copying"}
        aria-label={
          copyStatus === "success"
            ? "Code copied to clipboard"
            : copyStatus === "error"
            ? "Unable to copy code to clipboard"
            : label
        }
        title={
          copyStatus === "success"
            ? "Copied to clipboard"
            : copyStatus === "error"
            ? "Unable to copy"
            : "Copy code"
        }
        className={[
          "h-7 px-2.5 text-xs font-mono transition-colors motion-reduce:transition-none cursor-pointer",
          copyStatus === "success" &&
            "text-success border-success/30 bg-success/10 hover:bg-success/15 hover:text-success",
          copyStatus === "error" &&
            "text-danger border-danger/30 bg-danger/10 hover:bg-danger/15 hover:text-danger",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {copyStatus === "success" ? (
          <>
            <Check size={13} className="text-success shrink-0" aria-hidden="true" />
            <span className="text-success font-medium">Copied!</span>
          </>
        ) : copyStatus === "error" ? (
          <>
            <AlertCircle size={13} className="text-danger shrink-0" aria-hidden="true" />
            <span className="text-danger font-medium">Failed</span>
          </>
        ) : (
          <>
            <Copy size={13} className="text-foreground-muted shrink-0" aria-hidden="true" />
            <span>Copy Code</span>
          </>
        )}
      </Button>

      {/* Visually Hidden Aria-Live Status Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {copyStatus === "success" && "Code copied to clipboard."}
        {copyStatus === "error" && errorMessage}
      </div>
    </div>
  );
}
