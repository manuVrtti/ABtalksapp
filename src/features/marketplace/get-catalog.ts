import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type CatalogItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  costSP: number;
  imagePath: string | null;
};

export type CatalogSort = "recommended" | "price_asc" | "price_desc" | "newest";

const ORDER_BY: Record<
  CatalogSort,
  Prisma.MarketplaceItemOrderByWithRelationInput[]
> = {
  recommended: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  price_asc: [{ costSP: "asc" }, { sortOrder: "asc" }],
  price_desc: [{ costSP: "desc" }, { sortOrder: "asc" }],
  newest: [{ createdAt: "desc" }],
};

export async function getCatalog(
  sort: CatalogSort = "recommended",
): Promise<CatalogItem[]> {
  const items = await prisma.marketplaceItem.findMany({
    where: { active: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      costSP: true,
      imagePath: true,
    },
    orderBy: ORDER_BY[sort],
  });
  return items;
}
