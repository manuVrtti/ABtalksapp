import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/shared/app-header";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { ProductGrid } from "@/components/marketplace/product-grid";
import { SortControl } from "@/components/marketplace/sort-control";
import { getCatalog, type CatalogSort } from "@/features/marketplace/get-catalog";
import { getMySynergy } from "@/features/synergy/get-my-synergy";
import { prisma } from "@/lib/db";

function isCatalogSort(value: string | undefined): value is CatalogSort {
  return (
    value === "recommended" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "newest"
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const sp = await searchParams;
  const sort: CatalogSort = isCatalogSort(sp.sort) ? sp.sort : "recommended";

  const [items, balance, profile] = await Promise.all([
    getCatalog(sort),
    getMySynergy(userId),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { phone: true, college: true },
    }),
  ]);

  const headerUser = {
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    role: session.user.role ?? "STUDENT",
    isAdmin: session.user.isAdmin ?? false,
  };

  return (
    <div className="flex min-h-svh flex-col bg-[#030712] text-white">
      <div className="[&_header]:border-[#030712] [&_header]:bg-[#050C1D] [&_header]:shadow-none">
        <AppHeader user={headerUser} />
      </div>
      <MarketplaceHero />
      <main
        id="products"
        className="mx-auto w-full max-w-[1897px] flex-1 scroll-mt-20 px-4 py-8 sm:px-[67px] sm:py-10"
      >
        <div className="mb-8 flex justify-end">
          <SortControl sort={sort} />
        </div>
        <ProductGrid
          items={items}
          balance={balance}
          defaultPhone={profile?.phone ?? ""}
        />
      </main>
    </div>
  );
}
