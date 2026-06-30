import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { EarningPills } from "@/components/marketplace/earning-pills";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketplaceHero() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#180F5B] to-[#050C1D]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 130% at 15% 25%, rgba(115,100,230,0.28) 0%, rgba(115,100,230,0) 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] max-w-[820px] lg:block"
      >
        <Image
          src="/marketplace/hero-merch.png"
          alt=""
          fill
          priority
          sizes="46vw"
          className="object-contain object-right"
        />
      </div>

      <div className="relative mx-auto flex max-w-[1897px] flex-col gap-6 px-4 py-10 sm:px-[67px] sm:py-12 lg:min-h-[360px] lg:justify-center lg:py-16">
        <div className="flex max-w-xl flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#7364E6]">
            <ShoppingBag className="size-4" aria-hidden />
            Marketplace
          </span>
          <h1 className="text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-5xl">
            Redeem your <span className="text-[#7364E6]">Synergy</span> Points
          </h1>
          <p className="max-w-md text-sm text-[#BCBCBC] sm:text-base">
            Turn the points you earn from daily tasks, referrals, and proof of
            work into exclusive ABTalks merchandise.
          </p>
          <Link
            href="#products"
            className={cn(
              buttonVariants(),
              "w-fit gap-2 bg-gradient-to-b from-[#7166F0] to-[#2B1D8C] px-5 text-white shadow-[0_8px_24px_rgba(43,29,140,0.45)] hover:from-[#7d72f5] hover:to-[#33228f]",
            )}
          >
            Browse Rewards
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <EarningPills />
      </div>
    </section>
  );
}
