import Image from "next/image";
import Link from "next/link";

export function MarketplaceHero() {
  return (
    <section className="relative w-full">
      <div className="relative aspect-[1897/360] w-full min-h-[200px] max-h-[360px] overflow-hidden sm:min-h-[280px]">
        <Image
          src="/marketplace/hero-banner.png"
          alt="Marketplace — redeem synergy points for exclusive ABTalks merchandise"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <Link
        href="#products"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-[#2B1D8C] focus:px-4 focus:py-2 focus:text-white"
      >
        Browse Rewards
      </Link>
    </section>
  );
}
