"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/mock-interview", label: "Mock Interview", Icon: Mic },
  { href: "/mission", label: "Our Mission", Icon: Compass },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

function isTabActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" || pathname.startsWith("/challenge/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    /^\/(login|register|claude-signup|students)(\/|$)/.test(pathname)
  ) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-xs",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
