import type { Customer, Pet, Service, ServicePrice } from "@/lib/types"

// Raw API response types (snake_case from Supabase)
interface RawPet {
  id: number
  customer_id: number
  name: string
  type: "DOG" | "CAT"
  breed: string
  breed_2?: string | null
  is_mixed_breed: boolean
  weight: number | string | null
  note?: string | null
  created_at: string
  updated_at: string
}

interface RawServicePrice {
  id: number
  service_id: number
  pet_type_id?: string | null
  size_id?: string | null
  price: number
}

interface RawService {
  id: number
  name: string
  description?: string | null
  is_special?: boolean | null
  special_price?: number | null
  active: boolean
  order_index?: number | null
  created_at: string
  updated_at: string
  service_prices?: RawServicePrice[]
}

interface RawCustomer {
  id: number
  name: string
  phone: string
  created_at: string
  updated_at: string
  pets?: RawPet[]
}

export function transformPet(raw: RawPet): Pet {
  return {
    id: raw.id,
    customerId: raw.customer_id,
    name: raw.name,
    type: raw.type,
    breed: raw.breed || "",
    breed2: raw.breed_2 || undefined,
    isMixedBreed: raw.is_mixed_breed || false,
    weight: raw.weight !== null && raw.weight !== undefined
      ? parseFloat(String(raw.weight))
      : null,
    note: raw.note || "",
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  }
}

export function transformServicePrice(raw: RawServicePrice): ServicePrice {
  return {
    id: raw.id,
    serviceId: raw.service_id,
    petTypeId: raw.pet_type_id ?? undefined,
    sizeId: raw.size_id ?? undefined,
    price: raw.price,
  }
}

export function transformService(raw: RawService): Service {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    isSpecial: raw.is_special || false,
    specialPrice: raw.special_price ?? undefined,
    active: raw.active,
    order: raw.order_index || 0,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    prices: (raw.service_prices || []).map((price) =>
      transformServicePrice({ ...price, service_id: raw.id }),
    ),
  }
}

export function transformCustomer(raw: RawCustomer): Customer {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    pets: (raw.pets || []).map(transformPet),
  }
}
