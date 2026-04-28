import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { getAnalyticsData } from "@/features/admin/get-analytics-data";

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Registration, engagement, drop-off, and performance metrics.
        </p>
      </div>
      <AnalyticsDashboard data={data} />
    </div>
  );
}
