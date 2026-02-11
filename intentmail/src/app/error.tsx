"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <h1 className="text-4xl font-bold text-white">Something went wrong</h1>
      <p className="mt-4 text-slate-400">
        An unexpected error occurred. Please try again.
      </p>
      <Button
        onClick={reset}
        className="mt-8 bg-blue-500 hover:bg-blue-400"
      >
        Try Again
      </Button>
    </div>
  );
}
