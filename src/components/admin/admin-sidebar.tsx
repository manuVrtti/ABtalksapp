"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, FileText, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type IconName = "overview" | "students" | "submissions" | "content" | "analytics";

const iconMap = {
  overview: LayoutDashboard,
  students: Users,
  submissions: FileText,
  content: BookOpen,
  analytics: BarChart3,
} as const;

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

interface AdminSidebarProps {
  navItems: NavItem[];
}

export function AdminSidebar({ navItems }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex gap-2 overflow-x-auto md:block md:space-y-1">
      {navItems.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors md:flex",
              isActive ? "bg-accent font-medium" : "hover:bg-accent/70",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
