import { auth } from "@/auth";
import { redirect } from "next/navigation";

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export async function isAdminEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const isAdmin = await isAdminEmail(session.user.email);
  if (!isAdmin) redirect("/dashboard");

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function getAdminContext() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const isAdmin = await isAdminEmail(session.user.email);
  if (!isAdmin) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
