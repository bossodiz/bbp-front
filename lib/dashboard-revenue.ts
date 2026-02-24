type SaleType = "SERVICE" | "HOTEL" | "PRODUCT" | "MIXED";
type RevenueCategory = "service" | "hotel" | "product";

type SaleItemRevenueSource = {
  item_type?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  final_price?: number | string | null;
};

export type SaleRevenueSource = {
  total_amount?: number | string | null;
  deposit_used?: number | string | null;
  sale_type?: string | null;
  sale_items?: SaleItemRevenueSource[] | null;
};

export type RevenueBreakdown = {
  total: number;
  service: number;
  hotel: number;
  product: number;
};

export function toNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeSaleType(value: string | null | undefined): SaleType {
  const upper = String(value || "").toUpperCase();
  if (upper === "HOTEL") return "HOTEL";
  if (upper === "PRODUCT") return "PRODUCT";
  if (upper === "MIXED") return "MIXED";
  return "SERVICE";
}

function normalizeItemCategory(
  value: string | null | undefined,
): RevenueCategory | null {
  const upper = String(value || "").toUpperCase();
  if (upper === "HOTEL_ROOM") return "hotel";
  if (upper === "PRODUCT") return "product";
  if (upper === "SERVICE") return "service";
  return null;
}

function normalizeQuantity(value: number | string | null | undefined): number {
  const qty = Math.floor(toNumber(value));
  return qty >= 1 ? qty : 1;
}

function getLineGrossAmount(
  item: SaleItemRevenueSource,
  category: RevenueCategory,
): number {
  const qty = normalizeQuantity(item.quantity);
  const unitPrice = toNumber(item.unit_price);
  const finalPrice = toNumber(item.final_price);

  if (category === "hotel") {
    if (finalPrice > 0) return finalPrice;
    if (unitPrice > 0) return unitPrice * qty;
    return 0;
  }

  if (unitPrice > 0) return unitPrice * qty;
  if (finalPrice > 0) return finalPrice * qty;
  return 0;
}

export function getSaleRevenueBreakdown(sale: SaleRevenueSource): RevenueBreakdown {
  const total = toNumber(sale.total_amount) + toNumber(sale.deposit_used);

  const gross = {
    service: 0,
    hotel: 0,
    product: 0,
  };

  for (const item of sale.sale_items || []) {
    const category = normalizeItemCategory(item.item_type);
    if (!category) continue;
    gross[category] += getLineGrossAmount(item, category);
  }

  const grossTotal = gross.service + gross.hotel + gross.product;

  if (grossTotal > 0) {
    const service = (total * gross.service) / grossTotal;
    const hotel = (total * gross.hotel) / grossTotal;
    const product = total - service - hotel;

    return {
      total,
      service,
      hotel,
      product,
    };
  }

  const saleType = normalizeSaleType(sale.sale_type);
  if (saleType === "HOTEL") {
    return { total, service: 0, hotel: total, product: 0 };
  }
  if (saleType === "PRODUCT") {
    return { total, service: 0, hotel: 0, product: total };
  }

  return { total, service: total, hotel: 0, product: 0 };
}

export function sumSaleRevenueBreakdowns(
  sales: SaleRevenueSource[],
): RevenueBreakdown {
  return sales.reduce<RevenueBreakdown>(
    (sum, sale) => {
      const breakdown = getSaleRevenueBreakdown(sale);
      return {
        total: sum.total + breakdown.total,
        service: sum.service + breakdown.service,
        hotel: sum.hotel + breakdown.hotel,
        product: sum.product + breakdown.product,
      };
    },
    {
      total: 0,
      service: 0,
      hotel: 0,
      product: 0,
    },
  );
}
