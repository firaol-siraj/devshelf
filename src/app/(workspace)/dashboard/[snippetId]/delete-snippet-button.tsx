"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { Trash2, AlertTriangle, AlertCircle } from "lucide-react";

import Button from "@/components/ui/Button";
import { deleteSnippetAction } from "@/app/(workspace)/dashboard/actions";
import { initialDeleteSnippetFormState } from "@/app/(workspace)/dashboard/types";

export interface DeleteSnippetButtonProps {
  snippetId: string;
  snippetTitle: string;
  className?: string;
  initialOpen?: boolean;
}

export default function DeleteSnippetButton({
  snippetId,
  snippetTitle,
  className,
  initialOpen = false,
}: DeleteSnippetButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(initialOpen);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteSnippetAction,
    initialDeleteSnippetFormState,
  );

  const showDeleteDialog = isDialogOpen && !deleteState.success;
  const cancelDeleteButtonRef = useRef<HTMLButtonElement | null>(null);

  // Autofocus cancel button when dialog opens for accessibility
  useEffect(() => {
    if (showDeleteDialog && cancelDeleteButtonRef.current) {
      cancelDeleteButtonRef.current.focus();
    }
  }, [showDeleteDialog]);

  // Handle escape key to cancel deletion
  useEffect(() => {
    if (!showDeleteDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        setIsDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteDialog, isDeleting]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className={[
          "border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50 focus-visible:ring-danger cursor-pointer h-8 px-2.5 text-xs gap-1.5",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`Delete ${snippetTitle}`}
      >
        <Trash2 size={13} aria-hidden="true" />
        <span>Delete</span>
      </Button>

      {showDeleteDialog && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setIsDialogOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-dialog-title-${snippetId}`}
            aria-describedby={`delete-dialog-desc-${snippetId}`}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3
                  id={`delete-dialog-title-${snippetId}`}
                  className="text-base font-semibold text-foreground"
                >
                  Delete Snippet
                </h3>
                <p
                  id={`delete-dialog-desc-${snippetId}`}
                  className="text-xs text-foreground-secondary leading-relaxed"
                >
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    &ldquo;{snippetTitle}&rdquo;
                  </span>
                  ? This action cannot be undone and will permanently remove this
                  snippet from your library.
                </p>
              </div>
            </div>

            {/* Error banner if deletion failed */}
            {deleteState.errors?.form && deleteState.errors.form.length > 0 && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-danger/20 bg-danger/10 p-2.5 text-xs text-danger"
              >
                <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
                <span>{deleteState.errors.form[0]}</span>
              </div>
            )}

            {/* Action buttons */}
            <form action={deleteFormAction} className="flex items-center justify-end gap-2.5 pt-2">
              <input type="hidden" name="id" value={snippetId} />
              <input type="hidden" name="redirectTo" value="/dashboard" />

              <Button
                ref={cancelDeleteButtonRef}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                Delete Snippet
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
