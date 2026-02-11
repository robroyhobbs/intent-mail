import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ensureOrganizationExists } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // If user doesn't have an org, they need to create one
  if (!orgId) {
    redirect("/create-organization");
  }

  // Ensure org exists in our database
  try {
    await ensureOrganizationExists();
  } catch (e) {
    console.error("[DashboardLayout] ensureOrganizationExists error:", e);
    throw e;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
