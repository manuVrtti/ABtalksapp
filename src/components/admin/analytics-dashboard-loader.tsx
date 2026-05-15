"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const AnalyticsDashboard = dynamic(
  () =>
    import("@/components/admin/analytics-dashboard").then(
      (m) => m.AnalyticsDashboard,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading charts…</p>
    ),
  },
);

type Props = ComponentProps<typeof AnalyticsDashboard>;

export function AnalyticsDashboardLoader(props: Props) {
  return <AnalyticsDashboard {...props} />;
}
