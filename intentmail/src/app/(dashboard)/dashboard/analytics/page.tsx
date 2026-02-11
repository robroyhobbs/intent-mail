import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireOrganization } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNumber, formatDate } from "@/lib/utils";
import {
  Mail,
  CheckCircle,
  XCircle,
  MousePointer,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const org = await requireOrganization();

  // Get date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get stats
  const [
    totalSent,
    totalDelivered,
    totalOpened,
    totalClicked,
    totalFailed,
    thisMonthSent,
    lastMonthSent,
    recentEmails,
    topIntents,
  ] = await Promise.all([
    // All time counts
    db.emailLog.count({
      where: {
        organizationId: org.id,
        status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] },
      },
    }),
    db.emailLog.count({
      where: {
        organizationId: org.id,
        status: { in: ["DELIVERED", "OPENED", "CLICKED"] },
      },
    }),
    db.emailLog.count({
      where: { organizationId: org.id, status: { in: ["OPENED", "CLICKED"] } },
    }),
    db.emailLog.count({ where: { organizationId: org.id, status: "CLICKED" } }),
    db.emailLog.count({
      where: { organizationId: org.id, status: { in: ["FAILED", "BOUNCED"] } },
    }),

    // This month
    db.emailLog.count({
      where: {
        organizationId: org.id,
        createdAt: { gte: startOfMonth },
        status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] },
      },
    }),

    // Last month
    db.emailLog.count({
      where: {
        organizationId: org.id,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] },
      },
    }),

    // Recent emails
    db.emailLog.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        intent: { select: { name: true } },
        brand: { select: { name: true } },
      },
    }),

    // Top intents
    db.emailLog.groupBy({
      by: ["intentId"],
      where: {
        organizationId: org.id,
        intentId: { not: null },
        createdAt: { gte: startOfMonth },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Calculate rates
  const deliveryRate =
    totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0";
  const openRate =
    totalDelivered > 0
      ? ((totalOpened / totalDelivered) * 100).toFixed(1)
      : "0";
  const clickRate =
    totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : "0";
  const monthOverMonthGrowth =
    lastMonthSent > 0
      ? (((thisMonthSent - lastMonthSent) / lastMonthSent) * 100).toFixed(0)
      : thisMonthSent > 0
        ? "100"
        : "0";

  // Get intent names for top intents
  const intentIds = topIntents
    .map((i) => i.intentId)
    .filter(Boolean) as string[];
  const intents = await db.intent.findMany({
    where: { id: { in: intentIds } },
    select: { id: true, name: true },
  });
  const intentMap = new Map(intents.map((i) => [i.id, i.name]));

  const stats = [
    {
      name: "Emails Sent",
      value: formatNumber(thisMonthSent),
      subtext: "This month",
      icon: Mail,
      change: `${monthOverMonthGrowth}%`,
      changePositive: Number(monthOverMonthGrowth) >= 0,
    },
    {
      name: "Delivery Rate",
      value: `${deliveryRate}%`,
      subtext: `${formatNumber(totalDelivered)} delivered`,
      icon: CheckCircle,
    },
    {
      name: "Open Rate",
      value: `${openRate}%`,
      subtext: `${formatNumber(totalOpened)} opened`,
      icon: TrendingUp,
    },
    {
      name: "Click Rate",
      value: `${clickRate}%`,
      subtext: `${formatNumber(totalClicked)} clicked`,
      icon: MousePointer,
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your email performance and engagement
        </p>
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
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <Badge
                    variant={stat.changePositive ? "success" : "destructive"}
                    className="text-xs"
                  >
                    {stat.changePositive ? "+" : ""}
                    {stat.change} vs last month
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Intents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
            <CardDescription>
              Most used email intents this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topIntents.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No emails sent yet this month
              </p>
            ) : (
              <div className="space-y-4">
                {topIntents.map((item, index) => {
                  const intentName = item.intentId
                    ? (intentMap.get(item.intentId) ?? "Unknown")
                    : "Unknown";
                  const percentage =
                    thisMonthSent > 0
                      ? (item._count.id / thisMonthSent) * 100
                      : 0;
                  return (
                    <div key={item.intentId ?? index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{intentName}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(item._count.id)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest email activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No email activity yet
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
                        {email.toEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {email.intent?.name ?? "Unknown"} ·{" "}
                        {formatDate(email.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusColors[email.status]}>
                      {email.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Failures */}
      {totalFailed > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle>Delivery Issues</CardTitle>
              <CardDescription>
                {formatNumber(totalFailed)} emails failed to deliver
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
