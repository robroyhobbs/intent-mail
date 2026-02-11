"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScheduledEmailActionsProps {
  emailId: string;
}

export function ScheduledEmailActions({ emailId }: ScheduledEmailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this scheduled email?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/emails/scheduled/${emailId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule() {
    if (!newDate) return;

    const scheduledFor = new Date(newDate);
    if (scheduledFor.getTime() <= Date.now()) {
      alert("Scheduled time must be in the future");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/emails/scheduled/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: scheduledFor.toISOString() }),
      });
      if (res.ok) {
        setShowReschedule(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (showReschedule) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="datetime-local"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="h-8 w-48 text-xs"
          disabled={loading}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={loading || !newDate}
          onClick={handleReschedule}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => setShowReschedule(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => setShowReschedule(true)}
      >
        Reschedule
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={handleCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
