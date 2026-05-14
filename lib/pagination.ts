import { z } from "zod";

// ============================================================================
// PAGINATION SCHEMA & TYPES
// ============================================================================

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================================
// PAGINATION HELPER FUNCTIONS
// ============================================================================

/**
 * คำนวณ offset จาก page และ limit
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * สร้าง pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * ประสาน response ด้วย pagination
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
): PaginatedResponse<T> {
  return {
    data,
    pagination,
  };
}
