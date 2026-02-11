import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireOrganization } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { EmailStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const org = await requireOrganization();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q ?? "";
  const statusFilter = params.status ?? "";

  // Build where clause
  const where: Record<string, unknown> = { organizationId: org.id };
  if (query) {
    where.OR = [
      { toEmail: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
    ];
  }
  if (statusFilter) {
    where.status = statusFilter as EmailStatus;
  }

  const [emails, total] = await Promise.all([
    db.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        intent: { select: { name: true, slug: true } },
        brand: { select: { name: true } },
        provider: { select: { name: true, type: true } },
      },
    }),
    db.emailLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusColors = {
    PENDING: "secondary",
    QUEUED: "secondary",
    SCHEDULED: "secondary",
    SENT: "outline",
    DELIVERED: "success",
    OPENED: "success",
    CLICKED: "success",
    BOUNCED: "destructive",
    COMPLAINED: "destructive",
    CANCELLED: "outline",
    FAILED: "destructive",
  } as const;

  const statuses: EmailStatus[] = [
    "SCHEDULED",
    "SENT",
    "DELIVERED",
    "OPENED",
    "CLICKED",
    "BOUNCED",
    "COMPLAINED",
    "CANCELLED",
    "FAILED",
  ];

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      page: String(page),
      q: query,
      status: statusFilter,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/dashboard/emails?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Email History</h1>
        <p className="text-muted-foreground">
          View all sent emails and their delivery status
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          action="/dashboard/emails"
          method="GET"
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search by email or subject..."
            defaultValue={query}
            className="pl-9"
          />
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
        </form>
        <div className="flex gap-1">
          <Link href={buildUrl({ status: undefined, page: "1" })}>
            <Badge
              variant={!statusFilter ? "default" : "outline"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {statuses.map((s) => (
            <Link key={s} href={buildUrl({ status: s, page: "1" })}>
              <Badge
                variant={statusFilter === s ? "default" : "outline"}
                className="cursor-pointer"
              >
                {s.toLowerCase()}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {total} email{total !== 1 ? "s" : ""}
        {query ? ` matching "${query}"` : ""}
        {statusFilter ? ` with status ${statusFilter.toLowerCase()}` : ""}
      </p>

      {/* Email List */}
      {emails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {query || statusFilter
                ? "No emails match your search"
                : "No emails sent yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Recipient
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Intent
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr
                      key={email.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {email.toEmail}
                        </div>
                        {email.brand && (
                          <div className="text-xs text-muted-foreground">
                            {email.brand.name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate text-sm">
                          {email.subject}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {email.intent ? (
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {email.intent.slug}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[email.status]}>
                          {email.status.toLowerCase()}
                        </Badge>
                        {email.errorMessage && (
                          <div className="mt-1 text-xs text-destructive">
                            {email.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(email.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page - 1) })}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildUrl({ page: String(page + 1) })}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
