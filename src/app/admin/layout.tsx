import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { AppHeader } from "@/components/shared/app-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  const navItems = [
    { href: "/admin", label: "Overview", icon: "overview" as const },
    { href: "/admin/students", label: "Students", icon: "students" as const },
    { href: "/admin/submissions", label: "Submissions", icon: "submissions" as const },
    { href: "/admin/content", label: "Content", icon: "content" as const },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={{
          name: admin.name ?? "Admin",
          email: admin.email ?? "admin@local",
          image: null,
          role: "ADMIN",
          isAdmin: true,
        }}
      />
      <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6">
        <div className="md:sticky md:top-20 md:h-fit">
          <AdminSidebar navItems={navItems} />
          <div className="mt-3 text-xs text-muted-foreground">
            Admin area is read-only for now.
          </div>
          <Link href="/dashboard" className="mt-2 block text-xs text-primary underline">
            Back to student dashboard
          </Link>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}
