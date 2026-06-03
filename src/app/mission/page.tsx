import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shared/app-header";

export default async function MissionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const headerUser = {
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    role: session.user.role ?? "STUDENT",
    isAdmin: session.user.isAdmin ?? false,
  };

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <AppHeader user={headerUser} />
      <div className="mx-auto max-w-3xl flex-1 space-y-8 px-4 py-8 sm:py-12">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Our Mission
        </p>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Why ABTalks exists
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Talent isn&apos;t the problem. Proof is.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Too many students pour months into internships that pay nothing —
            or worse, ones they have to pay to join — and still come out without
            a real path to a first job. On the other side, recruiters are hiring
            half-blind: a resume can&apos;t tell them who genuinely knows their
            craft. Two real problems, one missing bridge.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            ABTalks is that bridge — a community run by students, for students,
            founded by Anil Bajpai after watching capable people get overlooked
            and undervalued.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Pick your track — AI, Data Science, or Software Engineering — and
            commit to 60 days. Every day you build, push your work to GitHub, and
            share your progress in public, tagging us so the community can follow
            along and verify it&apos;s real. Working in the open is the whole
            point: it forces you to actually grow, and it leaves behind a track
            record anyone can check.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            What you&apos;re working toward
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Complete the 60 days and you move into mock interviews to get you
            sharp and confident. From there you become visible to the HRs and
            leaders in our network — and they reach out to you. No applications
            shouted into the void.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            You&apos;re not doing it alone
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            ABTalks is students lifting each other up. Our Discord runs weekly
            communication practice and plenty more — with a lot still on the
            way. Show up, do the work in public, and let it speak for you.
          </p>
        </section>
      </div>
    </div>
  );
}
