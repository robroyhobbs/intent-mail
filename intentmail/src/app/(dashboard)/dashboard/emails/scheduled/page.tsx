import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireOrganization } from "@/lib/auth";
import { db } from "@/lib/db";
import { Clock } from "lucide-react";
import { ScheduledEmailActions } from "@/components/emails/scheduled-actions";

export const dynamic = "force-dynamic";

export default async function ScheduledEmailsPage() {
  const org = await requireOrganization();

  const scheduledEmails = await db.emailLog.findMany({
    where: {
      organizationId: org.id,
      status: "SCHEDULED",
    },
    orderBy: { scheduledFor: "asc" },
    include: {
      brand: { select: { name: true } },
      intent: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Scheduled Emails</h1>
        <p className="text-muted-foreground">
          View and manage emails queued for future delivery
        </p>
      </div>

      {/* Scheduled Email List */}
      {scheduledEmails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No scheduled emails</h3>
            <p className="text-sm text-muted-foreground">
              Emails scheduled for future delivery will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending ({scheduledEmails.length})</CardTitle>
            <CardDescription>
              Emails queued for future delivery. You can cancel or reschedule them.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Recipient</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Scheduled For</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledEmails.map((email) => (
                    <tr key={email.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{email.toEmail}</div>
                        {email.intent && (
                          <div className="text-xs text-muted-foreground">
                            {email.intent.slug}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate text-sm">{email.subject}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {email.brand?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {email.scheduledFor
                          ? new Date(email.scheduledFor).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">scheduled</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ScheduledEmailActions emailId={email.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
