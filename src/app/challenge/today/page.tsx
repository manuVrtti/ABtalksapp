import { redirect } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentDayNumber } from "@/lib/date-utils";

export default async function ChallengeTodayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });

  if (!enrollment) {
    redirect("/dashboard");
  }

  const currentDayNumber = getCurrentDayNumber(enrollment.startedAt);
  redirect(`/challenge/${currentDayNumber}`);
}
