import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrganizationWithLimits } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, Mail, Palette, MessageSquare, Plug } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const org = await getOrganizationWithLimits();

  if (!org) {
    return <div>Loading...</div>;
  }

  // Get counts
  const [brandCount, intentCount, providerCount] = await Promise.all([
    db.brand.count({ where: { organizationId: org.id } }),
    db.intent.count({ where: { organizationId: org.id } }),
    db.emailProvider.count({
      where: { organizationId: org.id, isActive: true },
    }),
  ]);

  // Get recent emails
  const recentEmails = await db.emailLog.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      intent: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Billing cycle usage
  const emailLimit = org.limits.emailsPerMonth;
  const emailsUsed = org.emailsUsedThisMonth;
  const usagePercent =
    emailLimit === Infinity
      ? 0
      : Math.min(100, Math.round((emailsUsed / emailLimit) * 100));
  const resetDate = org.billingCycleStart
    ? new Date(
        new Date(org.billingCycleStart).setMonth(
          new Date(org.billingCycleStart).getMonth() + 1,
        ),
      )
    : null;

  const stats = [
    {
      name: "Emails This Month",
      value: formatNumber(emailsUsed),
      description:
        emailLimit === Infinity
          ? "Unlimited"
          : `of ${formatNumber(emailLimit)}`,
      icon: Mail,
      href: "/dashboard/emails",
    },
    {
      name: "Brands",
      value: brandCount,
      description: `${org.limits.maxBrands === Infinity ? "Unlimited" : `of ${org.limits.maxBrands}`}`,
      icon: Palette,
      href: "/dashboard/brands",
    },
    {
      name: "Intents",
      value: intentCount,
      description: "Active templates",
      icon: MessageSquare,
      href: "/dashboard/intents",
    },
    {
      name: "Providers",
      value: providerCount,
      description: "Connected",
      icon: Plug,
      href: "/dashboard/providers",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to {org.name}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/intents/new">Create Intent</Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              {stat.href && (
                <Link
                  href={stat.href}
                  className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                >
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Usage */}
      {emailLimit !== Infinity && (
        <Card
          className={usagePercent >= 80 ? "border-yellow-200 bg-yellow-50" : ""}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p
                className={`text-sm font-medium ${usagePercent >= 80 ? "text-yellow-800" : ""}`}
              >
                Email Usage: {formatNumber(emailsUsed)} /{" "}
                {formatNumber(emailLimit)}
              </p>
              <div className="flex items-center gap-3">
                {resetDate && (
                  <p className="text-xs text-muted-foreground">
                    Resets {resetDate.toLocaleDateString()}
                  </p>
                )}
                {usagePercent >= 80 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/settings/billing">Upgrade Plan</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 80 ? "bg-yellow-500" : "bg-primary"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/brands/new">
                <Palette className="mr-2 h-4 w-4" />
                Create a Brand
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/intents/new">
                <MessageSquare className="mr-2 h-4 w-4" />
                Create an Intent
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/providers/new">
                <Plug className="mr-2 h-4 w-4" />
                Connect Provider
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/api-keys">
                <Mail className="mr-2 h-4 w-4" />
                Get API Key
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Emails */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Emails</CardTitle>
              <CardDescription>Latest sent emails</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/emails">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No emails sent yet. Send your first email to see activity here.
              </p>
            ) : (
              <div className="space-y-3">
                {recentEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        To: {email.toEmail}
                      </p>
                    </div>
                    <Badge
                      variant={
                        email.status === "DELIVERED"
                          ? "success"
                          : email.status === "SENT"
                            ? "secondary"
                            : email.status === "FAILED"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {email.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
