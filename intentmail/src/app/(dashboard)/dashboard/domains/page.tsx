import Link from "next/link";
import { Plus, Globe, Check, Clock, AlertCircle } from "lucide-react";
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

export const dynamic = "force-dynamic";

const statusConfig = {
  PENDING: {
    label: "Pending",
    variant: "outline" as const,
    icon: Clock,
  },
  VERIFIED: {
    label: "Verified",
    variant: "success" as const,
    icon: Check,
  },
  FAILED: {
    label: "Failed",
    variant: "destructive" as const,
    icon: AlertCircle,
  },
};

export default async function DomainsPage() {
  const org = await getOrganizationWithLimits();
  if (!org) return <div>Loading...</div>;

  // Plan gate: only GROWTH+ can manage domains
  if (!org.limits.customDomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Custom Domains</h1>
          <p className="text-muted-foreground">
            Verify sender domains for branded email delivery
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Upgrade to unlock custom domains
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground max-w-md">
              Custom sender domains are available on Growth and Enterprise plans.
              Verify your domain to send from your own email addresses.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/settings/billing">Upgrade Plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const domains = await db.domain.findMany({
    where: { organizationId: org.id },
    include: { provider: { select: { name: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Domains</h1>
          <p className="text-muted-foreground">
            Verify sender domains for branded email delivery
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/domains/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Link>
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No domains configured
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Add a custom domain to send emails from your own addresses.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/domains/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Domains</CardTitle>
            <CardDescription>
              {domains.length} domain{domains.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {domains.map((domain) => {
                const config = statusConfig[domain.status];
                const StatusIcon = config.icon;
                return (
                  <Link
                    key={domain.id}
                    href={`/dashboard/domains/${domain.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{domain.domain}</p>
                          <p className="text-xs text-muted-foreground">
                            via {domain.provider.name} ({domain.provider.type})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={config.variant}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                        {domain.verifiedAt && (
                          <span className="text-xs text-muted-foreground">
                            Verified{" "}
                            {new Date(domain.verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
