"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Palette,
  MessageSquare,
  Send,
  BarChart3,
  Key,
  Settings,
  Plug,
  Mail,
  Clock,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Brands", href: "/dashboard/brands", icon: Palette },
  { name: "Intents", href: "/dashboard/intents", icon: MessageSquare },
  { name: "Providers", href: "/dashboard/providers", icon: Plug },
  { name: "Emails", href: "/dashboard/emails", icon: Mail },
  { name: "Scheduled", href: "/dashboard/emails/scheduled", icon: Clock },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Members", href: "/dashboard/settings/members", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">IntentMail</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">Free Plan</p>
          <p className="text-xs text-muted-foreground">750 / 1,000 emails</p>
          <div className="mt-2 h-1.5 rounded-full bg-background">
            <div className="h-full w-3/4 rounded-full bg-primary" />
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="mt-2 block text-xs font-medium text-primary hover:underline"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
