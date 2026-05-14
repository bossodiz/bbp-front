// ============================================================================
// QUERY OPTIMIZATION GUIDE & UTILITIES
// ============================================================================

/**
 * COMMON N+1 QUERY PATTERNS & SOLUTIONS
 *
 * Problem: Fetching parent data, then looping to fetch children
 * Solution: Use Supabase selects with relations or batch queries
 */

export interface OptimizationTip {
  pattern: string;
  problem: string;
  solution: string;
  example: string;
}

export const optimizationTips: OptimizationTip[] = [
  {
    pattern: "N+1: GET /api/customers + pets loop",
    problem:
      "Fetch all customers (1 query) + fetch pets for each customer (N queries) = N+1",
    solution: "Use Supabase select() with relationships",
    example: `
// ❌ BAD - N+1 queries
const customers = await supabase.from('customers').select('*');
const customersWithPets = await Promise.all(
  customers.map(c =>
    supabase.from('pets').select('*').eq('customer_id', c.id)
  )
);

// ✅ GOOD - Single query with relations
const customersWithPets = await supabase
  .from('customers')
  .select('*, pets(*)');
    `,
  },
  {
    pattern: "N+1: GET /api/sales + items loop",
    problem: "Fetch sales + sale_items separately for each sale",
    solution: "Use nested select with relations",
    example: `
// ❌ BAD
const sales = await supabase.from('sales').select('*');
const items = await Promise.all(
  sales.map(s => supabase.from('sale_items').select('*').eq('sale_id', s.id))
);

// ✅ GOOD
const sales = await supabase
  .from('sales')
  .select('*, sale_items(*, pets(*)), customers(*)');
    `,
  },
  {
    pattern: "COUNT queries",
    problem: "Making separate query just to get count",
    solution: "Use count option in Supabase select()",
    example: `
// ❌ BAD
const { count } = await supabase
  .from('products')
  .select('id', { count: 'exact' });
const { data } = await supabase.from('products').select('*');

// ✅ GOOD - Run in parallel
const [{ count }, { data }] = await Promise.all([
  supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
  supabaseAdmin.from('products').select('*'),
]);
    `,
  },
  {
    pattern: "Filtering on related tables",
    problem: "Fetching all rows then filtering client-side",
    solution: "Filter at database level using filter()",
    example: `
// ❌ BAD
const bookings = await supabase.from('bookings').select('*');
const filtered = bookings.filter(b => b.status === 'CONFIRMED');

// ✅ GOOD
const bookings = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'CONFIRMED');
    `,
  },
  {
    pattern: "Multiple sequential queries",
    problem: "Making queries one after another",
    solution: "Run in parallel with Promise.all()",
    example: `
// ❌ BAD - Sequential (slow)
const customers = await fetchCustomers();
const products = await fetchProducts();
const bookings = await fetchBookings();

// ✅ GOOD - Parallel (fast)
const [customers, products, bookings] = await Promise.all([
  fetchCustomers(),
  fetchProducts(),
  fetchBookings(),
]);
    `,
  },
];

// ============================================================================
// BATCH QUERY HELPER
// ============================================================================

/**
 * Helper สำหรับทำ batch queries แทนการทำ loop
 * ใช้ได้กับ arrays ขนาดใหญ่
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Batch fetch related data เมื่อไม่สามารถใช้ relations ได้
 * ตัวอย่าง: การดึง pet details สำหรับ sale items
 */
export async function batchFetchRelated<T, U>(
  ids: number[],
  fetchFn: (ids: number[]) => Promise<U[]>,
  batchSize: number = 100,
): Promise<U[]> {
  const chunks = chunkArray(ids, batchSize);
  const results = await Promise.all(chunks.map(fetchFn));
  return results.flat();
}

// ============================================================================
// ALREADY OPTIMIZED QUERIES (Examples)
// ============================================================================

/**
 * ✅ GOOD: GET /api/products with pagination
 * - ใช้ range() สำหรับ pagination
 * - ใช้ count() สำหรับจำนวน total
 */
export const optimizedProductsQuery = `
// Single optimized query
const [{ count }, { data }] = await Promise.all([
  supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
  supabaseAdmin.from('products')
    .select('*')
    .range(offset, offset + limit - 1),
]);
`;

/**
 * ✅ GOOD: GET /api/sales with nested relations
 * - ใช้ nested select('*') เพื่อดึง customers + sale_items + pets
 * - ไม่ต้อง loop ตามแต่ละ sale
 */
export const optimizedSalesQuery = `
// Single query with all relations
const { data } = await supabaseAdmin
  .from('sales')
  .select(\`
    *,
    customers(id, name, phone),
    sale_items(
      *,
      pets(id, name, type)
    )
  \`);
`;

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export function measureQueryTime<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ data: T; duration: number }> {
  return new Promise(async (resolve) => {
    const start = Date.now();
    const data = await fn();
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`⚠️ SLOW QUERY: ${name} took ${duration}ms`);
    }

    resolve({ data, duration });
  });
}
