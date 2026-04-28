import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminHomePage() {
  const admin = await requireAdmin();

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Logged in as {admin.email}</p>
      <p className="mt-4 text-sm">Foundation is ready. Pages coming next.</p>
    </div>
  );
}
