"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Briefcase, Compass, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/jobs", label: "Jobs", Icon: Briefcase },
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

function findOverflowElements(viewportWidth: number) {
  const overflowing: Array<{
    tag: string;
    className: string;
    right: number;
    left: number;
    width: number;
  }> = [];
  for (const el of document.querySelectorAll("body *")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right > viewportWidth + 1 || rect.left < -1) {
      overflowing.push({
        tag: el.tagName,
        className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
        right: Math.round(rect.right),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
      });
    }
  }
  overflowing.sort((a, b) => b.width - a.width);
  return overflowing.slice(0, 5);
}

export function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const logLayout = () => {
      const nav = navRef.current;
      const docEl = document.documentElement;
      const body = document.body;
      const viewportWidth = window.innerWidth;
      const navRect = nav?.getBoundingClientRect();
      const tabEls = nav?.querySelectorAll("a") ?? [];
      const tabMetrics = Array.from(tabEls).map((tab) => {
        const rect = tab.getBoundingClientRect();
        return {
          label: tab.textContent?.trim() ?? "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      });

      // #region agent log
      fetch("http://127.0.0.1:7692/ingest/0ae915d4-d2e6-400c-bd95-05980df7545e", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "25e310",
        },
        body: JSON.stringify({
          sessionId: "25e310",
          runId: "pre-fix",
          hypothesisId: "A-B-D",
          location: "bottom-nav.tsx:layout",
          message: "Bottom nav layout metrics on route change",
          data: {
            pathname,
            viewportWidth,
            docClientWidth: docEl.clientWidth,
            docScrollWidth: docEl.scrollWidth,
            bodyScrollWidth: body.scrollWidth,
            hasHorizontalOverflow: docEl.scrollWidth > docEl.clientWidth + 1,
            navLeft: navRect ? Math.round(navRect.left) : null,
            navRight: navRect ? Math.round(navRect.right) : null,
            navWidth: navRect ? Math.round(navRect.width) : null,
            navHeight: navRect ? Math.round(navRect.height) : null,
            tabMetrics,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (pathname === "/profile" || pathname.startsWith("/profile/")) {
        const overflowEls = findOverflowElements(viewportWidth);
        // #region agent log
        fetch("http://127.0.0.1:7692/ingest/0ae915d4-d2e6-400c-bd95-05980df7545e", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "25e310",
          },
          body: JSON.stringify({
            sessionId: "25e310",
            runId: "pre-fix",
            hypothesisId: "A-E",
            location: "bottom-nav.tsx:profile-overflow",
            message: "Profile page overflow scan",
            data: {
              pathname,
              overflowCount: overflowEls.length,
              overflowEls,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
    };

    const raf = requestAnimationFrame(() => {
      logLayout();
      requestAnimationFrame(logLayout);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  if (
    pathname === "/" ||
    /^\/(login|register|claude-signup|students)(\/|$)/.test(pathname)
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:hidden"
      aria-hidden={false}
    >
      <nav
        ref={navRef}
        aria-label="Main navigation"
        className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-border/40 bg-card/70 px-2 py-1.5 shadow-lg shadow-black/10 backdrop-blur-xl dark:bg-card/60 dark:shadow-black/40"
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 text-xs transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
