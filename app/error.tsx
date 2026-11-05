"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="text-2xl font-semibold text-foreground">
        {error.message || "An unexpected error occurred"}
      </h1>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition hover:opacity-80"
      >
        Try again
      </button>
    </div>
  );
}
