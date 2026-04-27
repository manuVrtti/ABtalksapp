"use client";

import { Domain } from "@prisma/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AppHeaderUser = {
  name: string | null;
  email: string;
  image: string | null;
  role: string;
};

type Props = {
  user: AppHeaderUser;
  /** Student track; omit when user has no profile yet (e.g. OAuth before registration). */
  domain?: Domain | null;
};

function displayLabel(user: AppHeaderUser): string {
  return user.name?.trim() || user.email || "User";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function domainBadgeTitle(domain: Domain): string {
  switch (domain) {
    case Domain.AI:
      return "Artificial Intelligence";
    case Domain.DS:
      return "Data Science";
    case Domain.SE:
      return "Software Engineering";
    default:
      return domain;
  }
}

function domainBadgeClass(domain: Domain): string {
  switch (domain) {
    case Domain.AI:
      return "bg-purple-500 text-white";
    case Domain.DS:
      return "bg-blue-500 text-white";
    case Domain.SE:
      return "bg-green-500 text-white";
    default:
      return "bg-muted text-foreground";
  }
}

export function AppHeader({ user, domain }: Props) {
  const router = useRouter();
  const label = displayLabel(user);

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 text-base font-semibold tracking-tight text-foreground"
          >
            ABtalks
          </Link>
          {domain ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold tracking-wide sm:px-2.5 sm:text-sm ${domainBadgeClass(domain)}`}
              title={domainBadgeTitle(domain)}
            >
              {domain}
            </span>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                type="button"
                className="flex items-center gap-2 px-2"
              />
            }
          >
            <Avatar size="sm">
              {user.image ? (
                <AvatarImage src={user.image} alt="" />
              ) : null}
              <AvatarFallback>{initials(label)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">
              {label}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Role: {user.role}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction} className="p-1">
              <button
                type="submit"
                className="flex w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
              >
                Logout
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
