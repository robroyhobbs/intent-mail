"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <AlertTriangle className="h-12 w-12 text-yellow-500" />
      <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        An error occurred while loading this page.
      </p>
      <Button onClick={reset} className="mt-6" variant="outline">
        Try Again
      </Button>
    </div>
  );
}
